"""V2 FastAPI server — STANDALONE from v1 server.py.

Adds two capabilities on top of v1's pipeline, without touching v1:

1. A quick MCP "browser demo" endpoint (single query → live screenshots).
2. A FULL pipeline endpoint `/api/v2/runs` that runs an MCP pre-fetch phase
   BEFORE the v1 research → strategy → creative agents, and streams rich
   live-action events ("what the agent is doing right now") to the UI.

v1 modules are imported READ-ONLY — no edits to `server.py` or `app/agents/*`.

Runs on its own port (default 8001) alongside v1 (8000). Nothing from v1
is mutated — deletable as a unit (this file + `app/tools/browser_mcp.py`
+ `app/tools/web_mcp.py` + `frontend/src/app/dashboard/v2/`).

Start:
    python -m uvicorn server_v2:app --reload --port 8001

Endpoints:
- GET  /api/health                     — health + config
- POST /api/v2/browser-demo            — body {query}. Returns {demo_id}.
- GET  /api/v2/browser-demo/{id}       — polling fallback
- WS   /ws/v2/browser-demo/{id}        — event stream
- POST /api/v2/runs                    — body: BusinessInput. Full pipeline.
- GET  /api/v2/runs/{id}               — polling fallback
- WS   /ws/v2/runs/{id}                — event stream
"""

from __future__ import annotations

import asyncio
import sys
import traceback
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.agents.creative import run_creative_agent
from app.agents.research import (
    RESEARCH_SYSTEM_PROMPT,
    RESEARCH_TOOLS,
    _build_user_message as _research_build_user_message,
    _parse_output as _research_parse_output,
)
from app.agents.base import AgentRunner
from app.agents.strategy import run_strategy_agent
from app.config import config
from app.report import render_markdown
from app.schemas import BusinessInput, FullReport
from app.storage import mongo
from app.tools.browser_mcp import run_mcp_browser_search
from app.tools.meta_ad_library import search_meta_ads
from app.tools.web_mcp import format_context_for_agent, mcp_prefetch_context
from app.tools.web_scrape import scrape_webpage
from app.tools.web_search import web_search
from app.tools.wikipedia import wikipedia_lookup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


@dataclass
class DemoState:
    demo_id: str
    query: str
    status: str = "pending"  # pending | running | done | error
    events: list[dict] = field(default_factory=list)
    results: list[dict] | None = None
    error: str | None = None
    subscribers: list[asyncio.Queue] = field(default_factory=list)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class RunV2State:
    run_id: str
    business: BusinessInput
    status: str = "pending"  # pending | running | done | error
    events: list[dict] = field(default_factory=list)
    final_report: dict | None = None
    final_markdown: str | None = None
    mcp_context: dict | None = None
    error: str | None = None
    subscribers: list[asyncio.Queue] = field(default_factory=list)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


DEMOS: dict[str, DemoState] = {}
RUNS_V2: dict[str, RunV2State] = {}


app = FastAPI(title="AdForge v2 — MCP Browser + Full Pipeline", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- simple browser-demo (kept for the first iteration of the UI) ----


async def _run_demo(state: DemoState) -> None:
    async def emit(event: dict) -> None:
        stamped = {"ts": _ts(), **event}
        state.events.append(stamped)
        for q in list(state.subscribers):
            q.put_nowait(stamped)

    try:
        state.status = "running"
        await emit({"type": "demo_start", "query": state.query})
        result = await run_mcp_browser_search(state.query, emit, max_visits=5)
        state.results = result["results"]
        state.status = "done"
        await emit({"type": "demo_done", "count": result["count"]})
    except Exception as e:
        state.status = "error"
        state.error = f"{type(e).__name__}: {e}"
        await emit(
            {
                "type": "demo_error",
                "error": state.error,
                "trace": traceback.format_exc()[-2000:],
            }
        )


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "version": "v2-full",
        "server": "@playwright/mcp",
        "provider": config.LLM_PROVIDER,
        "models": {
            "research": config.model_for("research"),
            "strategy": config.model_for("strategy"),
            "creative": config.model_for("creative"),
        },
    }


@app.post("/api/v2/browser-demo")
async def create_demo(body: dict) -> dict:
    query = (body.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query required")
    demo_id = uuid.uuid4().hex[:12]
    state = DemoState(demo_id=demo_id, query=query)
    DEMOS[demo_id] = state
    asyncio.create_task(_run_demo(state))
    return {"demo_id": demo_id, "status": state.status, "created_at": state.created_at}


@app.get("/api/v2/browser-demo/{demo_id}")
async def get_demo(demo_id: str) -> dict:
    state = DEMOS.get(demo_id)
    if not state:
        raise HTTPException(status_code=404, detail="demo not found")
    return {
        "demo_id": state.demo_id,
        "query": state.query,
        "status": state.status,
        "created_at": state.created_at,
        "events": state.events,
        "results": state.results,
        "error": state.error,
    }


@app.websocket("/ws/v2/browser-demo/{demo_id}")
async def ws_demo(websocket: WebSocket, demo_id: str) -> None:
    await websocket.accept()
    state = DEMOS.get(demo_id)
    if not state:
        await websocket.send_json({"type": "error", "error": "demo_not_found"})
        await websocket.close()
        return

    queue: asyncio.Queue = asyncio.Queue()
    state.subscribers.append(queue)
    try:
        for past in list(state.events):
            await websocket.send_json(past)

        if state.status in ("done", "error"):
            return

        while True:
            event = await queue.get()
            await websocket.send_json(event)
            if event.get("type") in ("demo_done", "demo_error"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        if queue in state.subscribers:
            state.subscribers.remove(queue)


# ---------- full v2 pipeline (MCP pre-fetch → research → strategy → creative) ---


def _run_research_with_context(
    business: BusinessInput,
    mcp_context_text: str,
    on_event,
    verbose: bool = True,
):
    """Re-implementation of `run_research_agent` that injects MCP-browsed
    context into the user message. We don't modify v1's function — we just
    re-use its system prompt, tools, and parser, and build a richer user msg.
    """
    tool_handlers = {
        "web_search": web_search,
        "search_meta_ads": search_meta_ads,
        "scrape_webpage": scrape_webpage,
        "wikipedia_lookup": wikipedia_lookup,
    }

    runner = AgentRunner(
        model=config.model_for("research"),
        system_prompt=RESEARCH_SYSTEM_PROMPT,
        tools=RESEARCH_TOOLS,
        tool_handlers=tool_handlers,
        max_iterations=14,
        on_event=on_event,
        agent_name="research",
    )

    base_msg = _research_build_user_message(business)
    full_msg = base_msg + "\n" + mcp_context_text if mcp_context_text else base_msg
    raw_output = runner.run(full_msg, verbose=verbose)
    return _research_parse_output(raw_output)


_PERSIST_V2_TYPES = {"stage_done", "run_done", "run_error"}


async def _run_full_pipeline(state: RunV2State) -> None:
    loop = asyncio.get_running_loop()

    def emit_sync(event: dict) -> None:
        stamped = {"ts": _ts(), **event}
        state.events.append(stamped)
        for q in list(state.subscribers):
            loop.call_soon_threadsafe(q.put_nowait, stamped)
        if stamped.get("type") in _PERSIST_V2_TYPES:
            asyncio.run_coroutine_threadsafe(mongo.save_run_v2(state), loop)

    async def emit_async(event: dict) -> None:
        stamped = {"ts": _ts(), **event}
        state.events.append(stamped)
        for q in list(state.subscribers):
            q.put_nowait(stamped)
        if stamped.get("type") in _PERSIST_V2_TYPES:
            await mongo.save_run_v2(state)

    try:
        state.status = "running"
        await emit_async(
            {"type": "run_start", "business_name": state.business.business_name}
        )

        # ----- Phase 1: MCP pre-fetch (async, in this event loop) -----
        await emit_async({"type": "stage_start", "stage": "mcp_browse"})
        ctx = await mcp_prefetch_context(state.business, emit_async)
        state.mcp_context = ctx
        await emit_async(
            {
                "type": "stage_done",
                "stage": "mcp_browse",
                "summary": {
                    "visited": len(ctx.get("visited") or []),
                    "client_captured": bool(ctx.get("client_findings")),
                    "competitors_captured": len(ctx.get("competitor_findings") or []),
                },
                "data": {
                    "visited": ctx.get("visited") or [],
                },
            }
        )

        ctx_text = format_context_for_agent(ctx)

        # ----- Phase 2: Research (sync, run on thread) -----
        await emit_async({"type": "stage_start", "stage": "research"})
        research = await asyncio.to_thread(
            _run_research_with_context,
            state.business,
            ctx_text,
            emit_sync,
            True,
        )
        await emit_async(
            {
                "type": "stage_done",
                "stage": "research",
                "summary": {
                    "competitors": len(research.competitors_analyzed),
                    "sample_ads": len(research.sample_ads),
                    "gaps": len(research.gaps_and_opportunities),
                },
                "data": research.model_dump(),
            }
        )

        # ----- Phase 3: Strategy -----
        await emit_async({"type": "stage_start", "stage": "strategy"})
        strategy = await asyncio.to_thread(
            run_strategy_agent, state.business, research, True, emit_sync
        )
        await emit_async(
            {
                "type": "stage_done",
                "stage": "strategy",
                "summary": {
                    "segments": len(strategy.audience_segments),
                    "platforms": len(strategy.budget_allocation),
                },
                "data": strategy.model_dump(),
            }
        )

        # ----- Phase 4: Creative -----
        await emit_async({"type": "stage_start", "stage": "creative"})
        creatives = await asyncio.to_thread(
            run_creative_agent, state.business, strategy, True, emit_sync
        )
        await emit_async(
            {
                "type": "stage_done",
                "stage": "creative",
                "summary": {"variants": len(creatives.variants)},
                "data": creatives.model_dump(),
            }
        )

        report = FullReport(
            business=state.business,
            research=research,
            strategy=strategy,
            creatives=creatives,
        )
        state.final_report = report.model_dump()
        state.final_markdown = render_markdown(report)
        state.status = "done"
        await emit_async({"type": "run_done"})
    except Exception as e:
        state.status = "error"
        state.error = f"{type(e).__name__}: {e}"
        await emit_async(
            {
                "type": "run_error",
                "error": state.error,
                "trace": traceback.format_exc()[-2000:],
            }
        )


@app.post("/api/v2/runs")
async def create_run_v2(business: BusinessInput) -> dict:
    try:
        config.validate()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    run_id = uuid.uuid4().hex[:12]
    state = RunV2State(run_id=run_id, business=business)
    RUNS_V2[run_id] = state
    await mongo.save_run_v2(state)
    asyncio.create_task(_run_full_pipeline(state))
    return {"run_id": run_id, "status": state.status, "created_at": state.created_at}


@app.get("/api/v2/runs")
async def list_runs_v2(status: str | None = None, limit: int = 50) -> dict:
    """List past v2 runs (in-memory). Newest first.

    Storage is the `RUNS_V2` dict — survives only as long as the process.
    To swap to persistent storage (e.g. MongoDB), replace `RUNS_V2` with a
    thin wrapper exposing the same `__getitem__` / `__setitem__` / `.values()`
    interface, e.g. backed by `motor.motor_asyncio.AsyncIOMotorCollection`.
    """
    items = []
    for state in RUNS_V2.values():
        if status and state.status != status:
            continue
        items.append(
            {
                "run_id": state.run_id,
                "status": state.status,
                "business_name": state.business.business_name,
                "industry": state.business.industry,
                "created_at": state.created_at,
                "event_count": len(state.events),
                "has_report": state.final_report is not None,
                "error": state.error,
            }
        )
    items.sort(key=lambda r: r["created_at"], reverse=True)
    return {"runs": items[:limit], "total": len(items)}


@app.get("/api/v2/runs/{run_id}")
async def get_run_v2(run_id: str) -> dict:
    state = RUNS_V2.get(run_id)
    if not state:
        raise HTTPException(status_code=404, detail="run not found")
    return {
        "run_id": state.run_id,
        "status": state.status,
        "business_name": state.business.business_name,
        "created_at": state.created_at,
        "events": state.events,
        "final_report": state.final_report,
        "final_markdown": state.final_markdown,
        "error": state.error,
    }


@app.websocket("/ws/v2/runs/{run_id}")
async def ws_run_v2(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    state = RUNS_V2.get(run_id)
    if not state:
        await websocket.send_json({"type": "error", "error": "run_not_found"})
        await websocket.close()
        return

    queue: asyncio.Queue = asyncio.Queue()
    state.subscribers.append(queue)
    try:
        for past in list(state.events):
            await websocket.send_json(past)

        if state.status in ("done", "error"):
            return

        while True:
            event = await queue.get()
            await websocket.send_json(event)
            if event.get("type") in ("run_done", "run_error"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        if queue in state.subscribers:
            state.subscribers.remove(queue)

"""FastAPI server that runs the 3-agent pipeline and streams events over WebSocket.

Endpoints:
- POST `/api/runs` — body: BusinessInput JSON. Returns {run_id}. Kicks off the
  Research → Strategy → Creative pipeline on a background thread.
- GET `/api/runs/{run_id}` — returns current status + events-so-far + (if done) the
  final report. Useful for polling fallback / recovery on reconnect.
- WebSocket `/ws/runs/{run_id}` — streams events as they are emitted. On connect
  we also flush any events that were already queued before the client joined.

Events are emitted from the agents via the `on_event` callback plumbed through
AgentRunner. The worker thread uses `loop.call_soon_threadsafe` to push events
into an asyncio.Queue that the WebSocket handler drains.
"""

from __future__ import annotations

import asyncio
import sys
import traceback
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.agents.creative import run_creative_agent
from app.agents.research import run_research_agent
from app.agents.strategy import run_strategy_agent
from app.config import config
from app.report import render_markdown
from app.schemas import BusinessInput, FullReport
from app.storage import mongo

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


@dataclass
class RunState:
    run_id: str
    business: BusinessInput
    status: str = "pending"  # pending | running | done | error
    events: list[dict] = field(default_factory=list)
    final_report: dict | None = None
    final_markdown: str | None = None
    error: str | None = None
    subscribers: list[asyncio.Queue] = field(default_factory=list)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


RUNS: dict[str, RunState] = {}


app = FastAPI(title="AdForge Agent Orchestrator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


_PERSIST_V1_TYPES = {"stage_done", "run_done", "run_error"}


def _push_event(state: RunState, loop: asyncio.AbstractEventLoop, event: dict) -> None:
    stamped = {"ts": _timestamp(), **event}
    state.events.append(stamped)
    for q in list(state.subscribers):
        loop.call_soon_threadsafe(q.put_nowait, stamped)
    if stamped.get("type") in _PERSIST_V1_TYPES:
        asyncio.run_coroutine_threadsafe(mongo.save_run_v1(state), loop)


def _run_pipeline(state: RunState, loop: asyncio.AbstractEventLoop) -> None:
    business = state.business

    def emit(event: dict) -> None:
        _push_event(state, loop, event)

    try:
        state.status = "running"
        emit({"type": "run_start", "business_name": business.business_name})

        emit({"type": "stage_start", "stage": "research"})
        research = run_research_agent(business, verbose=True, on_event=emit)
        emit(
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

        emit({"type": "stage_start", "stage": "strategy"})
        strategy = run_strategy_agent(business, research, verbose=True, on_event=emit)
        emit(
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

        emit({"type": "stage_start", "stage": "creative"})
        creatives = run_creative_agent(business, strategy, verbose=True, on_event=emit)
        emit(
            {
                "type": "stage_done",
                "stage": "creative",
                "summary": {"variants": len(creatives.variants)},
                "data": creatives.model_dump(),
            }
        )

        report = FullReport(
            business=business,
            research=research,
            strategy=strategy,
            creatives=creatives,
        )
        state.final_report = report.model_dump()
        state.final_markdown = render_markdown(report)
        state.status = "done"
        emit({"type": "run_done"})
    except Exception as e:
        state.status = "error"
        state.error = f"{type(e).__name__}: {e}"
        emit(
            {
                "type": "run_error",
                "error": state.error,
                "trace": traceback.format_exc()[-2000:],
            }
        )


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "provider": config.LLM_PROVIDER,
        "models": {
            "research": config.model_for("research"),
            "strategy": config.model_for("strategy"),
            "creative": config.model_for("creative"),
        },
    }


@app.post("/api/runs")
async def create_run(business: BusinessInput) -> dict:
    try:
        config.validate()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    run_id = uuid.uuid4().hex[:12]
    state = RunState(run_id=run_id, business=business)
    RUNS[run_id] = state
    await mongo.save_run_v1(state)

    loop = asyncio.get_running_loop()
    asyncio.create_task(asyncio.to_thread(_run_pipeline, state, loop))

    return {"run_id": run_id, "status": state.status, "created_at": state.created_at}


@app.get("/api/runs")
def list_runs(status: str | None = None, limit: int = 50) -> dict:
    items = []
    for state in RUNS.values():
        if status and state.status != status:
            continue
        items.append(
            {
                "run_id": state.run_id,
                "status": state.status,
                "business_name": state.business.business_name,
                "created_at": state.created_at,
                "event_count": len(state.events),
                "error": state.error,
            }
        )
    items.sort(key=lambda r: r["created_at"], reverse=True)
    return {"runs": items[:limit], "total": len(items)}


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict:
    state = RUNS.get(run_id)
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


@app.websocket("/ws/runs/{run_id}")
async def ws_run(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    state = RUNS.get(run_id)
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

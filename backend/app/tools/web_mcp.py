"""V2 MCP pre-fetch — the "live browsing" stage that runs BEFORE the agents.

Given a BusinessInput, discovers key URLs (client site + each competitor's site)
via `ddgs`, then opens ONE `@playwright/mcp` Node subprocess and visits every
URL in sequence. For each visit it emits rich live-action events the v2
dashboard can render as "agent is doing X right now":

- `mcp_step`     — the *current* action banner: tool name, step N/M, URL,
                   short human description. UI shows this prominently.
- `mcp_tool_call`— a log line for the tool-call terminal.
- `mcp_screenshot`— base64 JPEG frame (mime included).
- `mcp_result`   — structured per-URL finding (title, meta desc, h1, pricing).

Return value is a dict the caller can inject into the research agent's user
message as "pre-browsed context" so the LLM doesn't have to re-discover it.

Used only by `server_v2.py` — zero coupling to v1.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Awaitable, Callable

from ddgs import DDGS
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from app.schemas import BusinessInput


EmitFn = Callable[[dict], Awaitable[None] | None]


async def _emit(emit: EmitFn, ev: dict) -> None:
    res = emit(ev)
    if asyncio.iscoroutine(res):
        await res


def _discover_urls(query: str, max_results: int = 2) -> list[dict]:
    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results, region="in-en"))
    except Exception:
        return []
    out = []
    for r in raw:
        url = (r.get("href") or r.get("url") or "").strip()
        if not url:
            continue
        out.append(
            {
                "url": url,
                "title": (r.get("title") or "").strip(),
                "snippet": (r.get("body") or "")[:240].strip(),
            }
        )
    return out


def _build_visit_list(business: BusinessInput) -> list[dict]:
    """Queue of {role, brand, url?, query} entries. URL resolved later via ddgs."""
    plan: list[dict] = []

    if business.website:
        plan.append(
            {
                "role": "client",
                "brand": business.business_name,
                "direct_url": business.website,
                "why": "Client homepage — understand current voice & hero products",
            }
        )
    else:
        plan.append(
            {
                "role": "client",
                "brand": business.business_name,
                "query": f"{business.business_name} official site India",
                "why": "Client homepage (discover via search)",
            }
        )

    for comp in business.competitor_names[:3]:
        plan.append(
            {
                "role": "competitor",
                "brand": comp,
                "query": f"{comp} official site India",
                "why": f"Competitor site — capture positioning & pricing",
            }
        )

    if business.focus_product:
        plan.append(
            {
                "role": "hero_search",
                "brand": business.business_name,
                "query": f"{business.business_name} {business.focus_product}",
                "why": "Hero product discovery — find the actual SKU page",
            }
        )

    return plan


_EVAL_FN = (
    "() => {"
    " const md = document.querySelector('meta[name=description]');"
    " const og = document.querySelector('meta[property=\"og:description\"]');"
    " const h1 = document.querySelector('h1');"
    " const body = document.body ? document.body.innerText : '';"
    " const prices = (body.match(/\\u20B9\\s?[0-9][0-9,]{2,}/g) || []).slice(0, 8);"
    " return {"
    "  title: document.title || '',"
    "  description: ((md && md.content) || (og && og.content) || '').trim().slice(0, 280),"
    "  h1: h1 ? (h1.innerText || '').trim().slice(0, 160) : '',"
    "  body_sample: (body || '').replace(/\\s+/g, ' ').trim().slice(0, 600),"
    "  prices_inr: prices"
    " };"
    "}"
)


async def mcp_prefetch_context(
    business: BusinessInput,
    emit: EmitFn,
) -> dict:
    """Run the MCP browsing phase. Returns structured context for agents."""

    plan = _build_visit_list(business)
    total = len(plan)

    await _emit(
        emit,
        {
            "type": "mcp_step",
            "tool": "plan",
            "step": f"0/{total}",
            "label": "Planning MCP browser visits",
            "description": f"Will browse {total} pages: client site + {len(business.competitor_names[:3])} competitors",
        },
    )

    # Resolve query-based entries to concrete URLs.
    for entry in plan:
        if "direct_url" in entry:
            entry["url"] = entry["direct_url"]
            continue
        q = entry["query"]
        await _emit(
            emit,
            {
                "type": "mcp_tool_call",
                "tool": "ddgs.discover",
                "args": {"query": q, "brand": entry["brand"]},
            },
        )
        hits = _discover_urls(q, max_results=2)
        if hits:
            entry["url"] = hits[0]["url"]
            entry["discovered_title"] = hits[0]["title"]
            entry["discovered_snippet"] = hits[0]["snippet"]
        else:
            entry["url"] = None

    plan = [p for p in plan if p.get("url")]
    total = len(plan)

    if not plan:
        await _emit(
            emit,
            {
                "type": "mcp_step",
                "tool": "skip",
                "step": "0/0",
                "label": "No URLs to browse",
                "description": "Skipping MCP phase — no resolvable URLs",
            },
        )
        return {"client_findings": None, "competitor_findings": [], "visited": []}

    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@playwright/mcp@latest", "--headless", "--isolated"],
    )

    await _emit(
        emit,
        {
            "type": "mcp_step",
            "tool": "mcp.connect",
            "step": f"0/{total}",
            "label": "Spawning Playwright MCP server",
            "description": "npx @playwright/mcp (headless, isolated)",
        },
    )
    await _emit(
        emit,
        {
            "type": "mcp_tool_call",
            "tool": "mcp.connect",
            "args": {"server": "@playwright/mcp", "transport": "stdio"},
        },
    )

    client_finding: dict | None = None
    competitor_findings: list[dict] = []
    visited: list[dict] = []

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            await _emit(
                emit,
                {
                    "type": "mcp_tool_call",
                    "tool": "mcp.initialize",
                    "args": {
                        "tool_count": len(tools.tools),
                        "sample_tools": [t.name for t in tools.tools[:6]],
                    },
                },
            )

            for idx, entry in enumerate(plan, start=1):
                url = entry["url"]
                brand = entry["brand"]
                role = entry["role"]
                step = f"{idx}/{total}"

                # --- navigate ---
                await _emit(
                    emit,
                    {
                        "type": "mcp_step",
                        "tool": "browser_navigate",
                        "step": step,
                        "url": url,
                        "brand": brand,
                        "role": role,
                        "label": f"Navigating to {brand}",
                        "description": entry.get("why") or url,
                    },
                )
                await _emit(
                    emit,
                    {
                        "type": "mcp_tool_call",
                        "tool": "browser_navigate",
                        "args": {"url": url, "brand": brand, "step": step},
                    },
                )

                try:
                    await session.call_tool("browser_navigate", {"url": url})
                except Exception as e:
                    await _emit(
                        emit,
                        {
                            "type": "mcp_tool_call",
                            "tool": "browser_navigate",
                            "args": {"error": f"{type(e).__name__}: {e}", "url": url},
                        },
                    )
                    continue

                # --- screenshot ---
                await _emit(
                    emit,
                    {
                        "type": "mcp_step",
                        "tool": "browser_take_screenshot",
                        "step": step,
                        "url": url,
                        "brand": brand,
                        "role": role,
                        "label": f"Capturing screenshot — {brand}",
                        "description": "JPEG, above-the-fold",
                    },
                )
                try:
                    shot_result = await session.call_tool(
                        "browser_take_screenshot",
                        {"type": "jpeg", "fullPage": False},
                    )
                    for content in shot_result.content:
                        if getattr(content, "type", None) == "image":
                            b64 = getattr(content, "data", "") or ""
                            mime = getattr(content, "mimeType", "image/jpeg") or "image/jpeg"
                            if b64:
                                await _emit(
                                    emit,
                                    {
                                        "type": "mcp_screenshot",
                                        "b64": b64,
                                        "mime": mime,
                                        "label": f"{brand} — {role}",
                                        "url": url,
                                        "step": step,
                                    },
                                )
                except Exception as e:
                    await _emit(
                        emit,
                        {
                            "type": "mcp_tool_call",
                            "tool": "browser_take_screenshot",
                            "args": {"error": f"{type(e).__name__}: {e}"},
                        },
                    )

                # --- evaluate (title, description, h1, prices) ---
                await _emit(
                    emit,
                    {
                        "type": "mcp_step",
                        "tool": "browser_evaluate",
                        "step": step,
                        "url": url,
                        "brand": brand,
                        "role": role,
                        "label": f"Extracting page data — {brand}",
                        "description": "title, meta description, h1, INR prices",
                    },
                )
                page_data: dict = {
                    "title": entry.get("discovered_title") or "",
                    "description": entry.get("discovered_snippet") or "",
                    "h1": "",
                    "body_sample": "",
                    "prices_inr": [],
                }
                try:
                    eval_result = await session.call_tool(
                        "browser_evaluate", {"function": _EVAL_FN}
                    )
                    for c in eval_result.content:
                        text = getattr(c, "text", "") or ""
                        if not text:
                            continue
                        m = re.search(r"\{.*\}", text, re.DOTALL)
                        if m:
                            try:
                                parsed = json.loads(m.group(0))
                                page_data["title"] = parsed.get("title") or page_data["title"]
                                page_data["description"] = parsed.get("description") or page_data["description"]
                                page_data["h1"] = parsed.get("h1") or ""
                                page_data["body_sample"] = parsed.get("body_sample") or ""
                                page_data["prices_inr"] = parsed.get("prices_inr") or []
                            except Exception:
                                pass
                except Exception as e:
                    await _emit(
                        emit,
                        {
                            "type": "mcp_tool_call",
                            "tool": "browser_evaluate",
                            "args": {"error": f"{type(e).__name__}: {e}"},
                        },
                    )

                finding = {
                    "role": role,
                    "brand": brand,
                    "url": url,
                    "title": page_data["title"],
                    "description": page_data["description"],
                    "h1": page_data["h1"],
                    "body_sample": page_data["body_sample"],
                    "prices_inr": page_data["prices_inr"],
                }
                visited.append(finding)
                if role == "client":
                    client_finding = finding
                elif role == "competitor":
                    competitor_findings.append(finding)

                await _emit(
                    emit,
                    {
                        "type": "mcp_result",
                        "brand": brand,
                        "role": role,
                        "url": url,
                        "title": finding["title"],
                        "description": finding["description"],
                        "h1": finding["h1"],
                        "prices_inr": finding["prices_inr"][:4],
                        "step": step,
                    },
                )

            try:
                await session.call_tool("browser_close", {})
            except Exception:
                pass

    await _emit(
        emit,
        {
            "type": "mcp_step",
            "tool": "done",
            "step": f"{total}/{total}",
            "label": "MCP browsing complete",
            "description": f"Visited {len(visited)} pages — feeding context to research agent",
        },
    )

    return {
        "client_findings": client_finding,
        "competitor_findings": competitor_findings,
        "visited": visited,
    }


def format_context_for_agent(ctx: dict) -> str:
    """Turn the pre-fetch dict into a text block to inject into the research
    agent's user message. Keeps the agent grounded with LIVE data it can cite."""
    if not ctx or not ctx.get("visited"):
        return ""

    lines = [
        "",
        "=== LIVE BROWSED CONTEXT (captured just now via Playwright MCP) ===",
        "The following pages were browsed live moments ago. Use this as",
        "PRIMARY evidence in your analysis — cite titles/prices directly.",
        "",
    ]

    client = ctx.get("client_findings")
    if client:
        lines.append(f"CLIENT SITE — {client['brand']} ({client['url']})")
        if client.get("title"):
            lines.append(f"  Title: {client['title']}")
        if client.get("h1"):
            lines.append(f"  H1: {client['h1']}")
        if client.get("description"):
            lines.append(f"  Meta description: {client['description']}")
        if client.get("prices_inr"):
            lines.append(f"  INR prices seen: {', '.join(client['prices_inr'])}")
        if client.get("body_sample"):
            lines.append(f"  Body sample: {client['body_sample'][:400]}")
        lines.append("")

    for comp in ctx.get("competitor_findings") or []:
        lines.append(f"COMPETITOR — {comp['brand']} ({comp['url']})")
        if comp.get("title"):
            lines.append(f"  Title: {comp['title']}")
        if comp.get("h1"):
            lines.append(f"  H1: {comp['h1']}")
        if comp.get("description"):
            lines.append(f"  Meta description: {comp['description']}")
        if comp.get("prices_inr"):
            lines.append(f"  INR prices seen: {', '.join(comp['prices_inr'])}")
        if comp.get("body_sample"):
            lines.append(f"  Body sample: {comp['body_sample'][:400]}")
        lines.append("")

    lines.append("=== END LIVE BROWSED CONTEXT ===")
    lines.append("")
    return "\n".join(lines)

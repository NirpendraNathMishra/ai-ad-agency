"""V2 browser tool — uses the *actual* Playwright MCP server (`@playwright/mcp`)
spawned as a Node subprocess over stdio. Communicates via the official MCP
JSON-RPC protocol using the `mcp` Python SDK.

Strategy:
1. `ddgs` discovers candidate URLs (search engines block headless, so we
   don't browse them — we use the API).
2. Spawn `@playwright/mcp` via `npx -y @playwright/mcp@latest --headless`.
3. For each URL: call real MCP tools `browser_navigate` →
   `browser_take_screenshot` → `browser_evaluate` (for title/meta).
4. Stream every MCP tool call + screenshot to the UI via `on_event`.

Requires:
- `pip install mcp ddgs`
- Node + `npx` on PATH
- First run downloads `@playwright/mcp` package (~30s); cached after.

Used only by `server_v2.py` — fully separable from v1.
"""

from __future__ import annotations

import asyncio
from typing import Awaitable, Callable

from ddgs import DDGS
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


EmitFn = Callable[[dict], Awaitable[None] | None]


async def _emit(emit: EmitFn, ev: dict) -> None:
    res = emit(ev)
    if asyncio.iscoroutine(res):
        await res


async def run_mcp_browser_search(
    query: str,
    emit: EmitFn,
    max_visits: int = 5,
) -> dict:
    await _emit(
        emit,
        {
            "type": "browser_action",
            "tool": "search.discover",
            "args": {"query": query, "engine": "ddgs", "region": "in-en"},
        },
    )

    discovered: list[dict] = []
    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_visits, region="in-en"))
        for r in raw:
            url = (r.get("href") or r.get("url") or "").strip()
            if url:
                discovered.append(
                    {
                        "url": url,
                        "title": (r.get("title") or "").strip(),
                        "snippet": (r.get("body") or "")[:280].strip(),
                    }
                )
    except Exception as e:
        await _emit(
            emit,
            {
                "type": "browser_action",
                "tool": "search.discover",
                "args": {"error": f"{type(e).__name__}: {e}"},
            },
        )

    await _emit(
        emit,
        {
            "type": "browser_action",
            "tool": "search.discover",
            "args": {"found": len(discovered)},
        },
    )

    if not discovered:
        return {"query": query, "count": 0, "results": [], "source": "mcp_playwright"}

    visited: list[dict] = []

    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@playwright/mcp@latest", "--headless", "--isolated"],
    )

    await _emit(
        emit,
        {
            "type": "browser_action",
            "tool": "mcp.connect",
            "args": {"server": "@playwright/mcp", "transport": "stdio"},
        },
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            await _emit(
                emit,
                {
                    "type": "browser_action",
                    "tool": "mcp.initialize",
                    "args": {
                        "tool_count": len(tools.tools),
                        "sample_tools": [t.name for t in tools.tools[:6]],
                    },
                },
            )

            for idx, item in enumerate(discovered, start=1):
                url = item["url"]
                step = f"{idx}/{len(discovered)}"

                try:
                    await _emit(
                        emit,
                        {
                            "type": "browser_action",
                            "tool": "browser_navigate",
                            "args": {"url": url, "step": step},
                        },
                    )
                    await session.call_tool("browser_navigate", {"url": url})

                    await _emit(
                        emit,
                        {
                            "type": "browser_action",
                            "tool": "browser_take_screenshot",
                            "args": {"type": "jpeg", "fullPage": False},
                        },
                    )
                    shot_result = await session.call_tool(
                        "browser_take_screenshot",
                        {"type": "jpeg", "fullPage": False},
                    )

                    label = item["title"][:80] or url
                    for content in shot_result.content:
                        if getattr(content, "type", None) == "image":
                            b64 = getattr(content, "data", "") or ""
                            mime = getattr(content, "mimeType", "image/jpeg") or "image/jpeg"
                            if b64:
                                await _emit(
                                    emit,
                                    {
                                        "type": "browser_screenshot",
                                        "b64": b64,
                                        "label": label,
                                        "mime": mime,
                                    },
                                )

                    title = item["title"]
                    description = item["snippet"]
                    try:
                        await _emit(
                            emit,
                            {
                                "type": "browser_action",
                                "tool": "browser_evaluate",
                                "args": {"function": "extract title + meta description"},
                            },
                        )
                        eval_result = await session.call_tool(
                            "browser_evaluate",
                            {
                                "function": (
                                    "() => { "
                                    "const md = document.querySelector('meta[name=description]'); "
                                    "const og = document.querySelector('meta[property=\"og:description\"]'); "
                                    "return { "
                                    "title: document.title, "
                                    "description: ((md && md.content) || (og && og.content) || '').trim().slice(0, 280) "
                                    "}; "
                                    "}"
                                )
                            },
                        )
                        for c in eval_result.content:
                            text = getattr(c, "text", "") or ""
                            if text:
                                import json
                                import re

                                match = re.search(r"\{.*\}", text, re.DOTALL)
                                if match:
                                    try:
                                        parsed = json.loads(match.group(0))
                                        title = parsed.get("title") or title
                                        description = parsed.get("description") or description
                                    except Exception:
                                        pass
                    except Exception:
                        pass

                    row = {
                        "title": title,
                        "url": url,
                        "snippet": description,
                        "source": "mcp_playwright",
                    }
                    visited.append(row)
                    await _emit(emit, {"type": "browser_result", **row})

                except Exception as e:
                    await _emit(
                        emit,
                        {
                            "type": "browser_action",
                            "tool": "browser_navigate",
                            "args": {
                                "url": url,
                                "step": step,
                                "error": f"{type(e).__name__}: {e}",
                            },
                        },
                    )

            try:
                await _emit(
                    emit,
                    {
                        "type": "browser_action",
                        "tool": "browser_close",
                        "args": {"visited_count": len(visited)},
                    },
                )
                await session.call_tool("browser_close", {})
            except Exception:
                pass

    return {
        "query": query,
        "count": len(visited),
        "results": visited,
        "source": "mcp_playwright",
    }

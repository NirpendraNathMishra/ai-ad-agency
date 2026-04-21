"""Combined ASGI entry: merges v1 and v2 routes under a single FastAPI app.

Railway gives us exactly one $PORT per service, so we mount both backends
into one process. v1 and v2 keep their own modules; this file imports their
apps, merges routes, and wires up MongoDB persistence + initial load.

Path layout (no collisions):
  v1 → /api/runs, /api/runs/{id}, /ws/runs/{id}
  v2 → /api/v2/runs, /api/v2/runs/{id}, /ws/v2/runs/{id},
       /api/v2/browser-demo, /api/v2/browser-demo/{id}, /ws/v2/browser-demo/{id}
Shared → /api/health (v2 wins — both return the same shape)
"""
from __future__ import annotations

import server as v1_mod
import server_v2 as v2_mod
from app.schemas import BusinessInput
from app.storage import mongo

app_v1 = v1_mod.app
app_v2 = v2_mod.app

_v2_paths = {getattr(r, "path", None) for r in app_v2.routes}
for route in app_v1.routes:
    path = getattr(route, "path", None)
    if path and path not in _v2_paths:
        app_v2.routes.append(route)


@app_v2.on_event("startup")
async def _startup_mongo() -> None:
    await mongo.init_mongo()
    if mongo.is_enabled():
        n1 = await mongo.load_v1_runs(v1_mod.RunState, BusinessInput, v1_mod.RUNS)
        n2 = await mongo.load_v2_runs(v2_mod.RunV2State, BusinessInput, v2_mod.RUNS_V2)
        print(f"[startup] loaded from mongo: v1={n1}, v2={n2}")
        # Any "running" run loaded from mongo was interrupted by the previous
        # container's exit — its asyncio task doesn't survive a restart. Mark
        # it errored so the UI stops showing a live spinner forever.
        i1 = await _sweep_stale_running(v1_mod.RUNS, mongo.save_run_v1)
        i2 = await _sweep_stale_running(v2_mod.RUNS_V2, mongo.save_run_v2)
        if i1 or i2:
            print(f"[startup] marked interrupted: v1={i1}, v2={i2}")


async def _sweep_stale_running(runs: dict, save_fn) -> int:
    n = 0
    for state in runs.values():
        if state.status == "running" or state.status == "pending":
            state.status = "error"
            state.error = "interrupted (container restart before pipeline completed)"
            await save_fn(state)
            n += 1
    return n

app = app_v2

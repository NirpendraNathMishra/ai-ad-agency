"""Combined ASGI entry: merges v1 and v2 routes under a single FastAPI app.

Railway gives us exactly one $PORT per service, so we mount both backends
into one process. v1 and v2 keep their own modules (untouched); this file
just imports their apps and merges routes.

Path layout (no collisions):
  v1 → /api/runs, /api/runs/{id}, /ws/runs/{id}
  v2 → /api/v2/runs, /api/v2/runs/{id}, /ws/v2/runs/{id},
       /api/v2/browser-demo, /api/v2/browser-demo/{id}, /ws/v2/browser-demo/{id}
Shared → /api/health (v2 wins — both return the same shape)
"""
from server import app as app_v1  # original v1 app
from server_v2 import app as app_v2  # v2 app (MCP + full pipeline)

_existing_paths = {getattr(r, "path", None) for r in app_v2.routes}
for route in app_v1.routes:
    path = getattr(route, "path", None)
    if path and path not in _existing_paths:
        app_v2.routes.append(route)
        _existing_paths.add(path)

app = app_v2

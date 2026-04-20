# Deployment — Railway (backend) + Vercel (frontend)

## Architecture

```
┌──────────────────┐         ┌─────────────────────────┐
│  Vercel          │ ──HTTPS▶│  Railway (v2 backend)    │
│  Next.js (3000)  │ ◀──WSS──│  FastAPI + Playwright MCP│
│                  │         │  (Python 3.11 + Node 20) │
└──────────────────┘         └─────────────────────────┘
```

The v1 backend (port 8000) and v2 backend (port 8001) are independent
processes. You can deploy either or both — each is its own Railway service.

---

## Backend — Railway

### Files (already in `backend/`):
- `Procfile` — start command for Railway
- `railway.json` — explicit Railway config + healthcheck
- `nixpacks.toml` — build config (installs **both** Python AND Node, since
  the v2 MCP browser spawns `npx @playwright/mcp`)
- `runtime.txt` — pins Python 3.11.9
- `.env.example` — all required + optional env vars
- `requirements.txt` — Python deps

### Steps

1. Push the repo to GitHub.
2. On Railway → **New Project → Deploy from GitHub repo**.
3. Pick the repo. Railway auto-detects the `backend/` Procfile.
4. Set the **root directory** to `backend` in Service Settings.
5. Add environment variables (Service → Variables):
   ```
   LLM_PROVIDER=nvidia
   NVIDIA_API_KEY=nvapi-...
   RESEARCH_MODEL=z-ai/glm-5.1
   STRATEGY_MODEL=moonshotai/kimi-k2-instruct-0905
   CREATIVE_MODEL=meta/llama-4-maverick-17b-128e-instruct
   PYTHONIOENCODING=utf-8
   PYTHONUNBUFFERED=1
   ```
6. Railway gives you a public URL like `https://your-app.up.railway.app`.
   Healthcheck `/api/health` must return 200 for the deploy to go live.

### To deploy v1 backend instead (or as a second service)
Change the Procfile or override the start command in Railway:
```
python -m uvicorn server:app --host 0.0.0.0 --port $PORT
```

### First-request slowness
First MCP request downloads `@playwright/mcp` (~30s + Chromium download
~120MB). Subsequent requests are fast. The `nixpacks.toml` pre-warms the
package at build time to reduce this.

---

## Frontend — Vercel

### Files (already in `frontend/`):
- `.env.example` — env-var template
- Standard Next.js — Vercel auto-detects, no extra config needed.

### Steps

1. On Vercel → **Add New → Project → Import** the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Next.js. Build command: `npm run build`.
4. Add environment variables (Project Settings → Environment Variables):
   ```
   NEXT_PUBLIC_API_BASE=https://<your-v1-backend>.up.railway.app
   NEXT_PUBLIC_WS_BASE=wss://<your-v1-backend>.up.railway.app
   NEXT_PUBLIC_API_BASE_V2=https://<your-v2-backend>.up.railway.app
   NEXT_PUBLIC_WS_BASE_V2=wss://<your-v2-backend>.up.railway.app
   ```
   Note: `wss://` (TLS WebSocket) since Vercel is HTTPS — `ws://` will be
   blocked by the browser as mixed content.
5. Deploy. Vercel gives you `https://your-app.vercel.app`.

CORS is already wide-open on both backends (`allow_origins=["*"]`), so no
extra config needed.

---

## In-memory state

Both v1 and v2 backends store runs in process memory (`RUNS` / `RUNS_V2`
dicts). On Railway dyno restart or redeploy, history is lost.

### To swap to MongoDB

Add `motor` to `requirements.txt` and replace the `RUNS_V2: dict` with a
small wrapper:

```python
# backend/app/storage/mongo.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

client = AsyncIOMotorClient(os.environ["MONGODB_URI"])
runs_coll = client[os.environ.get("MONGODB_DB", "adforge")].v2_runs

async def save_run(state):
    await runs_coll.replace_one(
        {"run_id": state.run_id},
        {
            "run_id": state.run_id,
            "status": state.status,
            "business": state.business.model_dump(),
            "events": state.events,
            "final_report": state.final_report,
            "final_markdown": state.final_markdown,
            "error": state.error,
            "created_at": state.created_at,
        },
        upsert=True,
    )
```

Call `await save_run(state)` after each `state.events.append(...)` (or
just at the end of `_run_full_pipeline`) and load on startup.

Add `MONGODB_URI` to Railway env vars when ready.

---

## Quick local dev

```bash
# 3 terminals:

# 1. v1 backend
cd backend && python -X utf8 -m uvicorn server:app --port 8000 --reload

# 2. v2 backend (needs Node + npx on PATH)
cd backend && python -X utf8 -m uvicorn server_v2:app --port 8001 --reload

# 3. frontend
cd frontend && npm run dev
```

Open `http://localhost:3000/launch` to pick v1 or v2.

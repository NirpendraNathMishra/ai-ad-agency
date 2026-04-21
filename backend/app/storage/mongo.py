"""MongoDB persistence for v1 and v2 RunState dicts.

If MONGO_URI is unset (or motor isn't installed, or the connection fails),
all calls become no-ops and the servers silently fall back to in-memory state.
That means local dev without Mongo still works; production gets persistence.

Public API:
    await init_mongo()                        # startup
    await save_run_v1(state) / save_run_v2    # after every important update
    await load_v1_runs(...) / load_v2_runs    # startup (after init_mongo)
    is_enabled()                              # cheap bool check
"""
from __future__ import annotations

import os
from typing import Any

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
    _MOTOR_OK = True
except ImportError:
    _MOTOR_OK = False
    AsyncIOMotorClient = None  # type: ignore
    AsyncIOMotorCollection = Any  # type: ignore

_client: Any = None
_v1_coll: Any = None
_v2_coll: Any = None


def is_enabled() -> bool:
    return _client is not None and _v1_coll is not None and _v2_coll is not None


async def init_mongo() -> None:
    """Connect to MongoDB. Safe to call if MONGO_URI is missing — becomes no-op."""
    global _client, _v1_coll, _v2_coll
    uri = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")
    if not uri or not _MOTOR_OK:
        print(f"[mongo] disabled (uri_set={bool(uri)}, motor_ok={_MOTOR_OK})")
        return
    try:
        _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await _client.admin.command("ping")
        db = _client[os.environ.get("MONGO_DB", "adforge")]
        _v1_coll = db["v1_runs"]
        _v2_coll = db["v2_runs"]
        await _v1_coll.create_index("run_id", unique=True)
        await _v1_coll.create_index([("created_at", -1)])
        await _v2_coll.create_index("run_id", unique=True)
        await _v2_coll.create_index([("created_at", -1)])
        print(f"[mongo] connected: db={db.name}")
    except Exception as e:
        print(f"[mongo] connect failed ({type(e).__name__}): {e}")
        _client = None
        _v1_coll = None
        _v2_coll = None


def _doc_v1(state) -> dict:
    return {
        "run_id": state.run_id,
        "status": state.status,
        "business": state.business.model_dump(),
        "events": state.events,
        "final_report": state.final_report,
        "final_markdown": state.final_markdown,
        "error": state.error,
        "created_at": state.created_at,
    }


def _doc_v2(state) -> dict:
    return {
        "run_id": state.run_id,
        "status": state.status,
        "business": state.business.model_dump(),
        "events": state.events,
        "final_report": state.final_report,
        "final_markdown": state.final_markdown,
        "mcp_context": state.mcp_context,
        "error": state.error,
        "created_at": state.created_at,
    }


async def save_run_v1(state) -> None:
    if _v1_coll is None:
        return
    try:
        await _v1_coll.replace_one({"run_id": state.run_id}, _doc_v1(state), upsert=True)
    except Exception as e:
        print(f"[mongo v1 save {state.run_id}] {type(e).__name__}: {e}")


async def save_run_v2(state) -> None:
    if _v2_coll is None:
        return
    try:
        await _v2_coll.replace_one({"run_id": state.run_id}, _doc_v2(state), upsert=True)
    except Exception as e:
        print(f"[mongo v2 save {state.run_id}] {type(e).__name__}: {e}")


async def load_v1_runs(RunStateCls, BusinessInputCls, RUNS: dict, limit: int = 200) -> int:
    if _v1_coll is None:
        return 0
    n = 0
    async for doc in _v1_coll.find().sort("created_at", -1).limit(limit):
        try:
            state = RunStateCls(
                run_id=doc["run_id"],
                business=BusinessInputCls(**doc["business"]),
            )
            state.status = doc.get("status", "done")
            state.events = doc.get("events") or []
            state.final_report = doc.get("final_report")
            state.final_markdown = doc.get("final_markdown")
            state.error = doc.get("error")
            state.created_at = doc.get("created_at") or state.created_at
            RUNS[state.run_id] = state
            n += 1
        except Exception as e:
            print(f"[mongo v1 load skip {doc.get('run_id')}] {type(e).__name__}: {e}")
    return n


async def load_v2_runs(RunV2StateCls, BusinessInputCls, RUNS_V2: dict, limit: int = 200) -> int:
    if _v2_coll is None:
        return 0
    n = 0
    async for doc in _v2_coll.find().sort("created_at", -1).limit(limit):
        try:
            state = RunV2StateCls(
                run_id=doc["run_id"],
                business=BusinessInputCls(**doc["business"]),
            )
            state.status = doc.get("status", "done")
            state.events = doc.get("events") or []
            state.final_report = doc.get("final_report")
            state.final_markdown = doc.get("final_markdown")
            state.mcp_context = doc.get("mcp_context")
            state.error = doc.get("error")
            state.created_at = doc.get("created_at") or state.created_at
            RUNS_V2[state.run_id] = state
            n += 1
        except Exception as e:
            print(f"[mongo v2 load skip {doc.get('run_id')}] {type(e).__name__}: {e}")
    return n

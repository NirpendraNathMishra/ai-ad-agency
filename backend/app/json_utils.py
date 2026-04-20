"""Robust JSON parsing for LLM outputs.

Handles the common quirks:
- Code fences (```json ... ```)
- Trailing / leading commentary
- Llama's "typed-wrapper" artifact — {"type": "list", "value": [...]}
  (happens when Llama emits final JSON as a tool-call and serialises each
  field as a typed argument)
"""

from __future__ import annotations

import json
import re
from typing import Any


_TYPED_WRAPPER_KEYS = {"type", "value"}


def parse_llm_json(raw: str) -> dict:
    """Parse an LLM's JSON-ish output into a clean Python dict."""
    cleaned = _strip_fences(raw)
    cleaned = _extract_first_object(cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Could not parse LLM output as JSON.\nError: {e}\nRaw:\n{raw[:1500]}"
        ) from e

    return _unwrap_typed(data)


def _strip_fences(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```"):
        s = s.split("```", 2)[1]
        if s.startswith("json"):
            s = s[4:]
        elif s.startswith("JSON"):
            s = s[4:]
        s = s.rsplit("```", 1)[0].strip()
    return s


def _extract_first_object(s: str) -> str:
    """Grab the first top-level JSON object, skipping any narrative text."""
    start = s.find("{")
    if start == -1:
        return s
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(s)):
        ch = s[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
    return s[start:]


def _unwrap_typed(value: Any) -> Any:
    """Recursively unwrap Llama's {"type": X, "value": Y} wrappers.

    Also handles the schema-echo variant where Llama emits tool args as
    {"type": "object", "properties": {"field": {"type": "string", "value": "x"}}}
    — we flatten `properties` to {field: value} when that shape is detected.
    """
    if isinstance(value, dict):
        if set(value.keys()) == _TYPED_WRAPPER_KEYS and isinstance(value.get("type"), str):
            return _unwrap_typed(value["value"])
        if (
            value.get("type") == "object"
            and isinstance(value.get("properties"), dict)
            and set(value.keys()) <= {"type", "properties", "required"}
        ):
            return _unwrap_typed(value["properties"])
        return {k: _unwrap_typed(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_unwrap_typed(v) for v in value]
    if isinstance(value, str):
        stripped = value.strip()
        if (stripped.startswith("{") and stripped.endswith("}")) or (
            stripped.startswith("[") and stripped.endswith("]")
        ):
            try:
                return _unwrap_typed(json.loads(stripped))
            except json.JSONDecodeError:
                return value
        return value
    return value


def unwrap_tool_args(raw_args: str) -> dict:
    """Parse + unwrap tool call arguments from an LLM. Tolerates schema-echoes."""
    try:
        data = json.loads(raw_args or "{}")
    except json.JSONDecodeError:
        return {}
    unwrapped = _unwrap_typed(data)
    return unwrapped if isinstance(unwrapped, dict) else {}

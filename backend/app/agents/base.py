"""Provider-agnostic agent loop.

Supports two backends:
- Anthropic Claude (native messages API + tool use)
- OpenAI-compatible endpoints (NVIDIA NIM, Groq, OpenAI, OpenRouter)

Tools are defined once in Anthropic-ish format ({name, description, input_schema})
and converted to OpenAI format when needed.

Observability: pass an `on_event(event: dict)` callback into AgentRunner and the
loop will emit structured events (iter_start, tool_call, tool_result, retry,
detected_synthesis, max_iter, final_text). The callback is also invoked for the
print-style verbose trace.
"""

from __future__ import annotations

import json
import time
from typing import Any, Callable

from app.config import config
from app.json_utils import unwrap_tool_args


EventCallback = Callable[[dict], None]


def _call_with_retry(
    fn,
    max_attempts: int = 6,
    base_delay: float = 5.0,
    max_delay: float = 90.0,
    emit_retry: EventCallback | None = None,
):
    """Retry on rate-limit / transient errors with exponential backoff (capped)."""
    last_exc: Exception | None = None
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            msg = str(e).lower()
            exc_name = type(e).__name__.lower()
            retryable = (
                "429" in msg
                or "rate" in msg
                or "too many requests" in msg
                or "overloaded" in msg
                or "503" in msg
                or "502" in msg
                or "504" in msg
                or "connection" in exc_name
                or "timeout" in exc_name
                or "getaddrinfo" in msg
                or "connection error" in msg
                or "connection reset" in msg
                or "remote disconnected" in msg
                or "internal server error" in msg
                or "internalservererror" in exc_name
            )
            if not retryable or attempt == max_attempts - 1:
                raise
            last_exc = e
            delay = min(base_delay * (2 ** attempt), max_delay)
            if emit_retry:
                emit_retry(
                    {
                        "type": "retry",
                        "attempt": attempt + 1,
                        "delay_seconds": delay,
                        "reason": type(e).__name__,
                        "message": str(e)[:200],
                    }
                )
            print(f"  [retry after {delay:.0f}s due to: {type(e).__name__}]")
            time.sleep(delay)
    if last_exc:
        raise last_exc


class AgentRunner:
    def __init__(
        self,
        model: str,
        system_prompt: str,
        tools: list[dict] | None = None,
        tool_handlers: dict[str, Callable[..., Any]] | None = None,
        max_iterations: int = 8,
        enable_caching: bool = False,
        on_event: EventCallback | None = None,
        agent_name: str = "agent",
    ):
        self.model = model
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.tool_handlers = tool_handlers or {}
        self.max_iterations = max_iterations
        self.enable_caching = enable_caching
        self.on_event = on_event
        self.agent_name = agent_name

    def _emit(self, event: dict) -> None:
        event = {"agent": self.agent_name, **event}
        if self.on_event:
            try:
                self.on_event(event)
            except Exception:
                pass

    def run(self, user_message: str, verbose: bool = True) -> str:
        self._emit({"type": "agent_start", "model": self.model})
        if config.LLM_PROVIDER == "anthropic":
            out = self._run_anthropic(user_message, verbose)
        elif config.is_openai_compatible():
            out = self._run_openai_compatible(user_message, verbose)
        else:
            raise RuntimeError(f"Unsupported provider: {config.LLM_PROVIDER}")
        self._emit({"type": "agent_raw_output", "length": len(out)})
        return out

    # --------------------------- Anthropic path ---------------------------

    def _run_anthropic(self, user_message: str, verbose: bool) -> str:
        from anthropic import Anthropic

        client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        system_blocks = self._anthropic_system_blocks()
        messages: list[dict] = [{"role": "user", "content": user_message}]

        for iteration in range(self.max_iterations):
            response = client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_blocks,
                tools=self.tools if self.tools else None,
                messages=messages,
            )

            self._emit(
                {
                    "type": "iter_done",
                    "iter": iteration + 1,
                    "finish_reason": response.stop_reason,
                }
            )
            if verbose:
                print(f"  [iter {iteration + 1}] stop_reason={response.stop_reason}")

            if response.stop_reason == "end_turn":
                return self._extract_anthropic_text(response)

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = self._run_anthropic_tools(response.content, verbose)
                messages.append({"role": "user", "content": tool_results})
                continue

            return self._extract_anthropic_text(response)

        raise RuntimeError(f"Agent exceeded {self.max_iterations} iterations")

    def _anthropic_system_blocks(self) -> list[dict]:
        block: dict = {"type": "text", "text": self.system_prompt}
        if self.enable_caching:
            block["cache_control"] = {"type": "ephemeral"}
        return [block]

    def _extract_anthropic_text(self, response) -> str:
        return "\n".join(b.text for b in response.content if b.type == "text").strip()

    def _run_anthropic_tools(self, content_blocks, verbose: bool) -> list[dict]:
        results = []
        for block in content_blocks:
            if block.type != "tool_use":
                continue
            self._emit(
                {"type": "tool_call", "tool": block.name, "args": block.input}
            )
            if verbose:
                print(f"    tool: {block.name}({json.dumps(block.input)[:120]})")
            output = self._invoke_handler(block.name, block.input)
            self._emit(
                {
                    "type": "tool_result",
                    "tool": block.name,
                    "summary": self._summarize_tool_output(output),
                }
            )
            results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(output)[:20000],
                }
            )
        return results

    # --------------------------- OpenAI-compatible path ---------------------------

    def _run_openai_compatible(self, user_message: str, verbose: bool) -> str:
        from openai import OpenAI

        client = OpenAI(
            api_key=config.provider_api_key(),
            base_url=config.provider_base_url(),
        )

        messages: list[dict] = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_message},
        ]
        tools = self._to_openai_tools()
        known_tool_names = {t["name"] for t in self.tools}
        seen_calls: dict[str, Any] = {}

        for iteration in range(self.max_iterations):
            kwargs: dict = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 8192,
                "temperature": 0.4,
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"

            self._emit({"type": "iter_start", "iter": iteration + 1})
            response = _call_with_retry(
                lambda: client.chat.completions.create(**kwargs),
                emit_retry=self._emit,
            )
            choice = response.choices[0]
            msg = choice.message

            self._emit(
                {
                    "type": "iter_done",
                    "iter": iteration + 1,
                    "finish_reason": choice.finish_reason,
                }
            )
            if verbose:
                print(f"  [iter {iteration + 1}] finish_reason={choice.finish_reason}")

            has_tool_calls = bool(msg.tool_calls)

            if has_tool_calls:
                unknown = [tc for tc in msg.tool_calls if tc.function.name not in known_tool_names]
                if unknown and len(unknown) == len(msg.tool_calls):
                    self._emit(
                        {
                            "type": "synthesis_as_tool_call",
                            "tool": unknown[0].function.name,
                        }
                    )
                    if verbose:
                        print(f"  [detected synthesis-as-tool-call: {unknown[0].function.name}]")
                    return (unknown[0].function.arguments or "").strip()

                messages.append(
                    {
                        "role": "assistant",
                        "content": msg.content or "",
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments,
                                },
                            }
                            for tc in msg.tool_calls
                        ],
                    }
                )
                for tc in msg.tool_calls:
                    args = unwrap_tool_args(tc.function.arguments or "{}")
                    self._emit(
                        {"type": "tool_call", "tool": tc.function.name, "args": args}
                    )
                    if verbose:
                        print(f"    tool: {tc.function.name}({json.dumps(args)[:120]})")
                    call_key = f"{tc.function.name}|{json.dumps(args, sort_keys=True)}"
                    if call_key in seen_calls:
                        if verbose:
                            print(f"    [duplicate call — returning cached result + stop hint]")
                        output = {
                            "_cached_duplicate": True,
                            "hint": (
                                "You already called this exact tool with these exact "
                                "arguments. Do not repeat tool calls. If you have enough "
                                "information, stop calling tools and output the final JSON now."
                            ),
                            "previous_output": seen_calls[call_key],
                        }
                        self._emit(
                            {
                                "type": "tool_result",
                                "tool": tc.function.name,
                                "cached": True,
                                "summary": "(duplicate — returning cached result)",
                            }
                        )
                    else:
                        output = self._invoke_handler(tc.function.name, args)
                        seen_calls[call_key] = output
                        self._emit(
                            {
                                "type": "tool_result",
                                "tool": tc.function.name,
                                "cached": False,
                                "summary": self._summarize_tool_output(output),
                            }
                        )
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": json.dumps(output)[:20000],
                        }
                    )
                continue

            return (msg.content or "").strip()

        self._emit({"type": "max_iterations_reached"})
        if verbose:
            print("  [max iterations reached — forcing synthesis pass]")
        messages.append(
            {
                "role": "user",
                "content": (
                    "You have enough information. Stop calling tools and respond "
                    "now with ONLY the final JSON output as plain text."
                ),
            }
        )
        final = _call_with_retry(
            lambda: client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=8192,
                temperature=0.2,
            ),
            emit_retry=self._emit,
        )
        return (final.choices[0].message.content or "").strip()

    def _to_openai_tools(self) -> list[dict]:
        out = []
        for t in self.tools:
            out.append(
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["input_schema"],
                    },
                }
            )
        return out

    # --------------------------- Shared ---------------------------

    def _invoke_handler(self, name: str, args: dict) -> Any:
        handler = self.tool_handlers.get(name)
        if handler is None:
            return {"error": f"no handler registered for tool '{name}'"}
        try:
            return handler(**args)
        except Exception as e:
            return {"error": f"{type(e).__name__}: {e}"}

    @staticmethod
    def _summarize_tool_output(output: Any) -> str:
        if isinstance(output, dict):
            if "error" in output:
                return f"error: {output['error']}"
            if "count" in output and "query" in output:
                return f"{output.get('count', '?')} hits for '{output.get('query','')}'"
            if "title" in output and "url" in output:
                return f"{output['title']} — {output.get('url','')[:60]}"
            if "results" in output and isinstance(output["results"], str):
                return output["results"][:220].replace("\n", " ")
            keys = ", ".join(list(output.keys())[:4])
            return f"keys: {keys}"
        return str(output)[:200]

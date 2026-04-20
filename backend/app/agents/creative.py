"""Creative Agent — generates ad copy variants for each audience segment."""

from __future__ import annotations

from typing import Callable

from app.agents.base import AgentRunner
from app.config import config
from app.json_utils import parse_llm_json
from app.schemas import AdStrategy, BusinessInput, CreativeSet


CREATIVE_SYSTEM_PROMPT = """You are a direct-response copywriter specialising in performance ads for Indian SMBs. You write copy that hooks attention in 3 words, speaks the customer's language, and drives click.

Rules:
- Headlines must be under 40 characters (Meta) or 30 characters (Google Search RSA).
- Primary text under 125 characters for Meta feed ads.
- Use concrete numbers, benefits, or social proof — not vague claims.
- Match tone to platform: Meta = conversational, Google Search = intent-matching.
- Every variant should test a different angle (problem-solution, social proof, discount, FOMO, aspirational, feature-led).
- Use code-switched Hinglish ONLY if the target audience matches (note in `angle` if you do).

Generate exactly 10 variants spread across the strategy's audience segments and platforms. For each, describe an `image_concept` clearly enough that an image model (or designer) could produce it.

Return ONLY a valid JSON object — no markdown — matching this schema:

{
  "variants": [
    {
      "variant_id": 1,
      "platform": "meta" | "google_search" | "google_display" | "youtube",
      "audience_segment_name": "matches one from strategy",
      "headline": "...",
      "primary_text": "...",
      "cta": "Shop Now" | "Learn More" | "Sign Up" | "Book Now" | ...,
      "image_concept": "clear visual description",
      "angle": "problem-solution | social-proof | discount | FOMO | aspirational | feature-led"
    }
  ]
}
"""


def run_creative_agent(
    business: BusinessInput,
    strategy: AdStrategy,
    verbose: bool = True,
    on_event: Callable[[dict], None] | None = None,
) -> CreativeSet:
    runner = AgentRunner(
        model=config.model_for("creative"),
        system_prompt=CREATIVE_SYSTEM_PROMPT,
        tools=[],
        tool_handlers={},
        max_iterations=2,
        on_event=on_event,
        agent_name="creative",
    )

    user_message = _build_user_message(business, strategy)
    raw = runner.run(user_message, verbose=verbose)
    return _parse_output(raw)


def _build_user_message(business: BusinessInput, strategy: AdStrategy) -> str:
    segments_desc = "\n".join(
        f"- {s.name} (platforms: {', '.join(s.platforms)}): {s.description}"
        for s in strategy.audience_segments
    )
    focus_line = (
        f"\nHERO PRODUCT (every variant must sell this SKU specifically): {business.focus_product}"
        if business.focus_product
        else ""
    )
    return f"""Business: {business.business_name}
Product: {business.product_description}
USPs: {"; ".join(business.unique_selling_points)}
Target audience: {business.target_audience}
Geography: {business.geography}{focus_line}

Strategy summary: {strategy.executive_summary}

Audience segments to write for:
{segments_desc}

Generate 10 creative variants spread intelligently across these segments and their platforms. Return JSON.
"""


def _parse_output(raw: str) -> CreativeSet:
    data = parse_llm_json(raw)
    return CreativeSet(**data)

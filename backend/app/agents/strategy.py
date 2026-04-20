"""Strategy Agent — turns research + business context into a full ad strategy."""

from __future__ import annotations

from typing import Callable

from app.agents.base import AgentRunner
from app.config import config
from app.json_utils import parse_llm_json
from app.schemas import AdStrategy, BusinessInput, CompetitorAnalysis


STRATEGY_SYSTEM_PROMPT = """You are a senior paid-media strategist with 10+ years running campaigns for small-to-mid businesses in India. You think in terms of funnels, unit economics, and what actually works for a given budget.

Your role: take a business brief + deep competitor research, and produce a complete, actionable ad strategy the business owner can execute.

Principles you follow:
1. BUDGET DISCIPLINE — match platform count to budget. ₹50k/mo → 1 platform; ₹5L/mo → 2-3; ₹25L+/mo → all 4 are in play.
2. Match platform to intent: Google Search for high-intent, Meta for discovery/social, YouTube for consideration, Google Display for retargeting.
3. If a HERO PRODUCT is given in the brief, the ENTIRE strategy should revolve around selling that SKU. Audience segments, funnel, and KPIs all zoom in on it. Mention the SKU name in the executive summary.
4. Use the COMPETITOR CHANNEL MIX to decide where to show up differently — if every competitor is on Meta feed, consider also investing in YouTube or Google Shopping where attention is less saturated.
5. Use the GAPS AND OPPORTUNITIES from research as the CORE positioning wedge. Do not reuse competitor themes.
6. Budget allocation MUST sum exactly to the user's stated monthly budget (INR).
7. `do_not_do` must be SPECIFIC to this business + this hero product — reference the actual competitor names, channels, or pricing seen in research. No generic best-practice lists.
8. `first_30_days_plan` is week-by-week and concrete — name the platforms, the ad sets, the audiences, the creative type per week.

Output ONLY a valid JSON object matching this schema exactly — no markdown, no commentary:

{
  "executive_summary": "4-6 sentences, concrete, mention hero SKU if given",
  "audience_segments": [
    {"name": "short label", "description": "...", "platforms": ["meta" | "google_search" | "google_display" | "youtube"], "targeting_signals": ["..."]}
  ],
  "budget_allocation": [
    {"platform": "meta" | "google_search" | "google_display" | "youtube", "monthly_inr": 30000, "rationale": "..."}
  ],
  "funnel_stages": ["Awareness: ...", "Consideration: ...", "Conversion: ..."],
  "recommended_kpis": ["CPL under ₹X", "ROAS > Y"],
  "do_not_do": ["specific mistake 1", "specific mistake 2"],
  "first_30_days_plan": ["Week 1: ...", "Week 2: ...", "Week 3: ...", "Week 4: ..."]
}
"""


def run_strategy_agent(
    business: BusinessInput,
    research: CompetitorAnalysis,
    verbose: bool = True,
    on_event: Callable[[dict], None] | None = None,
) -> AdStrategy:
    runner = AgentRunner(
        model=config.model_for("strategy"),
        system_prompt=STRATEGY_SYSTEM_PROMPT,
        tools=[],
        tool_handlers={},
        max_iterations=2,
        enable_caching=(config.LLM_PROVIDER == "anthropic"),
        on_event=on_event,
        agent_name="strategy",
    )

    user_message = _build_user_message(business, research)
    raw = runner.run(user_message, verbose=verbose)
    return _parse_output(raw)


def _build_user_message(business: BusinessInput, research: CompetitorAnalysis) -> str:
    hero_block = _format_hero(research)
    channel_mix_block = _format_channel_mix(research)
    campaigns_block = _format_campaigns(research)
    client_presence_block = (
        f"CLIENT BRAND CURRENT PRESENCE:\n{research.client_brand_presence}\n"
        if research.client_brand_presence
        else ""
    )
    focus_line = (
        f"Hero product to build around: {business.focus_product}"
        if business.focus_product
        else "No specific hero product — build a brand-level campaign."
    )

    return f"""BUSINESS BRIEF:
Name: {business.business_name}
Industry: {business.industry}
Product: {business.product_description}
Target audience: {business.target_audience}
USPs: {"; ".join(business.unique_selling_points)}
Monthly ad budget: ₹{business.monthly_ad_budget_inr:,}
Primary goal: {business.primary_goal}
Geography: {business.geography}
{focus_line}

COMPETITOR RESEARCH:
Market summary: {research.market_summary}
Competitors analyzed: {", ".join(research.competitors_analyzed)}
Common themes (avoid copying these): {"; ".join(research.common_positioning_themes)}
Pricing signals: {"; ".join(research.pricing_signals) if research.pricing_signals else "n/a"}
Gaps and opportunities (USE these as your wedge): {"; ".join(research.gaps_and_opportunities)}

{channel_mix_block}
{campaigns_block}
{client_presence_block}{hero_block}
Produce the full ad strategy JSON for this business. If a hero product is specified, make the strategy revolve around selling that specific SKU.
"""


def _format_channel_mix(research: CompetitorAnalysis) -> str:
    if not research.competitor_channel_mix:
        return ""
    lines = ["COMPETITOR CHANNEL MIX:"]
    for cm in research.competitor_channel_mix:
        lines.append(
            f"- {cm.competitor}: channels=[{', '.join(cm.channels_observed)}]; "
            f"targets=[{', '.join(cm.primary_targets)}]"
            + (f"; notes={cm.notes}" if cm.notes else "")
        )
    return "\n".join(lines) + "\n"


def _format_campaigns(research: CompetitorAnalysis) -> str:
    if not research.recent_campaigns_observed:
        return ""
    lines = ["RECENT COMPETITOR CAMPAIGNS OBSERVED:"]
    for c in research.recent_campaigns_observed:
        lines.append(
            f"- {c.brand} — '{c.name_or_theme}' ({c.approximate_timeframe}) — "
            f"hook: {c.hook}; channels: {', '.join(c.channels) if c.channels else 'n/a'}"
        )
    return "\n".join(lines) + "\n"


def _format_hero(research: CompetitorAnalysis) -> str:
    h = research.hero_product_deep_dive
    if not h:
        return ""
    return (
        "HERO PRODUCT DEEP DIVE:\n"
        f"- Product: {h.product_name}\n"
        f"- Why it matters: {h.why_it_matters}\n"
        f"- Key features: {', '.join(h.key_features)}\n"
        f"- Price: {h.price_inr}\n"
        f"- Direct competitor SKUs: {', '.join(h.direct_competitor_skus) if h.direct_competitor_skus else 'n/a'}\n"
        f"- Best selling angle: {h.best_selling_angle}\n\n"
    )


def _parse_output(raw: str) -> AdStrategy:
    data = parse_llm_json(raw)
    return AdStrategy(**data)

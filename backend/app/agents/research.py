"""Research Agent — deep competitive and brand research with tool use."""

from __future__ import annotations

from datetime import date
from typing import Callable

from app.agents.base import AgentRunner
from app.config import config
from app.json_utils import parse_llm_json
from app.schemas import BusinessInput, CompetitorAnalysis
from app.tools.meta_ad_library import search_meta_ads
from app.tools.web_scrape import scrape_webpage
from app.tools.web_search import web_search
from app.tools.wikipedia import wikipedia_lookup


RESEARCH_TOOLS = [
    {
        "name": "web_search",
        "description": (
            "Run a web search and get back ranked text results. Use this to find "
            "news about competitor campaigns, product launches, pricing changes, "
            "brand activations, sponsorships, influencer deals, and to identify a "
            "client's hero product when not specified."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query, e.g. 'Campus Shoes latest sneaker launch 2025'",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_meta_ads",
        "description": (
            "Search the Meta (Facebook/Instagram) Ad Library for ads by brand or "
            "keyword. Returns recent active ads with copy and CTAs when the Meta "
            "access token is configured. Use to see HOW a competitor sells on Meta."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "search_term": {"type": "string", "description": "Brand name or keyword"},
                "country": {
                    "type": "string",
                    "description": "ISO country code, e.g. 'IN', 'US'",
                    "default": "IN",
                },
                "limit": {"type": "integer", "description": "Max ads (1-25)", "default": 10},
            },
            "required": ["search_term"],
        },
    },
    {
        "name": "scrape_webpage",
        "description": (
            "Fetch the main text of a webpage. Use this to read competitor homepages, "
            "product pages, new-arrivals pages, about pages, and the client's own site."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Full URL including https://"}
            },
            "required": ["url"],
        },
    },
    {
        "name": "wikipedia_lookup",
        "description": (
            "Look up a brand / company / person on Wikipedia. Returns plaintext "
            "extract of the top match. Use this for authoritative facts: founders, "
            "HQ, revenue, listing status, subsidiary brands, history, key execs. "
            "Do NOT use for fresh news / latest launches — use web_search for that."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Brand / company / person name. E.g. 'Campus Activewear', 'Relaxo Footwears'",
                }
            },
            "required": ["query"],
        },
    },
]


RESEARCH_SYSTEM_PROMPT = """You are a senior paid-ads strategist doing DEEP competitive and brand research for a client.

You have four tools:
- `web_search(query)` — LIVE merged search across Google News RSS + Bing News RSS + DuckDuckGo. Returns results with publish dates when available (look for `[Mon, 12 Jan 2026 ...]` style dates). Use for news, launches, campaigns, sponsorships, influencer deals.
- `search_meta_ads(search_term, country)` — Meta Ad Library
- `scrape_webpage(url)` — fetch a page's text (homepages, product pages, new-arrivals)
- `wikipedia_lookup(query)` — authoritative brand facts (founders, revenue, listing, HQ, subsidiary brands). Good for structured company context.

IMPORTANT — PREFERRING FRESH DATA:
- When `web_search` returns results, pay attention to `[publish date]` tags. A 2024-2026 article beats a 2022 one. NEVER quote a 2022 "recent campaign" as if it's current.
- If top results are all stale (>18 months old), re-query with an explicit year: `"<brand> campaign 2025"`, `"<brand> sponsorship 2026"`.
- Today's date context should inform your "recent" judgement.

QUERY CRAFT — this is CRITICAL:
- Use the CORPORATE name, not the brand alias, for best news hits. Bad: "Campus Shoes". Good: "Campus Activewear".
- Avoid narrow phrases like "March 2026 launch" — they match almost nothing. Broader: "Campus Activewear new sneaker 2026" / "Campus Activewear campaign 2026".
- If the client gives a vague product hint like "March 2026 launch", convert it into a brand-level query first; identify the actual SKU from the results.

ABSOLUTE ANTI-HALLUCINATION RULES:
- Every entry in `recent_campaigns_observed` MUST include the source article title or URL inside `hook` or `name_or_theme` (e.g., "'Chunky Sneaker Collection with Sonam Bajwa' per Indian Retailer, 5 Apr 2026"). If you have no cited article, OMIT that campaign — do NOT invent one.
- Every entry in `sample_ads` must either come from Meta Ad Library output OR a scraped webpage OR a search result. If none, leave the list to ≤2 items with explicit `ad_text="evidence not found — no sources returned"`. Do NOT fabricate ad copy.
- Celebrity endorsements: only list names the tools actually surfaced. If you didn't see a celebrity's name in any tool output, do NOT add one.
- Specific dates (e.g., "March 2026"): only state them when a `[publish date]` in web_search or a scraped page explicitly confirms.
- `competitor_channel_mix.channels_observed` must differ between competitors — if you have no evidence of a specific channel for a competitor, leave that channel out. Copy-paste across competitors is a failure.

Your job is to produce a rich, grounded analysis — NOT a 2-line summary. You MUST:

1. **Research the CLIENT brand itself** — scrape their website, search for their recent campaigns, sponsorships, influencer deals, news mentions. Identify where THEY currently advertise and what their recent messaging has been.

2. **If `focus_product` is given in the brief** — zero in on that product. If it's a broad hint ("latest hero sneaker"), first IDENTIFY the specific SKU by scraping the client's new-arrivals / bestsellers page and/or web-searching for "<brand> latest launch". Once identified, capture: price, key features, direct competitor SKUs.

3. **Research EACH listed competitor** — scrape their homepage AND a relevant product category page. For each, determine:
   - Channels observed (Meta feed, YouTube, Google Shopping, Quick-commerce, TV, cricket sponsorships, influencers, etc.)
   - Primary audience targets (inferred)
   - Any recent notable campaign (name, timeframe, hook, channels)
   - Pricing signals (specific price points)

4. **Identify GAPS** — angles competitors are NOT using that the client could own, especially for the focus product.

Budget discipline: You have up to 14 tool calls total. Spend them wisely:
   - 1 `wikipedia_lookup` on the client brand (revenue, history, listing status)
   - 2-3 on the CLIENT brand (site + fresh campaigns/news via web_search)
   - 1-2 on hero product discovery/research if needed
   - 6-8 on competitor research (distribute across 3-4 competitors — prefer web_search for campaigns + wikipedia for company facts)
   - Remaining on filling gaps

QUALITY BAR — BEFORE YOU RESPOND:
- `sample_ads` MUST have at least 3 items. If Meta Ad Library was empty, infer likely ad copy from competitor homepages / scraped promo banners / web search snippets — and mark the `advertiser` + `estimated_positioning` with the source. If absolutely nothing, include 1 item with `ad_text="evidence not found — Meta API unavailable"`.
- `pricing_signals` MUST be non-empty — scrape products and list actual INR prices seen (e.g., "Sparx SM-03 ₹899", "Puma Softride Enzo ₹4,999").
- `gaps_and_opportunities` MUST have at least 3 specific angles, each referencing a real gap relative to what competitors ARE doing.
- `common_positioning_themes` MUST have at least 3 themes observed, NOT generic words like "discount" — use "flat ₹500 off + free shipping framing" or "celebrity endorsements (Ranveer, Shahid)" specificity.
- `hero_product_deep_dive` MUST be populated when focus_product is given. If you could not identify a specific SKU from tools, pick the most likely candidate from scraped new-arrivals pages and state the assumption in `why_it_matters`.
- `competitor_channel_mix` — `channels_observed` MUST be specific ad channels (e.g., "Meta feed ads", "Google Shopping", "YouTube pre-roll", "Cricket broadcast sponsorship"), NEVER generic terms like "website" or "social media".

After research, respond with ONLY a valid JSON object — no markdown, no commentary — matching this schema exactly:

{
  "competitors_analyzed": ["..."],
  "sample_ads": [
    {"advertiser": "...", "platform": "meta" | "google" | "other", "ad_text": "...", "cta": "...", "estimated_positioning": "..."}
  ],
  "common_positioning_themes": ["..."],
  "pricing_signals": ["..."],
  "gaps_and_opportunities": ["..."],
  "market_summary": "4-8 sentences, specific and grounded",
  "competitor_channel_mix": [
    {"competitor": "...", "channels_observed": ["..."], "primary_targets": ["..."], "notes": "..."}
  ],
  "recent_campaigns_observed": [
    {"brand": "...", "name_or_theme": "...", "approximate_timeframe": "...", "hook": "...", "channels": ["..."]}
  ],
  "client_brand_presence": "What the client itself is visibly doing — channels, campaigns, voice. Empty string if nothing found.",
  "hero_product_deep_dive": {
    "product_name": "...",
    "why_it_matters": "...",
    "key_features": ["..."],
    "price_inr": "...",
    "direct_competitor_skus": ["..."],
    "best_selling_angle": "..."
  }
}

If `focus_product` was NOT provided in the brief, omit `hero_product_deep_dive` or set it to null.

Do NOT fabricate ads, sponsorships, or campaigns that tool output didn't show. Better to say "evidence not found" than to invent.
"""


def run_research_agent(
    business: BusinessInput,
    verbose: bool = True,
    on_event: Callable[[dict], None] | None = None,
) -> CompetitorAnalysis:
    tool_handlers = {
        "web_search": web_search,
        "search_meta_ads": search_meta_ads,
        "scrape_webpage": scrape_webpage,
        "wikipedia_lookup": wikipedia_lookup,
    }

    runner = AgentRunner(
        model=config.model_for("research"),
        system_prompt=RESEARCH_SYSTEM_PROMPT,
        tools=RESEARCH_TOOLS,
        tool_handlers=tool_handlers,
        max_iterations=14,
        on_event=on_event,
        agent_name="research",
    )

    user_message = _build_user_message(business)
    raw_output = runner.run(user_message, verbose=verbose)
    return _parse_output(raw_output)


def _build_user_message(business: BusinessInput) -> str:
    competitors_line = (
        ", ".join(business.competitor_names)
        if business.competitor_names
        else "(none specified — infer likely competitors from the business description)"
    )
    focus_line = (
        f"Hero product to build the campaign around: {business.focus_product}"
        if business.focus_product
        else "No specific hero product — analyze the brand generally."
    )
    today = date.today().isoformat()
    return f"""Do a deep competitive + brand research dive for this client.

TODAY'S DATE: {today} — anything older than ~18 months is NOT "recent".

CLIENT BRIEF:
- Business: {business.business_name}
- Website: {business.website or "(not provided)"}
- Industry: {business.industry}
- Product: {business.product_description}
- Target audience: {business.target_audience}
- USPs: {"; ".join(business.unique_selling_points)}
- Monthly ad budget: ₹{business.monthly_ad_budget_inr:,}
- Geography: {business.geography}
- Primary goal: {business.primary_goal}
- Known competitors: {competitors_line}
- {focus_line}

Do the research plan in the system prompt. Budget: up to 12 tool calls.
Then return ONLY the structured JSON.
"""


def _parse_output(raw: str) -> CompetitorAnalysis:
    try:
        data = parse_llm_json(raw)
    except Exception:
        from pathlib import Path
        debug_path = Path("output") / "_research_raw_failed.txt"
        debug_path.parent.mkdir(parents=True, exist_ok=True)
        debug_path.write_text(raw, encoding="utf-8")
        print(f"  [research raw output dumped to {debug_path}]")
        raise
    return CompetitorAnalysis(**data)

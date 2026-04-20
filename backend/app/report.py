"""Render the FullReport as a readable markdown document."""

from __future__ import annotations

from app.schemas import FullReport


def render_markdown(report: FullReport) -> str:
    b = report.business
    r = report.research
    s = report.strategy
    c = report.creatives

    lines: list[str] = []
    lines.append(f"# Ad Strategy Report — {b.business_name}\n")
    lines.append(f"**Industry**: {b.industry}  ")
    lines.append(f"**Monthly budget**: ₹{b.monthly_ad_budget_inr:,}  ")
    lines.append(f"**Primary goal**: {b.primary_goal}  ")
    lines.append(f"**Geography**: {b.geography}\n")

    lines.append("---\n")
    lines.append("## 1. Competitor Research\n")
    lines.append(f"**Market summary**: {r.market_summary}\n")
    lines.append(f"**Competitors analyzed**: {', '.join(r.competitors_analyzed)}\n")

    if r.client_brand_presence:
        lines.append("### Client brand — current ad / channel presence\n")
        lines.append(f"{r.client_brand_presence}\n")

    if r.hero_product_deep_dive:
        h = r.hero_product_deep_dive
        lines.append("### Hero product deep dive\n")
        lines.append(f"**Product**: {h.product_name}  ")
        lines.append(f"**Price**: {h.price_inr}  ")
        lines.append(f"**Why it matters**: {h.why_it_matters}\n")
        if h.key_features:
            lines.append("**Key features**:")
            for f in h.key_features:
                lines.append(f"- {f}")
            lines.append("")
        if h.direct_competitor_skus:
            lines.append("**Direct competitor SKUs**:")
            for sku in h.direct_competitor_skus:
                lines.append(f"- {sku}")
            lines.append("")
        lines.append(f"**Best selling angle**: {h.best_selling_angle}\n")

    if r.competitor_channel_mix:
        lines.append("### Competitor channel mix\n")
        for cm in r.competitor_channel_mix:
            lines.append(f"**{cm.competitor}**  ")
            lines.append(f"Channels: {', '.join(cm.channels_observed) if cm.channels_observed else 'n/a'}  ")
            lines.append(f"Primary targets: {', '.join(cm.primary_targets) if cm.primary_targets else 'n/a'}  ")
            if cm.notes:
                lines.append(f"Notes: {cm.notes}")
            lines.append("")

    if r.recent_campaigns_observed:
        lines.append("### Recent campaigns observed\n")
        for rc in r.recent_campaigns_observed:
            lines.append(f"- **{rc.brand}** — *{rc.name_or_theme}* ({rc.approximate_timeframe})")
            lines.append(f"  Hook: {rc.hook}")
            if rc.channels:
                lines.append(f"  Channels: {', '.join(rc.channels)}")
        lines.append("")

    if r.common_positioning_themes:
        lines.append("**Common positioning themes**:")
        for theme in r.common_positioning_themes:
            lines.append(f"- {theme}")
        lines.append("")

    if r.pricing_signals:
        lines.append("**Pricing signals**:")
        for p in r.pricing_signals:
            lines.append(f"- {p}")
        lines.append("")

    if r.gaps_and_opportunities:
        lines.append("**Gaps you can own**:")
        for g in r.gaps_and_opportunities:
            lines.append(f"- {g}")
        lines.append("")

    if r.sample_ads:
        lines.append("**Sample competitor ads**:\n")
        for ad in r.sample_ads:
            lines.append(f"- *{ad.advertiser}* ({ad.platform}) — {ad.estimated_positioning}")
            lines.append(f"  > {ad.ad_text}")
            if ad.cta:
                lines.append(f"  CTA: {ad.cta}")
        lines.append("")

    lines.append("---\n")
    lines.append("## 2. Ad Strategy\n")
    lines.append(f"{s.executive_summary}\n")

    lines.append("### Audience Segments\n")
    for seg in s.audience_segments:
        lines.append(f"**{seg.name}** — {', '.join(seg.platforms)}")
        lines.append(f"{seg.description}")
        lines.append(f"Targeting: {', '.join(seg.targeting_signals)}\n")

    lines.append("### Budget Allocation\n")
    lines.append("| Platform | Monthly (₹) | Why |")
    lines.append("|---|---|---|")
    for a in s.budget_allocation:
        lines.append(f"| {a.platform} | ₹{a.monthly_inr:,} | {a.rationale} |")
    lines.append("")

    lines.append("### Funnel Stages\n")
    for stage in s.funnel_stages:
        lines.append(f"- {stage}")
    lines.append("")

    lines.append("### KPIs to Track\n")
    for k in s.recommended_kpis:
        lines.append(f"- {k}")
    lines.append("")

    lines.append("### Do NOT Do\n")
    for d in s.do_not_do:
        lines.append(f"- {d}")
    lines.append("")

    lines.append("### First 30 Days\n")
    for step in s.first_30_days_plan:
        lines.append(f"- {step}")
    lines.append("")

    lines.append("---\n")
    lines.append("## 3. Ad Creatives (10 variants)\n")
    for v in c.variants:
        lines.append(f"### Variant {v.variant_id} — {v.platform} — *{v.angle}*")
        lines.append(f"**Audience**: {v.audience_segment_name}  ")
        lines.append(f"**Headline**: {v.headline}  ")
        lines.append(f"**Primary text**: {v.primary_text}  ")
        lines.append(f"**CTA**: {v.cta}  ")
        lines.append(f"**Image concept**: {v.image_concept}\n")

    return "\n".join(lines)

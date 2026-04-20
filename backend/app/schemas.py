from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Literal


class BusinessInput(BaseModel):
    """What the user provides about their business."""

    business_name: str
    website: str | None = None
    industry: str = Field(description="e.g., D2C skincare, local restaurant, SaaS tool")
    product_description: str = Field(description="What you sell and how it works")
    target_audience: str = Field(
        description="Who buys from you — age, location, interests, pain points"
    )
    unique_selling_points: list[str] = Field(
        description="What makes you different from competitors"
    )
    monthly_ad_budget_inr: int = Field(
        description="Monthly ad budget in INR (e.g., 50000 for ₹50,000)"
    )
    primary_goal: Literal[
        "awareness", "traffic", "leads", "sales", "app_installs"
    ]
    competitor_names: list[str] = Field(
        default_factory=list,
        description="Known competitor brand names (we'll research them)",
    )
    geography: str = Field(
        default="India",
        description="Primary market — e.g., 'India', 'Delhi NCR', 'US-California'",
    )
    focus_product: str | None = Field(
        default=None,
        description=(
            "Optional — a specific hero product/SKU to build the campaign around. "
            "If provided, research and strategy zoom in on this product. "
            "E.g., 'Campus Crysta running sneaker (latest launch)'."
        ),
    )


class CompetitorAd(BaseModel):
    advertiser: str
    platform: Literal["meta", "google", "other"]
    ad_text: str
    cta: str | None = None
    estimated_positioning: str = Field(
        description="What angle/hook the ad uses — e.g., 'discount', 'social proof'"
    )


class CompetitorChannelMix(BaseModel):
    competitor: str
    channels_observed: list[str] = Field(
        description=(
            "Ad / marketing channels this competitor is active on — e.g., "
            "'Meta feed', 'YouTube pre-roll', 'Google Shopping', "
            "'Influencer on Instagram', 'Cricket sponsorship', 'Quick-commerce banner'"
        )
    )
    primary_targets: list[str] = Field(
        description="Whom this competitor targets — audience segments inferred"
    )
    notes: str = Field(
        default="",
        description="Any notable positioning, budget scale, or campaign cadence signals",
    )


class RecentCampaign(BaseModel):
    brand: str
    name_or_theme: str
    approximate_timeframe: str = Field(
        description="E.g., 'late 2024 IPL season', 'Diwali 2024', 'ongoing Q1 2026'"
    )
    hook: str = Field(description="The main message / creative angle")
    channels: list[str] = Field(default_factory=list)


class HeroProductDeepDive(BaseModel):
    product_name: str
    why_it_matters: str = Field(
        description="Why this SKU is the right focus — launch recency, price positioning, strategic importance"
    )
    key_features: list[str]
    price_inr: str = Field(description="Price or range, e.g., '₹1,499' or '₹1,499–₹1,999'")
    direct_competitor_skus: list[str] = Field(
        description="Specific competing SKUs from the researched competitors"
    )
    best_selling_angle: str = Field(
        description="The single most compelling angle to sell this product with"
    )


class CompetitorAnalysis(BaseModel):
    """Output of the Research Agent."""

    competitors_analyzed: list[str]
    sample_ads: list[CompetitorAd]
    common_positioning_themes: list[str] = Field(
        description="Recurring angles across competitor ads"
    )
    pricing_signals: list[str] = Field(
        default_factory=list,
        description="Price points, discounts, offers seen in competitor ads",
    )
    gaps_and_opportunities: list[str] = Field(
        description="Underserved angles the user could win on"
    )
    market_summary: str = Field(
        description="Detailed narrative (4-8 sentences) of the competitive landscape, including market size/direction signals if available."
    )
    competitor_channel_mix: list[CompetitorChannelMix] = Field(
        default_factory=list,
        description="Where each researched competitor runs ads and whom they target",
    )
    recent_campaigns_observed: list[RecentCampaign] = Field(
        default_factory=list,
        description="Notable campaigns observed for the researched competitors or the client",
    )
    client_brand_presence: str = Field(
        default="",
        description=(
            "What the client brand itself is visibly doing in ads / channels / campaigns, "
            "based on website + web search evidence. Empty if nothing found."
        ),
    )
    hero_product_deep_dive: HeroProductDeepDive | None = Field(
        default=None,
        description="Populated only when BusinessInput.focus_product is set",
    )


class AudienceSegment(BaseModel):
    name: str = Field(description="Short label — e.g., 'Urban moms 28-40'")
    description: str
    platforms: list[Literal["meta", "google_search", "google_display", "youtube"]]
    targeting_signals: list[str] = Field(
        description="Interests, behaviors, keywords to target"
    )


class BudgetAllocation(BaseModel):
    platform: Literal["meta", "google_search", "google_display", "youtube"]
    monthly_inr: int
    rationale: str


class AdStrategy(BaseModel):
    """Output of the Strategy Agent."""

    executive_summary: str
    audience_segments: list[AudienceSegment]
    budget_allocation: list[BudgetAllocation]
    funnel_stages: list[str] = Field(
        description="Ordered list — e.g., 'Awareness: video views', 'Consideration: ...'"
    )
    recommended_kpis: list[str]
    do_not_do: list[str] = Field(
        description="Common mistakes to avoid for this specific business"
    )
    first_30_days_plan: list[str] = Field(description="Week-by-week actions")


class CreativeVariant(BaseModel):
    variant_id: int
    platform: Literal["meta", "google_search", "google_display", "youtube"]
    audience_segment_name: str
    headline: str
    primary_text: str
    cta: str
    image_concept: str = Field(
        description="Description of what image should show — used for Phase 1.5 image gen"
    )
    angle: str = Field(description="Positioning angle — e.g., 'problem-agitate-solve'")


class CreativeSet(BaseModel):
    """Output of the Creative Agent."""

    variants: list[CreativeVariant]


class FullReport(BaseModel):
    """Final end-to-end output."""

    business: BusinessInput
    research: CompetitorAnalysis
    strategy: AdStrategy
    creatives: CreativeSet

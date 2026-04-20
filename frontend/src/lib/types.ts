export type BusinessInput = {
  business_name: string;
  website?: string;
  industry: string;
  product_description: string;
  target_audience: string;
  unique_selling_points: string[];
  monthly_ad_budget_inr: number;
  primary_goal: "awareness" | "traffic" | "leads" | "sales" | "app_installs";
  competitor_names: string[];
  geography: string;
  focus_product?: string;
};

export type AgentEvent = {
  ts: string;
  agent?: string;
  type: string;
  [key: string]: unknown;
};

export type ResearchData = {
  competitors_analyzed: string[];
  sample_ads: Array<{
    advertiser: string;
    platform: string;
    ad_text: string;
    cta?: string;
    estimated_positioning: string;
  }>;
  common_positioning_themes: string[];
  pricing_signals: string[];
  gaps_and_opportunities: string[];
  market_summary: string;
  competitor_channel_mix: Array<{
    competitor: string;
    channels_observed: string[];
    primary_targets: string[];
    notes?: string;
  }>;
  recent_campaigns_observed: Array<{
    brand: string;
    name_or_theme: string;
    approximate_timeframe: string;
    hook: string;
    channels: string[];
  }>;
  client_brand_presence?: string;
  hero_product_deep_dive?: {
    product_name: string;
    why_it_matters: string;
    key_features: string[];
    price_inr: string;
    direct_competitor_skus: string[];
    best_selling_angle: string;
  } | null;
};

export type StrategyData = {
  executive_summary: string;
  audience_segments: Array<{
    name: string;
    description: string;
    platforms: string[];
    targeting_signals: string[];
  }>;
  budget_allocation: Array<{
    platform: string;
    monthly_inr: number;
    rationale: string;
  }>;
  funnel_stages: string[];
  recommended_kpis: string[];
  do_not_do: string[];
  first_30_days_plan: string[];
};

export type CreativeData = {
  variants: Array<{
    variant_id: number;
    platform: string;
    audience_segment_name: string;
    headline: string;
    primary_text: string;
    cta: string;
    image_concept: string;
    angle: string;
  }>;
};

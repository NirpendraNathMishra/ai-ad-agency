"""Meta Ad Library API wrapper.

Meta publishes all active political + issue ads, and in EU/Brazil all commercial
ads too. Outside EU, commercial ads access is limited but the API still returns
what's available. Docs: https://www.facebook.com/ads/library/api/
"""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import config


META_API_URL = "https://graph.facebook.com/v21.0/ads_archive"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def search_meta_ads(
    search_term: str,
    country: str = "IN",
    limit: int = 10,
) -> dict:
    """Search Meta Ad Library for ads matching a brand or keyword.

    Returns a dict with 'ads' (list) and 'source' ('live' or 'unavailable').
    When no access token is configured, returns source='unavailable' so the
    agent can reason about that and still produce useful analysis.
    """
    if not config.META_ACCESS_TOKEN:
        return {
            "ads": [],
            "source": "unavailable",
            "reason": "META_ACCESS_TOKEN not configured. Agent should note this and rely on other signals.",
        }

    params = {
        "search_terms": search_term,
        "ad_reached_countries": f"['{country}']",
        "ad_type": "ALL",
        "fields": "ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,page_name,ad_snapshot_url",
        "limit": limit,
        "access_token": config.META_ACCESS_TOKEN,
    }

    with httpx.Client(timeout=30.0) as client:
        resp = client.get(META_API_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    return {
        "ads": data.get("data", []),
        "source": "live",
    }

"""DIY live-data search — merges Google News RSS, Bing News RSS, and DuckDuckGo
(via the `ddgs` package — raw html.duckduckgo.com has been returning HTTP 202
since mid-2026, so the package is the only reliable way in without an API key).

No API key, no rate limits on our side, dated results when available so the LLM
can tell fresh from stale. Designed as a drop-in replacement for paid search APIs.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup
from ddgs import DDGS
from tenacity import retry, stop_after_attempt, wait_exponential


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={q}&hl=en-IN&gl=IN&ceid=IN:en"
BING_NEWS_RSS = "https://www.bing.com/news/search?q={q}&format=rss&cc=IN"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}


def web_search(query: str, max_chars: int = 8000, max_results: int = 15) -> dict:
    """Live search across Google News + Bing News + DuckDuckGo HTML.

    Returns a merged, deduped, date-sorted list. Dated items come first
    (newest first), then undated web results.
    """
    buckets: list[list[dict]] = []
    errors: list[str] = []

    for label, fn in [
        ("google_news", _google_news),
        ("bing_news", _bing_news),
        ("ddg_html", _ddg_html),
    ]:
        try:
            buckets.append(fn(query))
        except Exception as e:
            errors.append(f"{label}: {type(e).__name__}: {e}")

    merged = [r for items in buckets for r in items]

    seen: set[str] = set()
    deduped: list[dict] = []
    for r in merged:
        key = r.get("url") or r.get("title", "")
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    deduped.sort(key=_sort_key)
    deduped = deduped[:max_results]

    return {
        "query": query,
        "count": len(deduped),
        "results": _format_as_text(deduped)[:max_chars],
        "errors": errors or None,
        "source": "diy_live_search",
    }


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
def _google_news(query: str) -> list[dict]:
    url = GOOGLE_NEWS_RSS.format(q=quote_plus(query))
    with httpx.Client(timeout=20.0, headers=_HEADERS, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
    return _parse_rss(resp.text, source="google_news")


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
def _bing_news(query: str) -> list[dict]:
    url = BING_NEWS_RSS.format(q=quote_plus(query))
    with httpx.Client(timeout=20.0, headers=_HEADERS, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
    return _parse_rss(resp.text, source="bing_news")


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
def _ddg_html(query: str) -> list[dict]:
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=15, region="in-en"))
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("href", "") or r.get("url", ""),
            "snippet": (r.get("body", "") or "")[:400],
            "published": "",
            "source": "ddg",
        }
        for r in results
    ]


def _parse_rss(xml_text: str, source: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[dict] = []
    for item in root.iter("item"):
        items.append(
            {
                "title": _et_text(item, "title"),
                "url": _et_text(item, "link"),
                "snippet": _strip_html(_et_text(item, "description"))[:400],
                "published": _et_text(item, "pubDate"),
                "source": source,
            }
        )
    return items[:12]


def _et_text(item, tag: str) -> str:
    el = item.find(tag)
    if el is None or el.text is None:
        return ""
    return el.text.strip()


def _strip_html(s: str) -> str:
    if not s:
        return ""
    return BeautifulSoup(s, "html.parser").get_text(" ", strip=True)


def _parse_pubdate(date_str: str) -> datetime | None:
    if not date_str:
        return None
    try:
        dt = parsedate_to_datetime(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (TypeError, ValueError):
        pass
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return None


def _sort_key(r: dict) -> tuple[int, float]:
    dt = _parse_pubdate(r.get("published", ""))
    if dt:
        return (0, -dt.timestamp())
    return (1, 0.0)


def _format_as_text(items: list[dict]) -> str:
    lines: list[str] = []
    for i, it in enumerate(items, 1):
        date = it.get("published", "")
        date_part = f"  [{date}]" if date else ""
        src = it.get("source", "")
        lines.append(f"{i}. [{src}] {it.get('title', '')}{date_part}")
        if it.get("url"):
            lines.append(f"   URL: {it['url']}")
        snip = it.get("snippet", "")
        if snip:
            lines.append(f"   {snip[:300]}")
        lines.append("")
    return "\n".join(lines)

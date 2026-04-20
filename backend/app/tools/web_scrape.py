"""Simple web scraping for competitor websites.

Priority order:
1. Firecrawl (if FIRECRAWL_API_KEY set) — best quality, paid
2. Jina AI Reader — free, no key needed, handles JS-rendered pages
3. httpx + BeautifulSoup — last-resort static HTML fallback
"""

from __future__ import annotations

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import config


FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape"
JINA_READER_PREFIX = "https://r.jina.ai/"


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
def scrape_webpage(url: str, max_chars: int = 8000) -> dict:
    """Fetch text content from a URL, trying the best available provider."""
    if config.FIRECRAWL_API_KEY:
        result = _scrape_firecrawl(url, max_chars)
        if result.get("content"):
            return result

    jina = _scrape_jina(url, max_chars)
    if jina.get("content"):
        return jina

    return _scrape_basic(url, max_chars)


def _scrape_firecrawl(url: str, max_chars: int) -> dict:
    headers = {"Authorization": f"Bearer {config.FIRECRAWL_API_KEY}"}
    payload = {"url": url, "formats": ["markdown"]}
    with httpx.Client(timeout=45.0) as client:
        resp = client.post(FIRECRAWL_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    content = data.get("data", {}).get("markdown", "")[:max_chars]
    return {"url": url, "content": content, "source": "firecrawl"}


def _scrape_jina(url: str, max_chars: int) -> dict:
    """Jina AI Reader — free, no API key, returns clean markdown.

    Docs: https://jina.ai/reader/
    """
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(
                JINA_READER_PREFIX + url,
                headers={"Accept": "text/plain", "User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
    except httpx.HTTPError as e:
        return {"url": url, "content": "", "source": "jina_error", "error": str(e)}

    return {
        "url": url,
        "content": resp.text[:max_chars],
        "source": "jina_reader",
    }


def _scrape_basic(url: str, max_chars: int) -> dict:
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
    except httpx.HTTPError as e:
        return {"url": url, "content": "", "source": "error", "error": str(e)}

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = " ".join(soup.get_text(separator=" ").split())
    return {"url": url, "content": text[:max_chars], "source": "basic"}

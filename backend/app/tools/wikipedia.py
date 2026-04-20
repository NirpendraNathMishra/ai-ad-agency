"""Wikipedia lookup — free, no key, authoritative brand/company facts.

Best used for: founder names, HQ, revenue, listing status, subsidiary brands,
history, key executives. NOT for fresh news or latest launches — use web_search
for that.
"""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential


WIKI_API = "https://en.wikipedia.org/w/api.php"


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=4))
def wikipedia_lookup(query: str, max_chars: int = 5000) -> dict:
    """Search Wikipedia and return the plaintext extract of the top match."""
    try:
        with httpx.Client(timeout=15.0, headers={"User-Agent": "ad-strategy-agent/0.1"}) as client:
            search = client.get(
                WIKI_API,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "format": "json",
                    "srlimit": 3,
                },
            )
            search.raise_for_status()
            hits = search.json().get("query", {}).get("search", [])
            if not hits:
                return {"query": query, "results": "", "source": "wikipedia_empty"}

            page_title = hits[0]["title"]
            extract = client.get(
                WIKI_API,
                params={
                    "action": "query",
                    "prop": "extracts",
                    "explaintext": 1,
                    "titles": page_title,
                    "format": "json",
                    "redirects": 1,
                },
            )
            extract.raise_for_status()
            pages = extract.json().get("query", {}).get("pages", {})
            text = ""
            resolved_title = page_title
            for _pid, page in pages.items():
                resolved_title = page.get("title", page_title)
                text = page.get("extract", "") or ""
                break
    except httpx.HTTPError as e:
        return {"query": query, "results": "", "source": "wikipedia_error", "error": str(e)}

    return {
        "query": query,
        "title": resolved_title,
        "url": f"https://en.wikipedia.org/wiki/{resolved_title.replace(' ', '_')}",
        "results": text[:max_chars],
        "source": "wikipedia",
    }

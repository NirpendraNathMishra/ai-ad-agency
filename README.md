# AI Ad Agency — MVP (Phase 1)

AI-powered ad strategy copilot for Indian SMBs. Give it a business brief, it runs competitive research, builds a full ad strategy, and drafts 10 creative variants.

**Status**: Phase 1 CLI MVP — no ad execution yet (strategy-only). See `PROJECT_PLAN.md` for the full roadmap.

---

## Setup (one-time)

```bash
# 1. Create a virtual environment
python -m venv .venv

# 2. Activate it
#    Windows (PowerShell):
.venv\Scripts\Activate.ps1
#    Windows (Git Bash / WSL):
source .venv/Scripts/activate
#    macOS / Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure API keys
cp .env.example .env
# Then open .env and fill in at least ANTHROPIC_API_KEY
```

### API keys you need

| Key | Required? | Where to get |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | https://console.anthropic.com/ |
| `META_ACCESS_TOKEN` | Optional (recommended) | https://developers.facebook.com/tools/explorer/ — needs `ads_read` |
| `FIRECRAWL_API_KEY` | Optional | https://www.firecrawl.dev/ (paid, best quality) |

**Web scraping fallback chain** (auto-selected based on what's configured):
1. Firecrawl (if key set) — paid, best quality
2. **Jina AI Reader** — free, no key needed, handles JS-rendered pages — default
3. httpx + BeautifulSoup — last resort for static HTML

So even with zero optional keys, competitor website scraping works out of the box via Jina.

---

## Run it

```bash
python main.py examples/sample_business.json
```

Output goes to `output/<business_slug>.md` and `.json`.

### Your own business

Copy `examples/sample_business.json`, edit the fields, and point `main.py` at it.

```bash
python main.py my_business.json --output output/my_report.md
```

---

## Project structure

```
.
├── main.py                    CLI entrypoint
├── app/
│   ├── config.py              Env + model config
│   ├── schemas.py             Pydantic models (BusinessInput, AdStrategy, etc.)
│   ├── report.py              Markdown renderer
│   ├── agents/
│   │   ├── base.py            Generic Claude-with-tools runner
│   │   ├── research.py        Competitor research agent
│   │   ├── strategy.py        Strategy-building agent (Opus + prompt caching)
│   │   └── creative.py        Ad copy variant generator
│   └── tools/
│       ├── meta_ad_library.py  Meta Ad Library API
│       └── web_scrape.py       Firecrawl or basic HTML scrape
├── examples/
│   └── sample_business.json   Reference input
├── PROJECT_PLAN.md            Full product roadmap + reasoning
└── requirements.txt
```

---

## What's next

See `PROJECT_PLAN.md` Section 10 for the actual next actions. Near-term:

- **Phase 0** — manually validate with 5 SMBs (do this while Phase 2 approvals are pending)
- **Phase 1.5** — add image generation (Imagen 3 / DALL-E 3) to the Creative Agent
- **Phase 2** — Meta Marketing API integration (file access application NOW; takes 2–8 weeks)
- **Phase 3** — Google Ads API + auto-optimization loop

---

## Cost per run (approx)

With Anthropic API, a full run (Research + Strategy + Creative) on a typical small business costs about **$0.30–$0.80** depending on how many tool calls the Research Agent makes. Enable prompt caching (already on for Strategy Agent) for repeated runs in the same session.

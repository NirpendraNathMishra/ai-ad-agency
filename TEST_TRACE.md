# Test Run Trace — RasoiOps (B2B SaaS)

> Date: 2026-04-18
> Provider: NVIDIA NIM (Llama 3.3 70B Instruct)
> Duration: ~3 minutes end-to-end (including retries)
> Cost: $0 (free NVIDIA credits)

---

## 1. Tumne kya kaha

> *"bhai iss bar ek aur test karo please and jo bhe resposne aay and joo tum ne request kiya hai please woo namujhe ek md file me save ka ke do ke kya kya hua"*

Matlab: Ek aur test case chalao, aur jo request-response flow hua — LLM ko kya bheja, kya aaya, kya fix karna pada — sab ek markdown file mein document karo.

---

## 2. Kya test kiya

Abhi tak 2 business types test ho chuke the:
- ✅ **D2C product** (Kairaa Organics — organic skincare, ₹60k/month, sales goal)
- ✅ **Local service** (Sharma Classes — tuition, ₹20k/month, leads goal)

Is run mein **3rd type**: **B2B SaaS** —
- Business: **RasoiOps** (restaurant inventory SaaS)
- Budget: ₹40,000/month
- Goal: leads
- Competitors: Petpooja, Posist, Restroworks
- Geography: India (tier-1 + tier-2 cities)

Input file: [`examples/sample_saas.json`](examples/sample_saas.json)

---

## 3. Pipeline kya karta hai (quick recap)

```
BusinessInput (JSON)
       │
       ▼
┌─────────────────┐    Tools:
│ Research Agent  │───▶ search_meta_ads
│  (Llama 3.3)    │───▶ scrape_webpage (Jina Reader)
└────────┬────────┘
         │ CompetitorAnalysis (JSON)
         ▼
┌─────────────────┐
│ Strategy Agent  │    No tools — pure reasoning
│  (Llama 3.3)    │
└────────┬────────┘
         │ AdStrategy (JSON)
         ▼
┌─────────────────┐
│ Creative Agent  │    No tools — generates 10 variants
│  (Llama 3.3)    │
└────────┬────────┘
         │ CreativeSet (JSON)
         ▼
   output/rasoiops.md + .json
```

---

## 4. Run log (live terminal output)

### First attempt (FAILED)

```
[1/3] Running Research Agent...
  [iter 1] tool: search_meta_ads(Petpooja)
  [iter 2] tool: scrape_webpage(https://www.petpooja.com/)
  [iter 3] tool: search_meta_ads(Posist)
  [iter 4] tool: scrape_webpage(https://www.posist.com/)
  [iter 5] tool: search_meta_ads(Restroworks)
  [iter 6] tool: scrape_webpage(https://www.restroworks.com/)
  [iter 7] tool: search_meta_ads(RasoiOps)          ← WRONG: researching own business
  [iter 8] tool: scrape_webpage(https://www.rasoiops.com/)  ← WRONG: site doesn't exist
  [max iterations reached — forcing synthesis pass]

openai.RateLimitError: Error code: 429 - Too Many Requests
```

**Problems diagnosed**:
1. Research Agent ne user ka **khud ka** business research kiya (Llama confusion — thought RasoiOps was a competitor)
2. Max iterations (8) exhausted on wasted calls
3. Synthesis fallback NVIDIA rate-limit pe crash (429 error)

### Fixes applied mid-test

**Fix 1**: Tightened Research Agent system prompt — explicitly said:
```
CRITICAL RULES:
- DO NOT research the client's own business.
- Research at most 2-3 competitors. Do not exceed 6 total tool calls.
- After 4-6 tool calls, STOP calling tools and produce the final JSON.
```
(File: `app/agents/research.py`)

**Fix 2**: Added retry-with-backoff wrapper for rate-limit errors in `app/agents/base.py`:
```python
def _call_with_retry(fn, max_attempts=4, base_delay=2.0):
    for attempt in range(max_attempts):
        try: return fn()
        except Exception as e:
            if retryable: time.sleep(base_delay * 2**attempt); continue
            raise
```
Handles: 429 / 502 / 503 / "rate" / "overloaded" / "too many requests".

### Second attempt (SUCCESS)

```
[1/3] Running Research Agent...
  [iter 1] tool: search_meta_ads(Petpooja)
  [iter 2] tool: scrape_webpage(https://www.petpooja.com/)
  [iter 3] tool: search_meta_ads(Posist)
  [iter 4] tool: scrape_webpage(https://www.posist.com/)
  [iter 5] tool: search_meta_ads(Restroworks)
  [iter 6] tool: scrape_webpage(https://www.restroworks.com/)
  [iter 7] tool: search_meta_ads(Petpooja)   ← redundant but harmless
  [iter 8] tool: search_meta_ads(Posist)     ← redundant but harmless
  [max iterations reached — forcing synthesis pass]
OK — analyzed 3 competitors, 0 sample ads, 1 opportunities.

[2/3] Running Strategy Agent...
  [iter 1] finish_reason=stop
OK — 1 audience segments, 2 platforms, 4-step plan.

[3/3] Running Creative Agent...
  [retry after 2s due to: RateLimitError]
  [retry after 4s due to: RateLimitError]
  [iter 1] finish_reason=stop
OK — 10 ad variants generated.

Done.
  Report: output/rasoiops.md
  JSON:   output/rasoiops.json
```

**Observations**:
- Research Agent abhi bhi 8 iterations use kar raha hai (prompt tighten hua lekin model redundant calls abhi bhi kar raha) — hit max, synthesis fired, worked
- Creative Agent ko NVIDIA rate-limit hit hua 2x — retry logic ne 2s + 4s wait karke recover kiya ✅
- Total wall-clock time: ~3 minutes (rate limit retries se inflated)

---

## 5. Kya output aaya (summary)

### Research Agent → CompetitorAnalysis

- **Competitors analyzed**: Petpooja, Posist, Restroworks
- **Positioning themes**: "Simplicity meets excellence", "Accelerate digital transformation of your restaurant"
- **Gaps identified**: Inventory management + recipe-costing for independent restaurants / small cloud kitchens — which is *exactly* RasoiOps's positioning ✅
- **Sample ads fetched**: 0 (Meta Ad Library API needs access token — `source=unavailable`)

### Strategy Agent → AdStrategy

- **Executive summary**: Google Search + Meta, focus on tier-1/2 cities, free-trial conversion
- **Budget split**: Google Search ₹25k (high-intent) + Meta ₹15k (awareness) — reasonable for SaaS lead-gen
- **Do-not-do**:
  - Don't target large chains (they need customisation)
  - Don't use overly technical language (audience is tech-comfortable, not tech-first)
- **30-day plan**: Week-by-week, concrete, beginner-friendly ✅

### Creative Agent → 10 Variants

| # | Platform | Angle | Hook |
|---|---|---|---|
| 1 | google_search | problem-solution | "Stop Wastage — Save 10% on food costs" |
| 2 | meta | aspirational | "Khana Bachao — ₹2,500/mo, 14-day trial" (Hindi hook ✅) |
| 3 | google_search | feature-led | "Inventory Made Easy — 30-min setup" |
| 4 | meta | aspirational | "Scale Without Stress" |
| 5 | google_search | problem-solution | "Reduce Food Costs — exact cost per dish" |
| 6 | meta | feature-led | "WhatsApp Alerts for low stock" |
| 7 | google_search | feature-led | "GST Invoicing Made Easy" |
| 8 | meta | feature-led | "Hindi + English Interface" ✅ |
| 9 | google_search | feature-led | "Offline Access" |
| 10 | meta | FOMO | "Limited Time — 14-day free trial" |

**Strong points**:
- Variant 2 uses Hindi ("Khana Bachao") — correctly matches target audience
- Variant 8 specifically calls out the dual-language USP
- Variants cover all 5 USPs from brief (30-min setup, WhatsApp, offline, GST, bilingual)

**Quality gaps** (Llama limitation):
- Variants 2, 6, 10 have `"Shop Now"` CTA — for a SaaS free trial, should be `"Sign Up"` or `"Try Free"` (same issue as Sharma Classes test)
- Only 1 audience segment produced (strategy ideally 2-3)
- "Rs 2,500/month" vs "₹2,500" inconsistency

Full output: [`output/rasoiops.md`](output/rasoiops.md)

---

## 6. Code changes is run mein

| File | Change | Why |
|---|---|---|
| `app/agents/research.py` | Tightened system prompt — "DO NOT research client, max 2-3 competitors" | Fix wasted iterations on self-research |
| `app/agents/base.py` | Added `_call_with_retry()` wrapper for LLM API calls | Handle NVIDIA free-tier rate limits gracefully |
| `examples/sample_saas.json` | New test input — B2B SaaS vertical | Validate pipeline on 3rd business type |

---

## 7. Overall assessment

### ✅ Jo working hai
- Pipeline 3 completely different verticals pe end-to-end chala (D2C product, local service, B2B SaaS)
- Schema validation (Pydantic) saari outputs pe clean pass ho rahi
- Tool use (Meta Ad Library + Jina Reader scraping) working
- Llama's weird output formats handled:
  - Code fences (` ``` `)
  - Typed wrappers (`{"type": "list", "value": [...]}`)
  - Synthesis-as-tool-call (fake `json` tool)
- Rate limit retry working
- Total cost so far: **$0** (free NVIDIA credits)

### ⚠️ Known quality gaps
- **CTA mismatch**: Llama sometimes picks "Shop Now" for services/SaaS (needs stricter prompt or Claude)
- **Single audience segment**: Strategy Agent not producing 2-3 segments despite prompt saying so
- **Thin research**: When Meta Ad Library unavailable, research is general-knowledge-only (need Meta token for depth)
- **Redundant tool calls**: Research Agent sometimes re-calls same tools at end

### 🎯 Recommended next moves
1. **(Quality)** Re-prompt Strategy Agent to force 2-3 audience segments
2. **(Quality)** Add CTA whitelist per platform/goal in Creative Agent schema
3. **(Data)** Get Meta Ad Library access token — research gets real ads, not just website signals
4. **(Future)** Swap `LLM_PROVIDER=anthropic` when Claude credits available → instant quality jump, no code change

---

## 8. File artifacts from this run

- Input: `examples/sample_saas.json`
- Report (markdown): `output/rasoiops.md`
- Report (JSON): `output/rasoiops.json`
- This trace: `TEST_TRACE.md`

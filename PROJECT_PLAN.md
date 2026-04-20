# AI Ad Agency Platform — Project Plan

> Last updated: 2026-04-18
> Owner: Nirpendra
> Status: Planning / Pre-MVP

---

## 1. Tumhara Original Idea (jaisa tumne bataya)

Small businesses ko aksar samajh nahi aata ki apne ads aur promotions kaise run karein. Is platform par:

1. User aayega aur apne **ad accounts ka detailed data** dega
2. Apne **products aur business** ke baare mein bataayega — kya hai, kaise kaam karta hai
3. Platform ka **LLM bot deep research** karega aur **competitor analysis** dega
4. Ek **full ad strategy** build karke dega — kaise ads run karne chahiye
5. Agar user chahe, to platform **uski behalf par MCP/API calls** karke ads setup kar dega
6. **Google Pomelli** use karke creatives aur LLM-driven content banayega
7. Campaigns ko **optimize** bhi karega
8. Jahan API possible nahi (jaise **DV360**), wahan **browser agent** use karke UI automate karega

---

## 2. Meri Understanding — Idea Valid Hai, Lekin...

### ✅ Strong Points

- **Real market pain**: SMBs Meta/Google Ads pe paisa waste karte hain — strategy nahi aati
- **LLM genuinely value add kar sakta hai**: Competitor analysis, ad copy, audience targeting
- **Paying customers exist**: AdCreative.ai, Pencil, Smartly.io $100M+ revenue wale players hain
- **Pomelli idea smart hai**: Google ka apna tool use karne se quality + trust dono

### ⚠️ Reality Checks (important)

1. **Ad Platform API access = policy-hard, not tech-hard**
   - **Meta Marketing API**: App Review mandatory, business verification, 2-8 weeks
   - **Google Ads API**: Developer token "Basic" → "Standard" access Google manually review karta hai, agency MCC chahiye
   - **DV360**: Enterprise-only — small businesses use hi nahi karte. **Is scope se drop karo.**

2. **Browser agent for ad platforms = TOS violation zone**
   - Meta aur Google ke Terms of Service automation ko explicitly ban karte hain
   - Detect hone par **user ka ad account ban ho sakta hai** — tumhari liability banegi
   - **Recommendation**: Yeh path MVP mein avoid karo

3. **"Deep research" ke legit data sources**
   - Meta Ads Library API (free, rate-limited)
   - Google Ads Transparency Center (scraping)
   - SEMrush / SimilarWeb (paid APIs)
   - Firecrawl for competitor websites

4. **Liability problem**
   - Agar bot ka setup galat ad chalake user ka budget waste kare, kaun zimmedar?
   - Legal disclaimer + insurance sochna padega

---

## 3. MVP Scope — "Ad Strategy Copilot" (Phase 1 only)

### Pehle sirf yeh karo. Execution, DV360, browser agents — sab drop for MVP.

**Input**:
- Business info + product details
- Website URL
- Competitor names/URLs (optional)
- Current ad performance data (optional)

**Output**:
- Competitor analysis report
- Target audience personas
- Full campaign strategy (objectives, budget split, platforms, funnel)
- 5–10 ad creative drafts (copy + image concepts)
- Step-by-step setup guide — **user khud implement karega**

**Value prop**:
> "Hire an ad agency for $5,000/month, ya humse same strategy lo $99/month mein."

**Kyun yeh version achha hai**: Zero ad platform API dependency. 4–6 weeks mein ship possible.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + Tailwind + shadcn/ui)      │
│  - Onboarding wizard                                │
│  - Strategy dashboard                               │
│  - Creative preview                                 │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  API Gateway (FastAPI / Python)                     │
│  - Auth (Clerk or Supabase Auth)                    │
│  - Job queue (Celery + Redis)                       │
└────┬──────────┬────────────┬──────────┬─────────────┘
     │          │            │          │
     ▼          ▼            ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐
│Research │ │Strategy│ │Creative  │ │Data         │
│ Agent   │ │ Agent  │ │ Agent    │ │Connectors   │
└────┬────┘ └───┬────┘ └─────┬────┘ └──────┬──────┘
     │          │            │             │
     └──────────┴────────────┴─────────────┘
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│Postgres  │  │Pinecone  │  │S3 / R2       │
│(Supabase)│  │(vectors) │  │(creatives)   │
└──────────┘  └──────────┘  └──────────────┘
```

---

## 5. The 3 Agents (Claude Agent SDK use karo)

### 5.1 Research Agent
**Tools**:
- `meta_ad_library_search(brand_name)` — official free API
- `google_ads_transparency_search(advertiser)` — scrape
- `web_scrape(url)` — Firecrawl API
- `semrush_keywords(domain)` — optional paid

**Output**: Structured JSON — competitor ads, keywords, positioning, estimated spend

### 5.2 Strategy Agent
**Input**: Research output + user business info
**Model**: Claude Opus 4.7 with **prompt caching** (business context 5–10k tokens — caching se 90% cost save)
**Output**: Strategy doc — platforms, budget split, funnel stages, audience segments, KPIs

### 5.3 Creative Agent
**Tools**:
- Ad copy: Claude Sonnet 4.6 (cheap + fast for variants)
- Images: Google Imagen 3 (via Vertex AI) ya DALL-E 3
- Pomelli: Phase 2 mein — abhi limited access

**Output**: 10 ad variants (headline + primary text + image + CTA)

---

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 + shadcn/ui | Fast ship, good DX |
| Backend | FastAPI (Python) | AI ecosystem mein Python king |
| Agent framework | **Claude Agent SDK** | Native fit with Anthropic stack |
| LLM (strategy) | Claude Opus 4.7 | Best reasoning |
| LLM (bulk) | Claude Sonnet 4.6 | Cost-effective variants |
| Prompt caching | **MANDATORY** | 90% cost reduction |
| DB | Supabase (Postgres + Auth + Storage) | All-in-one |
| Vector DB | Pinecone ya pgvector | Competitor ad similarity |
| Queue | Celery + Redis | Long-running agent jobs |
| Web scraping | Firecrawl API | Handles JS sites |
| Payments | Stripe | Standard |
| Hosting | Vercel (frontend) + Railway/Fly.io (backend) | |

---

## 7. Phased Roadmap

| Phase | Weeks | Deliverable |
|---|---|---|
| **Phase 0**: Manual validation | 1–2 | 5 SMBs ko khud strategy banake do. Feedback + pricing test. |
| **Phase 1**: Strategy Copilot MVP | 4–6 | Upar wala architecture, no ad execution |
| **Phase 2**: Meta Ads execution | 8–12 | Meta API approval + campaign creation flow |
| **Phase 3**: Google Ads + optimization | 12–16 | Google Ads API + auto-optimization loop |
| **Phase 4**: Pomelli + advanced creatives | Later | Partnership/access dependent |

---

## 8. Cost Economics (per user/month)

- LLM (Claude with caching): ~$3–8
- Image gen (10 variants): ~$0.40 (Imagen) ya $4 (DALL-E 3 HD)
- Firecrawl scraping: ~$0.20
- Infra overhead: ~$2
- **Total COGS**: ~$6–15 per user
- **Suggested price**: $49–99/month → healthy margin

---

## 9. Critical Risks

| Risk | Mitigation |
|---|---|
| Meta/Google API rejection | Application abhi file karo, parallel to Phase 1 build |
| Ad Library API rate limits | Aggressive caching |
| LLM hallucinating fake competitor data | Always ground output in tool-fetched real data |
| Creative quality gap | Invest in prompt engineering + good image models |
| TOS violation (browser agent path) | **Drop from MVP** |
| Liability for bad ad spend | Legal disclaimer + "advisory only" framing in Phase 1 |

---

## 10. Next Actions (order matters)

### This Week
- [ ] 5 small business owners se baat karo — pucho: *"Agar $99/month mein personalized ad strategy + 10 creatives milein, kharidoge?"*
- [ ] Pricing aur willingness-to-pay validate karo **code se pehle**

### Next Week
- [ ] Meta Developer account create karo + Marketing API access application file karo
- [ ] Google Ads Developer token application file karo
- [ ] (Approval 2–8 weeks lagega — parallel chalao build ke saath)

### Phase 1 Build Start
- [ ] Repo setup + FastAPI skeleton
- [ ] Claude Agent SDK integration
- [ ] Onboarding wizard (Next.js)
- [ ] Research Agent with Meta Ad Library + Firecrawl tools
- [ ] Strategy Agent with Opus 4.7 + prompt caching
- [ ] Creative Agent with Sonnet + Imagen
- [ ] Stripe billing ($49 / $99 / $199 tiers)
- [ ] 10 paying customers ka goal

---

## 11. Open Questions (tumhe decide karna hai)

1. **Target customer budget range**: $500/month SMB ya $10k/month mid-market?
   - Product bahut alag banega
2. **Tumhari domain expertise**: Kya tum khud paid ads chala chuke ho?
   - Agar nahi, to Phase 0 (manual validation) me seekhna critical hai
3. **Monetization model**:
   - SaaS subscription (recommended for MVP)
   - % of ad spend (scales with customer but complex)
   - Flat fee per strategy
4. **Geography**: India-first, US-first, ya global?
   - Ad ecosystem aur pricing dono alag hain

---

## 12. Things Explicitly NOT in MVP

- ❌ DV360 integration (enterprise-only, not SMB target)
- ❌ Browser agent automation (TOS risk)
- ❌ Auto ad execution (Phase 2)
- ❌ Pomelli integration (Phase 4 — access limited)
- ❌ Multi-language support (Phase 3+)
- ❌ Mobile app (web-first)

---

## 13. Reference Links

- Meta Ad Library API: https://www.facebook.com/ads/library/api/
- Google Ads API: https://developers.google.com/google-ads/api/docs/start
- Google Ads Transparency Center: https://adstransparency.google.com/
- Claude Agent SDK: https://docs.anthropic.com/en/api/agent-sdk
- Firecrawl: https://www.firecrawl.dev/
- Supabase: https://supabase.com/

---

## 14. Kaise Continue Karein (agar tum kal wapas aao)

1. Yeh file padho — **Section 10 (Next Actions)** se shuru karo
2. **Section 11 (Open Questions)** ke jawab decide karo
3. Phir Claude se bolo: *"Let's start Phase 0"* ya *"Build me the FastAPI skeleton for Phase 1"*

---

*Is plan ka koi hissa change karna ho ya expand karna ho, bolo — iterate karte rahenge.*

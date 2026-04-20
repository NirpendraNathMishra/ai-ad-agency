"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
    ArrowRight,
    Play,
    Zap,
    TrendingUp,
    Clock,
    Shield,
    CheckCircle2,
} from "lucide-react";

const stats = [
    { value: "90%", label: "Automation Rate", icon: Zap },
    { value: "<5 min", label: "Campaign Launch", icon: Clock },
    { value: "+30%", label: "ROAS Improvement", icon: TrendingUp },
];

// Detailed step-by-step terminal with JSON requests AND responses
const terminalBlocks = [
    { type: "header", text: "● ADFORGE AI MCP ORCHESTRATOR v2.1" },
    { type: "divider", text: "═══════════════════════════════════════════════════" },
    { type: "info", text: "→ Connecting LLMs..." },
    { type: "success", text: "  ✓ Claude Sonnet 4 (Anthropic) — connected" },
    { type: "success", text: "  ✓ Kimi k2 — connected" },
    { type: "success", text: "  ✓ Opus 4.6 — connected" },
    { type: "success", text: "  ✓ Llama 4 Scout (Meta) — connected" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 1 — STRATEGY ANALYSIS" },
    { type: "info", text: "  LLM: Claude Sonnet 4 analyzing campaign brief..." },
    { type: "json-start", text: "  request: {" },
    { type: "json", text: '    "model": "claude-sonnet-4-20250514",' },
    { type: "json", text: '    "task": "campaign_strategy",' },
    { type: "json", text: '    "input": "SaaS lead gen, $2500/day, Meta+Google"' },
    { type: "json-end", text: "  }" },
    { type: "info", text: "  Processing..." },
    { type: "json-start", text: "  response: {" },
    { type: "json-resp", text: '    "strategy": "multi-platform-conversion",' },
    { type: "json-resp", text: '    "channels": ["meta", "google", "dv360"],' },
    { type: "json-resp", text: '    "estimated_cpa": "$14.20",' },
    { type: "json-resp", text: '    "confidence": 0.94' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ Strategy ready" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 3 — BUDGET ALLOCATION" },
    { type: "json-start", text: "  budget_plan: {" },
    { type: "json", text: '    "meta_ads": { "daily": 1000, "objective": "LEADS" },' },
    { type: "json", text: '    "google_ads": { "daily": 1000, "objective": "CONVERSIONS" },' },
    { type: "json", text: '    "dv360": { "daily": 500, "objective": "AWARENESS" }' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ Budget allocated across 3 platforms" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 5 — CREATIVE GENERATION" },
    { type: "info", text: "  Pomelli AI (Google Labs) generating assets..." },
    { type: "json-start", text: "  creatives: {" },
    { type: "json-resp", text: '    "generated": 6,' },
    { type: "json-resp", text: '    "formats": ["1080x1080", "1200x628", "9:16"],' },
    { type: "json-resp", text: '    "variants": 3,' },
    { type: "json-resp", text: '    "brand_match_score": 0.97' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ 6 creatives → 3 A/B variants each" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 7 — MCP CAMPAIGN LAUNCH" },
    { type: "mcp", text: '  → tool: "create_campaign"' },
    { type: "mcp", text: "  → server: meta-ads-mcp | auth: OAuth 2.0" },
    { type: "json-start", text: "  meta_response: {" },
    { type: "json-resp", text: '    "campaign_id": "23851274839210",' },
    { type: "json-resp", text: '    "status": "ACTIVE",' },
    { type: "json-resp", text: '    "ad_sets": 3,' },
    { type: "json-resp", text: '    "ads": 6' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ Meta campaign LIVE" },
    { type: "blank", text: "" },
    { type: "mcp", text: '  → tool: "create_campaign"' },
    { type: "mcp", text: "  → server: google-ads-mcp" },
    { type: "json-start", text: "  google_response: {" },
    { type: "json-resp", text: '    "campaign_id": "9847201538",' },
    { type: "json-resp", text: '    "status": "ENABLED",' },
    { type: "json-resp", text: '    "ad_groups": 2,' },
    { type: "json-resp", text: '    "keywords": 47' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ Google campaign LIVE" },
    { type: "blank", text: "" },
    { type: "mcp", text: '  → tool: "create_line_item"' },
    { type: "mcp", text: "  → server: dv360-mcp" },
    { type: "success", text: "  ✓ DV360 line item LIVE — ID: LI-8829401" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 9 — AI SOCIAL MEDIA MANAGER" },
    { type: "info", text: "  Auto-publishing brand content + ads via MCP..." },
    { type: "mcp", text: '  → tool: "publish_omnichannel_post"' },
    { type: "mcp", text: "  → server: social-media-mcp | auth: OAuth 2.0" },
    { type: "json-start", text: "  social_posts: {" },
    { type: "json-resp", text: '    "meta": {' },
    { type: "json-resp", text: '      "instagram_reel": { "status": "published", "id": "IG-3847291" },' },
    { type: "json-resp", text: '      "facebook_page": { "status": "published", "id": "FB-5738291" },' },
    { type: "json-resp", text: '      "whatsapp_channel": { "status": "sent", "id": "WA-992102" },' },
    { type: "json-resp", text: '      "threads": { "status": "published", "id": "TH-119284" }' },
    { type: "json-resp", text: '    },' },
    { type: "json-resp", text: '    "snapchat": { "status": "published", "story_id": "SNAP-84729" },' },
    { type: "json-resp", text: '    "tiktok": { "status": "published", "video_id": "TT-109482" }' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ 6 organic & ad posts published across all platforms" },
    { type: "blank", text: "" },
    { type: "phase", text: "▸ PHASE 13 — REPORTING" },
    { type: "mcp", text: '  → tool: "send_report"' },
    { type: "json-start", text: "  report: {" },
    { type: "json-resp", text: '    "total_spend": "$2,480",' },
    { type: "json-resp", text: '    "leads": 201,' },
    { type: "json-resp", text: '    "cpa": "$12.34",' },
    { type: "json-resp", text: '    "roas": 3.2,' },
    { type: "json-resp", text: '    "social_reach": "12,400 impressions",' },
    { type: "json-resp", text: '    "sent_to": "team@company.com"' },
    { type: "json-end", text: "  }" },
    { type: "success", text: "  ✓ Daily report emailed" },
    { type: "blank", text: "" },
    { type: "divider", text: "═══════════════════════════════════════════════════" },
    { type: "complete", text: "✅ ALL 13 PHASES COMPLETE" },
    { type: "complete", text: "   3 campaigns • 4 social posts • 6 creatives • 3m 47s" },
];

// Platform SVG icons
function MetaSvg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
        </svg>
    );
}

function GoogleAdsSvg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M3.272 16.308l6.294-10.878a3.3 3.3 0 015.715 0l6.294 10.878" stroke="#F4B400" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="3.6" cy="17.4" r="2.4" fill="#34A853" />
            <circle cx="20.4" cy="17.4" r="2.4" fill="#4285F4" />
            <circle cx="12" cy="5.4" r="2.4" fill="#EA4335" />
        </svg>
    );
}

function DV360Svg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">DV</text>
        </svg>
    );
}

function SnapchatSvg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.27.07-.039.139-.061.209-.061.309 0 .524.268.557.469.039.256-.143.507-.31.605-.479.28-1.145.452-1.569.475-.18.009-.345.105-.39.2-.066.148-.058.37.117.66l.003.005c.568.953 1.399 1.743 2.461 2.262.253.12.493.32.493.596 0 .362-.403.605-.987.78-.699.21-1.208.329-1.355.473-.098.096-.123.35-.123.486 0 .074-.006.148-.018.221-.036.209-.182.318-.37.318a2.014 2.014 0 01-.399-.047 4.69 4.69 0 00-.934-.092c-.384 0-.639.045-.904.149-.395.149-.739.449-1.103.69-.484.32-1.068.689-1.862.689-.019 0-.039 0-.059-.002-.021.002-.041.002-.061.002-.793 0-1.377-.37-1.862-.689-.363-.24-.707-.54-1.103-.69A2.655 2.655 0 009.088 17c-.36 0-.696.032-.935.092a2.014 2.014 0 01-.399.047c-.186 0-.332-.109-.368-.318a1.298 1.298 0 01-.018-.221c0-.136-.026-.39-.124-.486-.147-.144-.655-.264-1.354-.473-.584-.175-.987-.42-.987-.78 0-.278.24-.477.493-.596 1.062-.52 1.893-1.31 2.461-2.262l.003-.005c.175-.29.183-.512.118-.66-.047-.095-.212-.191-.39-.2-.424-.023-1.092-.195-1.57-.475-.166-.098-.349-.349-.31-.605.033-.201.248-.469.558-.469.069 0 .139.022.209.061.263.15.622.286.922.27.199 0 .326-.045.401-.09a15.17 15.17 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z" />
        </svg>
    );
}

function AmazonAdsSvg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705a.66.66 0 01-.753.069c-1.06-.881-1.25-1.29-1.834-2.13-1.748 1.784-2.988 2.319-5.253 2.319-2.68 0-4.764-1.655-4.764-4.966 0-2.585 1.4-4.344 3.396-5.206 1.729-.761 4.146-.897 5.993-1.106v-.414c0-.761.058-1.662-.389-2.319-.388-.589-1.135-.832-1.793-.832-1.218 0-2.303.625-2.569 1.921-.054.285-.265.566-.554.58l-3.098-.334c-.261-.058-.551-.267-.477-.664C5.746 1.887 8.71.82 11.369.82c1.369 0 3.153.364 4.233 1.4 1.369 1.282 1.238 2.993 1.238 4.855v4.396c0 1.321.548 1.9 1.064 2.615.182.254.222.558-.009.744-.577.482-1.603 1.378-2.168 1.879l-.583.085z" />
            <path d="M21.727 18.837C19.137 20.849 15.27 21.924 11.955 21.924c-4.68 0-8.899-1.731-12.088-4.612-.25-.227-.027-.537.275-.361 3.445 2.003 7.707 3.21 12.103 3.21 2.97 0 6.233-.616 9.234-1.89.453-.193.832.297.248.566z" />
        </svg>
    );
}

function TikTokSvg() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
        </svg>
    );
}

const platformLogos = [
    { name: "Meta Ads", Icon: MetaSvg, color: "text-[#1877F2]" },
    { name: "Google Ads", Icon: GoogleAdsSvg, color: "" },
    { name: "DV360", Icon: DV360Svg, color: "text-[#4285F4]" },
    { name: "TikTok Ads", Icon: TikTokSvg, color: "text-[#00F2FE]" },
    { name: "Snapchat Ads", Icon: SnapchatSvg, color: "text-[#FFFC00]" },
    { name: "Amazon Ads", Icon: AmazonAdsSvg, color: "text-[#FF9900]" },
];

const trustBadges = [
    "Google Partner",
    "Meta Partner",
    "ISO 27001",
    "SOC 2",
    "GDPR",
];

export function Hero() {
    const ref = useRef(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });
    const [displayedLines, setDisplayedLines] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start the animation when in view
    const startAnimation = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedLines(0);

        // Small delay to let state reset
        setTimeout(() => {
            let count = 0;
            intervalRef.current = setInterval(() => {
                count++;
                if (count > terminalBlocks.length) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    // Loop after 5 seconds
                    setTimeout(() => startAnimation(), 5000);
                    return;
                }
                setDisplayedLines(count);
            }, 180);
        }, 300);
    }, []);

    useEffect(() => {
        if (!isInView) return;
        startAnimation();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isInView, startAnimation]);

    // Auto-scroll terminal as lines appear
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [displayedLines]);

    const getLineColor = (type: string) => {
        switch (type) {
            case "header": return "text-emerald-400 font-semibold text-sm";
            case "divider": return "text-white/10";
            case "phase": return "text-violet-400 font-semibold mt-4 mb-1";
            case "info": return "text-cyan-400/70";
            case "json-start": return "text-white/40";
            case "json": return "text-white/60";
            case "json-end": return "text-white/40";
            case "json-resp": return "text-green-400/90";
            case "mcp": return "text-orange-400/80 italic";
            case "success": return "text-emerald-400 font-medium";
            case "complete": return "text-blue-400 font-bold mt-4";
            case "blank": return "";
            default: return "text-white/40";
        }
    };

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center pt-20 overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0 bg-[#000000]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-white/[0.03] rounded-full blur-[120px]" />
                <div className="absolute inset-0 grid-bg-fine opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent_80%)]" />
            </div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full">
                <div className="grid lg:grid-cols-5 gap-10 items-start">
                    {/* Left — Copy (2 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className="lg:col-span-2"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-6 backdrop-blur-md">
                            <Zap className="w-3 h-3 text-white/70" />
                            MCP Protocol + AI Agents
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] mb-5 tracking-tight">
                            <span className="text-white">Run Ads with </span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                                AI Agents.
                            </span>
                        </h1>

                        <div className="space-y-2 mb-5">
                            {[
                                "Launch ads to Google, Meta, DV360 & more",
                                "AI generates plans, creatives & campaigns",
                                "AI Social Media Manager — auto-posts everywhere",
                                "Daily reports with AI-powered insights",
                                "Human approval at every decision",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                                    <span className="text-white/60 text-[13px] font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* Platform SVG Logos */}
                        <div className="flex flex-wrap gap-2.5 mb-6">
                            {platformLogos.map((p) => (
                                <div
                                    key={p.name}
                                    className="group flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-colors"
                                >
                                    <div className={`${p.color} group-hover:drop-shadow-[0_0_8px_currentColor] transition-all duration-300 w-5 h-5 flex items-center justify-center`}>
                                        <p.Icon />
                                    </div>
                                    <span className="text-[10px] font-semibold text-white/40 group-hover:text-white/70 transition-colors uppercase tracking-wider">{p.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <a
                                href="mailto:hi@adforge-ai.in?subject=Inquiry%20from%20AdForge%20AI"
                                className="group px-6 py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-all flex items-center gap-2 text-[13px]"
                            >
                                Contact Us
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="#mcp-demo"
                                className="group px-6 py-3 bg-[#0a0a0a] border border-white/[0.08] hover:bg-white/[0.05] text-white rounded-lg transition-all font-medium flex items-center gap-2 text-[13px]"
                            >
                                <Play className="w-4 h-4 text-white/70" />
                                Watch Demo
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-7 mb-6 mt-6">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col gap-1">
                                    <div className="text-xl md:text-2xl font-medium text-white tracking-tight">
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 group-hover:text-white flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-colors">
                                        <stat.icon className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — BIG Terminal (3 cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-3 relative"
                    >
                        <div className="absolute -top-3 -right-3 z-20">
                            <div className="px-3 py-1 rounded-full bg-[#111] border border-white/[0.08] text-white/70 text-[10px] font-medium flex items-center gap-1.5 tracking-wider uppercase backdrop-blur-md">
                                <Shield className="w-2.5 h-2.5" />
                                Secure OAuth
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_40px_-8px_rgba(0,0,0,0.8)]">
                            {/* Terminal header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-black/40">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-[12px] font-mono ml-3 font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                                    adforge-ai / orchestrator
                                </span>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Live</span>
                                </div>
                            </div>

                            {/* Terminal body — auto-scrolling */}
                            <div
                                ref={terminalRef}
                                className="p-4 font-mono text-[13px] leading-[1.5] h-[440px] overflow-y-auto scrollbar-hide bg-transparent"
                            >
                                <div className="space-y-0.5">
                                    {terminalBlocks.slice(0, displayedLines).map((line, i) => (
                                        <div
                                            key={i}
                                            className={getLineColor(line.type)}
                                        >
                                            {line.type === "blank" ? (
                                                <div className="h-1.5" />
                                            ) : (
                                                line.text
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {displayedLines > 0 && displayedLines < terminalBlocks.length && (
                                    <div className="mt-1">
                                        <span className="inline-block w-1.5 h-3 bg-white/60 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute -bottom-3 -left-3 z-20">
                            <div className="px-3 py-1 rounded-full bg-[#111] border border-white/[0.08] text-white/70 text-[10px] font-medium flex items-center gap-1.5 tracking-wider uppercase backdrop-blur-md">
                                <TrendingUp className="w-2.5 h-2.5" />
                                13-Phase Orchestration
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Trust Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 }}
                    className="mt-10 pt-8 border-t border-white/5"
                >
                    <div className="flex items-center justify-center gap-10 flex-wrap opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <GoogleAdsSvg />
                            <span className="text-xs font-semibold tracking-widest uppercase">Google Partner</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <MetaSvg />
                            <span className="text-xs font-semibold tracking-widest uppercase">Meta Partner</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-semibold tracking-widest uppercase">ISO 27001</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold tracking-widest uppercase">SOC 2 Type II</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-semibold tracking-widest uppercase">GDPR Ready</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

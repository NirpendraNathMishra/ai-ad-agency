"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
    User,
    BrainCircuit,
    Target,
    Palette,
    Settings,
    BarChart3,
    Mail,
    CheckCircle2,
    Zap,
    Bot,
} from "lucide-react";

const orchestrationFlow = [
    { type: "user", icon: User, label: "You", text: "Launch a lead gen campaign for our SaaS product, $2500/day budget on Meta + Google", },
    { type: "system", icon: BrainCircuit, label: "Claude Sonnet 4", text: "Analyzing request with Chain-of-Thought reasoning... Building 13-phase execution plan", },
    { type: "phase", icon: Target, label: "Phase 1-3", text: "→ Strategy Analysis (Claude Sonnet 4) → Audience Research (Kimi k2) → Budget Allocation ($1250 Meta + $1250 Google)", },
    { type: "question", icon: Bot, label: "AI Agent", text: "Preferred audience: Tech professionals 25-45 or broader reach? Also, prioritize conversions or brand awareness?", },
    { type: "user", icon: User, label: "You", text: "Tech professionals 25-45, focus on conversions with lookalike audiences", },
    { type: "approval", icon: CheckCircle2, label: "Plan Approved", text: "✓ Media plan approved — Lookalike 1% top converters, CPA target: $15, 3 platforms", },
    { type: "phase", icon: Palette, label: "Phase 4-6", text: "→ Creative Brief → Pomelli AI (Google Labs) generating 6 on-brand creatives → 3 A/B variant sets ready", },
    { type: "mcp", icon: Settings, label: "MCP → Meta Ads", text: 'tool: "create_campaign" → server: meta-ads-mcp → Campaign ID: 23851274839210 → 3 ad sets, 6 ads ✓', },
    { type: "mcp", icon: Settings, label: "MCP → Google Ads", text: 'tool: "create_campaign" → server: google-ads-mcp → Campaign ID: 9847201538 → 2 ad groups, 47 keywords ✓', },
    { type: "mcp", icon: Settings, label: "MCP → DV360", text: 'tool: "create_line_item" → server: dv360-mcp → Line Item: LI-8829401 → $500/day awareness ✓', },
    { type: "phase", icon: User, label: "AI Social Manager", text: "→ MCP Omni-channel publish: Instagram Reel, Facebook Page, WhatsApp Channel, Threads, Snapchat Story, TikTok Video ✓", },
    { type: "phase", icon: BarChart3, label: "Phase 10-12", text: "→ Live monitoring (Llama 4 Scout) → ROAS: 3.2x → CTR: 4.1% → CPA: $12.34 → Anomaly: all clear", },
    { type: "email", icon: Mail, label: "Email Report", text: "📧 Daily report → team@company.com → $2,480 spent → 201 leads → ROAS 3.2x → Next: increase Meta budget 10%", },
    { type: "success", icon: CheckCircle2, label: "Complete", text: "✅ Full 13-phase pipeline done in 3m 47s — 3 campaigns live & 4 social posts published", },
];

const typeColorMap: Record<string, string> = {
    user: "border-white/[0.08] bg-white/[0.03]",
    system: "border-white/[0.06] bg-white/[0.02]",
    phase: "border-white/[0.06] bg-white/[0.02]",
    question: "border-white/[0.08] bg-white/[0.03]",
    approval: "border-white/[0.1] bg-white/[0.04]",
    mcp: "border-white/[0.06] bg-white/[0.02]",
    email: "border-white/[0.06] bg-white/[0.02]",
    success: "border-white/[0.1] bg-white/[0.04]",
};

const iconColorMap: Record<string, string> = {
    user: "text-white/90",
    system: "text-white/70",
    phase: "text-white/60",
    question: "text-white/80",
    approval: "text-white/90",
    mcp: "text-white/60",
    email: "text-white/60",
    success: "text-white",
};

export function HowItWorks() {
    const ref = useRef(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [visibleLines, setVisibleLines] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startAnimation = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setVisibleLines(0);

        setTimeout(() => {
            let count = 0;
            intervalRef.current = setInterval(() => {
                count++;
                if (count > orchestrationFlow.length) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setTimeout(() => startAnimation(), 4000);
                    return;
                }
                setVisibleLines(count);
            }, 1800);
        }, 500);
    }, []);

    useEffect(() => {
        if (!isInView) return;
        startAnimation();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isInView, startAnimation]);

    // Auto-scroll as messages appear
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [visibleLines]);

    return (
        <section ref={ref} id="how-it-works" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg-fine opacity-10 [mask-image:linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-white/[0.015] rounded-full blur-[120px]" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <Zap className="w-3 h-3 text-white/70" />
                        See How It Works
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            From Brief to{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Live Campaign
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-xl mx-auto">
                        Watch the full AI orchestration — from your first message to live campaigns across 3 platforms.
                    </p>
                </motion.div>

                {/* Chat-style Flow in Terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_40px_-8px_rgba(0,0,0,0.8)]">
                        {/* Terminal header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-black/40">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            </div>
                            <span className="text-[11px] text-white/30 font-mono ml-3 font-medium tracking-wider">
                                adforge-ai / orchestrator
                            </span>
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Live</span>
                            </div>
                        </div>

                        {/* Chat Messages — auto-scrolls */}
                        <div
                            ref={scrollRef}
                            className="p-5 space-y-3 h-[500px] overflow-y-auto scrollbar-hide bg-transparent"
                        >
                            <AnimatePresence mode="popLayout">
                                {orchestrationFlow.slice(0, visibleLines).map((msg, i) => (
                                    <motion.div
                                        key={`${msg.label}-${i}`}
                                        initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.35 }}
                                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${typeColorMap[msg.type]}`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            <msg.icon className={`w-4 h-4 ${iconColorMap[msg.type]}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className={`text-sm font-semibold ${iconColorMap[msg.type]}`}>
                                                {msg.label}
                                            </span>
                                            <p className="text-base text-slate-300 leading-relaxed mt-0.5">
                                                {msg.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {visibleLines < orchestrationFlow.length && (
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                    <span className="text-xs text-white/30">AI is orchestrating...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

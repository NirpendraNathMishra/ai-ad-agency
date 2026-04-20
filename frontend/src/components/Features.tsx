"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Brain,
    Palette,
    Rocket,
    BarChart3,
    FileBarChart,
    ShieldCheck,
    Sparkles,
    ArrowUpRight,
} from "lucide-react";

const features = [
    {
        icon: Brain,
        title: "AI Strategy Engine",
        description:
            "AI analyzes your business, competition, and market to generate a comprehensive media plan with funnel structure, audience targeting, and KPI projections.",
        bullets: [
            "5 M's Framework analysis",
            "PESO model integration",
            "Predictive ROAS estimation",
        ],
        color: "cyan",
        gradient: "from-cyan-500/50 to-transparent",
    },
    {
        icon: Palette,
        title: "Creative Studio",
        description:
            "Generate ad copy, headlines, descriptions, and visual assets using Pomelli, Kimi k2 and DALL·E 3. Multiple variations for A/B testing built-in.",
        bullets: [
            "5 headlines + 3 descriptions per ad",
            "Pomelli brand-aware creatives",
            "DALL·E 3 image generation",
            "CTA optimization",
        ],
        color: "violet",
        gradient: "from-violet-500/50 to-transparent",
    },
    {
        icon: Rocket,
        title: "Auto-Activation via MCP",
        description:
            "Campaigns go live automatically through MCP servers connected to Google Ads, Meta, and DV360 APIs. Browser fallback ensures zero blocked paths.",
        bullets: [
            "95-98% API coverage",
            "Playwright browser fallback",
            "All assets default to PAUSED state",
        ],
        color: "emerald",
        gradient: "from-emerald-500/50 to-transparent",
    },
    {
        icon: BarChart3,
        title: "Smart Optimization",
        description:
            "AI-driven anomaly detection replaces static thresholds. Automated bid adjustments, creative rotation, and budget reallocation run 24/7.",
        bullets: [
            "Daily/Weekly/Monthly optimization cycles",
            "Unsupervised anomaly detection",
            "4-tier severity escalation matrix",
        ],
        color: "orange",
        gradient: "from-orange-500/50 to-transparent",
    },
    {
        icon: FileBarChart,
        title: "Daily AI Reports",
        description:
            "Every morning: performance summary, top 3 strategic insights, actions taken, and recommended next steps. Delivered to your inbox automatically.",
        bullets: [
            "Impressions, CTR, CPC, CPA, ROAS",
            "AI-generated insights",
            "Dashboard link included",
        ],
        color: "blue",
        gradient: "from-blue-500/50 to-transparent",
    },
    {
        icon: ShieldCheck,
        title: "Security First",
        description:
            "OAuth-only authentication. AES-256 token encryption. No passwords stored — ever. Session deletion after browser use. Full audit logging.",
        bullets: [
            "OAuth 2.0 exclusively",
            "Encrypted token storage",
            "Zero-trust architecture",
        ],
        color: "pink",
        gradient: "from-pink-500/50 to-transparent",
    },
];

const colorMap: Record<string, string> = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    orange: "text-orange-400",
    blue: "text-blue-400",
    pink: "text-pink-400",
};

const bgColorMap: Record<string, string> = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    violet: "bg-violet-500/10 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
    emerald: "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    orange: "bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
    blue: "bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    pink: "bg-pink-500/10 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
};

export function Features() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} id="features" className="relative py-24 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.015] rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <Sparkles className="w-3 h-3 text-white/70" />
                        Core Capabilities
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Everything You Need.{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Nothing You Don&apos;t.
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        Six powerful engines working together to automate your entire advertising workflow from strategy to scale.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.08 * i }}
                            className="group bg-[#050505] border border-white/[0.06] rounded-2xl p-6 transition-all duration-300 hover:border-white/[0.12] relative overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${feature.gradient}`} />

                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl ${bgColorMap[feature.color]} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                            >
                                <feature.icon className={`w-5 h-5 ${colorMap[feature.color]}`} />
                            </div>

                            {/* Title */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>

                            {/* Description */}
                            <p className="text-sm text-white/50 leading-relaxed mb-4">
                                {feature.description}
                            </p>

                            {/* Bullets */}
                            <div className="space-y-1.5">
                                {feature.bullets.map((bullet) => (
                                    <div key={bullet} className="flex items-center gap-2 text-xs text-white/40">
                                        <div className="w-1 h-1 rounded-full bg-white/30" />
                                        {bullet}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

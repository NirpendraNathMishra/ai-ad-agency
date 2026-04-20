"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    TrendingUp,
    TrendingDown,
    Eye,
    MousePointerClick,
    DollarSign,
    Target,
    BarChart3,
    Lightbulb,
    ArrowUpRight,
    Trophy,
    Clock,
} from "lucide-react";

const metrics = [
    {
        label: "Impressions",
        value: "284,391",
        change: "+12.4%",
        up: true,
        icon: Eye,
        color: "cyan",
    },
    {
        label: "Clicks",
        value: "8,247",
        change: "+8.2%",
        up: true,
        icon: MousePointerClick,
        color: "violet",
    },
    {
        label: "CTR",
        value: "2.90%",
        change: "+0.3%",
        up: true,
        icon: BarChart3,
        color: "emerald",
    },
    {
        label: "CPC",
        value: "$1.82",
        change: "-5.1%",
        up: false,
        icon: DollarSign,
        color: "blue",
    },
    {
        label: "Conversions",
        value: "423",
        change: "+22.5%",
        up: true,
        icon: Target,
        color: "pink",
    },
    {
        label: "CPA",
        value: "$35.50",
        change: "-8.3%",
        up: false,
        icon: DollarSign,
        color: "orange",
    },
    {
        label: "ROAS",
        value: "4.2x",
        change: "+15.7%",
        up: true,
        icon: TrendingUp,
        color: "emerald",
    },
];

const insights = [
    {
        icon: Trophy,
        text: "Best performing ad: Ad #2 with 3.2% CTR — outperforming by 40%",
    },
    {
        icon: Target,
        text: "Audience segment 'Interest A' driving 60% of total conversions",
    },
    {
        icon: Clock,
        text: "Morning hours (8-11 AM) showing 2x better performance than evening",
    },
];

const actions = [
    "Paused Ad #1 due to CTR dropping below 1% threshold",
    "Increased bid by 15% on top-performing keyword group",
    "Reallocated $200 from Display to Search campaigns",
];

const colorMap: Record<string, string> = {
    cyan: "text-zinc-300",
    violet: "text-zinc-300",
    emerald: "text-zinc-300",
    orange: "text-zinc-300",
    blue: "text-zinc-300",
    pink: "text-zinc-300",
};

const bgMap: Record<string, string> = {
    cyan: "bg-white/[0.02] border-white/10",
    violet: "bg-white/[0.02] border-white/10",
    emerald: "bg-white/[0.02] border-white/10",
    orange: "bg-white/[0.02] border-white/10",
    blue: "bg-white/[0.02] border-white/10",
    pink: "bg-white/[0.02] border-white/10",
};

export function DailyReporting() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-black" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <BarChart3 className="w-3 h-3 text-white/70" />
                        Daily Performance Reports
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Morning Report,{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            In Your Inbox
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        Every morning — automated performance summary with AI insights, actions taken, and recommended next steps. No manual work needed.
                    </p>
                </motion.div>

                {/* Report Mockup */}
                <div className="max-w-5xl mx-auto">
                    <div className="bg-[#050505] rounded-2xl overflow-hidden border border-white/[0.06]">
                        {/* Report Header */}
                        <div className="bg-[#0a0a0a] border-b border-white/[0.05] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-semibold">Daily Performance Report</h3>
                                <p className="text-xs text-white/30">February 20, 2026 · Yesterday&apos;s Summary</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/60 text-xs flex items-center gap-1.5">
                                <span className="text-white/80">✓</span> All campaigns healthy
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                                {metrics.map((m, i) => (
                                    <motion.div
                                        key={m.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        className={`p-4 rounded-xl bg-white/[0.02] border border-white/5`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <m.icon className={`w-4 h-4 ${colorMap[m.color]}`} />
                                            <span
                                                className={`text-xs font-medium flex items-center gap-0.5 ${m.up ? "text-zinc-300" : "text-zinc-300"
                                                    }`}
                                            >
                                                {m.up ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                {m.change}
                                            </span>
                                        </div>
                                        <div className="text-xl font-bold text-white">{m.value}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{m.label}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Insights + Actions */}
                            <div className="grid md:grid-cols-2 gap-5">
                                {/* AI Insights */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.6 }}
                                    className="p-5 rounded-xl bg-white/[0.02] border border-white/5"
                                >
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                                        <Lightbulb className="w-4 h-4 text-zinc-300" />
                                        Top 3 AI Insights
                                    </h4>
                                    <div className="space-y-3">
                                        {insights.map((insight, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                <insight.icon className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                                                <span className="leading-relaxed text-white/60">{insight.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Actions Taken */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.7 }}
                                    className="p-5 rounded-xl bg-white/[0.02] border border-white/5"
                                >
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                                        <ArrowUpRight className="w-4 h-4 text-zinc-300" />
                                        Automated Actions Taken
                                    </h4>
                                    <div className="space-y-3">
                                        {actions.map((action, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                                <div className="w-5 h-5 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-[10px] text-zinc-300 font-bold">{i + 1}</span>
                                                </div>
                                                <span className="leading-relaxed">{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

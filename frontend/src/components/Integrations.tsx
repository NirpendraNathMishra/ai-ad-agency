"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Globe,
    BrainCircuit,
    Cog,
    Server,
    Zap,
    ExternalLink,
} from "lucide-react";

const categories = [
    {
        title: "Ad Platforms",
        icon: Globe,
        color: "cyan",
        items: [
            { name: "Meta Ads", desc: "Facebook + Instagram campaigns" },
            { name: "Google Ads", desc: "Search, Display, YouTube" },
            { name: "DV360", desc: "Programmatic buying" },
            { name: "TikTok Ads", desc: "Short-form video ads" },
            { name: "Snapchat Ads", desc: "Stories & AR campaigns" },
            { name: "Amazon Ads", desc: "Sponsored Products & DSP" },
        ],
    },
    {
        title: "AI & LLMs",
        icon: BrainCircuit,
        color: "violet",
        items: [
            { name: "Claude Sonnet 4", desc: "Primary reasoning LLM" },
            { name: "Kimi k2", desc: "Creative copywriting" },
            { name: "Opus 4.6", desc: "Advanced creative model (Anthropic)" },
            { name: "Ollama + Llama 4", desc: "Self-hosted inference" },
            { name: "Llama 4 Scout", desc: "Open-source analysis" },
            { name: "Mistral Large 2", desc: "Fast inference & analysis" },
        ],
    },
    {
        title: "Automation & MCP",
        icon: Cog,
        color: "pink",
        items: [
            { name: "MCP Protocol", desc: "AI-tool orchestration layer" },
            { name: "n8n Workflows", desc: "Visual automation builder" },
            { name: "Google Sheets API", desc: "Bulk data operations" },
            { name: "Slack Integration", desc: "Alerts & approvals" },
        ],
    },
    {
        title: "Infrastructure",
        icon: Server,
        color: "emerald",
        items: [
            { name: "Supabase", desc: "Database & auth" },
            { name: "Vercel", desc: "Edge deployment" },
            { name: "Redis", desc: "Caching & queues" },
            { name: "Docker", desc: "Container orchestration" },
        ],
    },
];

const colorMap: Record<string, { iconBg: string; text: string; icon: string }> = {
    cyan: { iconBg: "bg-cyan-500/10", text: "text-cyan-400", icon: "text-cyan-400" },
    violet: { iconBg: "bg-violet-500/10", text: "text-violet-400", icon: "text-violet-400" },
    pink: { iconBg: "bg-pink-500/10", text: "text-pink-400", icon: "text-pink-400" },
    emerald: { iconBg: "bg-emerald-500/10", text: "text-emerald-400", icon: "text-emerald-400" },
};

const apiStats = [
    { platform: "Meta Marketing API", coverage: "94%", color: "text-zinc-300" },
    { platform: "Google Ads API", coverage: "91%", color: "text-zinc-300" },
    { platform: "DV360 API", coverage: "87%", color: "text-zinc-300" },
];

export function Integrations() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} id="integrations" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg-fine opacity-10 [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Zap className="w-3 h-3" />
                        Integrations & AI Stack
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">
                            Connects to{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Everything
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-xl mx-auto">
                        20+ integrations across ad platforms, LLMs, automation tools, and infrastructure.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {categories.map((cat, ci) => {
                        const colors = colorMap[cat.color];
                        return (
                            <motion.div
                                key={cat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.1 * ci }}
                                className="bg-[#050505] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-3 mb-6 relative">
                                    <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border border-white/[0.06] flex items-center justify-center`}>
                                        <cat.icon className={`w-5 h-5 ${colors.icon}`} />
                                    </div>
                                    <h3 className="text-base font-semibold text-white">{cat.title}</h3>
                                    <span className={`ml-auto text-[10px] uppercase tracking-widest font-semibold ${colors.text}`}>
                                        {cat.items.length} integrations
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {cat.items.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.08] transition-colors relative"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                            <div>
                                                <div className="text-sm font-medium text-white group-hover:text-white/90">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* API Coverage Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 }}
                    className="bg-transparent border border-white/[0.08] rounded-2xl p-8 max-w-3xl mx-auto"
                >
                    <h3 className="text-sm font-semibold text-white mb-4 text-center">
                        API Coverage
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {apiStats.map((stat) => (
                            <div key={stat.platform} className="text-center">
                                <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                    {stat.coverage}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {stat.platform}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

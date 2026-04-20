"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Monitor,
    Server,
    Cpu,
    Globe,
    ArrowDown,
    ArrowRight,
    Shield,
    Database,
    Bot,
} from "lucide-react";

const layers = [
    {
        id: "frontend",
        label: "User Interface",
        tech: "Next.js + Tailwind CSS",
        icon: Monitor,
        color: "cyan",
        items: ["Dashboard", "Campaign Builder", "Analytics", "Reports"],
    },
    {
        id: "backend",
        label: "Backend Server",
        tech: "Node.js + Express + TypeScript",
        icon: Server,
        color: "violet",
        items: [
            "AI Strategy Engine",
            "Creative Engine (Pomelli/Kimi k2/DALL·E)",
            "Optimization Engine",
            "Orchestrator Agent",
        ],
    },
    {
        id: "mcp",
        label: "MCP Layer",
        tech: "Model Context Protocol",
        icon: Cpu,
        color: "emerald",
        items: [
            "Meta Ads MCP Server",
            "Google Ads MCP Server",
            "DV360 MCP Server",
            "Playwright MCP (Fallback)",
        ],
    },
    {
        id: "platforms",
        label: "External Platforms",
        tech: "APIs & Services",
        icon: Globe,
        color: "orange",
        items: [
            "Meta Marketing API",
            "Google Ads API",
            "Display & Video 360 API",
            "Playwright Browser",
        ],
    },
];

const colorClassMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    cyan: {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        text: "text-cyan-400",
        glow: "shadow-cyan-500/20",
    },
    violet: {
        bg: "bg-violet-500/10",
        border: "border-violet-500/20",
        text: "text-violet-400",
        glow: "shadow-violet-500/20",
    },
    emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        glow: "shadow-emerald-500/20",
    },
    orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
        glow: "shadow-orange-500/20",
    },
};

export function Architecture() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} id="architecture" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Database className="w-3 h-3" />
                        System Architecture
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className=" text-white">
                            Built for{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                            Scale & Security
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-2xl mx-auto text-lg">
                        Four-layer architecture with MCP protocol bridging AI reasoning and platform execution. Every layer is secure, scalable, and observable.
                    </p>
                </motion.div>

                {/* Architecture Diagram */}
                <div className="max-w-4xl mx-auto space-y-3">
                    {layers.map((layer, i) => {
                        const colors = colorClassMap[layer.color];
                        return (
                            <div key={layer.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ duration: 0.5, delay: 0.15 * i }}
                                    className={`bg-[#050505] rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-colors`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Layer label */}
                                        <div className="flex items-center gap-3 md:w-1/3">
                                            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                <layer.icon className={`w-5 h-5 ${colors.text}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white text-sm">{layer.label}</h3>
                                                <p className="text-xs text-slate-500">{layer.tech}</p>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="flex-1 flex flex-wrap gap-2">
                                            {layer.items.map((item) => (
                                                <span
                                                    key={item}
                                                    className={`px-3 py-1.5 text-xs rounded-lg ${colors.bg} ${colors.text} ${colors.border} border font-medium`}
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Arrow */}
                                {i < layers.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={isInView ? { opacity: 1 } : {}}
                                        transition={{ delay: 0.15 * i + 0.1 }}
                                        className="flex justify-center py-1"
                                    >
                                        <div className="flex flex-col items-center">
                                            <ArrowDown className="w-4 h-4 text-slate-600" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Fallback Flow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8 }}
                    className="mt-12 bg-[#050505] border border-white/[0.06] rounded-2xl p-6 max-w-4xl mx-auto"
                >
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-zinc-300" />
                        Fallback & Recovery Flow
                    </h4>
                    <div className="flex flex-col md:flex-row items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-zinc-300">
                            <Cpu className="w-4 h-4" />
                            MCP API Call
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90 md:rotate-0" />
                        <div className="text-slate-500 text-xs">if fails</div>
                        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90 md:rotate-0" />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-zinc-300">
                            <Bot className="w-4 h-4" />
                            Browser Agent (Playwright)
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90 md:rotate-0" />
                        <div className="text-slate-500 text-xs">if fails</div>
                        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90 md:rotate-0" />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/70">
                            <Shield className="w-4 h-4 text-white/50" />
                            Manual + Alert
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

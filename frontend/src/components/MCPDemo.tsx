"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Play,
    BarChart3,
    MessageSquare,
    Database,
    ArrowRight,
    Shield,
    Zap,
    Eye,
} from "lucide-react";

const capabilities = [
    {
        icon: BarChart3,
        title: "Campaign Performance",
        description: "Pull real-time impressions, clicks, CTR, CPC, CPA, and ROAS from any Meta ad account.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    {
        icon: Eye,
        title: "Anomaly Detection",
        description: "AI spots spend anomalies, performance drops, and tracking issues before they cost you.",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
    },
    {
        icon: MessageSquare,
        title: "Natural Language Queries",
        description: "Ask Claude in plain English: \"Show me top 5 campaigns by ROAS this week.\"",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        icon: Database,
        title: "Multi-Account Access",
        description: "Connect multiple Meta ad accounts and get unified cross-account reporting instantly.",
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20",
    },
];

const mcpTools = [
    "get_campaigns",
    "get_ad_insights",
    "get_ad_creatives",
    "get_audience_data",
    "get_account_info",
    "export_report_csv",
];

export function MCPDemo() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} id="mcp-demo" className="relative py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-black" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-white/[0.015] rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Zap className="w-3 h-3" />
                        Live Demo
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">
                            Meta Ads via{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            MCP Protocol
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-2xl mx-auto text-lg">
                        Watch Claude AI pull real-time campaign data, generate performance reports,
                        and deliver actionable insights — all through the Meta Ads MCP Server.
                    </p>
                </motion.div>

                {/* Video + Info Layout */}
                <div className="grid lg:grid-cols-5 gap-8 items-start mb-16">
                    {/* Video Player — takes 3 columns */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3"
                    >
                        <div className="bg-[#050505] border border-white/[0.06] rounded-2xl p-4 overflow-hidden">
                            {/* Video header bar */}
                            <div className="flex items-center gap-2 mb-3 px-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                                </div>
                                <span className="text-[11px] text-white/30 font-mono ml-3 tracking-wider">
                                    claude / meta-ads-mcp
                                </span>
                            </div>

                            {/* Actual Video */}
                            <div className="relative rounded-xl overflow-hidden bg-black/60">
                                <video
                                    className="w-full aspect-video"
                                    loop
                                    autoPlay
                                    muted
                                    playsInline
                                >
                                    <source src="/meta-mcp-demo.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 px-2">
                                Demo: Claude AI using Meta Ads MCP Server to fetch campaign reports, analyze performance, and generate insights in real-time.
                            </p>
                        </div>
                    </motion.div>

                    {/* MCP Tools Sidebar — takes 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        {/* MCP Tools List */}
                        <div className="bg-[#050505] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-4 h-4 text-white/60" />
                                <h3 className="text-sm font-semibold text-white">MCP Tools Available</h3>
                            </div>
                            <div className="space-y-2">
                                {mcpTools.map((tool) => (
                                    <div
                                        key={tool}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                        <code className="text-xs text-white/60 font-mono">
                                            {tool}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Protocol Info */}
                        <div className="bg-[#050505] border border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-3">Protocol Details</h3>
                            <div className="space-y-2.5 text-xs text-zinc-300">
                                <div className="flex justify-between">
                                    <span>Protocol</span>
                                    <span className="text-zinc-300 font-mono">MCP v1.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Transport</span>
                                    <span className="text-zinc-300 font-mono">stdio / SSE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Auth</span>
                                    <span className="text-zinc-300 font-mono">OAuth 2.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Platforms</span>
                                    <span className="text-zinc-300 font-mono">Meta Marketing API</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>LLM</span>
                                    <span className="text-zinc-300 font-mono">Claude Sonnet 4</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Capabilities Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {capabilities.map((cap, i) => (
                        <motion.div
                            key={cap.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.4 + 0.1 * i }}
                            className="bg-[#050505] border border-white/[0.06] rounded-2xl p-5 group hover:border-white/[0.12] transition-colors"
                        >
                            <div className={`w-9 h-9 rounded-lg ${cap.bg} ${cap.border} border flex items-center justify-center mb-3`}>
                                <cap.icon className={`w-4 h-4 ${cap.color}`} />
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-1.5">
                                {cap.title}
                            </h3>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                {cap.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

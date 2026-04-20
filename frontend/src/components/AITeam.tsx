"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Sparkles, BarChart3, Palette } from "lucide-react";

const aiTeam = [
    {
        role: "The Core Strategist",
        model: "Claude Sonnet 4",
        provider: "Anthropic",
        icon: Brain,
        description: "Analyzes historical data, parses competitor strategies, and constructs the overarching campaign architecture.",
        color: ""
    },
    {
        role: "The Media Buyer",
        model: "Kimi k2",
        provider: "Moonshot AI",
        icon: Sparkles,
        description: "Drafts emotionally resonant ad copy, handles dynamic keyword insertion, and writes engaging landing page hooks.",
        color: ""
    },
    {
        role: "The Creative Architect",
        model: "Opus 4.6",
        provider: "Anthropic",
        icon: Palette,
        description: "Orchestrates Pomelli and DALL·E 3 to generate visual assets, resizes videos for Reels/TikTok, and tests unlimited variant combinations.",
        color: ""
    },
    {
        role: "The Data Analyst",
        model: "Llama 4 Scout",
        provider: "Meta",
        icon: BarChart3,
        description: "Ingests real-time ROAS data, autonomously pauses losing ad sets, and aggressively scales winning campaigns.",
        color: ""
    }
];

export function AITeam() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-black" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <Brain className="w-3 h-3 text-white/70" />
                        Multi-Modal Intelligence
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Meet Your New{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Marketing Team
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        We don&apos;t rely on a single model. AdForge AI dynamically routes tasks to the specific AI
                        that performs it best—delivering superhuman results at machine speed.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiTeam.map((member, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.1 * index }}
                            className="bg-[#050505] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300 relative group overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6 group-hover:bg-white/[0.06] transition-colors">
                                    <member.icon className="w-6 h-6 text-white/80" />
                                </div>

                                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2 block">
                                    {member.role}
                                </span>

                                <h3 className="text-xl font-semibold text-white mb-1">
                                    {member.model}
                                </h3>

                                <div className="text-xs font-medium text-white/40 mb-4">
                                    Powered by {member.provider}
                                </div>

                                <p className="text-white/50 leading-relaxed text-sm">
                                    {member.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

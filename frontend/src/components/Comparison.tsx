"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, XCircle, Zap, Building2 } from "lucide-react";

const comparisonData = [
    {
        feature: "Campaign Turnaround",
        agency: "1-2 Weeks",
        adForgeAi: "Under 5 Minutes",
    },
    {
        feature: "Pricing Model",
        agency: "15-20% of Ad Spend",
        adForgeAi: "Flat SaaS Fee ($0 Commission)",
    },
    {
        feature: "Optimization Frequency",
        agency: "Weekly Check-ins",
        adForgeAi: "24/7 Autonomous (Real-time)",
    },
    {
        feature: "Cross-Platform Strategy",
        agency: "Siloed Account Managers",
        adForgeAi: "Multi-modal AI Orchestration",
    },
    {
        feature: "Creative Generation",
        agency: "Extra Design Retainers",
        adForgeAi: "Included (Pomelli + DALL·E 3 + Kimi k2)",
    },
    {
        feature: "Reporting",
        agency: "Static Monthly PDFs",
        adForgeAi: "Real-time Slack / Email Alerts",
    }
];

export function Comparison() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            The New Standard of{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Agencies
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        See why modern performance brands are firing their media buyers and switching
                        to deterministic, AI-first campaign orchestration.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="bg-[#050505] rounded-2xl overflow-hidden border border-white/[0.06]">
                        {/* Headers */}
                        <div className="grid grid-cols-1 md:grid-cols-3 bg-[#0a0a0a] border-b border-white/[0.05]">
                            <div className="p-6 hidden md:block" />
                            <div className="p-6 flex items-center justify-center gap-2 border-r border-white/[0.05]">
                                <Building2 className="w-5 h-5 text-white/40" />
                                <span className="font-semibold text-white/60">Traditional Agency</span>
                            </div>
                            <div className="p-6 flex items-center justify-center gap-2">
                                <Zap className="w-5 h-5 text-white/80" />
                                <span className="font-semibold text-white">AdForge AI</span>
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-white/[0.04]">
                            {comparisonData.map((row, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="p-5 flex items-center">
                                        <span className="font-medium text-white/80">{row.feature}</span>
                                    </div>
                                    <div className="p-5 flex items-center gap-3 border-b md:border-b-0 md:border-r border-white/[0.04] md:justify-center">
                                        <XCircle className="w-4 h-4 text-red-500/60 shrink-0" />
                                        <span className="text-white/50">{row.agency}</span>
                                    </div>
                                    <div className="p-5 flex items-center gap-3 md:justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="font-medium text-white">{row.adForgeAi}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

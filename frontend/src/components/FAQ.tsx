"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
    {
        category: "General",
        items: [
            {
                q: "What is AdForge AI?",
                a: "AdForge AI is an AI-powered ad agency platform that automates the entire advertising workflow — from strategy and media planning to campaign launch, daily optimization, and reporting — across Google Ads, Meta Ads, and DV360.",
            },
            {
                q: "How is this different from other ad tools?",
                a: "Unlike tools that optimize one aspect (bidding, creative, etc.), AdForge AI replaces the entire agency workflow. We use MCP (Model Context Protocol) to give AI agents direct API access to ad platforms, with browser automation as a fallback. It's not a dashboard — it's an autonomous operator.",
            },
            {
                q: "Do I still need a media buyer?",
                a: "For most cases, no. AdForge AI handles 90%+ of the work autonomously. You'll need someone to review AI-generated strategies, approve budgets exceeding thresholds, and make high-level decisions. Think of it as going from 5 media buyers to 1 strategic overseer.",
            },
        ],
    },
    {
        category: "Technical",
        items: [
            {
                q: "What is MCP (Model Context Protocol)?",
                a: "MCP is an open standard (think 'USB-C for AI') that provides a standardized way for AI models to interact with external tools and APIs. AdForge AI uses MCP servers for Meta Ads, Google Ads, and DV360 to execute campaigns programmatically without screen scraping.",
            },
            {
                q: "What happens when an API doesn't support something?",
                a: "We use a 3-tier fallback: (1) MCP API Call → (2) Browser Automation via Playwright → (3) Human Manual + Alert. This ensures 100% coverage. Browser automation handles ~2-5% of edge cases.",
            },
            {
                q: "How do you handle security?",
                a: "OAuth 2.0 only — we never store passwords. Access tokens are AES-256 encrypted. Browser sessions are destroyed immediately after use. Every action is logged. We follow zero-trust architecture principles.",
            },
        ],
    },
    {
        category: "Pricing & Support",
        items: [
            {
                q: "Is there a free trial?",
                a: "Yes — 14-day free trial with full access to all features on the Growth plan. No credit card required to start.",
            },
            {
                q: "Can I cancel anytime?",
                a: "Absolutely. No contracts, no lock-in. Cancel anytime from your dashboard. Your data is exported before account closure.",
            },
        ],
    },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-white/5 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left group"
            >
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors pr-4">
                    {q}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-4 text-sm text-zinc-300 leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function FAQ() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <HelpCircle className="w-3 h-3 text-white/70" />
                        FAQ
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Got Questions?
                        </span>
                    </h2>
                </motion.div>

                {/* FAQ Grid */}
                <div className="max-w-3xl mx-auto space-y-8">
                    {faqs.map((cat, ci) => (
                        <motion.div
                            key={cat.category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.1 * ci }}
                        >
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                {cat.category}
                            </h3>
                            <div className="bg-[#050505] border border-white/[0.06] rounded-2xl px-6">
                                {cat.items.map((item) => (
                                    <FAQItem key={item.q} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

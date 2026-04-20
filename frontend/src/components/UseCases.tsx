"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown, ShoppingCart, Cloud, Home, UserPlus, Zap } from "lucide-react";

const useCases = [
    {
        id: "ecommerce",
        title: "E-Commerce",
        icon: ShoppingCart,
        metrics: "+42% ROAS | -28% CPA",
        description: "AdForge AI connects directly to your Shopify or WooCommerce store. Pomelli AI analyzes your product catalog to generate high-converting Meta and TikTok video creatives automatically. Llama 4 Scout continuously adjusts bids based on real-time inventory and conversion rate data.",
        strategies: ["Dynamic Product Ads (DPA)", "Lookalike Audience Scaling", "Cart Abandonment Retargeting"],
        color: ""
    },
    {
        id: "saas",
        title: "B2B SaaS",
        icon: Cloud,
        metrics: "-35% CPL | +2.1x Pipeline",
        description: "Focus on capturing high-intent leads without burning cash. AdForge AI utilizes Claude Sonnet 4 to analyze your competitors' messaging and generates highly technical, nuanced copy for LinkedIn and Google Search. It automatically pauses underperforming ad groups before your daily budget is wasted.",
        strategies: ["LinkedIn Document Ads", "Google Search Intent Capture", "G2 Competitor Retargeting"],
        color: ""
    },
    {
        id: "realestate",
        title: "Real Estate",
        icon: Home,
        metrics: "Sub-$10 Leads | 24/7 Nurture",
        description: "Stop relying on generic lead forms. The AI ingests your active MLS listings and automatically spins up localized Geo-fenced campaigns on Meta and Google. As properties sell, AdForge AI autonomously cycles them out of rotation and redirects budget to stale inventory.",
        strategies: ["Geo-fenced Radius Targeting", "Automated Listing Carousel Ads", "High-Net-Worth Profiling"],
        color: ""
    },
    {
        id: "leadgen",
        title: "Local Lead Generation",
        icon: UserPlus,
        metrics: "+85% Lead Volume | Flat CPA",
        description: "Perfect for local services (lawyers, roofers, dentists). AdForge AI dominates Google Local Services and Meta by building exact-match keyword funnels. It integrates with your CRM via webhooks to measure Offline Conversions, teaching the algorithm which leads actually closed.",
        strategies: ["Google Local Service Ads", "Click-to-Call Meta Forms", "Offline Conversion Tracking"],
        color: ""
    }
];

export function UseCases() {
    const [openId, setOpenId] = useState<string | null>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-black" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <Zap className="w-3 h-3 text-white/70" />
                        Industry Optimized
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Trained For{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Your Vertical
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        AdForge AI doesn&apos;t use generic templates. Our LLMs deploy proven, industry-specific
                        architectures that outperform generalized media buyers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    {useCases.map((useCase) => (
                        <div
                            key={useCase.id}
                            className={`bg-[#050505] rounded-2xl overflow-hidden border transition-colors duration-300 ${openId === useCase.id ? 'border-white/[0.12] bg-white/[0.02]' : 'border-white/[0.06] hover:border-white/[0.1]'
                                }`}
                        >
                            <button
                                onClick={() => setOpenId(openId === useCase.id ? null : useCase.id)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                        <useCase.icon className="w-5 h-5 text-white/80" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors">
                                            {useCase.title}
                                        </h3>
                                        <p className="text-xs font-medium text-white/40 mt-1">
                                            {useCase.metrics}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-7 h-7 rounded-full bg-white/[0.03] flex items-center justify-center transition-transform duration-300 ${openId === useCase.id ? 'rotate-180 text-white' : 'text-white/40'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </button>

                            <AnimatePresence>
                                {openId === useCase.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 pt-2 border-t border-white/[0.04]">
                                            <p className="text-white/50 leading-relaxed mb-6">
                                                {useCase.description}
                                            </p>

                                            <div>
                                                <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
                                                    Automated Strategies
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {useCase.strategies.map((strategy, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-sm text-white/60 flex items-center gap-2"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                            {strategy}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

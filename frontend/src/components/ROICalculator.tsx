"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Calculator, ArrowRight, DollarSign, TrendingUp } from "lucide-react";

export function ROICalculator() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const [adSpend, setAdSpend] = useState<number>(50000);
    const [agencyFee, setAgencyFee] = useState<number>(15);
    const [animatedSavings, setAnimatedSavings] = useState(0);

    const agencyCost = (adSpend * agencyFee) / 100;
    const adForgeAiCost = 3500; // Assuming Growth plan for comparison
    const monthlySavings = Math.max(0, agencyCost - adForgeAiCost);
    const annualSavings = monthlySavings * 12;

    // Animate the savings number
    useEffect(() => {
        const duration = 500; // ms
        const steps = 20;
        const stepTime = duration / steps;
        const increment = (annualSavings - animatedSavings) / steps;
        let current = animatedSavings;
        let step = 0;

        const timer = setInterval(() => {
            current += increment;
            step++;
            if (step >= steps) {
                clearInterval(timer);
                setAnimatedSavings(annualSavings);
            } else {
                setAnimatedSavings(current);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [annualSavings]); // Intentional: Only re-run when actual savings change

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg-fine opacity-[0.15] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Calculator className="w-3 h-3" />
                        ROI Calculator
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">
                            Stop Paying for{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Inefficiency
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-2xl mx-auto text-lg">
                        See exactly how much more budget you can put towards actual ads by switching
                        to AdForge AI&apos;s flat-fee autonomous model.
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="bg-[#050505] rounded-3xl p-8 md:p-12 border border-white/[0.08] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Sliders */}
                            <div className="space-y-10">
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="text-sm font-semibold text-slate-300">
                                            Monthly Ad Spend
                                        </label>
                                        <div className="text-2xl font-bold text-white">
                                            {formatCurrency(adSpend)}
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="10000"
                                        max="500000"
                                        step="5000"
                                        value={adSpend}
                                        onChange={(e) => setAdSpend(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-white hover:accent-white/80 transition-all"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                                        <span>$10k</span>
                                        <span>$500k+</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="text-sm font-semibold text-slate-300">
                                            Current Agency Fee
                                        </label>
                                        <div className="text-2xl font-bold text-white">
                                            {agencyFee}%
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="30"
                                        step="1"
                                        value={agencyFee}
                                        onChange={(e) => setAgencyFee(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-white hover:accent-white/80 transition-all"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                                        <span>5%</span>
                                        <span>30%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Result */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#0a0a0a] rounded-2xl border border-white/[0.04]" />
                                <div className="relative p-8 flex flex-col h-full justify-center">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="text-zinc-300">Traditional Agency Cost</span>
                                            <span className="font-mono text-lg text-slate-300">{formatCurrency(agencyCost)}<span className="text-xs text-slate-500">/mo</span></span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="text-zinc-300">AdForge AI Flat Fee <span className="text-xs bg-white/10 px-2 py-0.5 rounded ml-2">Growth</span></span>
                                            <span className="font-mono text-lg text-white">{formatCurrency(adForgeAiCost)}<span className="text-xs text-slate-500">/mo</span></span>
                                        </div>
                                        <div className="pt-4">
                                            <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2 block">
                                                Your Annual Savings
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-semibold tracking-tight text-white">
                                                    {formatCurrency(animatedSavings)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400 mt-3 flex items-start gap-2 font-medium">
                                                <TrendingUp className="w-4 h-4 shrink-0 text-white/50 mt-0.5" />
                                                That&apos;s {formatCurrency(animatedSavings)} more budget directly for ad performance securely every year.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <p className="text-sm text-zinc-300 max-w-lg">
                                Stop paying agencies to manually duplicate ads. Let AI orchestrate across all platforms for one flat SaaS fee.
                            </p>
                            <a
                                href="#pricing"
                                className="shrink-0 px-6 py-3 bg-white text-black hover:bg-white/90 font-semibold rounded-lg transition-all flex items-center gap-2 text-sm group"
                            >
                                View Pricing
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

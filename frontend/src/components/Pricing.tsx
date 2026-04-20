"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Star, ArrowRight, Zap, Crown, Building2 } from "lucide-react";

const plans = [
    {
        name: "Starter",
        price: "$1,500",
        period: "/month",
        description: "Perfect for growing businesses entering AI-powered ad management",
        icon: Zap,
        color: "cyan",
        popular: false,
        features: [
            "Up to 10 campaigns",
            "2 ad platforms (Meta + Google)",
            "AI media planning",
            "Basic creative generation (Pomelli)",
            "Daily email reports",
            "MCP orchestration",
            "5 human approval checkpoints",
            "Email support",
        ],
    },
    {
        name: "Growth",
        price: "$3,500",
        period: "/month",
        description: "For teams scaling ad operations across multiple platforms",
        icon: Crown,
        color: "violet",
        popular: true,
        features: [
            "Up to 50 campaigns",
            "4 ad platforms (Meta, Google, DV360, YouTube)",
            "Advanced AI media planning",
            "Pomelli creative generation",
            "Real-time dashboard + daily reports",
            "Full 13-phase MCP orchestration",
            "Unlimited approval workflows",
            "A/B testing automation",
            "Anomaly detection alerts",
            "Priority Slack support",
        ],
    },
    {
        name: "Enterprise",
        price: "$7,500",
        period: "/month",
        description: "Full AI ad agency replacement for large-scale operations",
        icon: Building2,
        color: "emerald",
        popular: false,
        features: [
            "Unlimited campaigns",
            "All ad platforms + 4 Social Networks",
            "Omnichannel AI Social Manager",
            "Custom Claude Sonnet 4 fine-tuning",
            "Full Pomelli + custom creative pipeline",
            "White-label AI reporting",
            "Custom MCP tool development",
            "Multi-account management",
            "Advanced budget optimization",
            "Dedicated account manager",
            "SLA guarantee + 24/7 support",
            "SOC 2 & ISO 27001 compliance included",
        ],
    },
];

const colorMap: Record<string, { border: string; bg: string; text: string; btn: string; glow: string }> = {
    cyan: {
        border: "border-white/[0.06]",
        bg: "bg-white/[0.02]",
        text: "text-white/60",
        btn: "bg-white text-black hover:bg-white/90",
        glow: "",
    },
    violet: {
        border: "border-white/[0.06]",
        bg: "bg-white/[0.02]",
        text: "text-white/60",
        btn: "bg-white text-black hover:bg-white/90",
        glow: "",
    },
    emerald: {
        border: "border-white/[0.06]",
        bg: "bg-white/[0.02]",
        text: "text-white/60",
        btn: "bg-white text-black hover:bg-white/90",
        glow: "",
    },
};

export function Pricing() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} id="pricing" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg-fine opacity-10 [mask-image:linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.015] rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Star className="w-3 h-3" />
                        Simple Pricing
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Replace Your Agency,{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Not Your Budget
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-xl mx-auto">
                        Starting at $1,500/month — less than hiring a single media buyer.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {plans.map((plan, i) => {
                        const colors = colorMap[plan.color];
                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.1 * i }}
                                className={`relative bg-[#050505] border border-white/[0.06] rounded-2xl p-7 flex flex-col ${plan.popular ? "ring-1 ring-white/20" : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="px-4 py-1 rounded-full bg-white text-black text-xs font-bold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}>
                                    <plan.icon className={`w-5 h-5 ${colors.text}`} />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                <p className="text-xs text-slate-500 mb-4">{plan.description}</p>

                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                                    <span className="text-slate-500 text-sm">{plan.period}</span>
                                </div>

                                <button
                                    className={`w-full py-3 rounded-lg font-semibold text-sm ${colors.btn} transition-all flex items-center justify-center gap-2 mb-6`}
                                >
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                <div className="space-y-2.5 flex-1">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-2.5">
                                            <Check className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />
                                            <span className="text-sm text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Palette,
    Sparkles,
    Globe,
    Layers,
    Image as ImageIcon,
    Wand2,
    ExternalLink,
    Play,
} from "lucide-react";

const steps = [
    {
        icon: Globe,
        title: "Build Business DNA",
        description:
            "Pomelli scans your website URL and extracts brand identity — colors, fonts, tone of voice, and visual style — into a unified \"Business DNA\" profile.",
        color: "cyan",
    },
    {
        icon: Sparkles,
        title: "Generate Campaign Ideas",
        description:
            "AI suggests tailored campaign concepts based on your business DNA, or you enter custom prompts for specific marketing goals and audiences.",
        color: "violet",
    },
    {
        icon: ImageIcon,
        title: "Create Editable Assets",
        description:
            "Generates on-brand social posts, ad creatives, banners, and visuals — fully editable with custom images, headers, fonts, colors, and CTAs.",
        color: "pink",
    },
    {
        icon: Wand2,
        title: "AI Photoshoot",
        description:
            "Transform basic product photos into professional, studio-quality images with AI-generated backgrounds, lighting, and styling — no photographer needed.",
        color: "emerald",
    },
];

const colorMap: Record<string, { iconBg: string; text: string; icon: string }> = {
    cyan: { iconBg: "bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]", text: "text-cyan-400", icon: "text-cyan-400" },
    violet: { iconBg: "bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]", text: "text-violet-400", icon: "text-violet-400" },
    pink: { iconBg: "bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.2)]", text: "text-pink-400", icon: "text-pink-400" },
    emerald: { iconBg: "bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]", text: "text-emerald-400", icon: "text-emerald-400" },
};

export function PommelliCreative() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 grid-bg-fine opacity-10 [mask-image:linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/10 text-zinc-300 text-xs font-medium mb-4">
                        <Palette className="w-3 h-3" />
                        AI Creative Studio
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        <span className="text-white">
                            Powered by Google{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Pomelli
                        </span>
                    </h2>
                    <p className="text-zinc-300 max-w-2xl mx-auto text-lg">
                        Generate on-brand ad creatives in seconds. Google Labs&apos; AI-powered
                        creative generation tool analyzes your brand DNA
                        and produces studio-quality marketing assets.
                    </p>
                </motion.div>

                {/* Alternating Layout: Video Left + Steps Right (admanage-inspired) */}
                <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
                    {/* Video Player */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-black border border-white/10 rounded-2xl p-4 overflow-hidden">
                            {/* Video header bar */}
                            <div className="flex items-center gap-2 mb-3 px-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-xs text-slate-500 font-mono ml-2">
                                    pomelli — creative-generation
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
                                    <source src="/pomelli-demo.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 px-2">
                                Watch: Google Pomelli generating on-brand ad creatives from just a website URL
                            </p>
                        </div>
                    </motion.div>

                    {/* Steps Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {steps.map((step, i) => {
                            const colors = colorMap[step.color];
                            return (
                                <div
                                    key={step.title}
                                    className="bg-[#050505] border border-white/[0.06] rounded-2xl p-6 group hover:border-white/[0.12] transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border border-white/[0.06] flex items-center justify-center`}>
                                            <step.icon className={`w-4 h-4 ${colors.icon}`} />
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-widest font-semibold ${colors.text}`}>
                                            0{i + 1}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1.5">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Feature Tags + Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto"
                >
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {[
                            "Business DNA Extraction",
                            "Gemini AI Models",
                            "Auto Brand Consistency",
                            "AI Photoshoot",
                            "Multi-format Output",
                        ].map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-white/60 text-xs font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <a
                        href="https://labs.google.com/pomelli/about/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors shrink-0"
                    >
                        Try Google Pomelli
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

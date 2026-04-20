"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";

export function CTA() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-32 overflow-hidden border-t border-white/[0.05]">
            {/* Background */}
            <div className="absolute inset-0 bg-black" />
            <div className="absolute inset-0 grid-bg-fine opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center max-w-3xl mx-auto"
                >
                    <h2 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 leading-[1.1]">
                        <span className="text-white">
                            Ready to Automate Your
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white/60 to-white/20">
                            Entire Ad Agency?
                        </span>
                    </h2>

                    <p className="text-lg text-zinc-300 mb-10 max-w-xl mx-auto">
                        Join the future of advertising. Let AI handle the execution while you
                        focus on strategy and growth.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 mt-12">
                        <a
                            href="mailto:hi@adforge-ai.in?subject=Inquiry%20from%20AdForge%20AI"
                            className="group px-8 py-4 bg-white text-black hover:bg-white/90 font-semibold rounded-lg transition-all flex items-center gap-2 text-base"
                        >
                            Contact Us
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        {/* <button className="group px-8 py-4 bg-[#0a0a0a] border border-white/[0.08] hover:bg-white/[0.05] text-white rounded-lg transition-all font-medium text-base">
                            Talk to Sales
                        </button> */}
                    </div>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center gap-8 text-[11px] font-semibold tracking-wider uppercase text-white/40">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-white/50" />
                            <span>No commitments</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-white/50" />
                            <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-white/50" />
                            <span>Setup in 5 min</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

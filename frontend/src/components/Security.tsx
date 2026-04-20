"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Lock,
    Key,
    ShieldCheck,
    FileCheck,
    ServerCrash,
    Eye,
    Fingerprint,
    AlertTriangle,
} from "lucide-react";
import { IsoSvg, Soc2Svg, GdprSvg } from "./icons/TrustBadges";

const securityFeatures = [
    {
        icon: Key,
        title: "OAuth 2.0 Only",
        description:
            "No passwords stored — ever. Users authenticate via OAuth 2.0 flow. We receive encrypted tokens, never credentials.",
        color: "emerald",
    },
    {
        icon: Lock,
        title: "AES-256 Token Encryption",
        description:
            "All access tokens and refresh tokens encrypted at rest using AES-256. Encryption keys stored in environment variables, never in code.",
        color: "cyan",
    },
    {
        icon: Fingerprint,
        title: "Session Isolation",
        description:
            "Browser profiles isolated per-user. Session cookies secured with HTTP-only flags. Auto-logout after inactivity period.",
        color: "violet",
    },
    {
        icon: ServerCrash,
        title: "Immediate Session Deletion",
        description:
            "After browser automation completes, sessions are immediately destroyed. No persistent storage of browser data.",
        color: "orange",
    },
    {
        icon: Eye,
        title: "Full Audit Logging",
        description:
            "Every API call, tool execution, and budget change is logged with timestamps, user IDs, and action details.",
        color: "blue",
    },
    {
        icon: FileCheck,
        title: "Global Compliance Certified",
        description:
            "Compliant with major global standards. We are ISO 27001, SOC 2 Type II, and GDPR certified to ensure your data is always protected.",
        color: "pink",
    },
];

const complianceBadges = [
    { name: "ISO 27001", Icon: IsoSvg },
    { name: "SOC 2 Type II", Icon: Soc2Svg },
    { name: "GDPR Ready", Icon: GdprSvg },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
    cyan: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
    violet: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
    orange: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
    blue: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
    pink: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-white/80" },
};

export function Security() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 grid-bg-fine opacity-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                        <ShieldCheck className="w-3 h-3 text-white/70" />
                        Security & Compliance
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        <span className="text-white">
                            Enterprise-Grade{" "}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Security
                        </span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg">
                        Zero-trust architecture with encrypted tokens, OAuth-only auth, and
                        complete audit trails. Your data stays yours.
                    </p>
                </motion.div>

                {/* Security Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                    {securityFeatures.map((feature, i) => {
                        const colors = colorMap[feature.color];
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.1 * i }}
                                className="bg-[#050505] border border-white/[0.06] rounded-2xl p-6 group hover:border-white/[0.12] transition-colors"
                            >
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-5 h-5 ${colors.text}`} />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed mb-4">
                                    {feature.description}
                                </p>
                                {feature.title === "Global Compliance Certified" && (
                                    <div className="flex items-center gap-3 pt-2">
                                        {complianceBadges.map((badge) => (
                                            <div key={badge.name} className="flex items-center justify-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-300 hover:text-white transition-colors" title={badge.name}>
                                                <badge.Icon className="w-4 h-4" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Alert Escalation Matrix */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6 }}
                    className="bg-[#050505] rounded-2xl overflow-hidden border border-white/[0.06]"
                >
                    <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/[0.05] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-white/60" />
                        <h4 className="font-semibold text-white text-sm">Automated Escalation Matrix</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left p-4 text-zinc-300 font-medium">Severity</th>
                                    <th className="text-left p-4 text-zinc-300 font-medium">Condition</th>
                                    <th className="text-left p-4 text-zinc-300 font-medium">Auto Action</th>
                                    <th className="text-left p-4 text-zinc-300 font-medium">Escalation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { severity: "Critical", sColor: "bg-red-500/10 text-red-400 border-red-500/20", condition: "Tracking Break", action: "Pause all ad groups", escalation: "Immediate alert" },
                                    { severity: "High", sColor: "bg-orange-500/10 text-orange-400 border-orange-500/20", condition: "CPA +50%", action: "Reduce budget 20%", escalation: "12 hours" },
                                    { severity: "Medium", sColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", condition: "Creative Fatigue", action: "Rotate assets", escalation: "Weekly summary" },
                                    { severity: "Low", sColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", condition: "Pacing Drift", action: "Adjust bids", escalation: "Daily report" },
                                ].map((row) => (
                                    <tr key={row.severity} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${row.sColor}`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/80">{row.condition}</td>
                                        <td className="p-4 text-white/60">{row.action}</td>
                                        <td className="p-4 text-white/40">{row.escalation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

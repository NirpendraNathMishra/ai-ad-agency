"use client";

import { GooglePartnerSvg, MetaPartnerSvg, IsoSvg, Soc2Svg, GdprSvg } from "./icons/TrustBadges";

export function Footer() {
    return (
        <footer className="relative py-8 border-t border-white/5 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-500">
                        Made with <span className="text-pink-500">♥</span> by AdForge AI team
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>© 2026 AdForge AI</span>
                        <span className="text-white/10">|</span>
                        <a href="mailto:hi@adforge-ai.in" className="hover:text-slate-400 transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

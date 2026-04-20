"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, Play } from "lucide-react";

const navLinks = [
    { href: "#workflow", label: "How It Works" },
    { href: "#features", label: "Features" },
    { href: "#integrations", label: "Integrations" },
    { href: "#architecture", label: "Architecture" },
    { href: "#pricing", label: "Pricing" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
                ? "bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-lg transition-all">
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <div className="absolute inset-0 bg-white rounded-lg blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        AdForge AI
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/launch"
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/90 hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-all"
                    >
                        <Play className="w-3.5 h-3.5" />
                        Launch Dashboard
                    </Link>
                    <a
                        href="mailto:hi@adforge-ai.in?subject=Inquiry%20from%20AdForge%20AI"
                        className="px-5 py-2.5 text-sm font-semibold text-black bg-white hover:bg-white/90 rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                        Contact Us
                    </a>
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden flex items-center gap-2">
                    <button
                        className="text-slate-300 p-2 hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="flex flex-col p-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-4 space-y-2">
                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center gap-2 px-4 py-3 border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Play className="w-4 h-4" />
                                    Launch Dashboard
                                </Link>
                                <a
                                    href="mailto:hi@adforge-ai.in?subject=Inquiry%20from%20AdForge%20AI"
                                    className="block text-center px-4 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

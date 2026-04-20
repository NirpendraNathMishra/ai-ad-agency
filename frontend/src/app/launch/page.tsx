"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Brain,
  Wand2,
  Search,
  Activity,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export default function LauncherPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-4">
            <Sparkles className="w-3 h-3" /> Pick your pipeline
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Launch Dashboard
          </h1>
          <p className="text-white/60 text-lg">
            v1 (stable, tool-based agents) ya v2 (live MCP browser + full pipeline) — apna choose karo
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LaunchCard
            href="/dashboard"
            badge="v1 · Stable"
            badgeClass="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            title="Classic Dashboard"
            subtitle="Tool-based agents — proven, faster, no subprocess spin-up"
            gradient="from-emerald-500/30 via-cyan-400/10 to-transparent"
            features={[
              { Icon: Search, text: "Research agent (web_search + scrape + Meta ads + Wikipedia)" },
              { Icon: Brain, text: "Strategy agent — budget allocation, audience segments" },
              { Icon: Wand2, text: "Creative agent — 10 ad variants" },
              { Icon: CheckCircle2, text: "~30-60s per run · no Playwright overhead" },
            ]}
            cta="Open v1 dashboard"
            delay={0}
          />

          <LaunchCard
            href="/dashboard/v2"
            badge="v2 · Live MCP"
            badgeClass="bg-violet-500/15 text-violet-300 border-violet-500/30"
            title="Full Pipeline + Live Browser"
            subtitle="Playwright MCP pre-fetch → research → strategy → creative with live screenshots"
            gradient="from-violet-500/30 via-cyan-400/10 to-transparent"
            features={[
              { Icon: Globe, text: "Real Playwright MCP — live screenshots of client + competitor sites" },
              { Icon: Activity, text: "Live 'now running' action banner · step-by-step" },
              { Icon: Terminal, text: "Color-coded tool-call terminal" },
              { Icon: Zap, text: "MCP-browsed context injected into research agent" },
            ]}
            cta="Launch v2 dashboard"
            delay={0.1}
          />
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Terminal className="w-4 h-4 text-amber-400" /> Quick start
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <div className="text-emerald-300 mb-1"># v1 backend</div>
              <div className="text-white/70">cd backend</div>
              <div className="text-white/70">python -X utf8 -m uvicorn server:app --port 8000</div>
            </div>
            <div>
              <div className="text-violet-300 mb-1"># v2 backend (needs Node + npx)</div>
              <div className="text-white/70">cd backend</div>
              <div className="text-white/70">python -X utf8 -m uvicorn server_v2:app --port 8001</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-300/80 border-t border-white/10 pt-3">
            ⚠ v2 pe 404 aa raha ho to server_v2.py restart karo — /api/v2/runs endpoint naya hai.
          </div>
        </div>
      </div>
    </main>
  );
}

function LaunchCard({
  href,
  badge,
  badgeClass,
  title,
  subtitle,
  gradient,
  features,
  cta,
  delay,
}: {
  href: string;
  badge: string;
  badgeClass: string;
  title: string;
  subtitle: string;
  gradient: string;
  features: Array<{ Icon: typeof Globe; text: string }>;
  cta: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link
        href={href}
        className="group block relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 hover:border-white/20 transition overflow-hidden"
      >
        <div
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${gradient} blur-3xl opacity-60 group-hover:opacity-100 transition`}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${badgeClass}`}
            >
              {badge}
            </span>
            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-white/60 text-sm mb-5 leading-relaxed">{subtitle}</p>

          <div className="space-y-2 mb-6">
            {features.map((f, i) => {
              const Icon = f.Icon;
              return (
                <div key={i} className="flex items-start gap-2 text-sm text-white/75">
                  <Icon className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                  <span>{f.text}</span>
                </div>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-white transition">
            {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Comparison } from "@/components/Comparison";
import { Features } from "@/components/Features";
import { AITeam } from "@/components/AITeam";
import { UseCases } from "@/components/UseCases";
import { PommelliCreative } from "@/components/PommelliCreative";
import { MCPDemo } from "@/components/MCPDemo";
import { Integrations } from "@/components/Integrations";
import { ROICalculator } from "@/components/ROICalculator";
import { Architecture } from "@/components/Architecture";
import { DailyReporting } from "@/components/DailyReporting";
import { Security } from "@/components/Security";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero — MCP Orchestrator Terminal */}
      <Hero />

      {/* How It Works — Chat-style Flow */}
      <HowItWorks />

      {/* Core Capabilities */}
      <Features />

      {/* AI Creative Studio — Google Pomelli */}
      <PommelliCreative />

      {/* Meta Ads MCP Demo — Live Video */}
      <MCPDemo />

      {/* Integrations & AI Stack — moved below MCP Demo */}
      <Integrations />

      {/* System Architecture */}
      <Architecture />

      {/* Daily AI Reports */}
      <DailyReporting />

      {/* Security & Compliance */}
      <Security />

      {/* --- NEW SECTIONS --- */}
      {/* AdForge AI vs Traditional Agency */}
      <Comparison />

      {/* Industry Verticals */}
      <UseCases />

      {/* Meet the AI Models */}
      <AITeam />

      {/* ROI & Savings Calculator */}
      <ROICalculator />

      {/* Pricing — $1,500/mo */}
      <Pricing />

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}

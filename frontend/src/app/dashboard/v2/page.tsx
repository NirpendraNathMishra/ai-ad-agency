"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Terminal as TerminalIcon,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Zap,
  Search,
  Target,
  Brain,
  Wand2,
  Download,
  Activity,
  MousePointerClick,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  BarChart3,
  Users,
  IndianRupee,
  Palette,
} from "lucide-react";
import Link from "next/link";
import type {
  BusinessInput,
  ResearchData,
  StrategyData,
  CreativeData,
} from "@/lib/types";
import { listRunsV2, type RunListItemV2 } from "@/lib/api";

const V2_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_V2 ?? "http://localhost:8001";
const V2_WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE_V2 ?? "ws://localhost:8001";

async function createRunV2(body: BusinessInput): Promise<{ run_id: string }> {
  const res = await fetch(`${V2_API_BASE}/api/v2/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createRunV2 failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function openRunV2Socket(id: string): WebSocket {
  return new WebSocket(`${V2_WS_BASE}/ws/v2/runs/${id}`);
}

type Stage = "mcp_browse" | "research" | "strategy" | "creative";
type StageStatus = "idle" | "running" | "done" | "error";
type RunStatus = "idle" | "running" | "done" | "error";

type AnyEvent = {
  ts?: string;
  type: string;
  [k: string]: unknown;
};

type McpStepEvent = {
  type: "mcp_step";
  tool: string;
  step?: string;
  url?: string;
  brand?: string;
  role?: string;
  label?: string;
  description?: string;
};

type McpScreenshotEvent = {
  type: "mcp_screenshot";
  b64: string;
  mime?: string;
  label?: string;
  url?: string;
  step?: string;
};

type McpResultEvent = {
  type: "mcp_result";
  brand?: string;
  role?: string;
  url?: string;
  title?: string;
  description?: string;
  h1?: string;
  prices_inr?: string[];
  step?: string;
};

const DEFAULT_BRIEF: BusinessInput = {
  business_name: "Mokobara",
  website: "https://mokobara.com",
  industry: "D2C premium luggage",
  product_description:
    "Polycarbonate hard-shell suitcases with lifetime warranty, built for the modern Indian traveller.",
  target_audience:
    "25-45 year old Indian urban professionals who travel 4+ times a year — tier-1 metros, interested in design and premium brands.",
  unique_selling_points: [
    "Lifetime warranty on the shell",
    "TSA-approved locks",
    "Featherlight polycarbonate build",
  ],
  monthly_ad_budget_inr: 500000,
  primary_goal: "sales",
  competitor_names: ["Nasher Miles", "Uppercase", "Safari"],
  geography: "India",
  focus_product: "Transit check-in suitcase",
};

export default function V2DashboardPage() {
  const [brief, setBrief] = useState<BusinessInput>(DEFAULT_BRIEF);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AnyEvent[]>([]);

  const [currentMcpStep, setCurrentMcpStep] = useState<McpStepEvent | null>(null);
  const [screenshots, setScreenshots] = useState<McpScreenshotEvent[]>([]);
  const [mcpResults, setMcpResults] = useState<McpResultEvent[]>([]);

  const [stageStatus, setStageStatus] = useState<Record<Stage, StageStatus>>({
    mcp_browse: "idle",
    research: "idle",
    strategy: "idle",
    creative: "idle",
  });
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [creativeData, setCreativeData] = useState<CreativeData | null>(null);
  const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null);
  const [allRuns, setAllRuns] = useState<RunListItemV2[]>([]);

  const socketRef = useRef<WebSocket | null>(null);

  async function refreshRuns() {
    try {
      const runs = await listRunsV2();
      setAllRuns(runs);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshRuns();
    const t = setInterval(refreshRuns, 5000);
    return () => clearInterval(t);
  }, []);

  async function loadPastRun(id: string) {
    try {
      socketRef.current?.close();
      const res = await fetch(`${V2_API_BASE}/api/v2/runs/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const evs = ((data.events as AnyEvent[]) || []).slice();

      setEvents(evs);
      setScreenshots(
        evs.filter((e) => e.type === "mcp_screenshot") as McpScreenshotEvent[],
      );
      setMcpResults(
        evs.filter((e) => e.type === "mcp_result") as McpResultEvent[],
      );
      const lastStep = [...evs]
        .reverse()
        .find((e) => e.type === "mcp_step") as McpStepEvent | undefined;
      setCurrentMcpStep(lastStep ?? null);

      const stages: Record<Stage, StageStatus> = {
        mcp_browse: evs.some((e) => e.type === "mcp_step") ? "done" : "idle",
        research: "idle",
        strategy: "idle",
        creative: "idle",
      };
      for (const ev of evs) {
        const stage = ev.stage as Stage | undefined;
        if (!stage) continue;
        if (ev.type === "stage_done") stages[stage] = "done";
        else if (ev.type === "stage_start" && stages[stage] !== "done")
          stages[stage] = "running";
      }
      setStageStatus(stages);

      const resDone = evs.find(
        (e) => e.type === "stage_done" && e.stage === "research",
      );
      if (resDone?.data) setResearchData(resDone.data as ResearchData);
      const stratDone = evs.find(
        (e) => e.type === "stage_done" && e.stage === "strategy",
      );
      if (stratDone?.data) setStrategyData(stratDone.data as StrategyData);
      const crDone = evs.find(
        (e) => e.type === "stage_done" && e.stage === "creative",
      );
      if (crDone?.data) setCreativeData(crDone.data as CreativeData);

      setFinalMarkdown((data.final_markdown as string) || null);
      if (data.business) setBrief(data.business as BusinessInput);
      setRunId(id);
      const s = data.status as string;
      setStatus(s === "done" ? "done" : s === "error" ? "error" : "running");
      setError((data.error as string) || null);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!runId) return;
    const ws = openRunV2Socket(runId);
    socketRef.current = ws;

    ws.onmessage = (msg) => {
      const ev = JSON.parse(msg.data) as AnyEvent;
      setEvents((prev) => [...prev, ev]);

      if (ev.type === "mcp_step") {
        setCurrentMcpStep(ev as McpStepEvent);
      } else if (ev.type === "mcp_screenshot") {
        setScreenshots((prev) => [...prev, ev as McpScreenshotEvent]);
      } else if (ev.type === "mcp_result") {
        setMcpResults((prev) => [...prev, ev as McpResultEvent]);
      } else if (ev.type === "stage_start") {
        const stage = ev.stage as Stage;
        setStageStatus((s) => ({ ...s, [stage]: "running" }));
      } else if (ev.type === "stage_done") {
        const stage = ev.stage as Stage;
        setStageStatus((s) => ({ ...s, [stage]: "done" }));
        if (stage === "research" && ev.data) setResearchData(ev.data as ResearchData);
        if (stage === "strategy" && ev.data) setStrategyData(ev.data as StrategyData);
        if (stage === "creative" && ev.data) setCreativeData(ev.data as CreativeData);
      } else if (ev.type === "run_done") {
        setStatus("done");
        fetch(`${V2_API_BASE}/api/v2/runs/${runId}`)
          .then((r) => r.json())
          .then((data) => setFinalMarkdown(data.final_markdown || null))
          .catch(() => {});
      } else if (ev.type === "run_error") {
        setStatus("error");
        setError((ev.error as string) || "unknown error");
      }
    };

    ws.onerror = () => setError("WebSocket error");
    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [runId]);

  async function handleStart() {
    setError(null);
    setEvents([]);
    setScreenshots([]);
    setMcpResults([]);
    setCurrentMcpStep(null);
    setResearchData(null);
    setStrategyData(null);
    setCreativeData(null);
    setFinalMarkdown(null);
    setStageStatus({
      mcp_browse: "idle",
      research: "idle",
      strategy: "idle",
      creative: "idle",
    });
    setStatus("running");
    try {
      const { run_id } = await createRunV2(brief);
      setRunId(run_id);
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  function handleReset() {
    setRunId(null);
    setStatus("idle");
    setError(null);
    setEvents([]);
    setScreenshots([]);
    setMcpResults([]);
    setCurrentMcpStep(null);
    setResearchData(null);
    setStrategyData(null);
    setCreativeData(null);
    setFinalMarkdown(null);
    setStageStatus({
      mcp_browse: "idle",
      research: "idle",
      strategy: "idle",
      creative: "idle",
    });
  }

  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <Header isRunning={isRunning} isDone={isDone} onReset={handleReset} />

        <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <BriefFormCentered
                  brief={brief}
                  setBrief={setBrief}
                  onStart={handleStart}
                />
                <RunsListV2
                  runs={allRuns}
                  currentRunId={runId}
                  onRefresh={refreshRuns}
                  onSelect={loadPastRun}
                />
              </motion.div>
            )}

            {(isRunning || isDone || status === "error") && (
              <motion.div
                key="run"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <StageStrip stages={stageStatus} />

                {/* Summary at top when done */}
                <AnimatePresence>
                  {isDone && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <SummaryHero
                        brief={brief}
                        research={researchData}
                        strategy={strategyData}
                        creative={creativeData}
                        markdown={finalMarkdown}
                        pagesBrowsed={mcpResults.length}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Browser (smaller, fixed) + terminal (bigger, fixed, scrollable) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2">
                    <McpLivePanel
                      currentStep={currentMcpStep}
                      screenshots={screenshots}
                      status={stageStatus.mcp_browse}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <ToolCallTerminal events={events} />
                  </div>
                </div>

                {error && <ErrorBanner message={error} />}

                {/* Collapsible detail sections */}
                <AnimatePresence>
                  {isDone && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-3"
                    >
                      <Dropdown
                        title="MCP Browsed Pages"
                        icon={<Globe className="w-4 h-4 text-violet-400" />}
                        badge={`${mcpResults.length}`}
                      >
                        <McpResultsGrid results={mcpResults} />
                      </Dropdown>

                      {researchData && (
                        <Dropdown
                          title="Research — competitor analysis"
                          icon={<Search className="w-4 h-4 text-amber-400" />}
                          badge={`${researchData.competitors_analyzed.length} competitors`}
                        >
                          <ResearchPanel data={researchData} />
                        </Dropdown>
                      )}

                      {strategyData && (
                        <Dropdown
                          title="Strategy — budget + segments"
                          icon={<Brain className="w-4 h-4 text-cyan-400" />}
                          badge={`${strategyData.audience_segments.length} segments`}
                        >
                          <StrategyPanel data={strategyData} />
                        </Dropdown>
                      )}

                      {creativeData && (
                        <Dropdown
                          title="Creative variants"
                          icon={<Wand2 className="w-4 h-4 text-pink-400" />}
                          badge={`${creativeData.variants.length} ads`}
                        >
                          <CreativePanel data={creativeData} />
                        </Dropdown>
                      )}

                      {finalMarkdown && (
                        <Dropdown
                          title="Full markdown report"
                          icon={<Download className="w-4 h-4 text-emerald-400" />}
                          badge={`${(finalMarkdown.length / 1000).toFixed(1)}K chars`}
                        >
                          <FinalReportPanel
                            markdown={finalMarkdown}
                            businessName={brief.business_name}
                          />
                        </Dropdown>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Header({
  isRunning,
  isDone,
  onReset,
}: {
  isRunning: boolean;
  isDone: boolean;
  onReset: () => void;
}) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> launcher
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-lg font-semibold">AdForge v2</div>
            <div className="text-xs text-white/50">
              Full pipeline + live Playwright MCP
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {(isRunning || isDone) && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-xs transition"
          >
            <RotateCcw className="w-3 h-3" /> new run
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? "bg-violet-400 animate-pulse" : isDone ? "bg-emerald-400" : "bg-white/40"
            }`}
          />
          <span className="text-white/70">
            {isRunning ? "running" : isDone ? "complete" : "idle"}
          </span>
        </div>
      </div>
    </header>
  );
}

function BriefFormCentered({
  brief,
  setBrief,
  onStart,
}: {
  brief: BusinessInput;
  setBrief: (b: BusinessInput) => void;
  onStart: () => void;
}) {
  const update = <K extends keyof BusinessInput>(k: K, v: BusinessInput[K]) =>
    setBrief({ ...brief, [k]: v });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-3">
          <Sparkles className="w-3 h-3" /> Ready to run
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
          Business Brief
        </h1>
        <p className="text-white/60 text-sm mt-2">
          Fill in the details — pipeline MCP browse karega, phir 3 agents chalenge
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Business name" value={brief.business_name} onChange={(v) => update("business_name", v)} />
          <Input label="Website" value={brief.website || ""} onChange={(v) => update("website", v)} />
        </div>
        <Input label="Industry" value={brief.industry} onChange={(v) => update("industry", v)} />
        <TextArea label="Product description" value={brief.product_description} onChange={(v) => update("product_description", v)} />
        <TextArea label="Target audience" value={brief.target_audience} onChange={(v) => update("target_audience", v)} />
        <Input
          label="USPs (comma-separated)"
          value={brief.unique_selling_points.join(", ")}
          onChange={(v) => update("unique_selling_points", v.split(",").map((x) => x.trim()).filter(Boolean))}
        />
        <Input
          label="Competitors (comma-separated)"
          value={brief.competitor_names.join(", ")}
          onChange={(v) => update("competitor_names", v.split(",").map((x) => x.trim()).filter(Boolean))}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Budget (INR/mo)"
            type="number"
            value={String(brief.monthly_ad_budget_inr)}
            onChange={(v) => update("monthly_ad_budget_inr", parseInt(v || "0") || 0)}
          />
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-white/50">Primary goal</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-400/50"
              value={brief.primary_goal}
              onChange={(e) => update("primary_goal", e.target.value as BusinessInput["primary_goal"])}
            >
              <option value="awareness">awareness</option>
              <option value="traffic">traffic</option>
              <option value="leads">leads</option>
              <option value="sales">sales</option>
              <option value="app_installs">app_installs</option>
            </select>
          </div>
          <Input label="Geography" value={brief.geography} onChange={(v) => update("geography", v)} />
        </div>
        <Input label="Focus product (optional)" value={brief.focus_product || ""} onChange={(v) => update("focus_product", v)} />

        <button
          onClick={onStart}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-400 text-black font-semibold py-3.5 rounded-lg hover:opacity-90 transition text-sm"
        >
          <Play className="w-4 h-4" /> Run full v2 pipeline
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-white/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-400/50"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-white/50">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-400/50 resize-none"
      />
    </div>
  );
}

function StageStrip({ stages }: { stages: Record<Stage, StageStatus> }) {
  const items: Array<{ key: Stage; label: string; Icon: typeof Globe }> = [
    { key: "mcp_browse", label: "MCP Browse", Icon: Globe },
    { key: "research", label: "Research", Icon: Search },
    { key: "strategy", label: "Strategy", Icon: Brain },
    { key: "creative", label: "Creative", Icon: Wand2 },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        {items.map(({ key, label, Icon }, i) => {
          const s = stages[key];
          return (
            <div key={key} className="flex items-center gap-2 flex-1 min-w-[140px]">
              <div
                className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border transition ${
                  s === "running"
                    ? "border-violet-400/50 bg-violet-400/10"
                    : s === "done"
                    ? "border-emerald-400/40 bg-emerald-400/5"
                    : s === "error"
                    ? "border-rose-400/40 bg-rose-400/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    s === "running"
                      ? "text-violet-300 animate-pulse"
                      : s === "done"
                      ? "text-emerald-400"
                      : "text-white/40"
                  }`}
                />
                <span className="text-xs flex-1">{label}</span>
                {s === "running" && <Loader2 className="w-3 h-3 animate-spin text-violet-300" />}
                {s === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              {i < items.length - 1 && (
                <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function McpLivePanel({
  currentStep,
  screenshots,
  status,
}: {
  currentStep: McpStepEvent | null;
  screenshots: McpScreenshotEvent[];
  status: StageStatus;
}) {
  const latest = screenshots[screenshots.length - 1];

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden h-[520px] flex flex-col">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold">Live MCP Browser</span>
          <span className="text-[10px] text-white/40 ml-1">@playwright/mcp</span>
        </div>
        <div className="text-[10px] text-white/50">
          frame {screenshots.length}
          {currentStep?.step ? `  ·  step ${currentStep.step}` : ""}
        </div>
      </div>

      {/* Fixed-height action banner — never grows beyond 88px */}
      <div className="h-[88px] border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-400/5 shrink-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep ? (
            <motion.div
              key={`${currentStep.tool}-${currentStep.step}-${currentStep.url || ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-2.5 h-full flex items-start gap-3"
            >
              <div className="mt-1.5 shrink-0">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === "done" ? "bg-emerald-400" : "bg-violet-400 animate-pulse"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-violet-300">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {status === "done" ? "completed" : "now running"} · {currentStep.tool}
                    {currentStep.step && (
                      <span className="text-white/50"> · step {currentStep.step}</span>
                    )}
                  </span>
                </div>
                <div className="text-sm font-semibold mt-0.5 truncate">
                  {currentStep.label || currentStep.tool}
                </div>
                {currentStep.url && (
                  <div className="text-xs text-cyan-300 mt-1 flex items-center gap-1 truncate">
                    <MousePointerClick className="w-3 h-3 shrink-0" />
                    <span className="truncate">{currentStep.url}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="px-4 py-2.5 h-full flex items-center text-xs text-white/40">
              waiting for MCP step...
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed-height image viewport — never zooms over time */}
      <div className="bg-black relative flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {latest ? (
            <motion.img
              key={latest.b64.slice(0, 24) + screenshots.length}
              src={`data:${latest.mime || "image/jpeg"};base64,${latest.b64}`}
              alt={latest.label || "screenshot"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 w-full h-full object-contain object-top bg-black"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-white/40">
              {status === "running" ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <div className="text-xs">Spawning Playwright MCP...</div>
                </>
              ) : status === "done" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div className="text-xs">MCP browsing complete</div>
                </>
              ) : (
                <>
                  <Globe className="w-6 h-6" />
                  <div className="text-xs">Waiting for MCP to start...</div>
                </>
              )}
            </div>
          )}
        </AnimatePresence>
        {latest?.url && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/85 to-transparent px-3 py-2 text-[11px] text-white/80 truncate">
            {latest.label && <span className="text-white font-medium">{latest.label}</span>}
            {latest.label && latest.url && <span className="text-white/40 mx-1">·</span>}
            {latest.url && <span className="text-cyan-300">{latest.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallTerminal({ events }: { events: AnyEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, autoScroll]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 16;
    setAutoScroll(atBottom);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/70 overflow-hidden flex flex-col h-[520px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.02] shrink-0">
        <TerminalIcon className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold">Tool-call Terminal</span>
        {!autoScroll && (
          <button
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              setAutoScroll(true);
            }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition"
          >
            jump to latest
          </button>
        )}
        <span className="text-[10px] text-white/40 ml-auto">{events.length} events</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed space-y-1"
      >
        {events.length === 0 && (
          <div className="text-white/30">waiting for events...</div>
        )}
        {events.map((ev, i) => (
          <EventLine key={i} ev={ev} />
        ))}
      </div>
    </div>
  );
}

function EventLine({ ev }: { ev: AnyEvent }) {
  const ts = ev.ts ? new Date(ev.ts).toLocaleTimeString() : "";
  const color =
    ev.type === "mcp_step"
      ? "text-violet-300"
      : ev.type === "mcp_screenshot"
      ? "text-pink-300"
      : ev.type === "mcp_result"
      ? "text-emerald-300"
      : ev.type === "mcp_tool_call"
      ? "text-cyan-300"
      : ev.type === "stage_start"
      ? "text-amber-300"
      : ev.type === "stage_done"
      ? "text-emerald-400"
      : ev.type === "run_error"
      ? "text-rose-400"
      : ev.type.startsWith("agent") || ev.type.startsWith("tool")
      ? "text-indigo-300"
      : "text-white/60";

  let summary: string;
  if (ev.type === "mcp_step") {
    const tool = (ev as unknown as McpStepEvent).tool;
    const step = (ev as unknown as McpStepEvent).step;
    const label = (ev as unknown as McpStepEvent).label;
    summary = `mcp_step · ${tool}${step ? ` ${step}` : ""} — ${label || ""}`;
  } else if (ev.type === "mcp_tool_call") {
    const tool = ev.tool as string;
    const args = JSON.stringify(ev.args || {}).slice(0, 140);
    summary = `tool_call · ${tool}  ${args}`;
  } else if (ev.type === "mcp_screenshot") {
    summary = `screenshot · ${(ev as unknown as McpScreenshotEvent).label || ""}`;
  } else if (ev.type === "mcp_result") {
    const r = ev as unknown as McpResultEvent;
    summary = `mcp_result · ${r.brand} — "${(r.title || "").slice(0, 60)}"`;
  } else if (ev.type === "stage_start") {
    summary = `▶ stage_start · ${ev.stage}`;
  } else if (ev.type === "stage_done") {
    summary = `✓ stage_done · ${ev.stage}`;
  } else if (ev.type === "run_start") {
    summary = `▶ run_start · ${ev.business_name}`;
  } else if (ev.type === "run_done") {
    summary = `✓ run_done`;
  } else if (ev.type === "run_error") {
    summary = `✗ run_error · ${ev.error}`;
  } else {
    summary = `${ev.type}  ${JSON.stringify(ev).slice(0, 160)}`;
  }

  return (
    <div className={`${color} truncate`}>
      <span className="text-white/30">{ts}</span> {summary}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/40 bg-rose-400/5 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-rose-300">Pipeline error</div>
        <div className="text-xs text-white/70 mt-1 font-mono">{message}</div>
      </div>
    </div>
  );
}

function SummaryHero({
  brief,
  research,
  strategy,
  creative,
  markdown,
  pagesBrowsed,
}: {
  brief: BusinessInput;
  research: ResearchData | null;
  strategy: StrategyData | null;
  creative: CreativeData | null;
  markdown: string | null;
  pagesBrowsed: number;
}) {
  const totalBudget = strategy?.budget_allocation.reduce((a, b) => a + b.monthly_inr, 0) || 0;

  const downloadMd = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.business_name.toLowerCase().replace(/\s+/g, "-")}-v2-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-violet-500/5 to-cyan-400/5 p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[10px] uppercase tracking-wider text-emerald-300 mb-2">
              <CheckCircle2 className="w-3 h-3" /> Pipeline complete
            </div>
            <h2 className="text-2xl font-bold">{brief.business_name} — ad strategy</h2>
            <p className="text-sm text-white/60 mt-1">
              {brief.industry} · {brief.geography} · ₹{brief.monthly_ad_budget_inr.toLocaleString("en-IN")}/mo target
            </p>
          </div>
          {markdown && (
            <button
              onClick={downloadMd}
              className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-400 text-black text-xs font-semibold hover:opacity-90 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download report
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <Stat
            Icon={Globe}
            label="Pages browsed"
            value={String(pagesBrowsed)}
            accent="violet"
          />
          <Stat
            Icon={Search}
            label="Competitors"
            value={String(research?.competitors_analyzed.length ?? 0)}
            accent="amber"
          />
          <Stat
            Icon={Users}
            label="Audience segments"
            value={String(strategy?.audience_segments.length ?? 0)}
            accent="cyan"
          />
          <Stat
            Icon={IndianRupee}
            label="Budget allocated"
            value={`₹${(totalBudget / 1000).toFixed(0)}K`}
            accent="emerald"
          />
          <Stat
            Icon={Palette}
            label="Creative variants"
            value={String(creative?.variants.length ?? 0)}
            accent="pink"
          />
        </div>

        {strategy?.executive_summary && (
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Executive summary
            </div>
            <p className="text-sm text-white/85 leading-relaxed">{strategy.executive_summary}</p>
          </div>
        )}

        {research?.gaps_and_opportunities && research.gaps_and_opportunities.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Top gaps to win
            </div>
            <ul className="space-y-1.5">
              {research.gaps_and_opportunities.slice(0, 3).map((g, i) => (
                <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">→</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: typeof Globe;
  label: string;
  value: string;
  accent: "violet" | "amber" | "cyan" | "emerald" | "pink";
}) {
  const colorMap = {
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    cyan: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    pink: "text-pink-300 bg-pink-500/10 border-pink-500/20",
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[accent]}`}>
      <Icon className="w-4 h-4 mb-2 opacity-80" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

function Dropdown({
  title,
  icon,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition"
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronRight className="w-4 h-4 text-white/50" />
        </motion.div>
        {icon}
        <span className="text-sm font-semibold flex-1 text-left">{title}</span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {badge}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function McpResultsGrid({ results }: { results: McpResultEvent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {results.map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-lg border border-white/10 bg-black/40 p-3 hover:border-violet-400/40 transition"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                r.role === "client"
                  ? "bg-violet-500/20 text-violet-300"
                  : "bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {r.role}
            </span>
            <span className="text-xs font-semibold truncate">{r.brand}</span>
          </div>
          <div className="text-sm font-medium truncate">{r.title}</div>
          <div className="text-xs text-white/60 mt-1 line-clamp-2">{r.description}</div>
          {r.prices_inr && r.prices_inr.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {r.prices_inr.slice(0, 4).map((p, j) => (
                <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                  {p}
                </span>
              ))}
            </div>
          )}
          <div className="text-[10px] text-cyan-300 mt-2 truncate flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> {r.url}
          </div>
        </a>
      ))}
    </div>
  );
}

function ResearchPanel({ data }: { data: ResearchData }) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Card label="Market summary">{data.market_summary}</Card>
          {data.client_brand_presence && (
            <Card label="Client brand presence">{data.client_brand_presence}</Card>
          )}
          <Card label={`Gaps & opportunities (${data.gaps_and_opportunities.length})`}>
            <ul className="space-y-1">
              {data.gaps_and_opportunities.map((g, i) => (
                <li key={i} className="text-sm text-white/80">• {g}</li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-3">
          <Card label={`Pricing signals (${data.pricing_signals.length})`}>
            <div className="flex flex-wrap gap-1">
              {data.pricing_signals.map((p, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-300">
                  {p}
                </span>
              ))}
            </div>
          </Card>
          <Card label="Common positioning themes">
            <ul className="space-y-1">
              {data.common_positioning_themes.map((t, i) => (
                <li key={i} className="text-sm text-white/80">• {t}</li>
              ))}
            </ul>
          </Card>
          {data.hero_product_deep_dive && (
            <Card label="Hero product deep-dive">
              <div className="text-sm font-semibold">{data.hero_product_deep_dive.product_name}</div>
              <div className="text-xs text-white/60 mt-1">{data.hero_product_deep_dive.why_it_matters}</div>
              <div className="mt-2 text-xs">
                <span className="text-white/50">Price:</span>{" "}
                <span className="text-emerald-300">{data.hero_product_deep_dive.price_inr}</span>
              </div>
              <div className="mt-1 text-xs">
                <span className="text-white/50">Best angle:</span>{" "}
                <span className="text-white/80">{data.hero_product_deep_dive.best_selling_angle}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {data.competitor_channel_mix.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Competitor channel mix</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.competitor_channel_mix.map((cm, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="text-sm font-semibold">{cm.competitor}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cm.channels_observed.map((ch, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                      {ch}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-xs text-white/60">Targets: {cm.primary_targets.join(", ")}</div>
                {cm.notes && <div className="mt-1 text-xs text-white/50 italic">{cm.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyPanel({ data }: { data: StrategyData }) {
  const totalBudget = data.budget_allocation.reduce((a, b) => a + b.monthly_inr, 0);
  return (
    <div>
      <Card label="Executive summary">{data.executive_summary}</Card>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
            Budget allocation (₹{totalBudget.toLocaleString("en-IN")}/mo)
          </div>
          <div className="space-y-2">
            {data.budget_allocation.map((b, i) => {
              const pct = totalBudget ? (b.monthly_inr / totalBudget) * 100 : 0;
              return (
                <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize">{b.platform.replace("_", " ")}</span>
                    <span className="text-sm text-emerald-300">₹{b.monthly_inr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-400 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-1.5">{b.rationale}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <Card label={`Audience segments (${data.audience_segments.length})`}>
            <div className="space-y-2">
              {data.audience_segments.map((s, i) => (
                <div key={i} className="rounded-md border border-white/10 bg-white/[0.02] p-2">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.description}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.platforms.map((p, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card label="Funnel stages">
            <ul className="space-y-1">
              {data.funnel_stages.map((s, i) => (
                <li key={i} className="text-sm text-white/80">• {s}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card label="Recommended KPIs">
          <ul className="space-y-1">
            {data.recommended_kpis.map((k, i) => (
              <li key={i} className="text-sm text-emerald-300">• {k}</li>
            ))}
          </ul>
        </Card>
        <Card label="Do not do">
          <ul className="space-y-1">
            {data.do_not_do.map((k, i) => (
              <li key={i} className="text-sm text-rose-300">× {k}</li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-4">
        <Card label="First 30 days plan">
          <ul className="space-y-1">
            {data.first_30_days_plan.map((w, i) => (
              <li key={i} className="text-sm text-white/80">• {w}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function CreativePanel({ data }: { data: CreativeData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.variants.map((v) => (
        <div key={v.variant_id} className="rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-white/50">#{v.variant_id} · {v.platform}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300">{v.angle}</span>
          </div>
          <div className="text-sm font-bold">{v.headline}</div>
          <div className="text-xs text-white/70 mt-1.5">{v.primary_text}</div>
          <div className="mt-2 text-[10px] text-white/50 italic">&ldquo;{v.image_concept}&rdquo;</div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-white/50 truncate">{v.audience_segment_name}</span>
            <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 font-semibold">{v.cta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinalReportPanel({ markdown, businessName }: { markdown: string; businessName: string }) {
  const downloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName.toLowerCase().replace(/\s+/g, "-")}-v2-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-white/60">{markdown.length.toLocaleString()} chars · rendered markdown</div>
        <button
          onClick={downloadMd}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" /> Download .md
        </button>
      </div>
      <pre className="max-h-[480px] overflow-auto text-xs text-white/80 whitespace-pre-wrap font-mono bg-black/60 border border-white/10 rounded-lg p-4">
        {markdown}
      </pre>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1.5">{label}</div>
      <div className="text-sm text-white/80">{children}</div>
    </div>
  );
}

function RunsListV2({
  runs,
  currentRunId,
  onRefresh,
  onSelect,
}: {
  runs: RunListItemV2[];
  currentRunId: string | null;
  onRefresh: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
          <Activity className="w-3.5 h-3.5" /> past runs
          <span className="text-white/30 font-mono normal-case tracking-normal">
            ({runs.length})
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-white/40 hover:text-white transition"
          title="Refresh"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="text-xs text-white/30 py-2">no runs yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
          {runs.map((r) => {
            const active = r.run_id === currentRunId;
            const dot =
              r.status === "running"
                ? "bg-amber-400 animate-pulse"
                : r.status === "done"
                ? "bg-emerald-400"
                : r.status === "error"
                ? "bg-red-400"
                : "bg-white/30";
            return (
              <button
                key={r.run_id}
                onClick={() => onSelect(r.run_id)}
                className={`text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition ${
                  active
                    ? "border-white/25 bg-white/[0.05]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <div className="text-sm text-white/85 truncate">
                      {r.business_name}
                    </div>
                    {r.has_report && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-300/80 shrink-0" />
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-white/40 mt-0.5 truncate">
                    {r.run_id} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/40 shrink-0">
                  {r.event_count}ev
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Target,
  Palette,
  Wrench,
  Terminal as TerminalIcon,
  Copy,
  RefreshCw,
  History,
  Sparkles,
  Download,
  FileText,
  Braces,
} from "lucide-react";
import { createRun, listRuns, openRunSocket, type RunListItem } from "@/lib/api";
import type {
  AgentEvent,
  BusinessInput,
  CreativeData,
  ResearchData,
  StrategyData,
} from "@/lib/types";

type StageName = "research" | "strategy" | "creative";

type StageState = {
  status: "idle" | "running" | "done" | "error";
  toolCalls: number;
  iterations: number;
  data?: ResearchData | StrategyData | CreativeData;
};

const defaultBrief: BusinessInput = {
  business_name: "Arctic Fox",
  website: "https://arcticfox.in",
  industry: "D2C backpacks & bags",
  product_description:
    "Modern-design backpacks, laptop bags and lifestyle accessories for Gen Z + young professionals.",
  target_audience:
    "Gen Z + young professionals (18-32), urban India, design-conscious, daily commuters and weekend travelers",
  unique_selling_points: [
    "Distinctive modern design & pop colours",
    "Functional premium features at D2C price",
    "Strong Instagram-first brand",
  ],
  monthly_ad_budget_inr: 800000,
  primary_goal: "sales",
  competitor_names: [
    "Wildcraft",
    "American Tourister",
    "Skybags",
    "Mokobara",
    "Uppercase",
  ],
  geography: "India",
  focus_product: "Latest flagship backpack launch 2026",
};

export default function DashboardPage() {
  const [brief, setBrief] = useState<BusinessInput>(defaultBrief);
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [stages, setStages] = useState<Record<StageName, StageState>>({
    research: { status: "idle", toolCalls: 0, iterations: 0 },
    strategy: { status: "idle", toolCalls: 0, iterations: 0 },
    creative: { status: "idle", toolCalls: 0, iterations: 0 },
  });
  const [runStatus, setRunStatus] = useState<
    "idle" | "submitting" | "running" | "done" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allRuns, setAllRuns] = useState<RunListItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  async function refreshRuns() {
    try {
      const runs = await listRuns();
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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  function resetRun() {
    wsRef.current?.close();
    wsRef.current = null;
    setEvents([]);
    setStages({
      research: { status: "idle", toolCalls: 0, iterations: 0 },
      strategy: { status: "idle", toolCalls: 0, iterations: 0 },
      creative: { status: "idle", toolCalls: 0, iterations: 0 },
    });
    setRunId(null);
    setSubmitError(null);
  }

  async function onSubmit() {
    resetRun();
    setRunStatus("submitting");
    try {
      const { run_id } = await createRun(brief);
      setRunId(run_id);
      setRunStatus("running");
      connect(run_id);
    } catch (e) {
      setRunStatus("error");
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  }

  function connect(id: string) {
    const ws = openRunSocket(id);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      const event = JSON.parse(ev.data) as AgentEvent;
      setEvents((prev) => [...prev, event]);
      applyEvent(event);
    };
    ws.onerror = () => {
      setRunStatus("error");
      setSubmitError("WebSocket error");
    };
  }

  function applyEvent(event: AgentEvent) {
    const agent = event.agent as StageName | undefined;
    setStages((prev) => {
      const next = { ...prev };
      if (agent && next[agent]) {
        const s = { ...next[agent] };
        if (event.type === "iter_start" || event.type === "iter_done") {
          if (event.type === "iter_done") s.iterations += 1;
          s.status = "running";
        }
        if (event.type === "tool_call") s.toolCalls += 1;
        next[agent] = s;
      }
      if (event.type === "stage_start") {
        const stage = event.stage as StageName;
        if (next[stage]) next[stage] = { ...next[stage], status: "running" };
      }
      if (event.type === "stage_done") {
        const stage = event.stage as StageName;
        if (next[stage])
          next[stage] = {
            ...next[stage],
            status: "done",
            data: event.data as StageState["data"],
          };
      }
      return next;
    });
    if (event.type === "run_done") setRunStatus("done");
    if (event.type === "run_error") setRunStatus("error");
  }

  const canSubmit =
    runStatus === "idle" || runStatus === "done" || runStatus === "error";

  return (
    <div className="min-h-screen bg-obsidian text-white font-sans">
      <div className="fixed inset-0 grid-bg-fine opacity-40 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/[0.02] blur-3xl rounded-full animate-float" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-10">
        <Header runId={runId} status={runStatus} />

        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 mt-8">
          <div className="flex flex-col gap-6 min-w-0">
            <BriefForm
              brief={brief}
              setBrief={setBrief}
              onSubmit={onSubmit}
              canSubmit={canSubmit}
              submitting={runStatus === "submitting"}
              error={submitError}
            />
            <RunsList
              runs={allRuns}
              currentRunId={runId}
              onRefresh={refreshRuns}
              onSelect={(id) => {
                resetRun();
                setRunId(id);
                setRunStatus("running");
                connect(id);
              }}
            />
          </div>

          <div className="flex flex-col gap-6 min-w-0">
            <StageStrip stages={stages} />
            {runStatus === "done" && (
              <ResultSummary
                runId={runId}
                brief={brief}
                research={stages.research.data as ResearchData | undefined}
                strategy={stages.strategy.data as StrategyData | undefined}
                creatives={stages.creative.data as CreativeData | undefined}
              />
            )}
            <Terminal events={events} bottomRef={terminalEndRef} />
            <StagePanels stages={stages} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({
  runId,
  status,
}: {
  runId: string | null;
  status: string;
}) {
  const pill =
    status === "running" ? (
      <span className="flex items-center gap-1.5 text-xs text-cyan-300">
        <Loader2 className="w-3 h-3 animate-spin" /> running
      </span>
    ) : status === "done" ? (
      <span className="flex items-center gap-1.5 text-xs text-emerald-300">
        <CheckCircle2 className="w-3 h-3" /> done
      </span>
    ) : status === "error" ? (
      <span className="flex items-center gap-1.5 text-xs text-rose-300">
        <AlertTriangle className="w-3 h-3" /> error
      </span>
    ) : (
      <span className="text-xs text-white/40">idle</span>
    );

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="min-w-0">
        <div className="text-xs tracking-[0.3em] text-white/40 uppercase">
          AdForge AI
        </div>
        <h1 className="text-3xl font-semibold mt-1">
          Live agent <span className="text-white/40">dashboard</span>
        </h1>
      </div>
      <div className="flex items-center gap-3 glass px-4 py-2 rounded-full text-sm text-white/60 max-w-full">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 shrink-0">
          run
        </span>
        <span className="font-mono text-white/80 text-xs select-all truncate">
          {runId ?? "—"}
        </span>
        {runId && (
          <button
            onClick={() => navigator.clipboard?.writeText(runId)}
            className="text-white/40 hover:text-white transition shrink-0"
            title="Copy run id"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="w-px h-4 bg-white/10 shrink-0" />
        <span className="shrink-0">{pill}</span>
      </div>
    </div>
  );
}

function BriefForm({
  brief,
  setBrief,
  onSubmit,
  canSubmit,
  submitting,
  error,
}: {
  brief: BusinessInput;
  setBrief: (b: BusinessInput) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
}) {
  function update<K extends keyof BusinessInput>(key: K, value: BusinessInput[K]) {
    setBrief({ ...brief, [key]: value });
  }
  function updateList(key: "unique_selling_points" | "competitor_names", value: string) {
    setBrief({
      ...brief,
      [key]: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="glass-card rounded-2xl p-5 h-fit">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40 mb-4">
        <Wrench className="w-3.5 h-3.5" /> brief
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Business name">
          <input
            className={inputCls}
            value={brief.business_name}
            onChange={(e) => update("business_name", e.target.value)}
          />
        </Field>
        <Field label="Website">
          <input
            className={inputCls}
            value={brief.website ?? ""}
            onChange={(e) => update("website", e.target.value)}
          />
        </Field>
        <Field label="Industry">
          <input
            className={inputCls}
            value={brief.industry}
            onChange={(e) => update("industry", e.target.value)}
          />
        </Field>
        <Field label="Product description">
          <textarea
            className={`${inputCls} min-h-[70px] resize-none`}
            value={brief.product_description}
            onChange={(e) => update("product_description", e.target.value)}
          />
        </Field>
        <Field label="Target audience">
          <textarea
            className={`${inputCls} min-h-[60px] resize-none`}
            value={brief.target_audience}
            onChange={(e) => update("target_audience", e.target.value)}
          />
        </Field>
        <Field label="USPs (comma separated)">
          <input
            className={inputCls}
            value={brief.unique_selling_points.join(", ")}
            onChange={(e) => updateList("unique_selling_points", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (INR/mo)">
            <input
              className={inputCls}
              type="number"
              value={brief.monthly_ad_budget_inr}
              onChange={(e) =>
                update("monthly_ad_budget_inr", Number(e.target.value))
              }
            />
          </Field>
          <Field label="Goal">
            <select
              className={inputCls}
              value={brief.primary_goal}
              onChange={(e) =>
                update("primary_goal", e.target.value as BusinessInput["primary_goal"])
              }
            >
              <option value="awareness">awareness</option>
              <option value="traffic">traffic</option>
              <option value="leads">leads</option>
              <option value="sales">sales</option>
              <option value="app_installs">app_installs</option>
            </select>
          </Field>
        </div>
        <Field label="Competitors (comma separated)">
          <input
            className={inputCls}
            value={brief.competitor_names.join(", ")}
            onChange={(e) => updateList("competitor_names", e.target.value)}
          />
        </Field>
        <Field label="Geography">
          <input
            className={inputCls}
            value={brief.geography}
            onChange={(e) => update("geography", e.target.value)}
          />
        </Field>
        <Field label="Focus product (optional)">
          <input
            className={inputCls}
            value={brief.focus_product ?? ""}
            onChange={(e) => update("focus_product", e.target.value)}
          />
        </Field>
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Starting…
          </>
        ) : (
          <>
            <Play className="w-4 h-4" /> Run agents
          </>
        )}
      </button>
      {error && (
        <div className="mt-3 text-xs text-rose-300/80 font-mono break-all">
          {error}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full min-w-0 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.15em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function StageStrip({ stages }: { stages: Record<StageName, StageState> }) {
  const items: { key: StageName; label: string; icon: React.ElementType }[] = [
    { key: "research", label: "Research", icon: Search },
    { key: "strategy", label: "Strategy", icon: Target },
    { key: "creative", label: "Creative", icon: Palette },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ key, label, icon: Icon }) => {
        const s = stages[key];
        const ring =
          s.status === "running"
            ? "border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.08)]"
            : s.status === "done"
            ? "border-emerald-400/30"
            : s.status === "error"
            ? "border-rose-400/40"
            : "border-white/10";
        return (
          <div
            key={key}
            className={`glass-card rounded-xl p-4 border ${ring} transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <StatusDot status={s.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/50">
              <div>
                iters <span className="text-white/80 font-mono">{s.iterations}</span>
              </div>
              <div>
                tools <span className="text-white/80 font-mono">{s.toolCalls}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: StageState["status"] }) {
  if (status === "running")
    return (
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75" />
        <span className="relative w-2 h-2 rounded-full bg-cyan-400" />
      </span>
    );
  if (status === "done")
    return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
  if (status === "error")
    return <span className="w-2 h-2 rounded-full bg-rose-400" />;
  return <span className="w-2 h-2 rounded-full bg-white/20" />;
}

function Terminal({
  events,
  bottomRef,
}: {
  events: AgentEvent[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <TerminalIcon className="w-3.5 h-3.5" /> agent_stream
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
      </div>
      <div className="h-[320px] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-[1.7]">
        {events.length === 0 ? (
          <div className="text-white/30">
            waiting for run… submit a brief to start streaming.
          </div>
        ) : (
          events.map((e, i) => <EventLine key={i} event={e} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function EventLine({ event }: { event: AgentEvent }) {
  const agent = (event.agent as string | undefined) ?? "sys";
  const color =
    event.type === "run_error" || event.type === "retry"
      ? "text-rose-300"
      : event.type === "stage_done" || event.type === "run_done"
      ? "text-emerald-300"
      : event.type === "tool_call"
      ? "text-cyan-300"
      : event.type === "tool_result"
      ? "text-white/70"
      : event.type === "stage_start" || event.type === "run_start"
      ? "text-violet-300"
      : "text-white/50";

  const tag = `[${agent}]`.padEnd(11, " ");

  let text = "";
  switch (event.type) {
    case "run_start":
      text = `run_start — ${String(event.business_name ?? "")}`;
      break;
    case "stage_start":
      text = `▸ stage_start: ${event.stage}`;
      break;
    case "stage_done": {
      const s = event.summary as Record<string, unknown> | undefined;
      text = `✓ stage_done: ${event.stage} — ${
        s ? Object.entries(s).map(([k, v]) => `${k}=${v}`).join(", ") : ""
      }`;
      break;
    }
    case "iter_start":
      text = `· iter ${event.iter} start`;
      break;
    case "iter_done":
      text = `· iter ${event.iter} done — ${event.finish_reason ?? ""}`;
      break;
    case "tool_call": {
      const args = event.args as Record<string, unknown> | undefined;
      const preview = args ? JSON.stringify(args).slice(0, 100) : "";
      text = `→ tool: ${event.tool}(${preview})`;
      break;
    }
    case "tool_result":
      text = `  ↳ ${event.summary ?? ""}`;
      break;
    case "retry":
      text = `retry #${event.attempt} in ${event.delay_seconds}s — ${event.reason}`;
      break;
    case "run_done":
      text = `✓ run_done`;
      break;
    case "run_error":
      text = `✗ run_error: ${event.error}`;
      break;
    case "agent_start":
      text = `agent_start — model=${event.model}`;
      break;
    case "agent_raw_output":
      text = `agent_raw_output — length=${event.length}`;
      break;
    default:
      text = event.type;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={`${color} whitespace-pre-wrap break-words`}
    >
      <span className="text-white/25">{tag}</span> {text}
    </motion.div>
  );
}

function StagePanels({ stages }: { stages: Record<StageName, StageState> }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <AnimatePresence>
        {stages.research.data && (
          <ResearchPanel key="research" data={stages.research.data as ResearchData} />
        )}
        {stages.strategy.data && (
          <StrategyPanel key="strategy" data={stages.strategy.data as StrategyData} />
        )}
        {stages.creative.data && (
          <CreativePanel key="creative" data={stages.creative.data as CreativeData} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-white/70" />
        <h3 className="text-sm uppercase tracking-[0.2em] text-white/60">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ResearchPanel({ data }: { data: ResearchData }) {
  return (
    <Panel title="Research" icon={Search}>
      <p className="text-sm text-white/80 leading-relaxed">{data.market_summary}</p>

      {data.hero_product_deep_dive && (
        <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Hero product
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 flex-wrap">
            <div className="text-lg font-medium">
              {data.hero_product_deep_dive.product_name}
            </div>
            <div className="font-mono text-sm text-cyan-300">
              {data.hero_product_deep_dive.price_inr}
            </div>
          </div>
          <div className="text-sm text-white/70 mt-2">
            {data.hero_product_deep_dive.why_it_matters}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.hero_product_deep_dive.key_features.map((f, i) => (
              <Chip key={i}>{f}</Chip>
            ))}
          </div>
        </div>
      )}

      <Section title="Gaps & opportunities">
        <ul className="text-sm text-white/75 space-y-1.5">
          {data.gaps_and_opportunities.map((g, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-300/70 mt-1">▸</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Section>

      {data.competitor_channel_mix.length > 0 && (
        <Section title="Competitor channel mix">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.competitor_channel_mix.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-white/10 bg-white/[0.02]"
              >
                <div className="text-sm font-medium">{c.competitor}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.channels_observed.map((ch, j) => (
                    <Chip key={j}>{ch}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.pricing_signals.length > 0 && (
        <Section title="Pricing signals">
          <div className="flex flex-wrap gap-1.5">
            {data.pricing_signals.map((p, i) => (
              <Chip key={i}>{p}</Chip>
            ))}
          </div>
        </Section>
      )}
    </Panel>
  );
}

function StrategyPanel({ data }: { data: StrategyData }) {
  const total = data.budget_allocation.reduce((a, b) => a + b.monthly_inr, 0);
  return (
    <Panel title="Strategy" icon={Target}>
      <p className="text-sm text-white/80 leading-relaxed">{data.executive_summary}</p>

      <Section title="Budget allocation">
        <div className="space-y-2">
          {data.budget_allocation.map((b, i) => {
            const pct = total ? (b.monthly_inr / total) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{b.platform}</span>
                  <span className="font-mono text-white/70">
                    ₹{b.monthly_inr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400/60 to-violet-400/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-white/50 mt-1">{b.rationale}</div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Audience segments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.audience_segments.map((s, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-white/10 bg-white/[0.02]"
            >
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-white/60 mt-1">{s.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {s.platforms.map((p, j) => (
                  <Chip key={j}>{p}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="First 30 days">
          <ol className="text-sm text-white/75 space-y-1.5 list-decimal list-inside">
            {data.first_30_days_plan.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Section>
        <Section title="Do NOT do">
          <ul className="text-sm text-white/75 space-y-1.5">
            {data.do_not_do.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-rose-300/70 mt-1">✗</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Panel>
  );
}

function CreativePanel({ data }: { data: CreativeData }) {
  return (
    <Panel title="Creative" icon={Palette}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.variants.map((v) => (
          <div
            key={v.variant_id}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip>{v.platform}</Chip>
                <Chip>{v.angle}</Chip>
              </div>
              <span className="font-mono text-[11px] text-white/40">
                #{v.variant_id}
              </span>
            </div>
            <div className="text-base font-medium mt-3">{v.headline}</div>
            <div className="text-sm text-white/70 mt-1">{v.primary_text}</div>
            <div className="text-xs text-white/40 mt-3">
              <span className="text-white/55">CTA:</span> {v.cta} ·{" "}
              <span className="text-white/55">for:</span> {v.audience_segment_name}
            </div>
            <div className="text-xs text-white/50 mt-2 italic">
              {v.image_concept}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-[11px] rounded-full border border-white/10 bg-white/[0.03] text-white/70 break-words max-w-full">
      {children}
    </span>
  );
}

function ResultSummary({
  runId,
  brief,
  research,
  strategy,
  creatives,
}: {
  runId: string | null;
  brief: BusinessInput;
  research?: ResearchData;
  strategy?: StrategyData;
  creatives?: CreativeData;
}) {
  const [downloading, setDownloading] = useState<"md" | "json" | null>(null);

  const totalBudget = strategy?.budget_allocation.reduce(
    (a, b) => a + b.monthly_inr,
    0
  ) ?? 0;

  async function download(kind: "md" | "json") {
    if (!runId) return;
    setDownloading(kind);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"}/api/runs/${runId}`
      );
      const data = await res.json();
      const slug = brief.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      if (kind === "md") {
        const blob = new Blob([data.final_markdown ?? ""], {
          type: "text/markdown;charset=utf-8",
        });
        triggerDownload(blob, `${slug}_strategy.md`);
      } else {
        const blob = new Blob([JSON.stringify(data.final_report, null, 2)], {
          type: "application/json",
        });
        triggerDownload(blob, `${slug}_strategy.json`);
      }
    } finally {
      setDownloading(null);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "competitors", value: research?.competitors_analyzed.length ?? 0 },
    { label: "gaps found", value: research?.gaps_and_opportunities.length ?? 0 },
    { label: "segments", value: strategy?.audience_segments.length ?? 0 },
    { label: "platforms", value: strategy?.budget_allocation.length ?? 0 },
    { label: "creatives", value: creatives?.variants.length ?? 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative glass-card rounded-2xl p-6 overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-400/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-400/10 border border-emerald-300/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">
                campaign plan ready
              </div>
              <h2 className="text-xl font-semibold mt-0.5">
                AI ne {brief.business_name} ke liye strategy build kar di
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => download("md")}
              disabled={downloading !== null}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition disabled:opacity-50"
            >
              {downloading === "md" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Markdown
            </button>
            <button
              onClick={() => download("json")}
              disabled={downloading !== null}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition disabled:opacity-50"
            >
              {downloading === "json" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Braces className="w-3.5 h-3.5" />
              )}
              JSON
            </button>
          </div>
        </div>

        {strategy?.executive_summary && (
          <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">
              TL;DR — strategy
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              {strategy.executive_summary}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center"
            >
              <div className="text-2xl font-semibold text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {totalBudget > 0 && (
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-xs text-white/60">
            <div>
              <span className="text-white/40">monthly budget allocated: </span>
              <span className="font-mono text-white">
                ₹{totalBudget.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/40">
              <Download className="w-3 h-3" /> scroll down for full breakdown
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RunsList({
  runs,
  currentRunId,
  onRefresh,
  onSelect,
}: {
  runs: RunListItem[];
  currentRunId: string | null;
  onRefresh: () => void;
  onSelect: (id: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(id: string) {
    navigator.clipboard?.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
          <History className="w-3.5 h-3.5" /> runs
          <span className="text-white/30 font-mono normal-case tracking-normal">
            ({runs.length})
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-white/40 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="text-xs text-white/30 py-2">no runs yet</div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
          {runs.map((r) => {
            const active = r.run_id === currentRunId;
            return (
              <div
                key={r.run_id}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
                  active
                    ? "border-white/25 bg-white/[0.05]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
                onClick={() => onSelect(r.run_id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot
                      status={
                        r.status === "running"
                          ? "running"
                          : r.status === "done"
                          ? "done"
                          : r.status === "error"
                          ? "error"
                          : "idle"
                      }
                    />
                    <div className="text-sm text-white/85 truncate">
                      {r.business_name}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/40 mt-0.5 truncate">
                    {r.run_id}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-white/40">
                    {r.event_count}ev
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(r.run_id);
                    }}
                    className="text-white/30 hover:text-white transition p-1"
                    title="Copy id"
                  >
                    {copied === r.run_id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

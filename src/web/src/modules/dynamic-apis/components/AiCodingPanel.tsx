import { code as codePlugin } from "@streamdown/code";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Code2,
  Globe,
  Loader2,
  Pen,
  Play,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, client } from "src/lib/client";
import type { LlmProviderItem } from "src/lib/types";

// ── Auto-resize textarea hook ─────────────────────────────────────────────────

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);
  return ref;
}

// ── Elapsed timer hook ────────────────────────────────────────────────────────

function useElapsedTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    startRef.current = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (elapsed < 60) return `${elapsed}s`;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentEvent {
  type: "thinking" | "tool_call" | "tool_result" | "text" | "text_delta" | "code" | "done" | "error";
  message?: string;
  code?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  duration?: number;
  receivedAt?: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  events?: AgentEvent[];
  code?: string;
  cancelled?: boolean;
}

interface AiCodingPanelProps {
  apiId: string;
  method: string;
  path: string;
  currentCode: string;
  onApplyCode: (code: string, isFinal?: boolean) => void;
}

// ── Timeline step types ───────────────────────────────────────────────────────

type TimelineStep =
  | { kind: "thinking"; message: string }
  | { kind: "code"; chars: number }
  | { kind: "tool"; name: string; args?: Record<string, unknown>; result?: unknown; running: boolean; durationMs?: number }
  | { kind: "text"; message: string }
  | { kind: "error"; message: string };

function eventsToTimeline(events: AgentEvent[], isLive = false): TimelineStep[] {
  const steps: TimelineStep[] = [];
  let i = 0;

  while (i < events.length) {
    const ev = events[i];

    if (ev.type === "thinking" && ev.message) {
      let msg = ev.message;
      let j = i + 1;
      while (j < events.length && events[j].type === "thinking") {
        msg = events[j].message || msg;
        j++;
      }
      if (j >= events.length && isLive) {
        steps.push({ kind: "thinking", message: msg });
      }
      i = j;
    } else if (ev.type === "code" && ev.code) {
      steps.push({ kind: "code", chars: ev.code.length });
      i++;
    } else if (ev.type === "tool_call") {
      // Collect any code events between tool_call and tool_result
      // so they appear as separate "code generated" steps in the timeline
      let j = i + 1;
      while (j < events.length && events[j].type !== "tool_result" && events[j].type !== "tool_call") {
        if (events[j].type === "code" && events[j].code) {
          steps.push({ kind: "code", chars: events[j].code!.length });
        }
        j++;
      }
      const resultEvent = events[j];
      const hasResult = resultEvent?.type === "tool_result";
      const durationMs = hasResult && ev.receivedAt && resultEvent.receivedAt ? resultEvent.receivedAt - ev.receivedAt : undefined;
      steps.push({
        kind: "tool",
        name: ev.toolName || "tool",
        args: ev.toolArgs,
        result: hasResult ? resultEvent.toolResult : undefined,
        running: isLive && !hasResult,
        durationMs,
      });
      i = hasResult ? j + 1 : j;
    } else if (ev.type === "tool_result") {
      i++;
    } else if (ev.type === "text_delta") {
      // Accumulate consecutive text_delta events into a single streaming text block
      let accumulated = ev.message || "";
      let j = i + 1;
      while (j < events.length && events[j].type === "text_delta") {
        accumulated += events[j].message || "";
        j++;
      }
      // Check if followed by a "text" end-marker
      const hasEnd = j < events.length && events[j].type === "text";
      // Strip markdown code blocks — they are shown separately via "code" events
      const stripped = accumulated.replace(/```(?:javascript|js|typescript|ts)?\n[\s\S]*?```/g, "").trim();
      if (stripped) {
        steps.push({ kind: "text", message: stripped });
      }
      i = hasEnd ? j + 1 : j;
    } else if (ev.type === "text" && ev.message) {
      steps.push({ kind: "text", message: ev.message });
      i++;
    } else if (ev.type === "text") {
      // Empty text event = end-of-stream marker, skip
      i++;
    } else if (ev.type === "error" && ev.message) {
      steps.push({ kind: "error", message: ev.message });
      i++;
    } else {
      i++;
    }
  }

  return steps;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOOL_LABEL: Record<string, string> = {
  write_code: "Write code",
  run_test: "Run test",
  fetch_web: "Fetch URL",
};

const TOOL_ICON: Record<string, typeof Pen> = {
  write_code: Pen,
  run_test: Play,
  fetch_web: Globe,
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function rawText(value: unknown, maxLen = 500): string {
  const s = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

// ── Step status icon ──────────────────────────────────────────────────────────

function StepStatusIcon({ status }: { status: "complete" | "active" | "pending" | "error" }) {
  if (status === "complete") {
    return (
      <div className="cot-status-icon cot-status-complete">
        <CircleCheck size={14} className="text-semantic-success" />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="cot-status-icon cot-status-active">
        <Loader2 size={14} className="text-amber-500 animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="cot-status-icon cot-status-error">
        <XCircle size={14} className="text-semantic-error" />
      </div>
    );
  }
  return (
    <div className="cot-status-icon cot-status-pending">
      <div className="w-[6px] h-[6px] rounded-full bg-muted-soft" />
    </div>
  );
}

// ── Tool detail (collapsible) ─────────────────────────────────────────────────

function TestResultDetail({ result }: { result: Record<string, unknown> }) {
  const status = result.status as number | undefined;
  const error = result.error as string | undefined;
  const body = result.body;
  const logs = result.consoleLogs as string[] | undefined;
  const execTime = result.executionTimeMs as number | undefined;

  return (
    <div className="space-y-1 mt-1">
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span className={status != null && status < 400 ? "text-semantic-success" : "text-semantic-error"}>Status {status ?? "?"}</span>
        {execTime != null && <span className="text-muted-soft">{formatDuration(execTime)}</span>}
      </div>
      {error && (
        <pre className="font-mono text-[11px] leading-[1.4] text-semantic-error whitespace-pre-wrap m-0 max-h-[100px] overflow-y-auto">
          {rawText(error, 300)}
        </pre>
      )}
      {body != null && !error && (
        <pre className="font-mono text-[11px] leading-[1.4] text-body whitespace-pre-wrap m-0 max-h-[100px] overflow-y-auto">{rawText(body, 300)}</pre>
      )}
      {logs && logs.length > 0 && (
        <div className="font-mono text-[11px] text-muted-soft">
          logs: {logs.slice(0, 3).join(" | ")}
          {logs.length > 3 ? ` (+${logs.length - 3} more)` : ""}
        </div>
      )}
    </div>
  );
}

function ToolDetail({ step }: { step: Extract<TimelineStep, { kind: "tool" }> }) {
  const [open, setOpen] = useState(false);

  const testStatus =
    step.name === "run_test" && !step.running && step.result != null
      ? (() => {
          const r = step.result as Record<string, unknown>;
          const status = r?.status as number | undefined;
          const hasError = !!r?.error;
          if (!hasError && status != null && status < 400) return "pass" as const;
          if (hasError || (status != null && status >= 400)) return "fail" as const;
          return null;
        })()
      : null;

  const argsSummary = (() => {
    const args = step.args;
    if (!args || Object.keys(args).length === 0) return null;
    if (step.name === "run_test") {
      // args.code may be a placeholder like "(1365 chars)" — extract the number
      if (typeof args.code === "string") {
        const match = args.code.match(/\((\d+)\s*chars\)/);
        const codeLen = match ? Number(match[1]) : args.code.length;
        return `code: ${codeLen} chars`;
      }
      return null;
    }
    if (step.name === "fetch_web") return (args.url as string) || "";
    if (step.name === "write_code") {
      const len = typeof args.code === "string" ? args.code.length : 0;
      return `${len} chars`;
    }
    return `${Object.keys(args).length} params`;
  })();

  const resultSummary = (() => {
    if (step.running || step.result == null) return null;
    if (step.name === "write_code") return "✓ saved";
    if (step.name === "run_test" && typeof step.result === "object") {
      const r = step.result as Record<string, unknown>;
      const status = r.status as number | undefined;
      return status != null ? `Status ${status}` : null;
    }
    return null;
  })();

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="cot-detail-toggle">
        <ChevronRight size={12} className={`text-muted-soft shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        {argsSummary && <span className="font-mono text-[11px] text-muted truncate">{argsSummary}</span>}
        {resultSummary && !step.running && (
          <>
            <span className="text-muted-soft text-[11px]">→</span>
            <span className={`font-mono text-[11px] ${testStatus === "fail" ? "text-semantic-error" : "text-semantic-success"}`}>{resultSummary}</span>
          </>
        )}
        {testStatus === "pass" && <span className="cot-badge cot-badge-pass">PASS</span>}
        {testStatus === "fail" && <span className="cot-badge cot-badge-fail">FAIL</span>}
      </button>

      <div className="cot-collapsible" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className="cot-detail-body">
            <div>
              <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider">Input</span>
              <pre className="font-mono text-[11px] leading-[1.4] text-body whitespace-pre-wrap m-0 mt-0.5 max-h-[140px] overflow-y-auto">
                {step.args ? rawText(step.args) : "—"}
              </pre>
            </div>
            {!step.running && step.result != null && (
              <div>
                <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider">Output</span>
                {step.name === "run_test" && typeof step.result === "object" ? (
                  <TestResultDetail result={step.result as Record<string, unknown>} />
                ) : (
                  <pre className="font-mono text-[11px] leading-[1.4] text-body whitespace-pre-wrap m-0 mt-0.5 max-h-[140px] overflow-y-auto">
                    {rawText(step.result)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CoT step ──────────────────────────────────────────────────────────────────

function CoTStep({ step, isLast, isLive }: { step: TimelineStep; isLast: boolean; isLive?: boolean }) {
  const getStepStatus = (): "complete" | "active" | "pending" | "error" => {
    if (step.kind === "error") return "error";
    if (step.kind === "thinking") return "active";
    if (step.kind === "tool" && step.running) return "active";
    return "complete";
  };

  const getIcon = () => {
    if (step.kind === "thinking") return Brain;
    if (step.kind === "code") return Code2;
    if (step.kind === "error") return XCircle;
    if (step.kind === "text") return Sparkles;
    if (step.kind === "tool") return TOOL_ICON[step.name] || Play;
    return Sparkles;
  };

  const getLabel = () => {
    if (step.kind === "thinking") return step.message;
    if (step.kind === "code") return `Code generated (${step.chars} chars)`;
    if (step.kind === "error") return step.message;
    if (step.kind === "tool") return TOOL_LABEL[step.name] || step.name;
    return null;
  };

  const status = getStepStatus();
  const Icon = getIcon();
  const label = getLabel();

  // Text steps — render Streamdown directly (no step chrome)
  if (step.kind === "text") {
    return (
      <div className="py-1 ai-streamdown cot-fade-in">
        <Streamdown className="ai-streamdown-content" plugins={{ code: codePlugin }} isAnimating={isLive}>
          {step.message}
        </Streamdown>
      </div>
    );
  }

  return (
    <div className="cot-step cot-fade-in">
      <div className="flex flex-col items-center shrink-0">
        <StepStatusIcon status={status} />
        {!isLast && <div className="cot-connector" />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="cot-step-header">
          <Icon size={13} className={`shrink-0 ${status === "active" ? "text-amber-500" : status === "error" ? "text-semantic-error" : "text-muted"}`} />
          <span
            className={`font-mono text-[12px] leading-[1.4] ${
              status === "error" ? "text-semantic-error" : status === "active" ? "text-body italic" : "text-body"
            }`}
          >
            {label}
          </span>
          {step.kind === "tool" && step.running && <span className="font-mono text-[11px] text-amber-500/80">Running…</span>}
          {step.kind === "tool" && !step.running && step.durationMs != null && (
            <span className="font-mono text-[11px] text-muted-soft">{formatDuration(step.durationMs)}</span>
          )}
        </div>
        {step.kind === "tool" && <ToolDetail step={step} />}
      </div>
    </div>
  );
}

// ── Chain of Thought (flat list) ──────────────────────────────────────────────

function ChainOfThought({
  events,
  isLive = false,
}: {
  events: AgentEvent[];
  isLive?: boolean;
  defaultOpen?: boolean;
}) {
  const steps = eventsToTimeline(events, isLive);
  const total = steps.length;

  if (total === 0 && !isLive) return null;

  if (total === 0 && isLive) {
    return (
      <div className="flex items-center gap-2.5 py-1.5">
        <div className="cot-status-icon cot-status-active">
          <Loader2 size={14} className="text-amber-500 animate-spin" />
        </div>
        <span className="font-mono text-[11px] text-muted-soft italic">Initializing…</span>
      </div>
    );
  }

  return (
    <div className="pt-1 pb-0.5 pl-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1 && !isLive;
        const key =
          step.kind === "thinking"
            ? `thinking-${i}`
            : step.kind === "code"
              ? `code-${i}`
              : step.kind === "tool"
                ? `tool-${step.name}-${i}`
                : step.kind === "text"
                  ? `text-${i}`
                  : `error-${i}`;
        return <CoTStep key={key} step={step} isLast={isLast} isLive={isLive} />;
      })}
      {isLive &&
        steps.length > 0 &&
        (() => {
          const last = steps[steps.length - 1];
          const needsTrailing = last.kind !== "thinking" && !(last.kind === "tool" && last.running) && last.kind !== "text";
          if (!needsTrailing) return null;
          return (
            <div className="cot-step cot-fade-in">
              <StepStatusIcon status="active" />
              <div className="cot-step-header">
                <Brain size={13} className="text-amber-500 shrink-0" />
                <span className="font-mono text-[11px] text-muted-soft italic">Thinking…</span>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ── Model Picker Popover (drill-down) ─────────────────────────────────────────

function ModelPickerPopover({
  providers,
  selectedProviderId,
  selectedModel,
  onSelect,
}: {
  providers: LlmProviderItem[];
  selectedProviderId: string;
  selectedModel: string;
  onSelect: (providerId: string, model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveProvider(null);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when entering model list
  useEffect(() => {
    if (activeProvider && searchRef.current) {
      searchRef.current.focus();
    }
  }, [activeProvider]);

  const currentProvider = providers.find((p) => p.id === selectedProviderId);
  const activeProviderData = providers.find((p) => p.id === activeProvider);
  const filteredModels = activeProviderData?.models.filter((m) => m.toLowerCase().includes(search.toLowerCase())) ?? [];

  const handleToggle = () => {
    setOpen(!open);
    if (open) {
      setActiveProvider(null);
      setSearch("");
    }
  };

  const handleSelectProvider = (pid: string) => {
    setActiveProvider(pid);
    setSearch("");
  };

  const handleBack = () => {
    setActiveProvider(null);
    setSearch("");
  };

  const handleSelectModel = (model: string) => {
    if (activeProvider) {
      onSelect(activeProvider, model);
    }
    setOpen(false);
    setActiveProvider(null);
    setSearch("");
  };

  // Display label
  const displayLabel = currentProvider ? `${currentProvider.name} / ${selectedModel || "—"}` : "Select model…";

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-hairline bg-surface-card hover:border-hairline-strong transition-colors cursor-pointer text-left min-w-0"
      >
        <Bot size={14} className="text-muted-soft shrink-0" />
        <span className="flex-1 min-w-0 font-mono text-[12px] text-ink truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`text-muted-soft shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-card border border-hairline rounded-lg shadow-[0_4px_24px_rgba(20,20,19,0.06)] overflow-hidden">
          {!activeProvider ? (
            /* Panel 1: Provider list */
            <div>
              <div className="px-3 py-2 border-b border-hairline">
                <span className="font-mono text-[10px] uppercase tracking-[0.88px] text-muted-soft font-semibold">SELECT PROVIDER</span>
              </div>
              <div className="max-h-[240px] overflow-y-auto py-1">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer border-none bg-transparent hover:bg-canvas-soft transition-colors ${
                      p.id === selectedProviderId ? "bg-canvas-soft" : ""
                    }`}
                  >
                    <span className="font-mono text-[12px] text-ink truncate">{p.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[11px] text-muted-soft">{p.models.length}</span>
                      <ChevronRight size={12} className="text-muted-soft" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Panel 2: Model list */
            <div>
              {/* Back + search header */}
              <div className="px-2 py-1.5 border-b border-hairline flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-left cursor-pointer border-none bg-transparent hover:text-ink transition-colors text-muted py-0.5"
                >
                  <ArrowLeft size={13} />
                  <span className="font-mono text-[12px] font-medium truncate">{activeProviderData?.name || "Back"}</span>
                </button>
                <div className="relative">
                  <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search models…"
                    className="w-full font-mono text-[12px] bg-canvas-soft text-ink pl-7 pr-2 py-1.5 rounded-md border border-hairline outline-none placeholder:text-muted-soft focus:border-hairline-strong transition-colors"
                  />
                </div>
              </div>
              <div className="max-h-[240px] overflow-y-auto py-1">
                {filteredModels.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <span className="font-mono text-[11px] uppercase tracking-[0.6px] text-muted-soft">NO MODELS FOUND</span>
                  </div>
                ) : (
                  filteredModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer border-none bg-transparent hover:bg-canvas-soft transition-colors ${
                        m === selectedModel && activeProvider === selectedProviderId ? "bg-canvas-soft" : ""
                      }`}
                    >
                      <span className="font-mono text-[12px] text-ink truncate">{m}</span>
                      {m === selectedModel && activeProvider === selectedProviderId && (
                        <CircleCheck size={13} className="text-semantic-success shrink-0 ml-auto" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AiCodingPanel({ apiId, method, path, currentCode, onApplyCode }: AiCodingPanelProps) {
  const [providers, setProviders] = useState<LlmProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [prompt, setPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentEvents, setCurrentEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latestCodeRef = useRef(currentCode);
  const textareaRef = useAutoResize(prompt);
  const elapsedStr = useElapsedTimer(running);

  useEffect(() => {
    latestCodeRef.current = currentCode;
  }, [currentCode]);

  // ── Load providers + saved model config ──────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [items, savedConfig] = await Promise.all([client.llmProviders.list(), client.configurations.get("CODING_AGENT_LLM_MODEL")]);
        if (cancelled) return;
        setProviders(items);

        if (savedConfig?.value && items.length > 0) {
          const [savedProviderId, savedModel] = savedConfig.value.split(":");
          const savedProvider = items.find((p) => p.id === savedProviderId);
          if (savedProvider && savedModel && savedProvider.models.includes(savedModel)) {
            setSelectedProviderId(savedProviderId);
            setSelectedModel(savedModel);
            return;
          }
        }
        if (items.length > 0) {
          setSelectedProviderId(items[0].id);
          if (items[0].models.length > 0) setSelectedModel(items[0].models[0]);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: running ? "instant" : "smooth" });
  }, [chatMessages, currentEvents, running]);

  const saveModelConfig = (providerId: string, model: string) => {
    if (providerId && model) {
      client.configurations.set("CODING_AGENT_LLM_MODEL", `${providerId}:${model}`).catch(() => {});
    }
  };

  const buildHistory = useCallback(
    (): Array<{ role: "user" | "assistant"; content: string }> =>
      chatMessages.map((msg) => {
        if (msg.role === "assistant") {
          let content = "";

          // Summarize tool actions so model understands what happened
          if (msg.events && msg.events.length > 0) {
            const actions: string[] = [];
            for (let i = 0; i < msg.events.length; i++) {
              const ev = msg.events[i];
              if (ev.type === "tool_call" && ev.toolName === "write_code") {
                actions.push("- Called write_code to save code draft");
              } else if (ev.type === "tool_call" && ev.toolName === "run_test") {
                // Find matching tool_result
                const resultEv = msg.events.slice(i + 1).find((e) => e.type === "tool_result" && e.toolName === "run_test");
                if (resultEv && typeof resultEv.toolResult === "object" && resultEv.toolResult !== null) {
                  const r = resultEv.toolResult as Record<string, unknown>;
                  const status = r.status as number | undefined;
                  const hasError = !!r.error;
                  const passed = !hasError && status != null && status < 400;
                  actions.push(`- Called run_test → ${passed ? "PASSED" : "FAILED"} (Status ${status ?? "?"})${r.executionTimeMs ? ` (${r.executionTimeMs}ms)` : ""}`);
                } else {
                  actions.push("- Called run_test");
                }
              } else if (ev.type === "tool_call" && ev.toolName === "fetch_web") {
                const url = ev.toolArgs?.url;
                actions.push(`- Called fetch_web: ${url || "unknown URL"}`);
              }
            }
            if (actions.length > 0) {
              content += `Actions performed:\n${actions.join("\n")}\n\n`;
            }
          }

          if (msg.content) content += msg.content;
          if (msg.code) content += `\n\n\`\`\`javascript\n${msg.code}\n\`\`\``;
          if (msg.cancelled) content += "\n\n(Cancelled by user)";

          return { role: msg.role, content: content || "Done." };
        }
        return { role: msg.role, content: msg.content };
      }),
    [chatMessages],
  );

  // ── Run agent ─────────────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    if (!prompt.trim() || !selectedProviderId || !selectedModel || running) return;

    const userPrompt = prompt.trim();
    setPrompt("");
    setChatMessages((prev) => [...prev, { role: "user", content: userPrompt }]);
    setRunning(true);
    setCurrentEvents([]);

    const controller = new AbortController();
    abortRef.current = controller;

    const collectedEvents: AgentEvent[] = [];
    let finalCode: string | null = null;
    let assistantText = "";

    try {
      const token = localStorage.getItem("access_token");
      const history = buildHistory();

      const res = await fetch(`${API_BASE || ""}/api/dynamic-apis/coding-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          providerId: selectedProviderId,
          model: selectedModel,
          prompt: userPrompt,
          currentCode: latestCodeRef.current,
          apiId,
          method,
          path,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: "Request failed" }));
        const errEvent: AgentEvent = {
          type: "error",
          message: (errBody as { message?: string }).message || `HTTP ${res.status}`,
          receivedAt: Date.now(),
        };
        collectedEvents.push(errEvent);
        setCurrentEvents((prev) => [...prev, errEvent]);
        setChatMessages((prev) => [...prev, { role: "assistant", content: errEvent.message || "Error", events: [errEvent] }]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "stream_end") continue;
            const event: AgentEvent = { ...parsed, receivedAt: Date.now() };

            collectedEvents.push(event);
            setCurrentEvents((prev) => [...prev, event]);

            if (event.code) {
              finalCode = event.code;
              latestCodeRef.current = finalCode;
              onApplyCode(finalCode);
            }
            if (event.type === "text_delta" && event.message) {
              // Accumulate streaming text deltas
              assistantText += event.message;
            } else if (event.type === "text" && event.message) {
              assistantText += (assistantText ? "\n" : "") + event.message;
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantText || "Cancelled by user.",
            events: collectedEvents,
            code: finalCode || undefined,
            cancelled: true,
          },
        ]);
        setRunning(false);
        setCurrentEvents([]);
        abortRef.current = null;
        return;
      }
      const errEvent: AgentEvent = {
        type: "error",
        message: (err as Error).message,
        receivedAt: Date.now(),
      };
      collectedEvents.push(errEvent);
      setCurrentEvents((prev) => [...prev, errEvent]);
    } finally {
      setRunning(false);
      abortRef.current = null;

      if (finalCode) {
        latestCodeRef.current = finalCode;
        onApplyCode(finalCode);
      }

      const content = assistantText || (finalCode ? "Code generated successfully." : "Done.");
      setChatMessages((prev) => [...prev, { role: "assistant", content, events: collectedEvents, code: finalCode || undefined }]);
      setCurrentEvents([]);
    }
  }, [prompt, selectedProviderId, selectedModel, apiId, method, path, running, buildHistory, onApplyCode]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // ── No providers configured ───────────────────────────────────────────────

  if (!loadingProviders && providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-16 h-16 rounded-lg border border-dashed border-hairline-strong flex items-center justify-center mb-5">
          <Bot size={28} className="text-muted-soft" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.88px] text-muted-soft mb-2">NO LLM PROVIDER CONFIGURED</span>
        <p className="text-[13px] text-muted leading-relaxed mb-5 max-w-[280px]">Configure at least one LLM provider to enable the AI coding assistant.</p>
        <a
          href="/ui/llm-providers"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-ink text-canvas text-[13px] font-medium hover:opacity-90 transition-opacity no-underline"
        >
          Initialize Provider
          <ChevronRight size={15} />
        </a>
      </div>
    );
  }

  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center h-full gap-2.5">
        <Loader2 size={18} className="text-muted-soft animate-spin" />
        <span className="font-mono text-[11px] text-muted-soft uppercase tracking-wide">Loading…</span>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      <div className="shrink-0 px-2 py-3 border-b border-hairline">
        <div className="flex items-center gap-2 mb-2.5">
          {running && (
            <span className="relative flex h-[7px] w-[7px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-amber-500" />
            </span>
          )}
          <span className={`font-mono text-[11px] uppercase tracking-[0.88px] font-semibold transition-colors ${running ? "text-amber-500" : "text-muted-soft"}`}>AI AGENT</span>
          {running && <span className="font-mono text-[11px] text-amber-400/80 tabular-nums ml-auto">{elapsedStr}</span>}
        </div>
        <ModelPickerPopover
          providers={providers}
          selectedProviderId={selectedProviderId}
          selectedModel={selectedModel}
          onSelect={(pid, model) => {
            setSelectedProviderId(pid);
            setSelectedModel(model);
            saveModelConfig(pid, model);
          }}
        />
      </div>

      {/* Indeterminate progress bar */}
      <div className="shrink-0 h-[2px] bg-hairline overflow-hidden">
        {running && (
          <div
            className="h-full w-1/3 rounded-full bg-amber-400"
            style={{
              animation: "ai-progress-slide 1.4s ease-in-out infinite",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes ai-progress-slide {
          0%   { transform: translateX(-100%) scaleX(1); }
          50%  { transform: translateX(150%) scaleX(1.5); }
          100% { transform: translateX(400%) scaleX(1); }
        }
      `}</style>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {chatMessages.length === 0 && !running && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-lg border border-dashed border-hairline-strong flex items-center justify-center mb-4">
              <Sparkles size={22} strokeWidth={1.5} className="text-muted-soft" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.88px] text-muted-soft font-semibold">DESCRIBE WHAT TO BUILD</span>
            <span className="text-[12px] text-muted mt-2 max-w-[240px] leading-relaxed">Agent will use tools to code, test, and fix autonomously</span>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={`msg-${msg.role}-${msg.content.slice(0, 20)}-${i}`}>
            {msg.role === "user" ? (
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[12px] text-ink leading-[1.6] bg-surface-card border border-hairline rounded-lg px-3.5 py-2.5 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="pl-1">
                {msg.events && msg.events.length > 0 ? (
                  <ChainOfThought events={msg.events} isLive={false} defaultOpen={false} />
                ) : (
                  <div className="font-mono text-[12px] text-body leading-[1.6]">{msg.content}</div>
                )}
              </div>
            )}
          </div>
        ))}

        {running && (
          <div className="pl-1">
            <ChainOfThought events={currentEvents} isLive={true} defaultOpen={true} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-2 py-2 bg-canvas">
        <div className={`relative flex items-stretch bg-surface-card border rounded-lg focus-within:border-hairline-strong transition-colors overflow-hidden ${running ? "border-amber-500/30" : "border-hairline"}`}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
            placeholder={running ? "" : chatMessages.length > 0 ? "Follow up…" : "Describe what to build…"}
            className="w-full font-mono text-[12px] leading-[1.5] bg-transparent text-ink pl-3.5 pr-12 py-3.5 resize-none border-none outline-none focus:outline-none focus:ring-0 placeholder:text-muted-soft"
            rows={2}
            spellCheck={false}
            disabled={running}
            style={{ minHeight: "52px", maxHeight: "120px" }}
          />
          <div className="absolute right-2 bottom-2 z-10 flex items-center">
            {running ? (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-md bg-semantic-error text-on-primary cursor-pointer border-none hover:opacity-90 transition-opacity"
                title="Abort"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRun}
                disabled={!prompt.trim() || !selectedModel}
                className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-md bg-ink text-canvas cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-20"
                title="Execute (Enter)"
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

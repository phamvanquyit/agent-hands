import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Tooltip, message, Spin } from "antd";
import {
  Copy,
  CheckCircle2,
  Zap,
  Lock,
  Server,
  ChevronRight,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { client } from "src/lib/client";
import type { ApiEndpoint, ApiDocsData } from "src/lib/types";

// ── Base URL ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18080";

function getBaseUrl() {
  return API_BASE;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#e7f6ec", text: "#12a856" },
  POST: { bg: "#fff3e0", text: "#ef8e19" },
  PUT: { bg: "#e3f2fd", text: "#2196f3" },
  PATCH: { bg: "#f3e5f5", text: "#9c27b0" },
  DELETE: { bg: "#fce4ec", text: "#e53935" },
};

function MethodBadge({ method }: { method: string }) {
  const colors = METHOD_COLORS[method] ?? { bg: "#e6e5e0", text: "#807d72" };
  return (
    <span
      className="inline-flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.5px] px-2.5 py-1 rounded-xs leading-none min-w-[52px] text-center"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {method}
    </span>
  );
}

function CopyButton({ text, inline }: { text: string; inline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      message.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      message.error("Failed to copy");
    }
  };
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"}>
      <button
        className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border cursor-pointer transition-all duration-150 ${
          inline
            ? "bg-transparent border-hairline text-muted hover:border-hairline-strong hover:text-ink"
            : "absolute top-2.5 right-2.5 bg-white/8 border-white/10 text-white/40 hover:bg-white/15 hover:text-white/70"
        }`}
        onClick={handleCopy}
      >
        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      </button>
    </Tooltip>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative bg-surface-dark rounded-md overflow-hidden border border-surface-dark-elevated">
      {label && (
        <div className="px-3 py-1.5 border-b border-white/8">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.6px] text-white/35">
            {label}
          </span>
        </div>
      )}
      <CopyButton text={code} />
      <pre className="text-on-dark text-[13px] font-mono leading-[1.7] p-4 m-0 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [docsData, setDocsData] = useState<ApiDocsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickExampleTab, setQuickExampleTab] = useState<"curl" | "js">("curl");
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const baseUrl = getBaseUrl();

  // Fetch docs from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    client.apiDocs
      .get()
      .then((data) => {
        if (!cancelled) {
          setDocsData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load API docs");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const introSections = docsData?.introSections ?? [];
  const apiSections = docsData?.apiSections ?? [];
  const allNav = useMemo(() => [...introSections, ...apiSections], [introSections, apiSections]);

  // Scrollspy
  useEffect(() => {
    const container = contentRef.current;
    if (!container || allNav.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const ids = allNav.map((s) => s.id);
      let current = ids[0];

      for (const id of ids) {
        const el = sectionRefs.current[id];
        if (el && el.offsetTop - 80 <= scrollTop) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [allNav]);

  const scrollTo = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    const container = contentRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    }
  }, []);

  const setRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas">
        <Spin size="large" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-soft mt-4">
          LOADING REFERENCE
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas">
        <div className="flex flex-col items-center justify-center border border-dashed border-hairline-strong rounded-md p-12 max-w-[480px]">
          <AlertTriangle size={28} className="text-muted-soft mb-4" strokeWidth={1.5} />
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted-soft mb-2">
            FETCH ERROR
          </div>
          <p className="text-[13px] text-muted text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-canvas">
      {/* ── Sidebar Nav ────────────────────────────────────────────────── */}
      <nav className="w-[220px] min-w-[220px] border-r border-hairline overflow-y-auto shrink-0 py-6 max-md:hidden bg-canvas">
        <div className="flex items-center gap-2 px-5 mb-6">
          <BookOpen size={14} className="text-muted" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
            API Reference
          </span>
        </div>

        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.8px] text-muted-soft px-5 mb-2">
            Overview
          </div>
          {introSections.filter((s) => s.id !== "response-format").map((s) => (
            <button
              key={s.id}
              className={`flex items-center w-full text-left text-[13px] py-[7px] px-5 border-none bg-transparent cursor-pointer transition-all duration-150 font-sans border-l-2 ${
                activeSection === s.id
                  ? "text-ink border-l-ink bg-ink/5 font-medium"
                  : "text-muted border-l-transparent hover:text-ink hover:bg-ink/3"
              }`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.8px] text-muted-soft px-5 mb-2">
            Endpoints
          </div>
          {apiSections.map((s) => (
            <button
              key={s.id}
              className={`flex items-center justify-between w-full text-left text-[13px] py-[7px] px-5 border-none bg-transparent cursor-pointer transition-all duration-150 font-sans border-l-2 ${
                activeSection === s.id
                  ? "text-ink border-l-ink bg-ink/5 font-medium"
                  : "text-muted border-l-transparent hover:text-ink hover:bg-ink/3"
              }`}
              onClick={() => scrollTo(s.id)}
            >
              <span>{s.label}</span>
              <span className="font-mono text-[10px] text-muted-soft tracking-wide">
                {s.endpoints.length}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="px-10 pt-10 pb-8 border-b border-hairline">
          <div className="max-w-[860px]">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-muted" strokeWidth={1.5} />
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                Documentation
              </span>
            </div>
            <h1 className="font-display text-[32px] font-normal text-ink tracking-[-0.64px] m-0 leading-tight">
              API Reference
            </h1>
          </div>
        </div>

        <div className="px-10 py-8 [&_section]:mb-14">
          <div className="max-w-[860px]">

            {/* ── Getting Started ─────────────────────────────────────── */}
            <section ref={setRef("getting-started")} id="getting-started">
              <h2 className="font-display text-[26px] font-normal text-ink tracking-[-0.4px] mb-4">
                Getting Started
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 border border-hairline rounded-md bg-surface-card">
                  <Zap size={16} className="text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft mb-2">
                      BASE URL
                    </div>
                    <div className="flex items-center gap-2 bg-canvas rounded-sm py-1.5 px-2.5 border border-hairline-soft">
                      <code className="font-mono text-[12px] text-ink truncate">{baseUrl}</code>
                      <CopyButton text={baseUrl} inline />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-hairline rounded-md bg-surface-card">
                  <Lock size={16} className="text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft mb-2">
                      AUTHENTICATION
                    </div>
                    <p className="text-[13px] text-body m-0">JWT token or API key</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-hairline rounded-md bg-surface-card">
                  <Server size={16} className="text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft mb-2">
                      FORMAT
                    </div>
                    <p className="text-[13px] text-body m-0">JSON request &amp; response</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft mb-2">
                  INSTALL SDK
                </div>
                <CodeBlock code={`npm install moro-llm-toolkit-client`} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft">
                    QUICK EXAMPLE
                  </div>
                  <div className="flex items-center gap-1">
                    {(["curl", "js"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`font-mono text-[11px] uppercase tracking-[0.4px] px-3 py-1.5 rounded-sm border cursor-pointer transition-all duration-150 ${
                          quickExampleTab === tab
                            ? "bg-ink text-canvas border-ink"
                            : "bg-transparent text-muted border-hairline hover:text-ink hover:border-hairline-strong"
                        }`}
                        onClick={() => setQuickExampleTab(tab)}
                      >
                        {tab === "curl" ? "cURL" : "JavaScript"}
                      </button>
                    ))}
                  </div>
                </div>
                {quickExampleTab === "curl" ? (
                  <CodeBlock
                    code={`# Create a variable in a project
curl -X POST ${baseUrl}/api/projects/prj_xxx/variables \\
  -H "X-API-Key: ltk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "greeting", "value": "Hello World"}'

# Read it back
curl ${baseUrl}/api/projects/prj_xxx/variables/by-key/greeting \\
  -H "X-API-Key: ltk_YOUR_KEY"`}
                  />
                ) : (
                  <CodeBlock
                    code={`import { MoroClient } from "src/lib/types";

const client = new MoroClient({
  baseUrl: "${baseUrl}",
  accessToken: "ltk_YOUR_KEY"
});

// Create a variable in a project
await client.variables.create("prj_xxx", {
  key: "greeting",
  value: "Hello World"
});

// Read it back
const v = await client.variables.getByKey("prj_xxx", "greeting");
console.log(v.value); // "Hello World"`}
                  />
                )}
              </div>
            </section>

            {/* ── Authentication ───────────────────────────────────────── */}
            <section ref={setRef("authentication")} id="authentication">
              <h2 className="font-display text-[26px] font-normal text-ink tracking-[-0.4px] mb-2">
                Authentication
              </h2>
              <p className="text-[14px] text-body mb-5 max-w-[640px] leading-relaxed">
                All endpoints (except login/refresh) require authentication. Two methods available:
              </p>

              <div className="border border-hairline rounded-md overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[120px_1fr_1fr] bg-canvas border-b border-hairline">
                  <div className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft">Method</div>
                  <div className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft border-l border-hairline">Header</div>
                  <div className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft border-l border-hairline">Note</div>
                </div>
                {/* JWT */}
                <div className="grid grid-cols-[120px_1fr_1fr] bg-surface-card border-b border-hairline-soft">
                  <div className="px-4 py-3.5 flex items-center">
                    <span className="font-mono text-[11px] font-medium text-ink">JWT Token</span>
                  </div>
                  <div className="px-4 py-3.5 border-l border-hairline-soft flex items-center">
                    <code className="font-mono text-[12px] text-ink bg-canvas px-2 py-1 rounded-xs border border-hairline-soft">Authorization: Bearer eyJhbG...</code>
                  </div>
                  <div className="px-4 py-3.5 border-l border-hairline-soft flex items-center">
                    <span className="text-[13px] text-muted">Obtained via <code className="font-mono text-[12px] text-ink">/api/auth/login</code>, valid 1 hour</span>
                  </div>
                </div>
                {/* API Key — Bearer */}
                <div className="grid grid-cols-[120px_1fr_1fr] bg-surface-card border-b border-hairline-soft">
                  <div className="px-4 py-3.5 flex items-center" style={{ gridRow: "span 2" }}>
                    <span className="font-mono text-[11px] font-medium text-ink">API Key</span>
                  </div>
                  <div className="px-4 py-3.5 border-l border-hairline-soft flex items-center">
                    <code className="font-mono text-[12px] text-ink bg-canvas px-2 py-1 rounded-xs border border-hairline-soft">Authorization: Bearer ltk_AbCd...</code>
                  </div>
                  <div className="px-4 py-3.5 border-l border-hairline-soft flex items-center" style={{ gridRow: "span 2" }}>
                    <span className="text-[13px] text-muted">Created in <a href="/api-keys" className="text-ink underline decoration-hairline-strong underline-offset-2 hover:decoration-ink">API Keys</a>, no expiry</span>
                  </div>
                </div>
                {/* API Key — X-API-Key */}
                <div className="grid grid-cols-[120px_1fr_1fr] bg-surface-card">
                  <div className="px-4 py-3.5" />
                  <div className="px-4 py-3.5 border-l border-hairline-soft flex items-center">
                    <code className="font-mono text-[12px] text-ink bg-canvas px-2 py-1 rounded-xs border border-hairline-soft">X-API-Key: ltk_AbCdEfGh...</code>
                  </div>
                  <div className="px-4 py-3.5 border-l border-hairline-soft" />
                </div>
              </div>
            </section>


            {/* ── API Groups — dynamically rendered from server data ──── */}
            {apiSections.map((group) => (
              <section key={group.id} ref={setRef(group.id)} id={group.id}>
                <h2 className="font-display text-[26px] font-normal text-ink tracking-[-0.4px] mb-2">
                  {group.label}
                </h2>
                <p className="text-[14px] text-body mb-5 max-w-[640px] leading-relaxed">
                  {group.description}
                </p>

                <div className="flex flex-col gap-2">
                  {group.endpoints.map((ep, i) => (
                    <EndpointCard
                      key={`${ep.method}-${ep.path}-${i}`}
                      endpoint={ep}
                      basePrefix={group.basePrefix}
                      baseUrl={baseUrl}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div style={{ height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Endpoint Card ────────────────────────────────────────────────────────────

function EndpointCard({
  endpoint,
  basePrefix,
  baseUrl,
}: {
  endpoint: ApiEndpoint;
  basePrefix: string;
  baseUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [exampleTab, setExampleTab] = useState<"curl" | "js">("curl");
  const fullPath = `${basePrefix}${endpoint.path === "/" ? "" : endpoint.path}`;

  const jsExample = useMemo(() => {
    return endpoint.jsExample?.replace(/\{\{BASE_URL\}\}/g, baseUrl);
  }, [endpoint.jsExample, baseUrl]);

  const curlExample = useMemo(() => {
    let cmd = `curl`;
    if (endpoint.method !== "GET") cmd += ` -X ${endpoint.method}`;
    cmd += ` ${baseUrl}${fullPath}`;
    if (endpoint.auth !== "none") {
      cmd += ` \\\n  -H "X-API-Key: ltk_YOUR_KEY"`;
    }
    if (endpoint.body) {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '${endpoint.body}'`;
    }
    return cmd;
  }, [endpoint, baseUrl, fullPath]);

  return (
    <div
      className={`border rounded-md overflow-hidden transition-all duration-200 ${
        expanded
          ? "border-hairline-strong bg-surface-card"
          : "border-hairline bg-transparent hover:bg-surface-card"
      }`}
    >
      <div
        className="flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors duration-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MethodBadge method={endpoint.method} />
          <code className="text-[13px] font-mono text-ink">{fullPath}</code>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[13px] text-muted hidden sm:inline">{endpoint.summary}</span>
          {endpoint.auth !== "none" && (
            <Lock size={11} className="text-muted-soft shrink-0" strokeWidth={1.5} />
          )}
          <ChevronRight
            size={13}
            className={`text-muted-soft transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-hairline-soft">
          {/* Summary on expanded */}
          <p className="text-[13px] text-body mb-4">{endpoint.summary}</p>

          {endpoint.notes && (
            <div className="text-[13px] text-body leading-relaxed py-2.5 px-3.5 bg-canvas rounded-sm border-l-2 border-hairline-strong mb-4">
              {endpoint.notes}
            </div>
          )}

          {endpoint.queryParams && (
            <div className="mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-muted-soft mb-2">
                QUERY PARAMETERS
              </div>
              <p className="text-[13px] text-body">{endpoint.queryParams}</p>
            </div>
          )}

          {endpoint.body && (
            <div className="mb-4">
              <CodeBlock label="Request Body" code={endpoint.body} />
            </div>
          )}

          {endpoint.response && (
            <div className="mb-4">
              <CodeBlock label="Response" code={endpoint.response} />
            </div>
          )}

          {/* Example: cURL / JS toggle */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              {(["curl", "js"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`font-mono text-[11px] uppercase tracking-[0.4px] px-3 py-1.5 rounded-sm border cursor-pointer transition-all duration-150 ${
                    exampleTab === tab
                      ? "bg-ink text-canvas border-ink"
                      : "bg-transparent text-muted border-hairline hover:text-ink hover:border-hairline-strong"
                  }`}
                  onClick={() => setExampleTab(tab)}
                >
                  {tab === "curl" ? "cURL" : "JavaScript"}
                </button>
              ))}
            </div>
            {exampleTab === "curl" ? (
              <CodeBlock code={curlExample} />
            ) : (
              <CodeBlock
                code={
                  jsExample ??
                  `// See cURL example — JS client method TBD`
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

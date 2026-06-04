import { Input } from "antd";
import { Globe, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { useApiKey } from "src/common/hooks/useApiKey";

// ── Config Tab ────────────────────────────────────────────────────────────────

export function ConfigTab({
  mcpEndpoint,
}: {
  mcpEndpoint: string;
}) {
  const [apiKey, setApiKey] = useApiKey();
  const authValue = apiKey || "<YOUR_API_KEY>";

  const claudeCodeCmd = `claude mcp add --transport http agent-hands ${mcpEndpoint} --header "Authorization: Bearer ${authValue}"`;

  const antigravityConfig = JSON.stringify(
    {
      mcpServers: {
        "agent-hands": {
          serverUrl: `${mcpEndpoint}`,
          headers: {
            Authorization: `Bearer ${authValue}`,
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="flex flex-col gap-8 max-w-[800px] mx-auto">
      {/* Endpoint Info */}
      <div className="animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={14} className="text-muted" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">MCP Endpoint</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-md border border-hairline bg-surface-card">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#1f8a65] bg-[#1f8a65]/10 px-2 py-0.5 rounded shrink-0">POST</span>
          <code className="font-mono text-[13px] text-ink flex-1 break-all">{mcpEndpoint}</code>
        </div>
        <p className="text-[12px] text-muted mt-2 mb-0">Streamable HTTP transport — compatible with MCP SDK 2025+</p>
      </div>

      {/* Authentication */}
      <div className="animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2 mb-4">
          <Key size={14} className="text-muted" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Authentication</span>
        </div>
        <div className="px-4 py-4 rounded-md border border-hairline bg-surface-card flex flex-col gap-3">
          <div>
            <div className="text-[13px] text-ink font-medium">API Key</div>
            <div className="text-[12px] text-muted mt-0.5">
              Create an API Key in{" "}
              <Link to="/settings/api-keys" className="text-ink underline hover:no-underline">
                Settings → API Keys
              </Link>
              , then paste it below. It will be auto-filled into all config snippets.
            </div>
          </div>
          <Input.Password value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ltk_xxxxxxxx..." className="font-mono !text-[12px]" />
        </div>
      </div>

      {/* Claude Code */}
      <ConfigBlock
        title="Claude Code"
        subtitle="Run this command in your terminal"
        code={claudeCodeCmd}
        delay="0.15s"
      />

      {/* Antigravity (Gemini) */}
      <ConfigBlock
        title="Antigravity / Gemini"
        subtitle=""
        code={antigravityConfig}
        delay="0.2s"
      />
    </div>
  );
}

// ── Reusable Config Block ─────────────────────────────────────────────────────

function ConfigBlock({
  title,
  subtitle,
  code,
  delay = "0s",
}: {
  title: string;
  subtitle: string;
  code: string;
  delay?: string;
}) {
  return (
    <div className="animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-mono text-[12px] text-ink font-medium">{title}</div>
          <div className="text-[11px] text-muted-soft mt-0.5">{subtitle}</div>
        </div>
      </div>
      <pre className="m-0 p-4 rounded-md bg-[#1e1e1e] border border-hairline font-mono text-[12px] text-[#d4d4d4] overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

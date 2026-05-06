import { useNavigate } from "react-router-dom";
import { useAuthStore } from "src/common/stores/auth.store";
import {
  Users,
  Braces,
  HardDrive,
  FileText,
  KeyRound,
  BookOpen,
  ArrowRight,
  Terminal,
  Database,
} from "lucide-react";
import { useUpdateChecker } from "src/common/hooks/useUpdateChecker";
import { UpdateBanner } from "src/common/components/UpdateBanner";

const NAV_ITEMS = [
  { icon: Database, title: "Databases", desc: "Tables & records", path: "/databases" },
  { icon: HardDrive, title: "Storage", desc: "Buckets & files", path: "/storage" },
  { icon: Braces, title: "Variables", desc: "Global configs", path: "/variables" },
  { icon: FileText, title: "Documents", desc: "Projects & editor", path: "/documents" },
  { icon: Users, title: "Users", desc: "Access control", path: "/users" },
  { icon: KeyRound, title: "API Keys", desc: "Manage credentials", path: "/api-keys" },
  { icon: Terminal, title: "MCP Servers", desc: "Tool servers", path: "/mcp-servers" },
  { icon: BookOpen, title: "Docs", desc: "API reference", path: "/docs" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const greeting = getGreeting();
  const { versionInfo, showBanner, isUpdating, updateError, dismiss, triggerUpdate } = useUpdateChecker();

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12 animate-fade-in-up">
      {/* Header */}
      <div className="mb-10 border-b border-hairline pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={18} className="text-muted" />
          <span className="font-mono text-[13px] text-muted tracking-wide uppercase">
            Dashboard
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[36px] font-normal tracking-[-0.72px] text-ink leading-tight">
            {greeting}, {user?.name}
          </h2>
          <div className="font-mono text-[13px] text-muted-soft flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            Operational
          </div>
        </div>
      </div>

      {/* Update Banner */}
      {showBanner && versionInfo && (
        <div className="mb-6">
          <UpdateBanner
            versionInfo={versionInfo}
            isUpdating={isUpdating}
            updateError={updateError}
            onUpdate={triggerUpdate}
            onDismiss={() => dismiss(versionInfo.latest!)}
          />
        </div>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            className="p-5 rounded-[12px] border border-hairline bg-surface-card hover:bg-canvas-soft hover:border-hairline-strong transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-canvas border border-hairline-soft text-muted group-hover:text-ink transition-colors">
              <item.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-ink">{item.title}</div>
              <div className="text-[12px] text-muted-soft">{item.desc}</div>
            </div>
            <ArrowRight
              size={14}
              className="text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </div>
        ))}
      </div>

      {/* Code snippet */}
      <div className="mt-8 bg-surface-dark rounded-[12px] p-6 border border-hairline">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#cf2d56]" />
          <div className="w-3 h-3 rounded-full bg-[#c08532]" />
          <div className="w-3 h-3 rounded-full bg-[#1f8a65]" />
        </div>
        <div
          className="font-mono text-[13px] leading-relaxed"
          style={{ color: "#a09c92" }}
        >
          <span style={{ color: "#c0a8dd" }}>import</span>
          {" { "}MoroClient{" } "}
          <span style={{ color: "#c0a8dd" }}>from</span>{" "}
          <span style={{ color: "#9fc9a2" }}>"moro-llm-toolkit-client"</span>;
          <br />
          <br />
          <span style={{ color: "#dfa88f" }}>const</span> client ={" "}
          <span style={{ color: "#c0a8dd" }}>new</span>{" "}
          <span style={{ color: "#9fbbe0" }}>MoroClient</span>
          {"({ "}baseUrl, apiKey{" })"};
          <br />
          <span style={{ color: "#dfa88f" }}>const</span> tables ={" "}
          <span style={{ color: "#c0a8dd" }}>await</span> client.tables.
          <span style={{ color: "#9fbbe0" }}>list</span>();
          <br />
          <span className="opacity-50 mt-4 block text-[15px] animate-pulse">
            _
          </span>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

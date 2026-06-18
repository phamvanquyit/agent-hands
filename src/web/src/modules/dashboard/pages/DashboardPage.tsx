import { Switch, Tooltip } from "antd";
import { ArrowRight, BookOpen, Braces, Database, FlaskConical, HardDrive, KeyRound, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UpdateBanner } from "src/common/components/UpdateBanner";
import { useUpdateChecker } from "src/common/hooks/useUpdateChecker";
import { useAuthStore } from "src/common/stores/auth.store";

const NAV_ITEMS = [
  { icon: Braces, title: "KV Store", desc: "Key-value store", path: "/kv-store" },
  { icon: Database, title: "DataTables", desc: "Projects, tables & records", path: "/datatables" },
  { icon: HardDrive, title: "Object Storage", desc: "Buckets & files", path: "/storage" },
  { icon: KeyRound, title: "API Keys", desc: "Manage credentials", path: "/api-keys" },
  { icon: Terminal, title: "MCP Servers", desc: "Tool servers", path: "/mcp-servers" },
  { icon: BookOpen, title: "Docs", desc: "API reference", path: "/docs" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const greeting = getGreeting();
  const { versionInfo, showBanner, dismiss, toggleChannel, channelLoading } = useUpdateChecker();
  const isDevChannel = versionInfo?.channel === "dev";

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12 animate-fade-in-up">
      {/* Header */}
      <div className="mb-10 border-b border-hairline pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={18} className="text-muted" />
          <span className="font-mono text-[13px] text-muted tracking-wide uppercase">Dashboard</span>
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
            onDismiss={() => dismiss(versionInfo.latest!)}
          />
        </div>
      )}

      {/* Dev Channel Toggle */}
      <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl border border-hairline bg-surface-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-canvas border border-hairline-soft">
            <FlaskConical size={15} className="text-muted" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-ink flex items-center gap-2">
              Pre-release updates
              {isDevChannel && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[rgba(245,158,11,0.12)] text-[#d97706]">DEV</span>}
            </div>
            <div className="text-[11px] text-muted-soft mt-0.5">
              {isDevChannel ? "You'll receive notifications for pre-release versions" : "Only stable releases will be notified"}
            </div>
          </div>
        </div>
        <Tooltip title={isDevChannel ? "Switch to stable channel" : "Enable pre-release notifications"}>
          <Switch size="small" checked={isDevChannel} loading={channelLoading} onChange={toggleChannel} />
        </Tooltip>
      </div>

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
            <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}
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

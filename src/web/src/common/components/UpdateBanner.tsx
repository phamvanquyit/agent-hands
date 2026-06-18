import { CheckCircle2, Copy, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { VersionInfo } from "src/lib/resources/system";

interface UpdateBannerProps {
  versionInfo: VersionInfo;
  onDismiss: () => void;
}

export function UpdateBanner({ versionInfo, onDismiss }: UpdateBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!versionInfo.installCommand) return;
    try {
      await navigator.clipboard.writeText(versionInfo.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text for manual copy
    }
  };

  return (
    <div
      className="w-full rounded-xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.05) 100%)",
        borderColor: "rgba(99,102,241,0.2)",
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
          <Sparkles size={16} className="text-indigo-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">New version available</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
              v{versionInfo.latest}
            </span>
            {versionInfo.isPreRelease && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[rgba(245,158,11,0.12)] text-[#d97706]">pre-release</span>
            )}
          </div>
          <p className="text-[12px] text-muted mt-0.5">
            You're running v{versionInfo.current}. Copy and run the command below — it will automatically stop, update, and restart the server with your current config.
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center text-muted hover:text-ink cursor-pointer transition-colors rounded-md hover:bg-surface-card"
        >
          <X size={13} />
        </button>
      </div>

      {/* Install command block */}
      {versionInfo.installCommand && (
        <div className="px-5 pb-4">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
            style={{
              background: "rgba(0,0,0,0.03)",
              borderColor: "rgba(99,102,241,0.15)",
            }}
          >
            <code className="flex-1 text-[12px] font-mono text-ink break-all select-all leading-relaxed">{versionInfo.installCommand}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all"
              style={{
                background: copied ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.1)",
                color: copied ? "#059669" : "#6366f1",
              }}
              id="update-banner-copy-btn"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

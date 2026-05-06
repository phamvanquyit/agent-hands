import { useState } from "react";
import { ArrowUpCircle, X, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import type { VersionInfo } from "src/lib/resources/system";

interface UpdateBannerProps {
  versionInfo: VersionInfo;
  isUpdating: boolean;
  updateError: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}

type Phase = "prompt" | "confirming" | "updating" | "restarting" | "error";

export function UpdateBanner({
  versionInfo,
  isUpdating,
  updateError,
  onUpdate,
  onDismiss,
}: UpdateBannerProps) {
  const [phase, setPhase] = useState<Phase>("prompt");

  const handleUpdateClick = () => setPhase("confirming");
  const handleCancel = () => setPhase("prompt");

  const handleConfirm = async () => {
    setPhase("updating");
    try {
      await Promise.resolve(onUpdate());
      setPhase("restarting");
      setTimeout(() => window.location.reload(), 6000);
    } catch {
      setPhase("error");
    }
  };

  if (updateError && phase !== "error") setPhase("error");

  return (
    <div
      className="w-full rounded-xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.05) 100%)",
        borderColor: "rgba(99,102,241,0.2)",
      }}
    >
      {phase === "prompt" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <Sparkles size={16} className="text-indigo-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink">New version available</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}
              >
                v{versionInfo.latest}
              </span>
            </div>
            <p className="text-[12px] text-muted mt-0.5">
              You're running v{versionInfo.current}. Update to get the latest features and fixes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUpdateClick}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              id="update-banner-update-btn"
            >
              Update now
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted cursor-pointer hover:text-ink border border-hairline hover:border-hairline-strong transition-colors"
              id="update-banner-dismiss-btn"
            >
              Later
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="shrink-0 w-7 h-7 flex items-center justify-center text-muted hover:text-ink cursor-pointer transition-colors rounded-md hover:bg-surface-card"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {phase === "confirming" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <ArrowUpCircle size={16} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-ink">Confirm update to v{versionInfo.latest}?</span>
            <p className="text-[12px] text-muted mt-0.5">
              The server will restart automatically. This takes about 10–30 seconds.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConfirm}
              disabled={isUpdating}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              id="update-banner-confirm-btn"
            >
              Confirm & Update
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted cursor-pointer hover:text-ink border border-hairline hover:border-hairline-strong transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === "updating" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <RefreshCw size={18} className="text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Installing v{versionInfo.latest}…</p>
            <p className="text-[12px] text-muted mt-0.5">Downloading and installing the update</p>
          </div>
        </div>
      )}

      {phase === "restarting" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Update installed — server restarting</p>
            <p className="text-[12px] text-muted mt-0.5">Page will reload automatically in a few seconds…</p>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-ink">Update failed</p>
            {updateError && <p className="text-[12px] text-muted mt-0.5 break-words">{updateError}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPhase("prompt")}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted cursor-pointer hover:text-ink border border-hairline hover:border-hairline-strong transition-colors"
            >
              Try again
            </button>
            <button onClick={onDismiss} className="text-muted hover:text-ink cursor-pointer">
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

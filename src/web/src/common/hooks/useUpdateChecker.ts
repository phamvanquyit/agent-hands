import { useEffect, useRef, useState, useCallback } from "react";
import { client } from "src/lib/client";
import type { VersionInfo } from "src/lib/resources/system";

const CHECK_INTERVAL_MS = 60_000; // 1 minute

interface UpdateCheckerState {
  versionInfo: VersionInfo | null;
  isUpdating: boolean;
  updateError: string | null;
  dismissedVersion: string | null;
}

export function useUpdateChecker() {
  const [state, setState] = useState<UpdateCheckerState>({
    versionInfo: null,
    isUpdating: false,
    updateError: null,
    dismissedVersion: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      const info = await client.system.getVersion();
      setState((prev) => ({ ...prev, versionInfo: info }));
    } catch {
      // silently ignore — server may be restarting
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkVersion();

    // Poll every minute
    intervalRef.current = setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkVersion]);

  const dismiss = useCallback((version: string) => {
    setState((prev) => ({ ...prev, dismissedVersion: version }));
  }, []);

  const triggerUpdate = useCallback(async () => {
    setState((prev) => ({ ...prev, isUpdating: true, updateError: null }));
    try {
      await client.system.triggerUpdate();
      // Server will restart — show a "restarting" message
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        updateError: null,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      setState((prev) => ({ ...prev, isUpdating: false, updateError: message }));
    }
  }, []);

  const showBanner =
    state.versionInfo?.hasUpdate === true &&
    state.versionInfo.latest !== state.dismissedVersion;

  return {
    versionInfo: state.versionInfo,
    showBanner,
    isUpdating: state.isUpdating,
    updateError: state.updateError,
    dismiss,
    triggerUpdate,
  };
}

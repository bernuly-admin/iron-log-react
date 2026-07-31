import { useEffect, useRef, useCallback } from "react";

// Requests a screen Wake Lock while `active` is true (best-effort; silently
// no-ops on browsers without the API). Re-acquires on tab visibility changes.
export function useWakeLock(active) {
  const lockRef = useRef(null);

  const acquire = useCallback(async () => {
    try {
      if (!("wakeLock" in navigator) || !active) return;
      lockRef.current = await navigator.wakeLock.request("screen");
      lockRef.current.addEventListener?.("release", () => { lockRef.current = null; });
    } catch {
      /* denied / not supported */
    }
  }, [active]);

  const release = useCallback(async () => {
    try { await lockRef.current?.release(); } catch { /* ignore */ }
    lockRef.current = null;
  }, []);

  useEffect(() => {
    if (active) acquire(); else release();
    const onVis = () => { if (active && document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); release(); };
  }, [active, acquire, release]);
}

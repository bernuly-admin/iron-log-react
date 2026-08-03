import { useCallback, useEffect, useState } from "react";
import { local } from "../lib/storage";
import { buildDefaultPlan } from "../data/defaultPlan";
import { defaultState, stamp, pickNewer, mergeLogs } from "../lib/core";
import { pullAll, enqueue, flushQueue, isSheetConfigured } from "../services/googleSheet";

export function useAppData() {
  const [plan, setPlanState] = useState(() => local.getPlan() || buildDefaultPlan());
  const [state, setStateState] = useState(() => local.getState() || defaultState());
  const [logs, setLogsState] = useState(() => local.getLogs());
  const [settings, setSettingsState] = useState(() => local.getSettings());
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState("local"); // local | syncing | synced | pending | offline

  // persist defaults on very first run
  useEffect(() => {
    if (!local.getPlan()) local.setPlan(plan);
    if (!local.getState()) local.setState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doFlush = useCallback(async () => {
    if (!isSheetConfigured()) { setSync("local"); return; }
    setSync("syncing");
    const r = await flushQueue();
    if (r.ok) setSync(local.getQueue().length ? "pending" : "synced");
    else setSync(r.reason === "offline" ? "offline" : "pending");
  }, []);

  // Pull from the sheet and MERGE (never blindly overwrite local).
  // Returns true on success. Flushes local writes up first so the sheet is
  // current before we read it back.
  const syncPull = useCallback(async () => {
    if (!isSheetConfigured()) return false;
    await doFlush(); // push any pending local changes UP before reading DOWN
    setSync("syncing");
    try {
      const data = await pullAll();
      // state & plan: keep whichever side is newer (by updatedAt)
      const mState = pickNewer(local.getState() || defaultState(), data?.state);
      local.setState(mState); setStateState(mState);
      const curPlan = local.getPlan();
      const mPlan = pickNewer(curPlan, data?.plan) || curPlan;
      if (mPlan) { local.setPlan(mPlan); setPlanState(mPlan); }
      // logs: union both sides, de-duplicated (never lose unsynced local logs)
      if (Array.isArray(data?.logs)) {
        const mLogs = mergeLogs(local.getLogs(), data.logs);
        local.setLogs(mLogs); setLogsState(mLogs);
      }
      setSync(local.getQueue().length ? "pending" : "synced");
      return true;
    } catch {
      setSync("offline");
      return false;
    }
  }, [doFlush]);

  // initial load: merge with the sheet if configured (cross-device refresh)
  useEffect(() => {
    (async () => {
      if (isSheetConfigured()) await syncPull();
      setReady(true);
    })();
  }, [syncPull]);

  // flush when connection returns
  useEffect(() => {
    const on = () => doFlush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [doFlush]);

  const savePlan = useCallback((p) => {
    const v = stamp(p);
    setPlanState(v); local.setPlan(v);
    enqueue({ t: "kv", key: "plan", value: v }); doFlush();
  }, [doFlush]);

  const saveState = useCallback((s) => {
    const v = stamp(s);
    setStateState(v); local.setState(v);
    enqueue({ t: "kv", key: "state", value: v }); doFlush();
  }, [doFlush]);

  const appendLogs = useCallback((rows) => {
    if (!rows?.length) return;
    setLogsState((prev) => { const next = [...prev, ...rows]; local.setLogs(next); return next; });
    enqueue({ t: "logs", rows }); doFlush();
  }, [doFlush]);

  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => { const next = { ...prev, ...patch }; local.setSettings(next); return next; });
  }, []);

  const refreshFromSheet = useCallback(async () => {
    if (!isSheetConfigured()) return { ok: false, reason: "no-sheet" };
    const ok = await syncPull();
    return ok ? { ok: true } : { ok: false, reason: "offline" };
  }, [syncPull]);

  const resetAll = useCallback(() => {
    const p = stamp(buildDefaultPlan()); const s = stamp(defaultState());
    setPlanState(p); setStateState(s); setLogsState([]);
    local.setPlan(p); local.setState(s); local.setLogs([]); local.clearQueue();
    enqueue({ t: "reset" });
    enqueue({ t: "kv", key: "plan", value: p });
    enqueue({ t: "kv", key: "state", value: s });
    doFlush();
  }, [doFlush]);

  return {
    plan, state, logs, settings, ready, sync,
    savePlan, saveState, appendLogs, updateSettings, refreshFromSheet, resetAll,
  };
}

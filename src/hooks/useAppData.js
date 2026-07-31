import { useCallback, useEffect, useState } from "react";
import { local } from "../lib/storage";
import { buildDefaultPlan } from "../data/defaultPlan";
import { defaultState } from "../lib/core";
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

  // initial load: pull from sheet if configured (cross-device refresh)
  useEffect(() => {
    (async () => {
      if (isSheetConfigured()) {
        try {
          setSync("syncing");
          const data = await pullAll();
          if (data?.plan) { setPlanState(data.plan); local.setPlan(data.plan); }
          if (data?.state) { setStateState(data.state); local.setState(data.state); }
          if (Array.isArray(data?.logs)) { setLogsState(data.logs); local.setLogs(data.logs); }
        } catch {
          /* offline / not reachable — keep local cache */
        }
        await doFlush();
      }
      setReady(true);
    })();
  }, [doFlush]);

  // flush when connection returns
  useEffect(() => {
    const on = () => doFlush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [doFlush]);

  const savePlan = useCallback((p) => {
    setPlanState(p); local.setPlan(p);
    enqueue({ t: "kv", key: "plan", value: p }); doFlush();
  }, [doFlush]);

  const saveState = useCallback((s) => {
    setStateState(s); local.setState(s);
    enqueue({ t: "kv", key: "state", value: s }); doFlush();
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
    try {
      setSync("syncing");
      const data = await pullAll();
      if (data?.plan) { setPlanState(data.plan); local.setPlan(data.plan); }
      if (data?.state) { setStateState(data.state); local.setState(data.state); }
      if (Array.isArray(data?.logs)) { setLogsState(data.logs); local.setLogs(data.logs); }
      setSync("synced");
      return { ok: true };
    } catch (e) { setSync("offline"); return { ok: false, reason: String(e) }; }
  }, []);

  const resetAll = useCallback(() => {
    const p = buildDefaultPlan(); const s = defaultState();
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

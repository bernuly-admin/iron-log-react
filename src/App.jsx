import { useState, useCallback } from "react";
import { Dumbbell, Cloud, CloudOff, Loader2, PartyPopper, Sparkles, X } from "lucide-react";

import { useAppData } from "./hooks/useAppData";
import { useRestTimer } from "./hooks/useRestTimer";
import { useWakeLock } from "./hooks/useWakeLock";
import { advanceIndex, buildLogRows, autoProgress, uid, localISO } from "./lib/core";
import { generateNewPlan } from "./services/aiGenerator";

import BottomNav from "./components/BottomNav";
import RestTimerBar from "./components/RestTimerBar";
import TodayTab from "./components/TodayTab";
import PlanTab from "./components/PlanTab";
import HistoryTab from "./components/HistoryTab";
import ToolsTab from "./components/ToolsTab";
import AiPreviewModal from "./components/AiPreviewModal";

export default function App() {
  const data = useAppData();
  const { plan, state, logs, settings, sync } = data;
  const timer = useRestTimer();
  const [tab, setTab] = useState("today");
  const [toast, setToast] = useState(null);
  const [cycleDone, setCycleDone] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const today = localISO();
  const session = plan.sessions[state.idx];
  const workoutActive = tab === "today" && session.kind === "workout";
  useWakeLock(workoutActive);

  const flash = useCallback((msg, tone = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ---- session handlers ----
  const completeWorkout = (sess, entries) => {
    const rows = buildLogRows(sess, state.idx, entries, today);
    data.appendLogs(rows);
    const { state: ns, wrapped } = advanceIndex(state, plan.sessions.length, today);
    data.saveState(ns);
    timer.stop();
    if (wrapped) setCycleDone(true);
    flash("บันทึกการฝึกแล้ว 💪");
  };

  const skipToday = () => {
    data.appendLogs([{
      logId: uid(), date: today, dayIndex: state.idx, sessionId: "skip", kind: "skip",
      title: session.title, exName: "", perSide: false, setNo: 0, weight: 0, reps: 0, extra: "",
    }]);
    flash("บันทึกว่าวันนี้ไม่ได้ออก — งานนี้ยกไปวันถัดไป", "warn");
  };

  const restDone = (sess) => {
    data.appendLogs([{
      logId: uid(), date: today, dayIndex: state.idx, sessionId: sess.id, kind: "rest",
      title: sess.title, exName: "", perSide: false, setNo: 0, weight: 0, reps: 0, extra: "",
    }]);
    const { state: ns, wrapped } = advanceIndex(state, plan.sessions.length, today);
    data.saveState(ns);
    if (wrapped) setCycleDone(true);
  };

  const cardio = (sess, name, minutes) => {
    data.appendLogs([{
      logId: uid(), date: today, dayIndex: state.idx, sessionId: "cardio", kind: "cardio",
      title: name, exName: name, perSide: false, setNo: 0, weight: 0, reps: 0, extra: `${minutes} นาที`,
    }]);
    flash(`บันทึก ${name} แล้ว`);
  };

  const startRest = () => timer.start(settings.restSec || 90);

  const setCurrentDay = (idx) => {
    // manual recovery / jump: anchor the shift logic to today so no bogus "missed" banner
    data.saveState({ ...state, idx, lastCompletedDate: today });
    flash(`ตั้งเป็น Day ${plan.sessions[idx].day} · ${plan.sessions[idx].title}`);
    setTab("today");
  };

  const editPlan = (si, ei, field, val) => {
    const p = structuredClone(plan);
    p.sessions[si].exercises[ei][field] = val;
    data.savePlan(p);
  };

  const doAutoProgress = () => {
    const { plan: np, changed } = autoProgress(plan, logs);
    data.savePlan(np);
    flash(changed ? `เพิ่มน้ำหนัก ${changed} ท่า` : "ยังไม่มีท่าที่ถึงเกณฑ์");
  };

  const runAi = async () => {
    setAiBusy(true);
    try {
      const np = await generateNewPlan({ plan, logs, settings });
      setPreview(np);
    } catch (e) {
      flash(String(e.message || e), "warn");
    } finally {
      setAiBusy(false);
    }
  };

  const applyAi = () => {
    data.savePlan(preview);
    setPreview(null);
    setCycleDone(false);
    setTab("plan");
    flash("ใช้แผน Phase 2 ใหม่แล้ว 🎉");
  };

  const week = Math.floor(state.idx / 7) + 1;
  const SyncIcon = sync === "synced" ? Cloud : sync === "syncing" ? Loader2 : CloudOff;

  return (
    <div className="max-w-[560px] mx-auto min-h-screen pb-24 relative">
      {/* header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 sticky top-0 bg-ink/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber text-ink grid place-items-center shadow-[0_0_0_1px_rgba(245,180,23,0.4)]">
            <Dumbbell size={18} />
          </div>
          <div>
            <div className="font-black tracking-[2px] font-mono text-[17px] leading-none">IRON LOG</div>
            <div className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
              <SyncIcon size={10} className={sync === "syncing" ? "animate-spin" : ""} />
              {sync === "synced" ? "ซิงก์แล้ว" : sync === "syncing" ? "ซิงก์…" : sync === "pending" ? "รอซิงก์" : sync === "offline" ? "ออฟไลน์" : "เครื่องนี้"}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[["รอบ", state.cycle], ["สัปดาห์", week], ["Day", session.day]].map(([l, v]) => (
            <div key={l} className="bg-panel border border-line rounded-lg px-2.5 py-1 text-center min-w-[42px]">
              <div className="font-mono font-extrabold text-amber text-[15px] leading-none">{v}</div>
              <div className="text-[9px] text-muted">{l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* cycle complete banner */}
      {cycleDone && (
        <div className="mx-3 mb-2 bg-amber/15 border border-amber/50 rounded-xl p-3.5 flex items-start gap-3">
          <PartyPopper size={20} className="text-amber shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-extrabold text-[14px]">คุณฝึกครบ 14 วันเรียบร้อยแล้ว! 🎉</div>
            <div className="text-[12px] text-muted mt-0.5">ให้ AI วิเคราะห์สถิติแล้วสร้างตารางรอบใหม่ (Phase 2) ปรับน้ำหนักให้เหมาะกับคุณ</div>
            <button onClick={runAi} disabled={aiBusy}
              className="mt-2.5 flex items-center gap-2 bg-amber text-ink font-extrabold rounded-lg px-3.5 py-2 text-[13px] disabled:opacity-60">
              {aiBusy ? <><Loader2 size={15} className="animate-spin" /> กำลังเจน…</> : <><Sparkles size={15} /> ให้ AI เจนแผน Phase 2</>}
            </button>
          </div>
          <button onClick={() => setCycleDone(false)} className="text-muted"><X size={18} /></button>
        </div>
      )}

      <main className="px-3.5">
        {tab === "today" && (
          <TodayTab plan={plan} state={state} logs={logs} settings={settings}
            onCompleteWorkout={completeWorkout} onSkip={skipToday}
            onRestDone={restDone} onCardio={cardio} onLogSet={startRest} />
        )}
        {tab === "plan" && (
          <PlanTab plan={plan} curIdx={state.idx} onEdit={editPlan} onAiGenerate={runAi} aiBusy={aiBusy} onSetCurrent={setCurrentDay} />
        )}
        {tab === "history" && <HistoryTab plan={plan} logs={logs} />}
        {tab === "tools" && (
          <ToolsTab settings={settings} updateSettings={data.updateSettings} logs={logs} sync={sync}
            onAutoProgress={doAutoProgress} onRefresh={data.refreshFromSheet} onReset={() => { data.resetAll(); setTab("today"); }} />
        )}
      </main>

      <RestTimerBar timer={timer} />
      <BottomNav tab={tab} setTab={setTab} />

      {preview && (
        <AiPreviewModal oldPlan={plan} newPlan={preview} onConfirm={applyAi} onClose={() => setPreview(null)} />
      )}

      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-[92px] z-40 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-center max-w-[88%]
          bg-panel2 border shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${toast.tone === "warn" ? "border-amber/50 text-[#F5D488]" : "border-good/40"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Waves, Footprints, ArrowRight } from "lucide-react";
import ExerciseCard from "./ExerciseCard";
import { CAT } from "../data/defaultPlan";
import { localISO, thaiDate, missedDays, lastEntryFor } from "../lib/core";
import { local } from "../lib/storage";

export default function TodayTab({
  plan, state, logs, settings,
  onCompleteWorkout, onSkip, onRestDone, onCardio, onLogSet,
}) {
  const today = localISO();
  const session = plan.sessions[state.idx];
  const cat = CAT[session.cat] || CAT.rest;
  const doneToday = logs.some((l) => l.date === today && l.sessionId === session.id);
  const missed = missedDays(state, today);

  const draftId = `${today}::${session.id}`;
  const [entries, setEntries] = useState({});
  useEffect(() => {
    // Restore an in-progress draft if one exists for this day+session,
    // otherwise seed the sets from the plan's targets.
    const saved = local.getDraft(draftId);
    if (saved && Object.keys(saved).length) { setEntries(saved); return; }
    const init = {};
    for (const e of session.exercises)
      init[e.id] = Array.from({ length: e.sets }, () => ({ w: e.weight, reps: e.lo, done: false }));
    setEntries(init);
  }, [session.id, today]); // reset when the session (or day) changes

  // autosave the draft so a reload / app switch mid-workout never loses input
  useEffect(() => {
    if (session.kind === "workout" && Object.keys(entries).length) local.setDraft(draftId, entries);
  }, [entries, draftId, session.kind]);

  const setSetsFor = (exId) => (updater) =>
    setEntries((prev) => ({ ...prev, [exId]: typeof updater === "function" ? updater(prev[exId] || []) : updater }));

  const clearDraft = () => local.clearDraft(draftId);

  const nxt = plan.sessions[(state.idx + 1) % plan.sessions.length];

  return (
    <div className="fadein">
      <div className="flex items-center justify-between px-0.5 mb-3">
        <span className="text-sm text-muted font-semibold">{thaiDate(today)}</span>
        {doneToday && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-good bg-good/15 border border-good/30 px-2.5 py-1 rounded-full">
            <Check size={13} /> ทำวันนี้แล้ว
          </span>
        )}
      </div>

      {missed > 0 && !doneToday && (
        <div className="flex gap-2 items-start bg-amber/15 border border-amber/40 text-[#F5D488] rounded-xl px-3 py-2.5 text-[12.5px] leading-relaxed mb-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber" />
          เลื่อนแผนอัตโนมัติ — คุณข้ามไป {missed} วัน งานที่ค้างถูกยกมาเป็น “วันนี้” ให้แล้ว
        </div>
      )}

      <div className="bg-panel border border-line rounded-2xl p-4 pb-2 relative overflow-hidden mb-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        style={{ borderLeftWidth: 5, borderLeftColor: cat.c }}>
        <div className="text-[10px] tracking-[1.5px] text-muted font-bold uppercase font-mono">
          {session.kind === "workout" ? "ใบสั่งงานวันนี้" : "วันพัก"} · DAY {session.day}
        </div>
        <div className="text-[23px] font-black mt-0.5">{session.title}</div>
        {session.subtitle && <div className="text-xs text-muted mt-0.5">{session.subtitle}</div>}
      </div>

      {session.kind === "workout" ? (
        <>
          <div className="mt-3">
            {session.exercises.map((e) => (
              <ExerciseCard key={e.id} ex={e} unit={plan.unit}
                sets={entries[e.id] || []} setSets={setSetsFor(e.id)}
                last={lastEntryFor(logs, e.name)} onLogSet={onLogSet} />
            ))}
          </div>

          {!doneToday ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { clearDraft(); onCompleteWorkout(session, entries); }}
                className="flex-1 flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3.5 shadow-[0_6px_18px_rgba(245,180,23,0.22)] active:translate-y-px">
                <Check size={17} /> บันทึกการฝึกเสร็จ
              </button>
              <button onClick={() => { clearDraft(); onSkip(); }}
                className="px-4 rounded-xl border border-line text-muted text-[13px] font-semibold">
                ไม่ได้ออก
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center bg-good/10 border border-good/30 text-good rounded-xl py-3.5 text-[13.5px] font-semibold mt-3">
              <Check size={16} /> ทำเซสชันนี้แล้ววันนี้ — พรุ่งนี้ขึ้นงานถัดไป
            </div>
          )}
        </>
      ) : (
        <RestBlock session={session} today={today} doneToday={doneToday}
          onRestDone={onRestDone} onCardio={onCardio} />
      )}

      <div className="flex items-center gap-2 mt-3 px-1 text-[12px] text-muted">
        ถัดไป <span className="w-2 h-2 rounded-sm" style={{ background: (CAT[nxt.cat] || CAT.rest).c }} />
        Day {nxt.day} · {nxt.title} <ArrowRight size={13} className="ml-auto" />
      </div>
    </div>
  );
}

function RestBlock({ session, today, doneToday, onRestDone, onCardio }) {
  const [mins, setMins] = useState("");
  return (
    <div className="mt-3">
      {session.recovery.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 bg-panel2 border border-line rounded-xl px-3 py-3 mb-2">
          <Footprints size={14} className="text-sky" />
          <span className="text-[13.5px] font-semibold">{r.name}</span>
          <span className="ml-auto text-xs text-muted font-mono">{r.detail}</span>
        </div>
      ))}

      <div className="flex gap-2 mt-1 mb-3">
        <input inputMode="numeric" placeholder="นาที" value={mins} onChange={(e) => setMins(e.target.value)}
          className="w-20 bg-ink border border-line rounded-lg text-center font-mono font-bold py-2.5 outline-none" />
        <button onClick={() => { onCardio(session, "เดินลู่วิ่งชัน", +mins || 0); setMins(""); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-panel2 border border-line text-sky rounded-lg text-[12.5px] font-bold">
          <Footprints size={13} /> เดิน
        </button>
        <button onClick={() => { onCardio(session, "ว่ายน้ำ", +mins || 0); setMins(""); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-panel2 border border-line text-sky rounded-lg text-[12.5px] font-bold">
          <Waves size={13} /> ว่ายน้ำ
        </button>
      </div>

      {!doneToday ? (
        <button onClick={() => onRestDone(session)}
          className="w-full flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3.5 active:translate-y-px">
          <Check size={17} /> พักแล้ว — ไปวันถัดไป
        </button>
      ) : (
        <div className="flex items-center gap-2 justify-center bg-good/10 border border-good/30 text-good rounded-xl py-3.5 text-[13.5px] font-semibold">
          <Check size={16} /> ผ่านวันพักนี้แล้ว
        </div>
      )}
    </div>
  );
}
          </span>
        )}
      </div>

      {missed > 0 && !doneToday && (
        <div className="flex gap-2 items-start bg-amber/15 border border-amber/40 text-[#F5D488] rounded-xl px-3 py-2.5 text-[12.5px] leading-relaxed mb-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber" />
          เลื่อนแผนอัตโนมัติ — คุณข้ามไป {missed} วัน งานที่ค้างถูกยกมาเป็น “วันนี้” ให้แล้ว
        </div>
      )}

      <div className="bg-panel border border-line rounded-2xl p-4 pb-2 relative overflow-hidden mb-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        style={{ borderLeftWidth: 5, borderLeftColor: cat.c }}>
        <div className="text-[10px] tracking-[1.5px] text-muted font-bold uppercase font-mono">
          {session.kind === "workout" ? "ใบสั่งงานวันนี้" : "วันพัก"} · DAY {session.day}
        </div>
        <div className="text-[23px] font-black mt-0.5">{session.title}</div>
        {session.subtitle && <div className="text-xs text-muted mt-0.5">{session.subtitle}</div>}
      </div>

      {session.kind === "workout" ? (
        <>
          <div className="mt-3">
            {session.exercises.map((e) => (
              <ExerciseCard key={e.id} ex={e} unit={plan.unit}
                sets={entries[e.id] || []} setSets={setSetsFor(e.id)}
                last={lastEntryFor(logs, e.name)} onLogSet={onLogSet} />
            ))}
          </div>

          {!doneToday ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => onCompleteWorkout(session, entries)}
                className="flex-1 flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3.5 shadow-[0_6px_18px_rgba(245,180,23,0.22)] active:translate-y-px">
                <Check size={17} /> บันทึกการฝึกเสร็จ
              </button>
              <button onClick={onSkip}
                className="px-4 rounded-xl border border-line text-muted text-[13px] font-semibold">
                ไม่ได้ออก
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center bg-good/10 border border-good/30 text-good rounded-xl py-3.5 text-[13.5px] font-semibold mt-3">
              <Check size={16} /> ทำเซสชันนี้แล้ววันนี้ — พรุ่งนี้ขึ้นงานถัดไป
            </div>
          )}
        </>
      ) : (
        <RestBlock session={session} today={today} doneToday={doneToday}
          onRestDone={onRestDone} onCardio={onCardio} />
      )}

      <div className="flex items-center gap-2 mt-3 px-1 text-[12px] text-muted">
        ถัดไป <span className="w-2 h-2 rounded-sm" style={{ background: (CAT[nxt.cat] || CAT.rest).c }} />
        Day {nxt.day} · {nxt.title} <ArrowRight size={13} className="ml-auto" />
      </div>
    </div>
  );
}

function RestBlock({ session, today, doneToday, onRestDone, onCardio }) {
  const [mins, setMins] = useState("");
  return (
    <div className="mt-3">
      {session.recovery.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 bg-panel2 border border-line rounded-xl px-3 py-3 mb-2">
          <Footprints size={14} className="text-sky" />
          <span className="text-[13.5px] font-semibold">{r.name}</span>
          <span className="ml-auto text-xs text-muted font-mono">{r.detail}</span>
        </div>
      ))}

      <div className="flex gap-2 mt-1 mb-3">
        <input inputMode="numeric" placeholder="นาที" value={mins} onChange={(e) => setMins(e.target.value)}
          className="w-20 bg-ink border border-line rounded-lg text-center font-mono font-bold py-2.5 outline-none" />
        <button onClick={() => { onCardio(session, "เดินลู่วิ่งชัน", +mins || 0); setMins(""); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-panel2 border border-line text-sky rounded-lg text-[12.5px] font-bold">
          <Footprints size={13} /> เดิน
        </button>
        <button onClick={() => { onCardio(session, "ว่ายน้ำ", +mins || 0); setMins(""); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-panel2 border border-line text-sky rounded-lg text-[12.5px] font-bold">
          <Waves size={13} /> ว่ายน้ำ
        </button>
      </div>

      {!doneToday ? (
        <button onClick={() => onRestDone(session)}
          className="w-full flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3.5 active:translate-y-px">
          <Check size={17} /> พักแล้ว — ไปวันถัดไป
        </button>
      ) : (
        <div className="flex items-center gap-2 justify-center bg-good/10 border border-good/30 text-good rounded-xl py-3.5 text-[13.5px] font-semibold">
          <Check size={16} /> ผ่านวันพักนี้แล้ว
        </div>
      )}
    </div>
  );
}

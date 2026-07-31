import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Minus, Check, History as HistoryIcon } from "lucide-react";
import { CAT } from "../data/defaultPlan";
import { thaiDate } from "../lib/core";

function Stepper({ value, step, onChange, small }) {
  const set = (v) => onChange(v === "" ? "" : +(+v).toFixed(2));
  return (
    <div className={`flex items-center bg-ink border border-line rounded-lg overflow-hidden ${small ? "" : ""}`}>
      <button className="px-2.5 py-2 text-muted active:bg-panel2" onClick={() => set(Math.max(0, (Number(value) || 0) - step))}>
        <Minus size={13} />
      </button>
      <input inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full min-w-0 bg-transparent text-center font-mono font-extrabold text-base py-1.5 outline-none" />
      <button className="px-2.5 py-2 text-muted active:bg-panel2" onClick={() => set((Number(value) || 0) + step)}>
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function ExerciseCard({ ex, sets, setSets, last, unit, onLogSet }) {
  const [open, setOpen] = useState(true);
  const cat = CAT[ex.cat] || CAT.legs;

  const update = (i, field, val) =>
    setSets((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: val } : s)));
  const toggle = (i) => {
    setSets((prev) => prev.map((s, j) => (j === i ? { ...s, done: !s.done } : s)));
    const justDone = !sets[i].done;
    if (justDone) onLogSet?.(); // start rest timer
  };
  const addSet = () => setSets((prev) => [...prev, { ...prev[prev.length - 1], done: false }]);
  const rmSet = () => setSets((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const suggestUp = last && last.sets.length >= 2 && last.sets.every((s) => s.reps >= ex.hi);

  return (
    <div className="bg-panel2 border border-line rounded-xl overflow-hidden mb-2.5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2.5 px-3 py-3 text-left">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: cat.c }} />
        <span className="font-bold text-[14.5px] flex-1">
          {ex.name}{ex.perSide && <em className="not-italic text-muted text-xs font-normal"> · ต่อข้าง</em>}
        </span>
        {open ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
      </button>

      {last && (
        <div className="flex items-center gap-1.5 flex-wrap px-3 pb-2 -mt-1 text-[11.5px] text-muted font-mono">
          <HistoryIcon size={12} className="text-sky" />
          ครั้งก่อน ({thaiDate(last.date)}): {last.sets.map((s) => `${s.w}×${s.reps}`).join("  ")}
          {suggestUp && <span className="text-amber font-bold bg-amber/15 px-1.5 rounded-full">↑ +2.5</span>}
        </div>
      )}

      {open && (
        <div className="px-2.5 pb-2.5">
          <div className="grid grid-cols-[34px_1fr_1fr_40px] gap-2 text-[10px] text-muted uppercase tracking-wide px-0.5 pb-1.5">
            <span>เซ็ต</span><span>น้ำหนัก ({unit})</span><span>ครั้ง</span><span></span>
          </div>
          {sets.map((s, i) => (
            <div key={i} className="grid grid-cols-[34px_1fr_1fr_40px] gap-2 items-center mb-1.5">
              <span className="font-mono font-extrabold text-muted text-center">{i + 1}</span>
              <Stepper value={s.w} step={(Number(s.w) || 0) >= 20 ? 2.5 : 1.25} onChange={(v) => update(i, "w", v)} />
              <Stepper value={s.reps} step={1} onChange={(v) => update(i, "reps", v)} small />
              <button onClick={() => toggle(i)}
                className={`h-10 rounded-lg grid place-items-center border transition
                  ${s.done ? "bg-good border-good text-ink" : "bg-ink border-line text-muted"}`}>
                <Check size={15} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <button onClick={addSet} className="flex items-center gap-1 text-[11.5px] text-muted bg-ink border border-line rounded-lg px-2.5 py-1.5">
              <Plus size={13} /> เพิ่มเซ็ต
            </button>
            <button onClick={rmSet} className="flex items-center gap-1 text-[11.5px] text-muted bg-ink border border-line rounded-lg px-2.5 py-1.5">
              <Minus size={13} /> ลบเซ็ต
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

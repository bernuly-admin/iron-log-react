import { Plus, Minus, Sparkles, Loader2 } from "lucide-react";
import { CAT } from "../data/defaultPlan";

function Field({ label, value, step = 1, onChange }) {
  return (
    <div className="flex-1 bg-ink border border-line rounded-lg px-1.5 py-1.5 text-center">
      <div className="text-[9.5px] text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <button className="w-6 h-6 grid place-items-center bg-panel2 border border-line rounded text-muted"
          onClick={() => onChange(+(Math.max(0, (Number(value) || 0) - step)).toFixed(2))}>
          <Minus size={11} />
        </button>
        <span className="font-mono font-extrabold text-sm">{value}</span>
        <button className="w-6 h-6 grid place-items-center bg-panel2 border border-line rounded text-muted"
          onClick={() => onChange(+((Number(value) || 0) + step).toFixed(2))}>
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

export default function PlanTab({ plan, curIdx, onEdit, onAiGenerate, aiBusy, onSetCurrent }) {
  return (
    <div className="fadein">
      <button onClick={onAiGenerate} disabled={aiBusy}
        className="w-full flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3 mb-3 disabled:opacity-60">
        {aiBusy ? <><Loader2 size={16} className="animate-spin" /> กำลังให้ AI เจน…</> : <><Sparkles size={16} /> ให้ AI เจนแผนใหม่ทันที</>}
      </button>
      <div className="text-[11px] text-muted mb-3 px-1">แตะปุ่ม +/- เพื่อแก้เซ็ต/เร็พ/น้ำหนักของแต่ละท่าได้เลย</div>

      {plan.sessions.map((s, si) => {
        const cat = CAT[s.cat] || CAT.rest;
        const cur = si === curIdx;
        return (
          <div key={s.id} className={`bg-panel border rounded-xl p-3 mb-2.5 ${cur ? "border-amber shadow-[0_0_0_1px_rgba(245,180,23,0.3)]" : "border-line"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cat.c }} />
              <span className="font-mono text-[11px] text-muted font-extrabold">DAY {s.day}</span>
              <span className="text-[14.5px] font-extrabold">{s.title}</span>
              {cur ? (
                <span className="ml-auto text-[10px] font-extrabold text-ink bg-amber px-2 py-0.5 rounded-full">ตอนนี้</span>
              ) : (
                <button onClick={() => onSetCurrent?.(si)}
                  className="ml-auto text-[10px] font-bold text-muted border border-line rounded-full px-2 py-0.5 active:bg-panel2">
                  ตั้งเป็นวันปัจจุบัน
                </button>
              )}
            </div>

            {s.kind === "workout" ? (
              <div className="mt-2 space-y-2">
                {s.exercises.map((e, ei) => (
                  <div key={e.id} className="border-t border-line pt-2">
                    <div className="text-[13px] font-semibold mb-1.5">
                      {e.name}{e.perSide && <em className="not-italic text-muted text-[11px] font-normal"> · ต่อข้าง</em>}
                      <span className="block text-muted text-[10.5px] font-normal">{e.equip}</span>
                    </div>
                    <div className="flex gap-2">
                      <Field label="เซ็ต" value={e.sets} onChange={(v) => onEdit(si, ei, "sets", Math.max(1, Math.round(v)))} />
                      <Field label="เร็พต่ำ" value={e.lo} onChange={(v) => onEdit(si, ei, "lo", Math.max(1, Math.round(v)))} />
                      <Field label="เร็พสูง" value={e.hi} onChange={(v) => onEdit(si, ei, "hi", Math.max(1, Math.round(v)))} />
                      <Field label="kg" value={e.weight} step={(Number(e.weight) || 0) >= 20 ? 2.5 : 1.25} onChange={(v) => onEdit(si, ei, "weight", Math.max(0, v))} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1 space-y-0.5">
                {s.recovery.map((r, i) => (
                  <div key={i} className="text-[12.5px]">{r.name} <span className="text-muted text-[11px] font-mono">{r.detail}</span></div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

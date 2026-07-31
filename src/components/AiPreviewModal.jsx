import { X, Check, Sparkles, ArrowRight } from "lucide-react";
import { CAT } from "../data/defaultPlan";

// Build a quick lookup of current weights by exercise name for diffing.
function weightMap(plan) {
  const m = {};
  for (const s of plan.sessions) for (const e of s.exercises || []) if (!(e.name in m)) m[e.name] = e.weight;
  return m;
}

export default function AiPreviewModal({ oldPlan, newPlan, onConfirm, onClose }) {
  if (!newPlan) return null;
  const oldW = weightMap(oldPlan);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-panel border border-line w-full max-w-[560px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-line">
          <Sparkles size={18} className="text-amber" />
          <div className="font-extrabold text-[15px]">แผนใหม่จาก AI (Phase 2)</div>
          <button onClick={onClose} className="ml-auto text-muted"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-3 space-y-2">
          <div className="text-[12px] text-muted px-1 mb-1">ตรวจดูก่อนนำไปใช้ · ตัวเลขสีเหลืองคือน้ำหนักที่เปลี่ยนจากเดิม</div>
          {newPlan.sessions.map((s, i) => {
            const cat = CAT[s.cat] || CAT.rest;
            return (
              <div key={i} className="bg-panel2 border border-line rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cat.c }} />
                  <span className="font-mono text-[11px] text-muted font-bold">DAY {s.day}</span>
                  <span className="text-[13.5px] font-bold">{s.title}</span>
                </div>
                {s.kind === "workout" ? (
                  <div className="space-y-1 mt-1">
                    {s.exercises.map((e, j) => {
                      const prev = oldW[e.name];
                      const changed = prev != null && prev !== e.weight;
                      return (
                        <div key={j} className="flex items-center text-[12.5px] gap-2">
                          <span className="flex-1">{e.name}</span>
                          <span className="font-mono text-muted">{e.sets}×{e.lo}-{e.hi}</span>
                          <span className={`font-mono font-bold flex items-center gap-1 ${changed ? "text-amber" : "text-muted"}`}>
                            {changed && <><span className="text-muted line-through text-[11px]">{prev}</span><ArrowRight size={10} /></>}
                            {e.weight}kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[12px] text-muted">พัก — {s.recovery.map((r) => r.name).join(", ")}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-line flex gap-2">
          <button onClick={onClose} className="px-4 rounded-xl border border-line text-muted font-semibold text-[13px] py-3">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 bg-amber text-ink font-extrabold rounded-xl py-3">
            <Check size={17} /> Confirm & Apply New Program
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { allExerciseNames, setsByExercise, thaiDate } from "../lib/core";

function LineChart({ data }) {
  // data: [{ date, e1rm, top }]
  const W = 320, H = 150, pad = 26;
  if (data.length < 2) return null;
  const xs = data.map((_, i) => i);
  const ys = data.flatMap((d) => [d.e1rm, d.top]);
  const minY = Math.min(...ys) * 0.95, maxY = Math.max(...ys) * 1.05 || 1;
  const px = (i) => pad + (i / (data.length - 1)) * (W - pad * 1.2);
  const py = (v) => H - pad - ((v - minY) / (maxY - minY || 1)) * (H - pad * 1.6);
  const path = (key) => data.map((d, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((f) => {
        const y = H - pad - f * (H - pad * 1.6);
        return <line key={f} x1={pad} y1={y} x2={W - 6} y2={y} stroke="#2A2E35" strokeWidth="1" />;
      })}
      <path d={path("e1rm")} fill="none" stroke="#F5B417" strokeWidth="2.5" />
      <path d={path("top")} fill="none" stroke="#4C9AE6" strokeWidth="2" />
      {data.map((d, i) => <circle key={i} cx={px(i)} cy={py(d.e1rm)} r="3" fill="#F5B417" />)}
      <text x={pad} y={H - 6} fill="#8A929B" fontSize="9">{data[0].date.slice(5)}</text>
      <text x={W - 6} y={H - 6} fill="#8A929B" fontSize="9" textAnchor="end">{data[data.length - 1].date.slice(5)}</text>
    </svg>
  );
}

export default function HistoryTab({ plan, logs }) {
  const names = useMemo(() => allExerciseNames(plan, logs), [plan, logs]);
  const [pick, setPick] = useState(names[0] || "");
  const active = names.includes(pick) ? pick : names[0] || "";
  const hist = useMemo(() => (active ? setsByExercise(logs, active) : []), [logs, active]);
  const pr = hist.reduce((m, h) => Math.max(m, h.e1rm), 0);

  if (!names.length) return <div className="fadein text-muted text-sm p-6 text-center">ยังไม่มีท่าให้แสดง</div>;

  return (
    <div className="fadein">
      <select value={active} onChange={(e) => setPick(e.target.value)}
        className="w-full bg-panel border border-line rounded-xl px-3 py-3 font-bold outline-none mb-3">
        {names.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>

      {pr > 0 && (
        <div className="flex items-center gap-2 bg-amber/15 border border-amber/35 rounded-xl px-3 py-2.5 mb-3 text-[13px]">
          <Trophy size={16} className="text-amber" /> สถิติดีสุด (est. 1RM): <b className="text-amber font-mono">{pr} kg</b>
        </div>
      )}

      {hist.length >= 2 ? (
        <div className="bg-panel border border-line rounded-xl p-2 mb-3">
          <LineChart data={hist.map((h) => ({ date: h.date, e1rm: h.e1rm, top: h.top }))} />
          <div className="flex gap-4 justify-center text-[10px] text-muted pb-1">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber inline-block" /> est.1RM</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-sky inline-block" /> เซ็ตหนักสุด</span>
          </div>
        </div>
      ) : hist.length === 1 ? (
        <div className="text-muted text-[12.5px] text-center p-4 border border-dashed border-line rounded-xl mb-3">
          ฝึกท่านี้อีกครั้งเพื่อดูกราฟความคืบหน้า
        </div>
      ) : null}

      <div className="space-y-1.5">
        {[...hist].reverse().map((h, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-panel border border-line rounded-lg px-3 py-2.5">
            <span className="text-xs text-muted w-[74px] shrink-0">{thaiDate(h.date)}</span>
            <span className="flex gap-1 flex-wrap flex-1">
              {h.sets.map((s, j) => (
                <span key={j} className="bg-panel2 border border-line rounded px-1.5 py-0.5 font-mono text-[11.5px]">{s.w}×{s.reps}</span>
              ))}
            </span>
            <span className="font-mono font-black text-amber">{h.e1rm}<span className="text-[9px] text-muted">kg</span></span>
          </div>
        ))}
        {!hist.length && <div className="text-muted text-[12.5px] text-center p-4">ยังไม่มีประวัติของท่านี้</div>}
      </div>
    </div>
  );
}

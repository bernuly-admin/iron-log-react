import { Plus, Minus, X } from "lucide-react";

const fmt = (s) => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export default function RestTimerBar({ timer }) {
  const { running, remaining, total, adjust, stop } = timer;
  if (!running) return null;

  const R = 15;
  const C = 2 * Math.PI * R;
  const pct = total > 0 ? remaining / total : 0;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[66px] w-full max-w-[560px] px-3 z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-3 bg-panel2 border border-amber/60 rounded-2xl px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
          <circle cx="20" cy="20" r={R} fill="none" stroke="#33383F" strokeWidth="4" />
          <circle cx="20" cy="20" r={R} fill="none" stroke="#F5B417" strokeWidth="4"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </svg>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted font-mono">พักเซ็ต</div>
          <div className="font-mono font-black text-2xl text-amber leading-none">{fmt(remaining)}</div>
        </div>
        <button onClick={() => adjust(-30)} className="w-11 h-11 rounded-xl bg-ink border border-line grid place-items-center text-muted active:scale-95">
          <div className="flex items-center text-xs font-mono"><Minus size={12} />30</div>
        </button>
        <button onClick={() => adjust(30)} className="w-11 h-11 rounded-xl bg-ink border border-line grid place-items-center text-muted active:scale-95">
          <div className="flex items-center text-xs font-mono"><Plus size={12} />30</div>
        </button>
        <button onClick={stop} className="w-11 h-11 rounded-xl bg-amber text-ink grid place-items-center active:scale-95">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

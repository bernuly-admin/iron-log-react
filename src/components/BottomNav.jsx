import { Flame, CalendarDays, LineChart, Wrench } from "lucide-react";

const TABS = [
  { k: "today", label: "วันนี้", Icon: Flame },
  { k: "plan", label: "แผน", Icon: CalendarDays },
  { k: "history", label: "ประวัติ", Icon: LineChart },
  { k: "tools", label: "เครื่องมือ", Icon: Wrench },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] flex bg-ink/95 backdrop-blur border-t border-line z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ k, label, Icon }) => (
        <button key={k} onClick={() => setTab(k)}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition
            ${tab === k ? "text-amber" : "text-muted"}`}>
          <Icon size={20} className={tab === k ? "drop-shadow-[0_0_8px_rgba(245,180,23,0.5)]" : ""} />
          {label}
        </button>
      ))}
    </nav>
  );
}

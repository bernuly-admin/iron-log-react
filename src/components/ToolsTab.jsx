import { useState } from "react";
import { Zap, RefreshCw, Download, Cloud, CloudOff, KeyRound, Timer, Trash2, Loader2, Check } from "lucide-react";
import { LOG_COLUMNS } from "../lib/core";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4 mb-3">
      <div className="flex items-center gap-2 font-extrabold text-[14.5px] mb-2"><Icon size={16} className="text-amber" /> {title}</div>
      {children}
    </div>
  );
}

const SYNC_LABEL = {
  local: ["โหมดเครื่องนี้ (ยังไม่ต่อชีต)", CloudOff, "text-muted"],
  syncing: ["กำลังซิงก์…", Loader2, "text-sky"],
  synced: ["ซิงก์กับ Google Sheets แล้ว", Cloud, "text-good"],
  pending: ["มีข้อมูลรอซิงก์", Cloud, "text-amber"],
  offline: ["ออฟไลน์ — จะซิงก์เมื่อกลับมาออนไลน์", CloudOff, "text-amber"],
};

export default function ToolsTab({ settings, updateSettings, onAutoProgress, onRefresh, onReset, logs, sync }) {
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState("");
  const [S, Icon, color] = SYNC_LABEL[sync] || SYNC_LABEL.local;

  const exportCsv = () => {
    const head = LOG_COLUMNS.join(",");
    const body = logs.map((l) => LOG_COLUMNS.map((c) => JSON.stringify(l[c] ?? "")).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iron-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fadein">
      <div className={`flex items-center gap-2 text-[12.5px] mb-3 ${color}`}>
        <Icon size={15} className={sync === "syncing" ? "animate-spin" : ""} /> {S}
      </div>

      <Section icon={Zap} title="ปรับน้ำหนักอัตโนมัติ">
        <p className="text-[12.5px] text-muted leading-relaxed mb-3">
          เพิ่ม +1.25–2.5 kg ให้เฉพาะท่าที่ครั้งล่าสุดทำครบเร็พสูงสุดทุกเซ็ต (Progressive Overload) ทำงานในเครื่อง ไม่ต้องใช้ AI
        </p>
        <button onClick={onAutoProgress} className="w-full bg-amber text-ink font-extrabold rounded-xl py-3 flex items-center justify-center gap-2">
          <Zap size={16} /> ปรับน้ำหนักจากผลล่าสุด
        </button>
      </Section>

      <Section icon={Cloud} title="Google Sheets (ซิงก์หลายเครื่อง)">
        <label className="text-[11px] text-muted uppercase tracking-wide">Apps Script Web App URL</label>
        <input value={settings.sheetUrl} placeholder="https://script.google.com/macros/s/xxxx/exec"
          onChange={(e) => updateSettings({ sheetUrl: e.target.value.trim() })}
          className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-[12px] font-mono outline-none mt-1 mb-2" />
        <button onClick={async () => { setBusy(true); await onRefresh(); setBusy(false); }} disabled={busy || !settings.sheetUrl}
          className="w-full flex items-center justify-center gap-2 bg-panel2 border border-line rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} ดึงข้อมูลจากชีต
        </button>
      </Section>

      <Section icon={KeyRound} title="AI Program Generator">
        <label className="text-[11px] text-muted uppercase tracking-wide">ผู้ให้บริการ</label>
        <div className="flex gap-2 my-1.5">
          {["gemini", "claude"].map((p) => (
            <button key={p} onClick={() => updateSettings({ aiProvider: p })}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold border ${settings.aiProvider === p ? "bg-amber text-ink border-amber" : "bg-ink border-line text-muted"}`}>
              {p === "gemini" ? "Gemini" : "Claude"}{settings.aiProvider === p && <Check size={13} className="inline ml-1" />}
            </button>
          ))}
        </div>
        <label className="text-[11px] text-muted uppercase tracking-wide">API Key</label>
        <input type="password" value={settings.aiKey} placeholder="วาง API Key ที่นี่"
          onChange={(e) => updateSettings({ aiKey: e.target.value.trim() })}
          className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-[12px] font-mono outline-none mt-1" />
        <p className="text-[11px] text-muted leading-relaxed mt-2">
          {settings.aiProvider === "gemini"
            ? "รับคีย์ฟรีที่ Google AI Studio · เรียกจากเบราว์เซอร์ได้เลย"
            : "Claude ต้องเปิด direct-browser-access (ดู README) แนะนำ Gemini สำหรับ client-side"}
          <br />⚠️ คีย์เก็บในเครื่องนี้ (localStorage) — ใช้บนอุปกรณ์ส่วนตัวเท่านั้น
        </p>
      </Section>

      <Section icon={Timer} title="เวลาพักเซ็ต (Rest Timer)">
        <div className="flex items-center gap-2">
          {[60, 90, 120, 150].map((v) => (
            <button key={v} onClick={() => updateSettings({ restSec: v })}
              className={`flex-1 py-2.5 rounded-lg font-mono font-bold border ${settings.restSec === v ? "bg-amber text-ink border-amber" : "bg-ink border-line text-muted"}`}>
              {v}s
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Download} title="ข้อมูล">
        <button onClick={exportCsv} disabled={!logs.length}
          className="w-full flex items-center justify-center gap-2 bg-panel2 border border-line rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-50 mb-3">
          <Download size={15} /> ดาวน์โหลดประวัติ (CSV)
        </button>
        <label className="text-[11px] text-muted">พิมพ์ RESET เพื่อยืนยันการล้างข้อมูลทั้งหมด</label>
        <div className="flex gap-2 mt-1">
          <input value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)}
            className="flex-1 bg-ink border border-line rounded-lg px-3 py-2.5 text-[12px] font-mono outline-none" />
          <button onClick={() => { onReset(); setConfirmReset(""); }} disabled={confirmReset !== "RESET"}
            className="flex items-center gap-1.5 bg-bad/15 border border-bad/40 text-bad rounded-lg px-3 text-[13px] font-bold disabled:opacity-40">
            <Trash2 size={14} /> รีเซ็ต
          </button>
        </div>
      </Section>

      <p className="text-[11px] text-muted text-center px-4 leading-relaxed">
        น้ำหนักเริ่มต้นเป็นค่าประมาณ ปรับให้ตรงกับที่ยกได้จริงในแท็บ ‘แผน’ · ข้อมูลบันทึกอัตโนมัติทุกครั้ง
      </p>
    </div>
  );
}

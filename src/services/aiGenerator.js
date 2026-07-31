// Sends 14-day performance history to an AI model and gets back a NEW 14-day
// plan (Phase 2) with weights/sets/reps adjusted to the real numbers logged.
//
// Default provider = Gemini, because its REST endpoint allows direct
// browser calls with an API key. (Claude/Anthropic blocks browser CORS unless
// you proxy it — see README for the Apps Script proxy option.)

import { uid } from "../lib/core.js";
import { setsByExercise } from "../lib/core.js";
import { CAT } from "../data/defaultPlan.js";

const GEMINI_MODEL = "gemini-1.5-flash";

function summarizePerformance(plan, logs) {
  const lines = [];
  for (const s of plan.sessions) {
    for (const e of s.exercises || []) {
      const hist = setsByExercise(logs, e.name);
      if (!hist.length) {
        lines.push(`${e.name}: target ${e.sets}x${e.lo}-${e.hi} @ ${e.weight}kg (ยังไม่มีสถิติ)`);
        continue;
      }
      const last = hist[hist.length - 1];
      const done = last.sets.map((x) => `${x.w}x${x.reps}`).join(", ");
      lines.push(`${e.name}: target ${e.sets}x${e.lo}-${e.hi} @ ${e.weight}kg | ล่าสุด ${last.date}: ${done} (best 1RM ${last.e1rm}kg)`);
    }
  }
  return lines.join("\n");
}

const SCHEMA_HINT = `ตอบเป็น JSON เท่านั้น (ห้ามมี markdown/คำอธิบายอื่น) โครงสร้าง:
{"sessions":[
  {"day":1,"kind":"workout","title":"...","cat":"legs","subtitle":"...",
   "exercises":[{"name":"...","equip":"Smith|Dumbbell|Multi-gym","cat":"legs","sets":4,"lo":6,"hi":8,"weight":60,"perSide":false}],
   "recovery":[]},
  {"day":2,"kind":"rest","title":"พัก","cat":"rest","exercises":[],"recovery":[{"name":"...","detail":"..."}]}
]}
กติกา: ต้องมี 14 วันครบ (day 1..14), สลับวันฝึกกับวันพักคล้ายเดิม, จบด้วยวันพัก.
cat ต้องเป็นหนึ่งใน: legs, back, chest, arms, shoulders, core, rest.
ใช้เฉพาะอุปกรณ์: Smith machine, ดัมเบล, Multi-gym cable (lat pulldown/seated row/chest press/cable tricep/cable curl/leg extension), บาร์โหน, ลู่วิ่ง, สระว่ายน้ำ.
ปรับน้ำหนักตามหลัก progressive overload: ท่าที่ทำครบเร็พสูงสุดให้เพิ่ม 1.25–2.5kg, ท่าที่ยังไม่ถึงให้คงไว้.`;

function buildPrompt(plan, logs) {
  return `คุณเป็นเทรนเนอร์เวท ออกแบบตารางฝึก 14 วันรอบใหม่ (Phase 2) สำหรับผู้ชายวัยทำงาน สไตล์ hypertrophy
อ้างอิงจากสถิติจริง 14 วันที่ผ่านมาด้านล่าง แล้วปรับน้ำหนัก/เซ็ต/เร็พให้เหมาะสม

[สถิติล่าสุดต่อท่า]
${summarizePerformance(plan, logs)}

${SCHEMA_HINT}`;
}

// Normalize AI output into the app's plan structure (adds ids, validates cat).
export function normalizePlan(raw) {
  if (!raw || !Array.isArray(raw.sessions) || raw.sessions.length < 7)
    throw new Error("โครงสร้างแผนจาก AI ไม่ถูกต้อง");
  const sessions = raw.sessions.slice(0, 14).map((s, i) => ({
    id: uid(),
    day: s.day || i + 1,
    kind: s.kind === "rest" ? "rest" : "workout",
    title: s.title || `Day ${i + 1}`,
    subtitle: s.subtitle || "",
    cat: CAT[s.cat] ? s.cat : s.kind === "rest" ? "rest" : "legs",
    exercises: Array.isArray(s.exercises)
      ? s.exercises.map((e) => ({
          id: uid(),
          name: String(e.name || "Exercise"),
          equip: e.equip || "",
          cat: CAT[e.cat] ? e.cat : "legs",
          sets: clampInt(e.sets, 1, 10, 3),
          lo: clampInt(e.lo, 1, 50, 8),
          hi: clampInt(e.hi, 1, 50, 12),
          weight: Math.max(0, Number(e.weight) || 0),
          perSide: !!e.perSide,
          note: "",
        }))
      : [],
    recovery: Array.isArray(s.recovery)
      ? s.recovery.map((r) => ({ name: String(r.name || ""), detail: String(r.detail || "") }))
      : [],
  }));
  return { version: 2, unit: "kg", sessions };
}

function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

function extractJson(text) {
  let t = (text || "").trim().replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

// --- Gemini (default) ------------------------------------------------------
async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${msg.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return extractJson(text);
}

// --- Claude (optional; needs the browser-access header) --------------------
async function callClaude(prompt, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Claude error ${res.status}: ${msg.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return extractJson(text);
}

// Public: returns a normalized 14-day plan or throws with a readable message.
export async function generateNewPlan({ plan, logs, settings }) {
  const key = (settings.aiKey || "").trim();
  if (!key) throw new Error("ยังไม่ได้ใส่ API Key ในแท็บ ‘เครื่องมือ’");
  const prompt = buildPrompt(plan, logs);
  const raw = settings.aiProvider === "claude"
    ? await callClaude(prompt, key)
    : await callGemini(prompt, key);
  return normalizePlan(raw);
}

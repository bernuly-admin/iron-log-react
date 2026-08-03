// Pure helpers — no React, no DOM. Easy to reason about & test.

export const uid = () => Math.random().toString(36).slice(2, 9);

export const localISO = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) =>
  Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

export const epley = (w, r) => (w > 0 && r > 0 ? Math.round(w * (1 + r / 30)) : 0);

const DOW = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const MON = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const thaiDate = (iso) => {
  try {
    const d = new Date(iso + "T00:00:00");
    return `${DOW[(d.getDay() + 6) % 7]} ${d.getDate()} ${MON[d.getMonth() + 1]}`;
  } catch {
    return iso;
  }
};

export const defaultState = () => ({
  idx: 0,
  cycle: 1,
  startDate: localISO(),
  lastCompletedDate: null,
  updatedAt: 0,
});

// Advance the pointer when a session is completed (or a rest is taken).
// Skipping does NOT call this, so a missed workout carries to the next day.
// Returns { state, wrapped } — wrapped=true means a full 14-day cycle just finished.
export function advanceIndex(state, planLen, onDate = localISO()) {
  const nxt = (state.idx + 1) % planLen;
  const wrapped = nxt === 0;
  return {
    state: {
      ...state,
      idx: nxt,
      cycle: wrapped ? state.cycle + 1 : state.cycle,
      lastCompletedDate: onDate,
    },
    wrapped,
  };
}

export function missedDays(state, onDate = localISO()) {
  if (!state.lastCompletedDate) return 0;
  return Math.max(0, daysBetween(state.lastCompletedDate, onDate) - 1);
}

// --- logs / history ---------------------------------------------------------
export function setsByExercise(logs, exName) {
  const byDate = {};
  for (const row of logs) {
    if (row.kind !== "workout" || row.exName !== exName) continue;
    (byDate[row.date] ||= []).push({ w: +row.weight || 0, reps: +row.reps || 0 });
  }
  return Object.keys(byDate).sort().map((date) => {
    const sets = byDate[date];
    const top = sets.reduce((m, s) => Math.max(m, s.w), 0);
    const e1rm = sets.reduce((m, s) => Math.max(m, epley(s.w, s.reps)), 0);
    return { date, sets, top, e1rm };
  });
}

export function lastEntryFor(logs, exName) {
  const rows = setsByExercise(logs, exName);
  return rows.length ? rows[rows.length - 1] : null;
}

export function allExerciseNames(plan, logs) {
  const seen = new Set();
  const names = [];
  for (const s of plan.sessions)
    for (const e of s.exercises || [])
      if (!seen.has(e.name)) { seen.add(e.name); names.push(e.name); }
  for (const r of logs)
    if (r.exName && !seen.has(r.exName)) { seen.add(r.exName); names.push(r.exName); }
  return names;
}

// Deterministic offline progressive overload: bump weight on exercises whose
// last session hit the top rep target on every logged set.
export function autoProgress(plan, logs) {
  let changed = 0;
  const p = structuredClone(plan);
  for (const s of p.sessions)
    for (const e of s.exercises || []) {
      const last = lastEntryFor(logs, e.name);
      if (last && last.sets.length && last.sets.every((st) => st.reps >= e.hi)) {
        e.weight = +(e.weight + (e.weight >= 20 ? 2.5 : 1.25)).toFixed(2);
        changed++;
      }
    }
  return { plan: p, changed };
}

// Build flat per-set log rows for a completed workout.
// entered: { [exId]: [{ w, reps }, ...] }
export function buildLogRows(session, dayIndex, entered, onDate = localISO()) {
  const logId = uid();
  const rows = [];
  for (const e of session.exercises) {
    const sets = entered[e.id] || [];
    sets.forEach((s, i) => {
      const w = +s.w || 0, reps = +s.reps || 0;
      if (w <= 0 && reps <= 0) return;
      rows.push({
        logId, date: onDate, dayIndex, sessionId: session.id, kind: "workout",
        title: session.title, exName: e.name, perSide: !!e.perSide,
        setNo: i + 1, weight: w, reps, extra: "",
      });
    });
  }
  return rows;
}

export const LOG_COLUMNS = [
  "logId", "date", "dayIndex", "sessionId", "kind", "title",
  "exName", "perSide", "setNo", "weight", "reps", "extra",
];

// --- sync merge helpers -----------------------------------------------------
// Stamp an object with a fresh version marker before saving.
export const stamp = (obj) => ({ ...obj, updatedAt: Date.now() });

// Keep whichever of local/remote is newer (by updatedAt). Ties -> local, so a
// device never clobbers its own just-made change with an equal-timestamped pull.
export function pickNewer(localObj, remoteObj) {
  if (!remoteObj) return localObj || null;
  if (!localObj) return remoteObj;
  return (remoteObj.updatedAt || 0) > (localObj.updatedAt || 0) ? remoteObj : localObj;
}

// Union logs from both sides, de-duplicated. A pull must never drop local logs
// that haven't reached the sheet yet, nor re-add ones already there.
export function mergeLogs(localLogs, remoteLogs) {
  const key = (r) => `${r.logId}|${r.kind}|${r.date}|${r.exName}|${r.setNo}`;
  const map = new Map();
  for (const r of remoteLogs || []) map.set(key(r), r);
  for (const r of localLogs || []) map.set(key(r), r); // local wins on tie
  return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

// LocalStorage cache. Always the source of truth for instant UI;
// Google Sheets sync happens in the background (see services/googleSheet.js).

const K = {
  plan: "il_plan",
  state: "il_state",
  logs: "il_logs",
  settings: "il_settings",
  queue: "il_sync_queue", // pending writes when offline / sheet not configured
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* quota / private mode — ignore, UI still works in memory */
  }
}

export const local = {
  getPlan: () => read(K.plan, null),
  setPlan: (p) => write(K.plan, p),

  getState: () => read(K.state, null),
  setState: (s) => write(K.state, s),

  getLogs: () => read(K.logs, []),
  setLogs: (l) => write(K.logs, l),
  appendLogs: (rows) => write(K.logs, [...read(K.logs, []), ...rows]),

  getSettings: () => read(K.settings, { sheetUrl: "", aiKey: "", aiProvider: "gemini", restSec: 90 }),
  setSettings: (s) => write(K.settings, s),

  getQueue: () => read(K.queue, []),
  setQueue: (q) => write(K.queue, q),
  pushQueue: (op) => write(K.queue, [...read(K.queue, []), op]),
  clearQueue: () => write(K.queue, []),

  // in-progress workout entries (so a mid-session reload doesn't lose typed sets)
  getDraft: (id) => read("il_draft_" + id, null),
  setDraft: (id, v) => write("il_draft_" + id, v),
  clearDraft: (id) => { try { localStorage.removeItem("il_draft_" + id); } catch { /* ignore */ } },
};

export { K };  appendLogs: (rows) => write(K.logs, [...read(K.logs, []), ...rows]),

  getSettings: () => read(K.settings, { sheetUrl: "", aiKey: "", aiProvider: "gemini", restSec: 90 }),
  setSettings: (s) => write(K.settings, s),

  getQueue: () => read(K.queue, []),
  setQueue: (q) => write(K.queue, q),
  pushQueue: (op) => write(K.queue, [...read(K.queue, []), op]),
  clearQueue: () => write(K.queue, []),
};

export { K };

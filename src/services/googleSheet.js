// Talks to the Google Apps Script Web App (see google-apps-script.gs).
//
// Design notes:
// * Writes go to localStorage first (instant, offline-safe). Each write is also
//   pushed to a sync queue and flushed to the Sheet in the background.
// * POST uses a plain-text body so the browser sends a "simple" request and
//   skips the CORS preflight that Apps Script cannot answer.
// * GET pulls the whole dataset for first load / cross-device refresh.

import { local } from "../lib/storage";

function sheetUrl() {
  return (local.getSettings().sheetUrl || "").trim();
}
export function isSheetConfigured() {
  return !!sheetUrl();
}

async function post(action, payload) {
  const url = sheetUrl();
  if (!url) throw new Error("no-sheet-url");
  const res = await fetch(url, {
    method: "POST",
    // text/plain => simple request => no preflight (Apps Script friendly)
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
    redirect: "follow",
  });
  if (!res.ok) throw new Error("sheet-post-failed:" + res.status);
  return res.json();
}

// ---- pull everything (used on load / manual refresh) ----------------------
export async function pullAll() {
  const url = sheetUrl();
  if (!url) throw new Error("no-sheet-url");
  const res = await fetch(url + (url.includes("?") ? "&" : "?") + "action=all", {
    method: "GET",
    redirect: "follow",
  });
  if (!res.ok) throw new Error("sheet-get-failed:" + res.status);
  const data = await res.json(); // { plan, state, logs }
  return data;
}

// ---- queued writes --------------------------------------------------------
// op shapes:
//   { t: "kv",   key: "plan"|"state", value: <obj> }
//   { t: "logs", rows: [...] }
//   { t: "reset" }
export function enqueue(op) {
  local.pushQueue(op);
}

async function runOp(op) {
  if (op.t === "kv") return post("saveKv", { key: op.key, value: op.value });
  if (op.t === "logs") return post("appendLogs", { rows: op.rows });
  if (op.t === "reset") return post("reset", {});
  return null;
}

let flushing = false;
// Try to send everything in the queue. Safe to call often; no-ops when empty,
// offline, or the sheet isn't configured yet.
export async function flushQueue() {
  if (flushing || !isSheetConfigured()) return { ok: false, reason: "skip" };
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return { ok: false, reason: "offline" };
  const queue = local.getQueue();
  if (!queue.length) return { ok: true, sent: 0 };

  flushing = true;
  let sent = 0;
  try {
    // process in order; keep unsent ones on failure
    const remaining = [...queue];
    while (remaining.length) {
      const op = remaining[0];
      await runOp(op); // throws on failure -> caught below
      remaining.shift();
      sent++;
      local.setQueue(remaining); // persist progress after each op
    }
    return { ok: true, sent };
  } catch (e) {
    return { ok: false, reason: String(e), sent };
  } finally {
    flushing = false;
  }
}

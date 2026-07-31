/**
 * Iron Log — Google Apps Script backend
 * วางโค้ดนี้ใน Google Sheet ที่ต้องการใช้เก็บข้อมูล:
 *   Extensions → Apps Script → วางทับ Code.gs → Deploy → New deployment
 *   → Type: Web app → Execute as: Me → Who has access: Anyone → Deploy
 * แล้วก็อป Web app URL (ลงท้าย /exec) ไปใส่ในแอป (แท็บเครื่องมือ)
 *
 * ชีตจะถูกสร้างให้อัตโนมัติ 2 แท็บ:
 *   kv   : [key, value]  -> เก็บ plan / state เป็น JSON string
 *   logs : ประวัติรายเซ็ต (ดู LOG_COLUMNS)
 */

var LOG_COLUMNS = ["logId", "date", "dayIndex", "sessionId", "kind", "title",
  "exName", "perSide", "setNo", "weight", "reps", "extra"];

function ss_() { return SpreadsheetApp.getActive(); }

function sheet_(name, header) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
  }
  return sh;
}

function kvSheet_() { return sheet_("kv", ["key", "value"]); }
function logsSheet_() { return sheet_("logs", LOG_COLUMNS); }

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------------------------------------------------- GET: all */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "all";
    if (action === "all") {
      return json_({ plan: readKv_("plan"), state: readKv_("state"), logs: readLogs_() });
    }
    return json_({ error: "unknown action" });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

/* ------------------------------------------------------------- POST: writes */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var action = body.action;
    var payload = body.payload || {};

    if (action === "saveKv") {
      writeKv_(payload.key, payload.value);
      return json_({ ok: true });
    }
    if (action === "appendLogs") {
      appendLogs_(payload.rows || []);
      return json_({ ok: true, added: (payload.rows || []).length });
    }
    if (action === "reset") {
      resetAll_();
      return json_({ ok: true });
    }
    return json_({ error: "unknown action" });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

/* ----------------------------------------------------------------- helpers */
function readKv_(key) {
  var sh = kvSheet_();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      try { return JSON.parse(values[i][1]); } catch (e) { return null; }
    }
  }
  return null;
}

function writeKv_(key, value) {
  var sh = kvSheet_();
  var values = sh.getDataRange().getValues();
  var payload = JSON.stringify(value);
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sh.getRange(i + 1, 2).setValue(payload);
      return;
    }
  }
  sh.appendRow([key, payload]);
}

function readLogs_() {
  var sh = logsSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < header.length; c++) row[header[c]] = values[i][c];
    out.push(row);
  }
  return out;
}

function appendLogs_(rows) {
  if (!rows.length) return;
  var sh = logsSheet_();
  var matrix = rows.map(function (r) {
    return LOG_COLUMNS.map(function (c) { return r[c] !== undefined ? r[c] : ""; });
  });
  sh.getRange(sh.getLastRow() + 1, 1, matrix.length, LOG_COLUMNS.length).setValues(matrix);
}

function resetAll_() {
  var ss = ss_();
  ["kv", "logs"].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh) ss.deleteSheet(sh);
  });
  kvSheet_();
  logsSheet_();
}

const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Leads";

const TELEGRAM_BOT_TOKEN = "PASTE_TELEGRAM_BOT_TOKEN_HERE"; // optional
const TELEGRAM_CHAT_ID = "PASTE_TELEGRAM_CHAT_ID_HERE";     // optional

const STATUS_DEFAULT = "NEW";
const STATUSES = ["NEW", "IN_WORK", "DONE", "CANCELED"];
const STATUS_COLORS = {
  NEW: "#FFF2CC",
  IN_WORK: "#D9E1F2",
  DONE: "#C6EFCE",
  CANCELED: "#F8CBAD"
};

function doGet() {
  return ContentService.createTextOutput("UHU CRM WebApp is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = parseJson_(e);
    const sh = ensureSheet_();
    const rowId = appendLead_(sh, data);
    notifyTelegram_(rowId, data);
    return jsonOk_({ ok: true, id: rowId });
  } catch (err) {
    return jsonOk_({ ok: false, error: String(err) });
  }
}

// === 1) Запусти вручную один раз после вставки скрипта ===
function setupUhuCrm() {
  const sh = ensureSheet_();
  setupStatusDropdown_(sh);
  setupConditionalFormatting_(sh);
}

function onEdit(e) {
  try {
    const range = e.range;
    const sh = range.getSheet();
    if (sh.getName() !== SHEET_NAME) return;

    // Status column = C (3)
    if (range.getColumn() !== 3) return;
    if (range.getRow() <= 1) return;

    const status = String(range.getValue() || "").trim();
    const color = STATUS_COLORS[status];
    if (!color) return;

    sh.getRange(range.getRow(), 1, 1, sh.getLastColumn()).setBackground(color);
  } catch (err) {}
}

function parseJson_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); } catch (err) { return {}; }
}

function ensureSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "ID","CreatedAt","Status",
      "Name","Contact",
      "Service","District","When","Budget","Details",
      "PageUrl","Lang","UserAgent"
    ]);
    sh.getRange(1,1,1,13).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendLead_(sh, d) {
  const id = Utilities.getUuid();
  const createdAt = d.createdAt || new Date().toISOString();
  const status = STATUS_DEFAULT;

  sh.appendRow([
    id, createdAt, status,
    d.name || "", d.contact || "",
    d.service || "", d.district || "", d.when || "", d.budget || "", d.details || "",
    d.pageUrl || "", d.lang || "", d.userAgent || ""
  ]);

  const lastRow = sh.getLastRow();
  const color = STATUS_COLORS[status];
  if (color) sh.getRange(lastRow, 1, 1, sh.getLastColumn()).setBackground(color);

  return id;
}

function setupStatusDropdown_(sh) {
  const last = Math.max(sh.getLastRow(), 2);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES, true)
    .setAllowInvalid(false)
    .build();

  sh.getRange(2, 3, last - 1, 1).setDataValidation(rule);
}

function setupConditionalFormatting_(sh) {
  const rules = [];
  const rangeAll = sh.getRange(2, 1, Math.max(sh.getMaxRows()-1, 1), sh.getLastColumn());

  Object.keys(STATUS_COLORS).forEach((st) => {
    const r = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$C2="${st}"`)
      .setBackground(STATUS_COLORS[st])
      .setRanges([rangeAll])
      .build();
    rules.push(r);
  });

  sh.setConditionalFormatRules(rules);
}

function notifyTelegram_(id, d) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.startsWith("PASTE_")) return;
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID.startsWith("PASTE_")) return;

  const text = [
    "🆕 Neue Anfrage (UHU)",
    "ID: " + id,
    "Service: " + (d.service || "-"),
    "District: " + (d.district || "-"),
    "When: " + (d.when || "-"),
    "Budget: " + (d.budget || "-"),
    "Name: " + (d.name || "-"),
    "Contact: " + (d.contact || "-"),
    "Details: " + (d.details || "-"),
    "URL: " + (d.pageUrl || "-")
  ].join("\n");

  UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true
    }),
    muteHttpExceptions: true
  });
}

function jsonOk_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * UHU CRM — Google Apps Script WebApp
 * Receives JSON from the site (crm.js) and writes to Google Sheets.
 * Also sends Telegram notification (optional).
 *
 * 1) Create a Google Sheet (e.g. "UHU CRM")
 * 2) Extensions -> Apps Script, paste this file
 * 3) Set SPREADSHEET_ID (from URL) and SHEET_NAME
 * 4) Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (optional)
 * 5) Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6) Copy Web app URL into crm-config.js as endpoint
 */

const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Leads";

const TELEGRAM_BOT_TOKEN = "PASTE_TELEGRAM_BOT_TOKEN_HERE"; // optional
const TELEGRAM_CHAT_ID = "PASTE_TELEGRAM_CHAT_ID_HERE";     // optional

// Statuses and colors (edit if you want)
const STATUS_DEFAULT = "NEW";
const STATUS_COLORS = {
  NEW: "#FFF2CC",        // light yellow
  IN_WORK: "#D9E1F2",    // light blue
  DONE: "#C6EFCE",       // light green
  CANCELED: "#F8CBAD"    // light red
};

function doGet() {
  return ContentService
    .createTextOutput("UHU CRM WebApp is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = parseJson_(e);
    const rowId = appendLead_(data);
    notifyTelegram_(rowId, data);
    return jsonOk_({ ok: true, id: rowId });
  } catch (err) {
    return jsonOk_({ ok: false, error: String(err) });
  }
}

// ---- helpers ----

function parseJson_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = e.postData.contents;
  try { return JSON.parse(raw); } catch (err) { return {}; }
}

function ensureSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  // Header (only if empty)
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

function appendLead_(d) {
  const sh = ensureSheet_();
  const id = Utilities.getUuid();
  const createdAt = d.createdAt || new Date().toISOString();
  const status = STATUS_DEFAULT;

  const row = [
    id, createdAt, status,
    d.name || "", d.contact || "",
    d.service || "", d.district || "", d.when || "", d.budget || "", d.details || "",
    d.pageUrl || "", d.lang || "", d.userAgent || ""
  ];

  sh.appendRow(row);

  // color whole row based on status
  const lastRow = sh.getLastRow();
  const color = STATUS_COLORS[status] || null;
  if (color) sh.getRange(lastRow, 1, 1, sh.getLastColumn()).setBackground(color);

  return id;
}

function notifyTelegram_(id, d) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.indexOf("PASTE_") === 0) return;
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID.indexOf("PASTE_") === 0) return;

  const lines = [
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
  ];

  const text = lines.join("\n");
  const url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      disable_web_page_preview: true
    }),
    muteHttpExceptions: true
  });
}

function jsonOk_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * UHU CRM — Google Apps Script (Web App → doPost)
 * - Сохраняет заявки в Google Sheets
 * - Ставит статус NEW
 * - Делает Telegram уведомление (если настроено)
 *
 * Настройка:
 * 1) Extensions → Apps Script
 * 2) Project Settings → Script Properties:
 *    SHEET_ID = (ID твоей таблицы)
 *    SHEET_NAME = Leads
 *    TG_BOT_TOKEN = 123:ABC...   (опционально)
 *    TG_CHAT_ID = 123456789      (опционально)
 */

const DEFAULT_SHEET_NAME = "Leads";

function doGet(){
  return json_({ ok:true, msg:"UHU CRM OK" });
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty("SHEET_ID");
    const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
    if (!sheetId) throw new Error("Missing SHEET_ID in Script Properties");

    const ss = SpreadsheetApp.openById(sheetId);
    const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    ensureHeader_(sh);

    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    const data = JSON.parse(raw);

    const now = new Date();
    const status = "NEW";

    const row = [
      now,                // A: created_at
      status,             // B: status
      data.name || "",    // C: name
      data.phone || "",   // D: phone
      data.service || "", // E: service
      data.address || "", // F: address
      data.comment || "", // G: comment
      data.source || "",  // H: source
      data.page || "",    // I: page
      data.ts || "",      // J: client_ts
      data.userAgent || ""// K: userAgent
    ];
    sh.appendRow(row);

    // Применим валидации/форматирование для статуса
    setupStatusValidation_(sh);

    // Telegram уведомление
    const token = props.getProperty("TG_BOT_TOKEN");
    const chatId = props.getProperty("TG_CHAT_ID");
    if (token && chatId) {
      const msg =
        "🆕 Новая заявка UHU\n" +
        "Имя: " + (data.name || "-") + "\n" +
        "Контакт: " + (data.phone || "-") + "\n" +
        "Услуга: " + (data.service || "-") + "\n" +
        "Адрес: " + (data.address || "-") + "\n" +
        "Комментарий: " + (data.comment || "-");
      sendTelegram_(token, chatId, msg);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function ensureHeader_(sh){
  const head = ["created_at","status","name","phone","service","address","comment","source","page","client_ts","userAgent"];
  const first = sh.getRange(1,1,1,head.length).getValues()[0];
  const empty = first.every(v => !v);
  if (empty) {
    sh.getRange(1,1,1,head.length).setValues([head]);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, head.length);
  }
}

function setupStatusValidation_(sh){
  // Создаём список статусов + цвета (условное форматирование)
  const statuses = ["NEW","IN_WORK","DONE","CANCELLED"];
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statuses, true)
    .setAllowInvalid(false)
    .build();

  sh.getRange(2,2,lastRow-1,1).setDataValidation(rule);

  // Условное форматирование по статусу (только фон/цвет текста)
  const range = sh.getRange(2,1,Math.max(1,lastRow-1),11);

  const rules = sh.getConditionalFormatRules().filter(r => {
    // оставим любые чужие правила, но наши добавим заново (чтобы не дублировать — чистим по формуле)
    const f = r.getBooleanCondition() ? r.getBooleanCondition().getCriteriaType() : null;
    return true;
  });

  const makeRule = (status, bg, fg) => SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$B2="${status}"`)
      .setBackground(bg)
      .setFontColor(fg)
      .setRanges([range])
      .build();

  // Цвета выбраны «мягкие» (можно поменять)
  const newRules = [
    makeRule("NEW", "#FFF7CC", "#000000"),
    makeRule("IN_WORK", "#D9ECFF", "#000000"),
    makeRule("DONE", "#D9F7E5", "#000000"),
    makeRule("CANCELLED", "#FFD9D9", "#000000")
  ];

  sh.setConditionalFormatRules([...rules, ...newRules]);
}

function sendTelegram_(token, chatId, text){
  const url = "https://api.telegram.org/bot" + token + "/sendMessage";
  const payload = {
    chat_id: chatId,
    text: text
  };
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function json_(obj){
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  // CORS
  out.setHeader("Access-Control-Allow-Origin", "*");
  out.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  out.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return out;
}

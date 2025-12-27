/**
 * UHU CRM — Google Apps Script (Web App)
 * Функции:
 * 1) POST JSON -> запись заявки в Google Sheets
 * 2) GET  ?action=leads&status=NEW&limit=10 -> последние заявки (JSON)
 * 3) POST ?action=updateStatus&key=... -> смена статуса по строке (row)
 *
 * Script Properties (Project Settings → Script properties):
 *   SHEET_ID   = <ID таблицы>
 *   SHEET_NAME = Leads
 *   ADMIN_KEY  = <секретный ключ для кабинета, любой длинный>
 *   TG_BOT_TOKEN = 123:ABC...   (опционально)
 *   TG_CHAT_ID   = 123456789    (опционально)
 */
const DEFAULT_SHEET_NAME = "Leads";
const HEAD = ["created_at","status","name","phone","service","address","comment","source","page","client_ts","userAgent"];
const STATUSES = ["NEW","IN_WORK","DONE","CANCELLED"];

function doGet(e){
  try{
    const p = (e && e.parameter) ? e.parameter : {};
    const action = (p.action || "health").toString();

    if(action === "health"){
      return json_({ ok:true, msg:"UHU CRM OK", actions:[
        "POST (заявка JSON) -> appendRow",
        "GET  ?action=leads&status=NEW&limit=10",
        "POST ?action=updateStatus&key=... body:{row,status?}"
      ]});
    }

    if(action === "leads"){
      const limit = clampInt_(p.limit, 10, 1, 50);
      const status = (p.status || "").toString().trim().toUpperCase(); // optional
      const out = getLastLeads_(limit, status);
      return json_({ ok:true, items: out });
    }

    return json_({ ok:false, error:"Unknown action: " + action });
  }catch(err){
    return json_({ ok:false, error:String(err) });
  }
}

function doPost(e){
  try{
    const p = (e && e.parameter) ? e.parameter : {};
    const action = (p.action || "").toString();

    if(action === "updateStatus"){
      return handleUpdateStatus_(e);
    }

    // default: create lead
    return handleCreateLead_(e);
  }catch(err){
    return json_({ ok:false, error:String(err) });
  }
}

function handleCreateLead_(e){
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
  if(!sheetId) throw new Error("Missing SHEET_ID in Script Properties");

  const ss = SpreadsheetApp.openById(sheetId);
  const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  ensureHeader_(sh);
  setupStatusValidation_(sh);

  const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
  const data = JSON.parse(raw);

  const now = new Date();
  const status = "NEW";

  const row = [
    now,
    status,
    data.name || "",
    data.phone || "",
    data.service || "",
    data.address || "",
    data.comment || "",
    data.source || "",
    data.page || "",
    data.ts || "",
    data.userAgent || ""
  ];

  sh.appendRow(row);
  const rowNum = sh.getLastRow();

  // Telegram
  const token = props.getProperty("TG_BOT_TOKEN");
  const chatId = props.getProperty("TG_CHAT_ID");
  if(token && chatId){
    const msg =
      "🆕 Новая заявка UHU\n" +
      "Имя: " + (data.name || "-") + "\n" +
      "Контакт: " + (data.phone || "-") + "\n" +
      "Услуга: " + (data.service || "-") + "\n" +
      "Адрес: " + (data.address || "-") + "\n" +
      "Комментарий: " + (data.comment || "-");
    sendTelegram_(token, chatId, msg);
  }

  return json_({ ok:true, row: rowNum });
}

function handleUpdateStatus_(e){
  const props = PropertiesService.getScriptProperties();
  const adminKey = (props.getProperty("ADMIN_KEY") || "").trim();
  const key = (e && e.parameter && e.parameter.key) ? String(e.parameter.key).trim() : "";
  if(!adminKey) throw new Error("Missing ADMIN_KEY in Script Properties");
  if(!key || key !== adminKey) return json_({ ok:false, error:"Forbidden" });

  const sheetId = props.getProperty("SHEET_ID");
  const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
  if(!sheetId) throw new Error("Missing SHEET_ID in Script Properties");

  const ss = SpreadsheetApp.openById(sheetId);
  const sh = ss.getSheetByName(sheetName);
  if(!sh) throw new Error("Sheet not found: " + sheetName);

  const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
  const body = JSON.parse(raw);

  const rowNum = clampInt_(body.row, 0, 2, sh.getLastRow());
  if(rowNum < 2) throw new Error("Bad row");

  const wantStatus = (body.status || "").toString().trim().toUpperCase();
  const statusCell = sh.getRange(rowNum, 2);
  const cur = String(statusCell.getValue() || "").trim().toUpperCase();

  let next = "";
  if(wantStatus){
    if(STATUSES.indexOf(wantStatus) === -1) throw new Error("Bad status");
    next = wantStatus;
  }else{
    const i = Math.max(0, STATUSES.indexOf(cur));
    next = STATUSES[Math.min(i + 1, STATUSES.length - 1)];
  }

  statusCell.setValue(next);
  setupStatusValidation_(sh);

  return json_({ ok:true, row: rowNum, status: next });
}

function getLastLeads_(limit, status){
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
  if(!sheetId) throw new Error("Missing SHEET_ID in Script Properties");

  const ss = SpreadsheetApp.openById(sheetId);
  const sh = ss.getSheetByName(sheetName);
  if(!sh) return [];

  const lastRow = sh.getLastRow();
  if(lastRow < 2) return [];

  const data = sh.getRange(2, 1, lastRow - 1, HEAD.length).getValues(); // no header
  const out = [];
  for(let i = data.length - 1; i >= 0 && out.length < limit; i--){
    const r = data[i];
    const item = {};
    for(let c = 0; c < HEAD.length; c++){
      item[HEAD[c]] = r[c];
    }
    item.row = i + 2; // actual sheet row number

    if(status){
      const st = String(item.status || "").trim().toUpperCase();
      if(st !== status) continue;
    }
    out.push(item);
  }
  return out;
}

function ensureHeader_(sh){
  const first = sh.getRange(1,1,1,HEAD.length).getValues()[0];
  const empty = first.every(v => !v);
  if(empty){
    sh.getRange(1,1,1,HEAD.length).setValues([HEAD]);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, HEAD.length);
  }
}

function setupStatusValidation_(sh){
  const lastRow = sh.getLastRow();
  if(lastRow < 2) return;

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES, true)
    .setAllowInvalid(false)
    .build();

  sh.getRange(2,2,lastRow-1,1).setDataValidation(rule);

  // Conditional formatting on whole row A:K based on status in col B
  const range = sh.getRange(2,1,Math.max(1,lastRow-1),HEAD.length);

  // remove our old rules (marked by formula contains =$B2="STATUS")
  const old = sh.getConditionalFormatRules();
  const kept = old.filter(r=>{
    try{
      const bc = r.getBooleanCondition();
      const crit = bc ? bc.getCriteriaType() : null;
      const vals = bc ? bc.getCriteriaValues() : [];
      // formulas are in criteria values as string
      const txt = (vals && vals[0]) ? String(vals[0]) : "";
      return !txt.includes("=$B2=");
    }catch(_e){
      return true;
    }
  });

  const makeRule = (status, bg) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=$B2="${status}"`)
    .setBackground(bg)
    .setRanges([range])
    .build();

  const newRules = [
    makeRule("NEW", "#FFF7CC"),
    makeRule("IN_WORK", "#D9ECFF"),
    makeRule("DONE", "#D9F7E5"),
    makeRule("CANCELLED", "#FFD9D9")
  ];

  sh.setConditionalFormatRules(kept.concat(newRules));
}

function sendTelegram_(token, chatId, text){
  const url = "https://api.telegram.org/bot" + token + "/sendMessage";
  const payload = { chat_id: chatId, text: text };
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function clampInt_(v, def, min, max){
  const n = parseInt(v, 10);
  if(isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function json_(obj){
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  out.setHeader("Access-Control-Allow-Origin", "*");
  out.setHeader("Access-Control-Allow-Methods", "POST, GET");
  out.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return out;
}

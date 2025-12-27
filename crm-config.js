// crm-config.js
// ВАЖНО:
// 1) endpoint — URL Web App из Google Apps Script (Deploy → Web app → Copy URL)
//    Пример: https://script.google.com/macros/s/AKfycbxxxxxxx/exec
// 2) sheetUrl — ссылка на Google-таблицу (чтобы кнопка "Открыть CRM" открывала её)
//    Пример: https://docs.google.com/spreadsheets/d/XXXXXXXXXXXX/edit
window.UHU_CRM = {
  enabled: true,
  endpoint: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",
  sheetUrl: "PASTE_YOUR_GOOGLE_SHEET_URL_HERE",
  telegram: "https://t.me/UHU_help",
  revolut: "https://revolut.me/vladshvachko",
  site: "UHU.digital",
  currency: "EUR"
};

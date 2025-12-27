// crm-config.js
// ВАЖНО:
// 1) endpoint — URL Web App из Google Apps Script (Deploy → Web app → Copy URL)
//    Пример: https://script.google.com/macros/s/AKfycbxxxxxxx/exec
// 2) sheetUrl — ссылка на Google-таблицу (для кнопок в кабинете)
// 3) leadsGid — gid вкладки Leads (видно в URL как ...#gid=123456)
// 4) *FilterUrl — (опционально) ссылки на заранее сохранённые фильтры в Google Sheets

window.UHU_CRM = {
  endpoint: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",
  // Пример: "https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXX/edit"
  sheetUrl: "PASTE_YOUR_GOOGLE_SHEET_URL_HERE",
  // Пример: "0" или "123456789"
  leadsGid: "PASTE_LEADS_GID_HERE",

  // Опционально: ссылки на фильтрованные виды (если ты их сохранил в Google Sheets и скопировал ссылку)
  newFilterUrl: "",
  inWorkFilterUrl: "",
  doneFilterUrl: "",
  cancelledFilterUrl: "",

  // Оплата (если нужно показывать QR/ссылку на главной)
  revolutLink: "https://revolut.me/vladshvachko",

  site: "UHU.digital",
  currency: "EUR"
};

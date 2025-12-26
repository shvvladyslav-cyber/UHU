// crm-config.js
window.UHU_CRM = {
  // сюда вставь Web app URL из Apps Script (Deploy → Web app URL)
  endpoint: "https://script.google.com/macros/s/AKfycbwGZ7PT8ZNDWBCF1n-k81N0_nmPQme2CZxKRWa_Yp0wDxsb6pjM4KulNnl70AulxjWo/exec",
  enabled: true,

  // важно: для Apps Script обычно лучше no-cors (чтобы сайт не падал из-за CORS)
  mode: "no-cors",
};

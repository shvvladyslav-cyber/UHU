// crm-config.js
window.UHU_CRM = {
  // сюда вставь Web app URL из Apps Script (Deploy → Web app URL)
  endpoint: "https://script.google.com/macros/s/AKfycbxeN8spv04Am9LxgtaPTNx7PLW3eqxeY3mnHqWWERk6xC26SX3eVGzhPXdfP8lrqCEC3g/exec",
  enabled: true,

  // важно: для Apps Script обычно лучше no-cors (чтобы сайт не падал из-за CORS)
  mode: "no-cors",
};

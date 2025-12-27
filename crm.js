// crm.js
// UHU CRM client (safe, без падений)
// Отправляет заявки в Google Apps Script Web App (Google Sheets CRM)
//
// ВАЖНО: в crm-config.js вставь endpoint (URL вида .../exec)

(function () {
  function safeJson(obj){
    try { return JSON.stringify(obj); } catch(e){ return "{}"; }
  }

  async function sendToCRM(payload) {
    try {
      const cfg = window.UHU_CRM || {};
      if (!cfg.enabled) return false;
      if (!cfg.endpoint || String(cfg.endpoint).includes("PASTE_YOUR")) return false;

      const body = safeJson(payload || {});
      // Самый надежный вариант для Apps Script: no-cors + text/plain (без preflight OPTIONS)
      const opts = {
        method: "POST",
        mode: "no-cors",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body
      };

      // 1) fetch
      try {
        await fetch(cfg.endpoint, opts);
        return true;
      } catch (e) {
        // 2) beacon (fallback)
        if (navigator.sendBeacon) {
          try {
            const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
            return navigator.sendBeacon(cfg.endpoint, blob);
          } catch (e2) {}
        }
        return false;
      }
    } catch (e) {
      return false; // никогда не ломаем сайт
    }
  }

  window.sendToCRM = sendToCRM;
})();
// crm.js
// PR-14 CRM Live: send lead to Google Sheets (Apps Script Web App)

(function () {
  function nowISO() {
    return new Date().toISOString();
  }

  function safeStr(v) {
    return (v === undefined || v === null) ? "" : String(v);
  }

  async function sendLeadToCRM(payload) {
    try {
      if (!window.UHU_CRM || !window.UHU_CRM.enabled) return { ok: false, skipped: true };
      const endpoint = window.UHU_CRM.endpoint;
      if (!endpoint || endpoint.includes("PASTE_YOUR")) return { ok: false, error: "CRM endpoint not set" };

      // payload → JSON → POST
      const body = JSON.stringify({
        ...payload,
        createdAt: nowISO(),
        source: "uhu.digital",
        page: location.href,
        userAgent: navigator.userAgent,
        lang: document.documentElement.lang || "ru",
      });

      // no-cors: браузер не даст прочитать ответ, но запрос уйдет
      await fetch(endpoint, {
        method: "POST",
        mode: window.UHU_CRM.mode || "no-cors",
        headers: { "Content-Type": "application/json" },
        body,
      });

      return { ok: true };
    } catch (e) {
      return { ok: false, error: safeStr(e) };
    }
  }

  // Экспортируем в window, чтобы вызвать из index.html
  window.UHU_sendLeadToCRM = sendLeadToCRM;
})();

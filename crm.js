// crm.js
(function () {
  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return "{}"; }
  }

  async function sendToCRM(payload) {
    try {
      const cfg = window.UHU_CRM || {};
      if (!cfg.enabled) return false;
      if (!cfg.endpoint || String(cfg.endpoint).includes("PASTE_YOUR")) return false;

      // no-cors: ответ прочитать нельзя, но запрос уйдет
      await fetch(cfg.endpoint, {
        method: "POST",
        mode: cfg.mode || "no-cors",
        headers: { "Content-Type": "application/json" },
        body: safeStringify(payload || {}),
      });

      return true;
    } catch (e) {
      // никогда не ломаем сайт
      return false;
    }
  }

  window.sendToCRM = sendToCRM;
})();

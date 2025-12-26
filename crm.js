(function () {
  async function sendToCRM(data) {
    const cfg = window.UHU_CRM || {};
    if (!cfg.endpoint) return;
    await fetch(cfg.endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  window.sendToCRM = sendToCRM;
})();

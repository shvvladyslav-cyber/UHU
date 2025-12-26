(function () {
  async function sendToCRM(data) {
    const cfg = window.UHU_CRM || {};
    if (!cfg.webAppUrl) return;

    await fetch(cfg.webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  window.sendToCRM = sendToCRM;
})();

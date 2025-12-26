// crm.js (UHU) — safe, works with existing index.html
// What it does:
// 1) Sends lead to Google Sheets (Apps Script WebApp) if configured (crm-config.js)
// 2) Never breaks the site (all errors swallowed)
// 3) Can work in 2 modes:
//    - If #leadForm exists -> submit handler
//    - Otherwise -> it hooks into existing openTelegram() button flow

(function () {
  function $(id) { return document.getElementById(id); }

  function val(id) {
    const el = $(id);
    if (!el) return "";
    return String(el.value || "").trim();
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return "{}"; }
  }

  async function sendToCRM(payload) {
    try {
      const cfg = window.UHU_CRM || {};
      if (!cfg.enabled) return false;
      if (!cfg.endpoint || String(cfg.endpoint).includes("PASTE_YOUR")) return false;

      await fetch(cfg.endpoint, {
        method: "POST",
        mode: cfg.mode || "no-cors",
        headers: { "Content-Type": "application/json" },
        body: safeStringify(payload || {}),
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  function buildPayload() {
    const payload = {
      createdAt: new Date().toISOString(),
      pageUrl: location.href,
      lang: document.documentElement.lang || "ru",
      name: val("name"),
      contact: val("contact") || val("phone") || val("telegram") || "",
      service: val("service"),
      district: val("district") || val("address") || "",
      when: val("when") || "",
      budget: val("budget") || "",
      details: val("details") || val("comment") || "",
      consent: !!($("consent") && $("consent").checked),
      userAgent: navigator.userAgent || ""
    };

    // Remove empty keys to keep Sheets clean
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "" || payload[k] === null || typeof payload[k] === "undefined") delete payload[k];
    });
    return payload;
  }

  function showToast(msg) {
    try {
      const t = $("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2500);
    } catch (e) {}
  }

  async function submitLead(alsoOpenTelegram) {
    // Basic consent check (if checkbox exists)
    const consentEl = $("consent");
    if (consentEl && !consentEl.checked) {
      showToast("Нужно согласие с Datenschutz");
      consentEl.focus();
      return false;
    }

    const payload = buildPayload();
    await sendToCRM(payload);
    showToast("Заявка отправлена ✅");

    if (alsoOpenTelegram && typeof window.openTelegram === "function") {
      // openTelegram from index.html will open chat with prepared text
      try { window.openTelegram(); } catch (e) {}
    }
    return true;
  }

  // Expose for debugging
  window.sendToCRM = sendToCRM;
  window.uhuSubmitLead = submitLead;

  // 1) If there is a real <form id="leadForm"> — handle submit
  const form = document.getElementById("leadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitLead(false);
    });
    return;
  }

  // 2) Otherwise: hook into existing Telegram flow
  // Replace window.openTelegram with wrapper that sends lead before opening Telegram.
  if (typeof window.openTelegram === "function") {
    const original = window.openTelegram;
    window.openTelegram = function () {
      // Fire-and-forget: send lead, then open Telegram anyway
      submitLead(false).finally(() => {
        try { original(); } catch (e) {}
      });
    };
  }
})();

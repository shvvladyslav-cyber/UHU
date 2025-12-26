// crm.js (UHU) — safe, works with existing index.html
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
      if (!cfg.endpoint || String(cfg.endpoint).includes("PASTE_")) return false;

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
      try { window.openTelegram(); } catch (e) {}
    }
    return true;
  }

  window.sendToCRM = sendToCRM;
  window.uhuSubmitLead = submitLead;

  const form = document.getElementById("leadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitLead(false);
    });
    return;
  }

  if (typeof window.openTelegram === "function") {
    const original = window.openTelegram;
    window.openTelegram = function () {
      submitLead(false).finally(() => {
        try { original(); } catch (e) {}
      });
    };
  }
})();

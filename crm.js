// crm.js — UHU CRM (браузер → Google Apps Script Web App)
// Требования:
// 1) На странице есть <form id="leadForm"> и поля с id: name, phone, service, address, comment, consent
// 2) В crm-config.js задан window.UHU_CRM.endpoint = "https://script.google.com/macros/s/XXXX/exec"

(function () {
  const cfg = (window.UHU_CRM || {});
  const ENDPOINT = (cfg.endpoint || "").trim();

  const $ = (id) => document.getElementById(id);

  function toast(msg, ok = true) {
    const el = $("toast");
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.remove("ok", "err");
    el.classList.add(ok ? "ok" : "err");
    el.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.display = "none"; }, 5200);
  }

  function isValidEndpoint(url) {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec\/?$/.test(url);
  }

  async function sendLead(payload) {
    // Важно: Apps Script Web App поддерживает CORS (в Code.gs выставлены заголовки)
    // поэтому используем обычный fetch + читаем JSON-ответ.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    // Если вдруг прокси/хостинг ломает CORS — браузер может не дать прочитать ответ.
    // Но при правильном Apps Script коде всё ок.
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}

    if (!res.ok) {
      throw new Error("HTTP " + res.status + " " + (data?.error || text || ""));
    }
    if (data && data.ok === false) {
      throw new Error(data.error || "Unknown CRM error");
    }
    return data || { ok: true };
  }

  function bind() {
    const form = $("leadForm");
    if (!form) return;

    // подсказка, если endpoint не настроен
    if (!ENDPOINT || ENDPOINT.includes("PASTE_")) {
      toast("⚠️ CRM не настроен: открой crm-config.js и вставь Apps Script Web App URL (endpoint).", false);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!ENDPOINT || ENDPOINT.includes("PASTE_")) {
        toast("❌ CRM endpoint не задан. Открой crm-config.js и вставь URL Web App.", false);
        return;
      }
      if (!isValidEndpoint(ENDPOINT)) {
        // не блокируем полностью, но предупреждаем
        console.warn("Endpoint выглядит необычно:", ENDPOINT);
      }

      const name = ($("name")?.value || "").trim();
      const phone = ($("phone")?.value || "").trim();
      const service = ($("service")?.value || "").trim();
      const address = ($("address")?.value || "").trim();
      const comment = ($("comment")?.value || "").trim();
      const consent = !!$("consent")?.checked;

      if (!name || !phone) {
        toast("❌ Заполни имя и контакт (телефон/Telegram).", false);
        return;
      }
      if (!consent) {
        toast("❌ Нужно согласие с Datenschutz.", false);
        return;
      }

      const btn = $("submitBtn");
      const oldTxt = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Отправляю…"; }

      const payload = {
        ts: new Date().toISOString(),
        name, phone, service, address, comment,
        site: cfg.site || "UHU.digital",
        utm: new URLSearchParams(location.search).toString() || "",
        userAgent: navigator.userAgent
      };

      try {
        await sendLead(payload);
        form.reset();
        toast("✅ Заявка отправлена! Проверь Google Sheets — должна появиться новая строка.", true);
      } catch (err) {
        console.error(err);
        toast("❌ Не удалось отправить. Проверь Apps Script (Deploy) + endpoint в crm-config.js.", false);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = oldTxt || "Отправить заявку"; }
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();

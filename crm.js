// crm.js — UHU CRM client (safe)
// Требует window.UHU_CRM = { endpoint: "https://script.google.com/macros/s/...../exec" }

(function () {
  const cfg = window.UHU_CRM || {};
  const endpoint = cfg.endpoint;

  function qs(id) { return document.getElementById(id); }

  function toast(msg) {
    try { alert(msg); } catch (e) { console.log(msg); }
  }

  async function sendLead(payload) {
    if (!endpoint) throw new Error("CRM endpoint is not set in crm-config.js");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    // Apps Script иногда возвращает text/html — поэтому читаем как текст
    const text = await res.text();

    // пытаемся распарсить JSON
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { ok: res.ok, raw: text }; }

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "CRM request failed");
    }
    return data;
  }

  function buildLeadFromForm(form) {
    const name = (qs("name")?.value || "").trim();
    const phone = (qs("phone")?.value || "").trim();
    const service = (qs("service")?.value || "").trim();
    const address = (qs("address")?.value || "").trim();
    const comment = (qs("comment")?.value || "").trim();
    const consent = !!qs("consent")?.checked;

    return {
      name,
      phone,
      service,
      address,
      comment,
      consent,
      source: location.href,
      ts: new Date().toISOString(),
    };
  }

  function validateLead(lead) {
    if (!lead.name) return "Введите имя";
    if (!lead.phone) return "Введите телефон или Telegram";
    if (!lead.service) return "Выберите услугу";
    if (!lead.consent) return "Нужно согласие с Datenschutz";
    return "";
  }

  function wireForm() {
    const form = document.getElementById("leadForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const lead = buildLeadFromForm(form);
      const err = validateLead(lead);
      if (err) return toast(err);

      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Отправка..."; }

      try {
        await sendLead(lead);
        toast("✅ Заявка отправлена! Мы скоро вам напишем.");
        form.reset();
      } catch (ex) {
        console.error(ex);
        toast("❌ Ошибка отправки. Проверь CRM URL (crm-config.js) и доступ Apps Script.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = oldText || "Отправить заявку"; }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", wireForm);
})();

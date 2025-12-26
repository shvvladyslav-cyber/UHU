// crm.js
(function () {
  const cfg = window.UHU_CRM || {};
  const endpoint = cfg.endpoint;
  const enabled = !!cfg.enabled;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function val(id) {
    const el = qs(`#${id}`);
    return el ? String(el.value || "").trim() : "";
  }

  function getLang() {
    return document.documentElement.lang || "ru";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function sendPayload(payload) {
    if (!enabled) return Promise.resolve({ skipped: true });
    if (!endpoint || endpoint.includes("PASTE_")) {
      console.warn("CRM endpoint not set in crm-config.js");
      return Promise.resolve({ skipped: true, reason: "no-endpoint" });
    }

    const body = JSON.stringify(payload);

    // 1) fetch no-cors (запрос уйдет, но ответа не прочитаем — это нормально)
    return fetch(endpoint, {
      method: "POST",
      mode: (cfg.mode || "no-cors"),
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch((err) => {
      // 2) fallback sendBeacon
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(endpoint, blob);
          return { ok: true, via: "beacon" };
        }
      } catch (_) {}
      throw err;
    });
  }

  function setBtnState(btn, loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.loading = loading ? "1" : "0";
    const orig = btn.dataset.origText || btn.textContent;
    if (!btn.dataset.origText) btn.dataset.origText = orig;
    btn.textContent = loading ? "Отправляем..." : btn.dataset.origText;
  }

  function bindLeadForm() {
    const form = qs("#leadForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = qs('#leadForm button[type="submit"]');
      setBtnState(btn, true);

      try {
        const consent = qs("#consent");
        if (consent && !consent.checked) {
          alert("Нужно согласие с обработкой данных (Datenschutz).");
          setBtnState(btn, false);
          return;
        }

        const payload = {
          created_at: nowIso(),
          name: val("name"),
          phone: val("phone"),
          service: val("service"),
          address: val("address"),
          date: val("date"),
          comment: val("comment"),
          language: getLang(),
          source: (new URLSearchParams(location.search).get("source") || ""),
          page: location.href,
          user_agent: navigator.userAgent,
        };

        // минимальная валидация
        if (!payload.name || !payload.phone) {
          alert("Заполни имя и телефон.");
          setBtnState(btn, false);
          return;
        }

        await sendPayload(payload);

        form.reset();
        alert("Заявка отправлена ✅ Мы свяжемся с вами в Telegram/по телефону.");
      } catch (err) {
        console.error(err);
        alert("Не удалось отправить заявку. Напиши нам в Telegram: @UHU_help");
      } finally {
        setBtnState(btn, false);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindLeadForm);
})();

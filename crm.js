<script>
(() => {
  // Настройки — поменяй под себя
  const CFG = {
    endpoint: window.UHU_CRM?.endpoint || "",   // URL Web App из Apps Script
    revolutLink: "https://revolut.me/vladshvachko", // твой Revolut.me
    autoOpenRevolut: false, // true = после заявки откроет оплату
  };

  function $(id){ return document.getElementById(id); }

  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.error || ("HTTP " + res.status));
    return json;
  }

  function setMsg(text, ok=true) {
    const el = $("formMsg");
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
    el.style.padding = "10px";
    el.style.borderRadius = "12px";
    el.style.marginTop = "10px";
    el.style.border = ok ? "1px solid rgba(0,200,0,.35)" : "1px solid rgba(255,0,0,.35)";
  }

  function getFormData() {
    return {
      name: ($("name")?.value || "").trim(),
      phone: ($("phone")?.value || "").trim(),
      service: ($("service")?.value || "").trim(),
      address: ($("address")?.value || "").trim(),
      comment: ($("comment")?.value || "").trim(),
      source: "pwa"
    };
  }

  window.UHU_sendLead = async function UHU_sendLead() {
    if (!CFG.endpoint) {
      setMsg("❌ CRM не настроен: нет endpoint в crm-config.js", false);
      return;
    }
    const consent = $("consent");
    if (consent && !consent.checked) {
      setMsg("❌ Нужно согласие с Datenschutz", false);
      return;
    }

    const payload = getFormData();
    if (!payload.name || !payload.phone) {
      setMsg("❌ Заполни имя и контакт", false);
      return;
    }

    try {
      setMsg("⏳ Отправляю заявку...");
      await postJSON(CFG.endpoint, payload);
      setMsg("✅ Заявка отправлена! Мы скоро свяжемся.");

      // очистка
      ["name","phone","address","comment"].forEach(id => { if($(id)) $(id).value = ""; });

      if (CFG.autoOpenRevolut) {
        window.open(CFG.revolutLink, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setMsg("❌ Ошибка отправки: " + e.message, false);
    }
  };

  // Автопривязка к форме
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("leadForm");
    if (!form) return;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      window.UHU_sendLead();
    });
  });
})();
</script>

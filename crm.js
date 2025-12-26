// crm.js — отправка заявок в Google Sheets (через Apps Script Web App)
// Работает на GitHub Pages (fetch no-cors) — без чтения ответа, но заявки доходят.
(function () {
  const cfg = window.UHU_CRM || {};
  const endpoint = cfg.endpoint;

  function $(id){ return document.getElementById(id); }

  function toast(msg, ok=true){
    const el = $("crmToast") || $("toast");
    if(!el) { alert(msg); return; }
    el.textContent = msg;
    el.className = "toast " + (ok ? "ok" : "bad");
    el.hidden = false;
    setTimeout(()=>{ el.hidden=true; }, 3500);
  }

  function validate(form){
    const name = $("name")?.value?.trim();
    const phone = $("phone")?.value?.trim();
    const consent = $("consent")?.checked;
    if(!name) return "Введите имя";
    if(!phone) return "Введите телефон или Telegram";
    if(!consent) return "Нужно согласие с Datenschutz";
    if(!endpoint || endpoint.includes("PASTE_")) return "Не настроен endpoint в crm-config.js";
    return null;
  }

  async function sendLead(payload){
    // Для GitHub Pages чаще всего нужен no-cors (Apps Script не отдаёт корректные CORS заголовки).
    // Это нормально: мы не читаем ответ, но запрос уходит.
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function buildPayload(){
    return {
      ts: new Date().toISOString(),
      name: $("name").value.trim(),
      phone: $("phone").value.trim(),
      service: $("service").value,
      address: $("address").value.trim(),
      comment: $("comment").value.trim(),
      source: (new URLSearchParams(location.search)).get("source") || "web",
      page: location.href,
      userAgent: navigator.userAgent
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("leadForm");
    if(!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = validate(form);
      if(err){ toast(err, false); return; }

      const btn = form.querySelector('button[type="submit"]');
      const old = btn ? btn.textContent : "";
      if(btn){ btn.disabled = true; btn.textContent = "Отправка..."; }

      try{
        const payload = buildPayload();
        await sendLead(payload);
        form.reset();
        toast("Заявка отправлена ✅ Мы скоро свяжемся.");
      }catch(ex){
        console.error(ex);
        toast("Не удалось отправить. Проверь endpoint и Deploy Apps Script.", false);
      }finally{
        if(btn){ btn.disabled = false; btn.textContent = old || "Отправить заявку"; }
      }
    });
  });
})();

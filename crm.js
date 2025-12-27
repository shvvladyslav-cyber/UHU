// crm.js — UHU CRM (браузер → Google Apps Script Web App)
// Работает даже если у Apps Script нет CORS (используем mode:'no-cors').
// Ожидает форму с id="leadForm" и поля: name, phone, service, address, comment, consent.

(function(){
  const cfg = (window.UHU_CRM || {});
  const ENDPOINT = (cfg.endpoint || "").trim();

  const $ = (id) => document.getElementById(id);

  function toast(msg, ok=true){
    const el = $("crmToast") || $("toast");
    if(!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.remove("ok","err");
    el.classList.add(ok ? "ok" : "err");
    el.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.style.display="none"; }, 4500);
  }

  function getVal(id){ const el=$(id); return el ? (el.value||"").trim() : ""; }
  function isChecked(id){ const el=$(id); return !!(el && el.checked); }

  async function sendLead(payload){
    if(!ENDPOINT || ENDPOINT.includes("PASTE_YOUR")) {
      throw new Error("CRM не настроен: вставь URL Web App в crm-config.js");
    }

    // Важно: no-cors, иначе браузер может заблокировать ответ от Apps Script.
    // Мы не можем прочитать ответ, но можем показать пользователю "отправлено".
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }

  function bind(){
    const form = $("leadForm");
    if(!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = getVal("name");
      const phone = getVal("phone");
      const service = getVal("service");
      const address = getVal("address");
      const comment = getVal("comment");
      const consent = isChecked("consent");

      if(!name || !phone) { toast("Заполни имя и телефон/Telegram.", false); return; }
      if(!consent) { toast("Нужно согласие с Datenschutz.", false); return; }

      const payload = {
        site: cfg.site || "UHU.digital",
        name, phone, service, address, comment,
        page: location.href,
        ts: new Date().toISOString()
      };

      const btn = form.querySelector('button[type="submit"],button:not([type]),input[type="submit"]');
      const oldTxt = btn ? btn.textContent : null;
      if(btn){ btn.disabled = true; btn.textContent = "Отправка..."; }

      try{
        await sendLead(payload);
        form.reset();
        toast("✅ Заявка отправлена! Мы свяжемся с вами в Telegram.", true);
      }catch(err){
        console.error(err);
        toast("❌ Не удалось отправить. Проверь CRM URL (crm-config.js) и повтори.", false);
      }finally{
        if(btn){ btn.disabled = false; btn.textContent = oldTxt || "Отправить заявку"; }
      }
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();

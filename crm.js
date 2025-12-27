// crm.js — UHU CRM client
// Требует: window.UHU_CRM.endpoint (URL Web App Apps Script)
// Работает с формой:
// <form id="leadForm"> ... inputs #name #phone #service #address #comment #consent ... </form>

(function(){
  const cfg = window.UHU_CRM || {};
  const endpoint = (cfg.endpoint || "").trim();
  const form = document.getElementById("leadForm");
  if(!form) return;

  const $ = (id) => document.getElementById(id);

  function toast(msg, ok){
    let el = document.getElementById("crmToast");
    if(!el){
      el = document.createElement("div");
      el.id = "crmToast";
      el.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:720px;margin:0 auto;padding:12px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(8,18,39,.92);backdrop-filter:blur(10px);color:#eef2ff;font-weight:800;box-shadow:0 18px 40px rgba(0,0,0,.45)";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.borderColor = ok ? "rgba(93,245,171,.35)" : "rgba(255,120,120,.35)";
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ try{ el.remove(); }catch(e){} }, 3200);
  }

  async function sendLead(payload){
    if(!endpoint || endpoint.includes("PASTE_YOUR_")){
      throw new Error("CRM endpoint не настроен (crm-config.js)");
    }
    const res = await fetch(endpoint, {
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" }, // без CORS preflight в большинстве случаев
      body: JSON.stringify(payload)
    });
    const js = await res.json().catch(()=>null);
    if(!res.ok || !js || !js.ok){
      const msg = (js && (js.error||js.message)) ? (js.error||js.message) : ("HTTP " + res.status);
      throw new Error(msg);
    }
    return js;
  }

  function getValue(id){
    const el = $(id);
    if(!el) return "";
    if(el.type === "checkbox") return !!el.checked;
    return (el.value || "").trim();
  }

  form.addEventListener("submit", async (ev)=>{
    ev.preventDefault();

    const consentEl = $("consent");
    if(consentEl && !consentEl.checked){
      toast("Нужно согласие с Datenschutz.", false);
      return;
    }

    const payload = {
      name: getValue("name"),
      phone: getValue("phone"),
      service: getValue("service"),
      address: getValue("address"),
      comment: getValue("comment"),
      source: "uhu.digital",
      page: location.pathname,
      ts: Date.now(),
      userAgent: navigator.userAgent
    };

    const btn = form.querySelector('button[type="submit"]');
    const old = btn ? btn.textContent : "";
    if(btn){ btn.disabled = true; btn.textContent = "Отправляю…"; }

    try{
      await sendLead(payload);
      toast("✅ Заявка отправлена. Спасибо!", true);
      form.reset();
    }catch(err){
      toast("❌ Ошибка: " + String(err), false);
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = old || "Отправить заявку"; }
    }
  });
})();

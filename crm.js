// crm.js (replace whole file)
(function () {
  const QUEUE_KEY = "uhu_crm_queue_v1";
  const MAX_QUEUE = 50;

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return "{}"; }
  }

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return ""; }
  }

  function getCfg() {
    return window.UHU_CRM || {};
  }

  function isEnabled() {
    const cfg = getCfg();
    return !!cfg.enabled && !!cfg.endpoint && !String(cfg.endpoint).includes("PASTE_YOUR");
  }

  function loadQueue() {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = safeJsonParse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }

  function saveQueue(arr) {
    try {
      localStorage.setItem(QUEUE_KEY, safeStringify(arr.slice(0, MAX_QUEUE)));
    } catch (e) {}
  }

  function enqueue(payload) {
    const q = loadQueue();
    q.unshift(payload); // latest first
    saveQueue(q);
  }

  async function postOnce(payload) {
    const cfg = getCfg();

    // no-cors: нельзя прочитать ответ, но запрос уйдет
    await fetch(cfg.endpoint, {
      method: "POST",
      mode: cfg.mode || "no-cors",
      headers: { "Content-Type": "application/json" },
      body: safeStringify(payload || {}),
      keepalive: true
    });

    return true;
  }

  async function flushQueue() {
    if (!isEnabled()) return;

    const q = loadQueue();
    if (!q.length) return;

    // Отправляем с конца, чтобы сохранять порядок (старые -> новые)
    const toSend = q.slice().reverse();
    const left = [];

    for (const item of toSend) {
      try {
        await postOnce(item);
      } catch (e) {
        // если что-то пошло не так — оставляем в очереди
        left.unshift(item);
      }
    }

    saveQueue(left);
  }

  async function sendToCRM(payload) {
    try {
      if (!isEnabled()) return false;

      const decorated = Object.assign(
        { event: "lead_create", sentAt: nowIso() },
        payload || {}
      );

      // если офлайн — сразу в очередь
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        enqueue(decorated);
        return false;
      }

      try {
        await postOnce(decorated);
        // после успешной отправки — попробуем добить хвост очереди
        flushQueue().catch(()=>{});
        return true;
      } catch (e) {
        enqueue(decorated);
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  // публично
  window.sendToCRM = sendToCRM;
  window.UHUCRM = { send: sendToCRM, flush: flushQueue };

  // авто-досыл очереди
  window.addEventListener("online", () => flushQueue().catch(()=>{}));
  window.addEventListener("load", () => flushQueue().catch(()=>{}));
})();

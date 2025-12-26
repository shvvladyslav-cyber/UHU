// crm.js
(function () {
  function cfg() {
    return window.UHU_CRM || {};
  }

  async function postNoCors(url, payload) {
    // no-cors запрещает кастомные заголовки → используем text/plain
    const body = JSON.stringify(payload);

    return fetch(url, {
      method: "POST",
      mode: cfg().mode || "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body
    });
  }

  async function sendToCRM(payload) {
    try {
      const c = cfg();
      if (!c.enabled) return;
      if (!c.endpoint || !String(c.endpoint).includes("/exec")) return;

      await postNoCors(c.endpoint, payload);
    } catch (e) {
      // не ломаем сайт при ошибках CRM
    }
  }

  window.sendToCRM = sendToCRM;
})();

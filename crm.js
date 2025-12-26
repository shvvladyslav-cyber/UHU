async function sendToCRM(payload) {
  if (!window.CRM_ENDPOINT) return;

  try {
    await fetch(window.CRM_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // тихо игнорируем, чтобы не ломать UX
  }
}

// Alerte Telegram optionnelle pour l'équipe (pas un bot client) : utilisée en cas d'échec du cron d'archivage.
// Sans ALERT_TELEGRAM_BOT_TOKEN / ALERT_TELEGRAM_CHAT_ID, cette fonction ne fait rien (silencieux, non bloquant).
export async function sendOpsAlert(text) {
  const token = process.env.ALERT_TELEGRAM_BOT_TOKEN;
  const chat = process.env.ALERT_TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch (e) {
    console.error("Alerte ops (non bloquant):", e.message);
  }
}

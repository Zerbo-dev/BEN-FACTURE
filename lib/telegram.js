const API = "https://api.telegram.org";

export async function tg(token, method, body = {}) {
  const r = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.description || "Erreur Telegram");
  return j.result;
}

/** Télécharge un fichier déjà stocké dans Telegram (liens getFile valables ~1 h : on les utilise à la volée). */
export async function downloadFile(token, fileId) {
  const f = await tg(token, "getFile", { file_id: fileId });
  const r = await fetch(`${API}/file/bot${token}/${f.file_path}`);
  if (!r.ok) throw new Error("Fichier introuvable dans Telegram.");
  return Buffer.from(await r.arrayBuffer());
}

export const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");
export const webhookUrl = (botId) => `${appUrl()}/api/webhook/${botId}`;

import { createHash } from "node:crypto";

// Drive central (compte Google du propriétaire du SaaS), accès via OAuth refresh token, scope drive.file.
const REQUIRED = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "DRIVE_ROOT_FOLDER_ID"];
export const driveConfigured = () => REQUIRED.every((k) => process.env[k]);

let cache = null;
async function accessToken() {
  if (cache && cache.exp > Date.now() + 60_000) return cache.token;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Drive : authentification refusée (${j.error_description || j.error || r.status})`);
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.token;
}

async function api(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${await accessToken()}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`Drive : ${j.error?.message || r.status}`);
  return j;
}

/** Trouve ou crée un sous-dossier (idempotent). */
export async function ensureFolder(name, parentId) {
  const q = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const found = await api(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
  if (found.files?.[0]) return found.files[0].id;
  const made = await api("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parents: [parentId], mimeType: "application/vnd.google-apps.folder" }),
  });
  return made.id;
}

/** Envoie un fichier puis vérifie taille et MD5 renvoyés par Drive. Ne renvoie l'id qu'après vérification. */
export async function uploadVerified({ name, parentId, buffer, mimeType }) {
  const boundary = `b${Date.now()}`;
  const meta = JSON.stringify({ name, parents: [parentId] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const f = await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size,md5Checksum", {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const md5 = createHash("md5").update(buffer).digest("hex"); // simple contrôle d'intégrité
  if (f.md5Checksum !== md5 || Number(f.size) !== buffer.length) throw new Error(`Drive : contrôle d'intégrité échoué pour ${name}`);
  return { id: f.id, md5 };
}

/** Télécharge le contenu binaire d'un fichier Drive existant (utilisé pour la restauration). */
export async function downloadFile(fileId) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  if (!r.ok) throw new Error(`Drive : téléchargement impossible (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

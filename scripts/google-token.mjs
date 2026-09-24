// Obtient UNE FOIS le refresh token Google et crée le dossier racine « Archives BD » (via l'API, car le scope
// drive.file ne voit que les fichiers créés par l'app).
//   npm run google-token
// Prérequis : GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET dans .env.local, et l'URI de redirection
// http://localhost:53682/callback ajoutée à l'identifiant OAuth (type « Application Web »).
import http from "node:http";

const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error("Renseigne GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local"); process.exit(1); }
const redirect = "http://localhost:53682/callback";

const url = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: id, redirect_uri: redirect, response_type: "code", access_type: "offline", prompt: "consent",
  scope: "https://www.googleapis.com/auth/drive.file",
});
console.log("\nOuvre cette adresse dans ton navigateur et autorise l'accès :\n\n" + url + "\n");

const server = http.createServer(async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get("code");
  if (!code) { res.end("En attente…"); return; }
  try {
    const t = await (await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" }),
    })).json();
    if (!t.refresh_token) throw new Error(JSON.stringify(t));
    const f = await (await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
      method: "POST", headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Archives BD", mimeType: "application/vnd.google-apps.folder" }),
    })).json();
    res.end("C'est fait, tu peux fermer cet onglet.");
    console.log("Ajoute ceci à tes variables d'environnement (.env.local et Vercel) :\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${t.refresh_token}`);
    console.log(`DRIVE_ROOT_FOLDER_ID=${f.id}\n`);
  } catch (e) {
    res.end("Erreur, regarde le terminal.");
    console.error("Échec :", e.message);
  }
  server.close();
});
server.listen(53682);

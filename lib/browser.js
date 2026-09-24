import { createClient } from "@supabase/supabase-js";

let client;
/** Client Supabase du navigateur : sert uniquement à la connexion (clé anon, aucun accès direct aux tables). */
export const supabase = () =>
  (client ||= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

/** Appel d'une route API avec le jeton de session. raw = renvoie un Blob (PDF, image). */
export async function api(path, { method = "GET", body, raw, signal } = {}) {
  const { data } = await supabase().auth.getSession();
  const r = await fetch(path, {
    method,
    signal,
    headers: { Authorization: `Bearer ${data.session?.access_token || ""}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Erreur ${r.status}`);
  return raw ? r.blob() : r.json();
}

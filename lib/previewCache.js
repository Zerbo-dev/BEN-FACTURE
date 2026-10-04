import crypto from "node:crypto";
import { db } from "./supabase.js";
import { PALETTES } from "./meta.js";

const BUCKET = "previews";

/** Si (primary, accent) correspond à une des 6 palettes prédéfinies, renvoie son index ; sinon null (couleur personnalisée, non mise en cache). */
export function presetIndex(primary, accent) {
  const i = PALETTES.findIndex((p) => p.primary === primary && p.accent === accent);
  return i === -1 ? null : i;
}

/** Empreinte des champs qui influencent le rendu visuel : change => la clé change => plus jamais d'aperçu périmé servi. */
function brandingHash(org) {
  const h = crypto.createHash("sha1");
  h.update(JSON.stringify({
    name: org.name, address: org.address, phone: org.phone, email: org.email, footer_text: org.footer_text,
    currency: org.currency, default_tva: org.default_tva, default_terms: org.default_terms, default_garantie: org.default_garantie,
    payment_methods: org.payment_methods, logo_path: org.logo_path, signature_path: org.signature_path,
  }));
  return h.digest("hex").slice(0, 16);
}

export function cacheKey(org, template, paletteIdx) {
  return `${org.id}/${template}-${paletteIdx}-${brandingHash(org)}.png`;
}

export async function getCached(key) {
  const { data, error } = await db().storage.from(BUCKET).download(key);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Best-effort : un échec d'écriture du cache ne doit jamais faire échouer la requête d'aperçu. */
export async function putCached(key, buffer) {
  try { await db().storage.from(BUCKET).upload(key, buffer, { contentType: "image/png", upsert: true }); }
  catch (e) { console.error("Cache aperçu (écriture):", e.message); }
}

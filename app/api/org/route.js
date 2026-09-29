import { handle, requireOrg, publicOrg, HttpError } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";
import { randomToken } from "@/lib/crypto.js";
import { TEMPLATE_META, DEFAULT_THEME } from "@/lib/meta.js";
import { safeColor } from "@/lib/pdf/colors.js";
import { signedBrandingUrls } from "@/lib/branding.js";

export const runtime = "nodejs";

const str = (v, max) => String(v ?? "").trim().slice(0, max);

function cleanMethods(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 6).map((m) => ({
    label: str(m?.label, 40),
    lines: (Array.isArray(m?.lines) ? m.lines : []).slice(0, 4).map((l) => str(l, 120)).filter(Boolean),
  })).filter((m) => m.label);
}

export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  return Response.json({ ...publicOrg(org), ...(await signedBrandingUrls(org)) });
});

export const PUT = handle(async (req) => {
  const { org } = await requireOrg(req);
  const b = await req.json();
  const patch = {};
  if ("name" in b) patch.name = str(b.name, 80);
  if ("email" in b) patch.email = str(b.email, 120);
  if ("phone" in b) patch.phone = str(b.phone, 40);
  if ("address" in b) patch.address = str(b.address, 160);
  if ("footer_text" in b) patch.footer_text = str(b.footer_text, 200);
  if ("currency" in b) patch.currency = str(b.currency, 12) || "FCFA";
  if ("default_tva" in b) patch.default_tva = Math.min(100, Math.max(0, Number(b.default_tva) || 0));
  if ("default_terms" in b) patch.default_terms = str(b.default_terms, 300);
  if ("default_garantie" in b) patch.default_garantie = str(b.default_garantie, 200);
  if ("payment_methods" in b) patch.payment_methods = cleanMethods(b.payment_methods);
  if ("template" in b) {
    if (!TEMPLATE_META.some((t) => t.id === b.template)) throw new HttpError(400, "Modèle inconnu.");
    patch.template = b.template;
  }
  if ("theme" in b) {
    patch.theme = {
      primary: safeColor(b.theme?.primary, DEFAULT_THEME.primary),
      accent: safeColor(b.theme?.accent, DEFAULT_THEME.accent),
    };
  }
  const updated = must(await db().from("organizations").update(patch).eq("id", org.id).select("*").single());
  return Response.json({ ...publicOrg(updated), ...(await signedBrandingUrls(updated)) });
});

// Nouveau lien d'association : invalide l'ancien (utile pour ajouter un collaborateur).
export const POST = handle(async (req) => {
  const { org } = await requireOrg(req);
  const { action } = await req.json();
  if (action !== "new_claim_code") throw new HttpError(400, "Action inconnue.");
  const updated = must(await db().from("organizations").update({ claim_code: randomToken(8) }).eq("id", org.id).select("*").single());
  return Response.json({ ...publicOrg(updated), ...(await signedBrandingUrls(updated)) });
});

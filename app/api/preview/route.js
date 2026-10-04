import { handle, requireOrg, HttpError } from "@/lib/auth.js";
import { loadBranding } from "@/lib/branding.js";
import { renderPdf, pdfToPng } from "@/lib/pdf/render.jsx";
import { sampleProps } from "@/lib/pdf/sample.js";
import { TEMPLATE_META } from "@/lib/meta.js";
import { safeColor } from "@/lib/pdf/colors.js";
import { presetIndex, cacheKey, getCached, putCached } from "@/lib/previewCache.js";
import { checkPreviewRate } from "@/lib/rateLimit.js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Aperçu en direct du modèle (avant enregistrement) : ?template=&primary=&accent=&format=png|pdf
export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const sp = new URL(req.url).searchParams;
  const template = sp.get("template") || org.template;
  if (!TEMPLATE_META.some((t) => t.id === template)) throw new HttpError(400, "Modèle inconnu.");
  const theme = {
    primary: safeColor(sp.get("primary"), org.theme?.primary),
    accent: safeColor(sp.get("accent"), org.theme?.accent),
  };
  const asPdf = sp.get("format") === "pdf";
  const long = sp.get("long") === "1";

  // Les 6 palettes prédéfinies, en liste courte (pas de logo personnalisé variable), sont mises en cache :
  // elles couvrent la grande majorité des changements de modèle/couleur faits depuis le tableau de bord.
  const idx = !asPdf && !long ? presetIndex(theme.primary, theme.accent) : null;
  const key = idx !== null ? cacheKey(org, template, idx) : null;

  if (key) {
    const hit = await getCached(key);
    if (hit) return new Response(hit, { headers: { "content-type": "image/png", "cache-control": "private, max-age=86400", "x-preview-cache": "hit" } });
  }

  // Au-delà du cache : la génération réelle (PDF + rasterisation) est l'étape coûteuse, donc limitée en débit,
  // qu'il s'agisse d'une couleur personnalisée ou d'un premier passage sur une palette prédéfinie.
  const rate = await checkPreviewRate(org.id);
  if (!rate.allowed) throw new HttpError(429, "Trop d'aperçus générés en une minute. Patientez un instant et réessayez.");

  const pdf = await renderPdf(sampleProps(org, await loadBranding(org), { template, theme, longList: long }));
  const body = asPdf ? pdf : await pdfToPng(pdf, 2);

  if (key) await putCached(key, body); // best-effort, ne bloque pas la réponse en cas d'échec

  return new Response(body, {
    headers: { "content-type": asPdf ? "application/pdf" : "image/png", "cache-control": "private, no-store", "x-preview-cache": "miss" },
  });
});

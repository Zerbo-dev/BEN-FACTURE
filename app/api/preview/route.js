import { handle, requireOrg, HttpError } from "@/lib/auth.js";
import { loadBranding } from "@/lib/branding.js";
import { renderPdf, pdfToPng } from "@/lib/pdf/render.jsx";
import { sampleProps } from "@/lib/pdf/sample.js";
import { TEMPLATE_META } from "@/lib/meta.js";
import { safeColor } from "@/lib/pdf/colors.js";

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
  const pdf = await renderPdf(sampleProps(org, await loadBranding(org), { template, theme, longList: sp.get("long") === "1" }));
  const asPdf = sp.get("format") === "pdf";
  return new Response(asPdf ? pdf : await pdfToPng(pdf, 2), {
    headers: { "content-type": asPdf ? "application/pdf" : "image/png", "cache-control": "private, no-store" },
  });
});

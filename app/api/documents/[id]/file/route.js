import { handle, requireOrg, HttpError } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";
import { decrypt } from "@/lib/crypto.js";
import { downloadFile } from "@/lib/telegram.js";
import { loadBranding } from "@/lib/branding.js";
import { renderPdf } from "@/lib/pdf/render.jsx";
import { DOC_LABELS } from "@/lib/format.js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Renvoie le PDF d'origine (stocké dans Telegram) ; à défaut, le régénère depuis les données.
export const GET = handle(async (req, { params }) => {
  const { org } = await requireOrg(req);
  const { id } = await params;
  const d = must(await db().from("documents").select("*").eq("id", id).eq("org_id", org.id).maybeSingle());
  if (!d) throw new HttpError(404, "Document introuvable.");

  let pdf = null;
  if (d.tg_file_id && org.bot_token_enc) {
    try { pdf = await downloadFile(decrypt(org.bot_token_enc), d.tg_file_id); } catch (e) { console.error("Telegram:", e.message); }
  }
  if (!pdf && d.payload) {
    const { template, theme, ...doc } = d.payload;
    pdf = await renderPdf({ template, theme, org, branding: await loadBranding(org), doc });
  }
  if (!pdf) throw new HttpError(410, "Ce document est archivé sur le Drive et son fichier n'est plus disponible ici.");

  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${DOC_LABELS[d.doc_type]}_${d.number.replace("/", "-")}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
});

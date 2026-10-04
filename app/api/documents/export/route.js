import { handle, requireOrg, HttpError } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";
import { documentsToCsv } from "@/lib/csv.js";

export const runtime = "nodejs";

// Export CSV à la demande, sur une période choisie (indépendant de l'archivage automatique mensuel).
// total_ht/total_ttc/client_name restent en base même pour un document allégé après archivage : rien à régénérer.
export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  if (!from || !to) throw new HttpError(400, "Indiquez une période (from et to).");

  const docs = must(
    await db().from("documents").select("number, doc_type, issued_on, client_name, total_ht, total_ttc, currency")
      .eq("org_id", org.id).gte("issued_on", from).lte("issued_on", to).order("issued_on")
  );
  return new Response(documentsToCsv(docs), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="documents_${from}_${to}.csv"`,
      "cache-control": "private, no-store",
    },
  });
});

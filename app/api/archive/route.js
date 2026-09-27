import { handle, requireOrg } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

// Liste des lots archivés (un par organisation et par mois) : de quoi afficher "Mois archivés" et les restaurer.
export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const rows = must(
    await db().from("archive_batches").select("id, period, row_count, created_at").eq("org_id", org.id).order("period", { ascending: false })
  );
  return Response.json(rows);
});

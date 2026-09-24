import { handle, requireOrg } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const q = (new URL(req.url).searchParams.get("q") || "").replace(/[%,()]/g, " ").trim();
  let query = db()
    .from("documents")
    .select("id, doc_type, number, issued_on, client_name, currency, total_ttc, archived_at, tg_file_id, payload")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`client_name.ilike.%${q}%,number.ilike.%${q}%`);
  const rows = must(await query).map(({ payload, tg_file_id, ...r }) => ({ ...r, downloadable: !!(tg_file_id || payload) }));
  return Response.json(rows);
});

import { handle, requireOrg, HttpError } from "@/lib/auth.js";
import { db } from "@/lib/supabase.js";

export const runtime = "nodejs";
const PAGE_SIZE = 20;

export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").replace(/[%,()]/g, " ").trim();
  const from = sp.get("from"); // AAAA-MM-JJ
  const to = sp.get("to");
  const page = Math.max(0, parseInt(sp.get("page") || "0", 10) || 0);

  let query = db()
    .from("documents")
    .select("id, doc_type, number, issued_on, client_name, currency, total_ttc, archived_at, tg_file_id, payload", { count: "exact" })
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (q) query = query.or(`client_name.ilike.%${q}%,number.ilike.%${q}%`);
  if (from) query = query.gte("issued_on", from);
  if (to) query = query.lte("issued_on", to);

  const { data, error, count } = await query;
  if (error) throw new HttpError(500, error.message);

  const rows = data.map(({ payload, tg_file_id, ...r }) => ({ ...r, downloadable: !!(tg_file_id || payload) }));
  return Response.json({ rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE, hasMore: (page + 1) * PAGE_SIZE < (count ?? 0) });
});

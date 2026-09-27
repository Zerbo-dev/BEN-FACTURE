import { handle, requireOrg } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

const startOfMonth = () => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)).toISOString().slice(0, 10); };
const daysAgo = (n) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
const weekKey = (iso) => { const d = new Date(iso + "T00:00:00Z"); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); };

export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);

  const monthRows = must(await db().from("documents").select("doc_type, total_ttc").eq("org_id", org.id).gte("issued_on", startOfMonth()));
  const byType = { devis: 0, facture: 0, proforma: 0 };
  let revenue = 0;
  for (const r of monthRows) { byType[r.doc_type] = (byType[r.doc_type] || 0) + 1; revenue += Number(r.total_ttc) || 0; }

  // 8 dernières semaines (lundi à dimanche), pour une courbe simple de l'activité.
  const weekRows = must(await db().from("documents").select("issued_on").eq("org_id", org.id).gte("issued_on", daysAgo(56)));
  const counts = new Map();
  for (const r of weekRows) { const k = weekKey(r.issued_on); counts.set(k, (counts.get(k) || 0) + 1); }
  const weeks = [];
  const cursor = new Date(weekKey(daysAgo(49)) + "T00:00:00Z");
  for (let i = 0; i < 8; i++) {
    const k = cursor.toISOString().slice(0, 10);
    weeks.push({ week: k, count: counts.get(k) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  const recent = must(
    await db().from("documents").select("id, doc_type, number, client_name, total_ttc, currency, issued_on, archived_at, tg_file_id, payload")
      .eq("org_id", org.id).order("created_at", { ascending: false }).limit(5)
  ).map(({ payload, tg_file_id, ...r }) => ({ ...r, downloadable: !!(tg_file_id || payload) }));

  return Response.json({
    month: { count: monthRows.length, revenue, byType, currency: org.currency },
    weeks,
    recent,
  });
});

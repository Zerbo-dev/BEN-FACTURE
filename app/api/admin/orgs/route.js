import { handle } from "@/lib/auth.js";
import { requireAdmin } from "@/lib/admin.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

// Vue d'ensemble de toutes les organisations (équipe B.A.G uniquement) : forfait, bot, activité du mois.
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const orgs = must(
    await db().from("organizations").select("id, name, email, slug, plan, currency, bot_id, bot_username, created_at")
      .order("created_at", { ascending: false })
  );
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const docs = orgs.length
    ? must(await db().from("documents").select("org_id, total_ttc").gte("issued_on", start).in("org_id", orgs.map((o) => o.id)))
    : [];
  const byOrg = new Map();
  for (const d of docs) {
    const c = byOrg.get(d.org_id) || { count: 0, revenue: 0 };
    c.count += 1; c.revenue += Number(d.total_ttc) || 0;
    byOrg.set(d.org_id, c);
  }
  const rows = orgs.map((o) => ({
    ...o, bot_connected: !!o.bot_id,
    month_count: byOrg.get(o.id)?.count || 0,
    month_revenue: byOrg.get(o.id)?.revenue || 0,
  }));
  return Response.json(rows);
});

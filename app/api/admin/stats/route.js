import { handle } from "@/lib/auth.js";
import { requireAdmin } from "@/lib/admin.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const orgs = must(await db().from("organizations").select("id, plan, bot_id, created_at"));
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const docs = must(await db().from("documents").select("org_id, total_ttc, currency").gte("issued_on", start));

  const revenueByCurrency = {};
  for (const d of docs) revenueByCurrency[d.currency] = (revenueByCurrency[d.currency] || 0) + (Number(d.total_ttc) || 0);

  return Response.json({
    orgsTotal: orgs.length,
    orgsPro: orgs.filter((o) => o.plan === "pro").length,
    botsConnected: orgs.filter((o) => o.bot_id).length,
    docsThisMonth: docs.length,
    revenueByCurrency,
  });
});

import { handle } from "@/lib/auth.js";
import { requireAdmin } from "@/lib/admin.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const rows = must(await db().from("cron_runs").select("id, ran_at, ok, summary").order("ran_at", { ascending: false }).limit(20));
  return Response.json(rows);
});

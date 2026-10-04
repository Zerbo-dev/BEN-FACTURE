import { db } from "@/lib/supabase.js";
import { driveConfigured } from "@/lib/drive.js";

export const runtime = "nodejs";

// Public, sans authentification : pensé pour un service de supervision externe (UptimeRobot, etc.).
// Ne renvoie rien de sensible, seulement des indicateurs ok/erreur et des horodatages.
export async function GET() {
  try {
    const { error } = await db().from("organizations").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw new Error(error.message);

    const { data: lastCron } = await db().from("cron_runs").select("ran_at, ok").order("ran_at", { ascending: false }).limit(1).maybeSingle();

    return Response.json({
      status: "ok",
      database: "ok",
      drive_configured: driveConfigured(),
      last_cron: lastCron ? { ran_at: lastCron.ran_at, ok: lastCron.ok } : null,
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ status: "error", database: "error", error: e.message }, { status: 503 });
  }
}

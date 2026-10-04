import { db, must } from "@/lib/supabase.js";
import { runArchive } from "@/lib/archive.js";
import { sendOpsAlert } from "@/lib/alert.js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Appelée chaque nuit par Vercel Cron (voir vercel.json). Vercel envoie CRON_SECRET en Bearer.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET non défini." }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  let out, ok;
  try {
    out = await runArchive();
    ok = out.errors.length === 0;
  } catch (e) {
    console.error(e);
    out = { error: e.message };
    ok = false;
  }

  try { must(await db().from("cron_runs").insert({ ok, summary: out })); }
  catch (e) { console.error("Enregistrement cron_runs (non bloquant):", e.message); }

  if (!ok) {
    const detail = out.errors?.length ? out.errors.join("; ") : out.error || "erreur inconnue";
    await sendOpsAlert(`🚫 Cron d'archivage en échec : ${detail}`);
  }

  return Response.json(out, { status: ok ? 200 : 500 });
}

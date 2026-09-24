import { runArchive } from "@/lib/archive.js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Appelée chaque nuit par Vercel Cron (voir vercel.json). Vercel envoie CRON_SECRET en Bearer.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET non défini." }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  try {
    return Response.json(await runArchive());
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

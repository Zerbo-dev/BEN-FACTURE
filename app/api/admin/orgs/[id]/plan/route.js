import { handle, HttpError } from "@/lib/auth.js";
import { requireAdmin } from "@/lib/admin.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

// Passage manuel free <-> pro (pas de paiement en ligne automatisé pour l'instant).
export const PUT = handle(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const { plan } = await req.json();
  if (!["free", "pro"].includes(plan)) throw new HttpError(400, "Forfait inconnu.");
  const updated = must(await db().from("organizations").update({ plan }).eq("id", id).select("id, name, plan").single());
  return Response.json(updated);
});

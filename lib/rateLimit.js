import { db, must } from "./supabase.js";

const WINDOW_SECONDS = 60;
const LIMIT = 20; // aperçus générés (non servis depuis le cache) par minute et par organisation

/** Incrémente atomiquement le compteur de la fenêtre en cours ; renvoie si la limite est dépassée. */
export async function checkPreviewRate(orgId) {
  const windowMs = WINDOW_SECONDS * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
  const count = must(await db().rpc("bump_preview_rate", { p_org: orgId, p_window: windowStart }));
  return { allowed: count <= LIMIT, count, limit: LIMIT };
}

import { db } from "./supabase.js";
import { HttpError } from "./auth.js";

/** Liste des e-mails autorisés dans le panneau admin (ADMIN_EMAILS, séparés par des virgules). */
function allowedEmails() {
  return (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** Comme requireOrg, mais vérifie l'appartenance à l'équipe plutôt qu'une organisation cliente. */
export async function requireAdmin(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Connexion requise.");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Session expirée, reconnecte-toi.");
  const email = (data.user.email || "").toLowerCase();
  const allowed = allowedEmails();
  if (!allowed.length || !allowed.includes(email)) throw new HttpError(403, "Accès réservé à l'équipe.");
  return { user: data.user };
}

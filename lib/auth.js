import { db } from "./supabase.js";
import { randomToken } from "./crypto.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Enveloppe une route API : erreurs => JSON { error } avec le bon statut. */
export const handle = (fn) => async (req, ctx) => {
  try {
    return await fn(req, ctx);
  } catch (e) {
    if (!e.status) console.error(e);
    return Response.json({ error: e.message || "Erreur serveur" }, { status: e.status || 500 });
  }
};

/** Vérifie le jeton Supabase (Authorization: Bearer) et renvoie l'utilisateur + son organisation (créée au premier appel). */
export async function requireOrg(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Connexion requise.");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Session expirée, reconnecte-toi.");
  const user = data.user;

  const found = await db().from("organizations").select("*").eq("owner_user_id", user.id).maybeSingle();
  if (found.error) throw new Error(found.error.message);
  if (found.data) return { user, org: found.data };

  const created = await db()
    .from("organizations")
    .insert({ owner_user_id: user.id, slug: `org-${randomToken(4)}`, email: user.email || "", claim_code: randomToken(8) })
    .select("*")
    .single();
  if (created.error) throw new Error(created.error.message);
  return { user, org: created.data };
}

/** Vue de l'organisation sans aucun secret, pour le navigateur. */
export function publicOrg(o) {
  const { bot_token_enc, webhook_secret, owner_user_id, claim_code, authorized_chats, ...rest } = o;
  return {
    ...rest,
    has_logo: !!o.logo_path,
    has_signature: !!o.signature_path,
    bot_connected: !!o.bot_id,
    channel_connected: !!o.storage_channel_id,
    authorized_count: (authorized_chats || []).length,
    claim_link: o.bot_username && claim_code ? `https://t.me/${o.bot_username}?start=${claim_code}` : null,
    bot_link: o.bot_username ? `https://t.me/${o.bot_username}` : null,
  };
}

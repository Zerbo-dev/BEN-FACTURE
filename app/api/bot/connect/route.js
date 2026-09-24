import { handle, requireOrg, publicOrg, HttpError } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";
import { encrypt, decrypt, randomToken } from "@/lib/crypto.js";
import { tg, webhookUrl, appUrl } from "@/lib/telegram.js";

export const runtime = "nodejs";

// Le client colle le token de SON bot (créé avec @BotFather) : on le vérifie, on le chiffre, on branche le webhook.
export const POST = handle(async (req) => {
  const { org } = await requireOrg(req);
  const token = String((await req.json()).token || "").trim();
  if (!/^\d+:[\w-]{30,}$/.test(token)) throw new HttpError(400, "Ce token n'a pas le bon format (copie-le depuis @BotFather).");
  if (!appUrl().startsWith("https://")) throw new HttpError(500, "APP_URL doit être une adresse https publique.");

  let me;
  try { me = await tg(token, "getMe"); } catch { throw new HttpError(400, "Telegram refuse ce token. Vérifie-le ou régénère-le dans @BotFather."); }

  const clash = must(await db().from("organizations").select("id").eq("bot_id", me.id).neq("id", org.id).maybeSingle());
  if (clash) throw new HttpError(409, "Ce bot est déjà utilisé par un autre compte.");

  // Ancien bot : on coupe son webhook (sans bloquer si ça échoue).
  if (org.bot_token_enc && org.bot_id !== me.id) {
    try { await tg(decrypt(org.bot_token_enc), "deleteWebhook"); } catch {}
  }

  const secret = randomToken(24);
  await tg(token, "setWebhook", {
    url: webhookUrl(me.id),
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
    drop_pending_updates: true,
  });
  await tg(token, "setMyCommands", {
    commands: [
      { command: "devis", description: "Nouveau devis" },
      { command: "facture", description: "Nouvelle facture" },
      { command: "proforma", description: "Nouvelle facture proforma" },
      { command: "annuler", description: "Annuler la commande en cours" },
    ],
  });

  const updated = must(
    await db().from("organizations").update({
      bot_id: me.id, bot_username: me.username, bot_token_enc: encrypt(token), webhook_secret: secret,
      ...(org.bot_id !== me.id ? { authorized_chats: [], storage_channel_id: null } : {}),
    }).eq("id", org.id).select("*").single()
  );
  return Response.json(publicOrg(updated));
});

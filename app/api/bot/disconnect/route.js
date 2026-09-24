import { handle, requireOrg, publicOrg } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";
import { decrypt } from "@/lib/crypto.js";
import { tg } from "@/lib/telegram.js";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { org } = await requireOrg(req);
  if (org.bot_token_enc) {
    try { await tg(decrypt(org.bot_token_enc), "deleteWebhook"); } catch {}
  }
  const updated = must(
    await db().from("organizations").update({
      bot_id: null, bot_username: null, bot_token_enc: null, webhook_secret: null, authorized_chats: [], storage_channel_id: null,
    }).eq("id", org.id).select("*").single()
  );
  return Response.json(publicOrg(updated));
});

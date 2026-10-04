import { db } from "@/lib/supabase.js";
import { decrypt } from "@/lib/crypto.js";
import { buildBot } from "@/lib/bot.js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Un webhook par bot : /api/webhook/<id du bot Telegram>. Le secret est propre à chaque bot.
export async function POST(req, { params }) {
  const { botId } = await params;
  const { data: org } = await db().from("organizations").select("*").eq("bot_id", botId).maybeSingle();
  if (!org) return new Response("Not found", { status: 404 });
  if (req.headers.get("x-telegram-bot-api-secret-token") !== org.webhook_secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await req.json();

  // Déduplication : si Telegram relance le même update_id (réseau coupé juste après notre réponse),
  // on ne le traite qu'une fois. L'échec de cette étape ne doit jamais bloquer le traitement normal.
  if (update?.update_id != null) {
    const { error } = await db().from("processed_updates").insert({ org_id: org.id, update_id: update.update_id });
    if (error) {
      if (error.code === "23505") return new Response("ok"); // déjà traité, on ignore silencieusement
      console.error("Déduplication webhook (non bloquant):", error.message);
    }
  }

  try {
    const bot = buildBot(org, decrypt(org.bot_token_enc));
    await bot.handleUpdate(update);
  } catch (e) {
    console.error("Erreur webhook:", e); // toujours 200 : Telegram ne doit pas rejouer l'update
  }
  return new Response("ok");
}

export const GET = () => new Response("Webhook actif.");

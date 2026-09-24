import { db, must } from "./supabase.js";

const TTL_MS = 6 * 60 * 60 * 1000; // une conversation abandonnée expire au bout de 6 h

export async function getState(orgId, chatId) {
  const row = must(
    await db().from("bot_sessions").select("state, expires_at").eq("org_id", orgId).eq("chat_id", chatId).maybeSingle()
  );
  if (!row || new Date(row.expires_at) < new Date()) return null;
  return row.state;
}

export async function setState(orgId, chatId, state) {
  must(
    await db()
      .from("bot_sessions")
      .upsert({ org_id: orgId, chat_id: chatId, state, expires_at: new Date(Date.now() + TTL_MS).toISOString() })
  );
}

export async function clearState(orgId, chatId) {
  must(await db().from("bot_sessions").delete().eq("org_id", orgId).eq("chat_id", chatId));
}

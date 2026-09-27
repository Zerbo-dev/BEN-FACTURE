import { db, must } from "./supabase.js";
import { formatNumber } from "./format.js";

/** Tire le numéro suivant (atomique, par organisation / type / année). */
export async function nextDocNumber(orgId, docType) {
  const now = new Date();
  const n = must(await db().rpc("next_doc_number", { p_org: orgId, p_type: docType, p_year: now.getUTCFullYear() }));
  return formatNumber(n, now);
}

export async function saveDocument(row) {
  must(await db().from("documents").insert(row));
}

/** Nombre de documents émis depuis le 1er du mois en cours (heure UTC = heure de Ouagadougou). */
export async function monthlyCount(orgId) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const { count } = await db().from("documents").select("id", { count: "exact", head: true }).eq("org_id", orgId).gte("issued_on", start);
  return count || 0;
}

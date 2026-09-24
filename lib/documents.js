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

import { gzipSync, gunzipSync } from "node:zlib";
import { db, must } from "./supabase.js";
import { driveConfigured, ensureFolder, uploadVerified, downloadFile } from "./drive.js";
import { documentsToCsv } from "./csv.js";

const GRACE_DAYS = 7;       // délai entre l'archivage et l'allègement de la base
const MAX_DOCS_PER_RUN = 300;
const MAX_GROUPS_PER_RUN = 10;

/**
 * Tâche planifiée :
 * 1. purge les sessions de bot expirées (sans archivage) ;
 * 2. archive sur le Drive les documents anciens (un .jsonl.gz + un registre .csv par organisation et par mois) ;
 * 3. allège en base (payload = null) les documents archivés depuis plus de 7 jours : la fiche reste, le détail est sur le Drive.
 * Rien n'est jamais supprimé avant que Drive ait confirmé la taille et le MD5 du fichier.
 */
export async function runArchive() {
  const out = { sessionsPurged: 0, archivedGroups: [], lightened: 0, skipped: null, errors: [] };

  must(await db().from("bot_sessions").delete().lt("expires_at", new Date().toISOString()));

  // Les entrées de déduplication des webhooks n'ont besoin de vivre que quelques jours.
  await db().from("processed_updates").delete().lt("created_at", new Date(Date.now() - 2 * 86400_000).toISOString());

  // Les fenêtres de limitation de débit n'ont besoin de vivre que quelques minutes.
  await db().from("preview_rate_limits").delete().lt("window_start", new Date(Date.now() - 10 * 60_000).toISOString());

  if (driveConfigured()) {
    const size = Number(must(await db().rpc("db_size_bytes")));
    const limit = Number(process.env.DB_LIMIT_BYTES || 524288000);
    const months = size > limit * 0.7 ? 3 : Number(process.env.ARCHIVE_AFTER_MONTHS || 12);
    out.months = months;
    out.dbSizeMb = Math.round(size / 1048576);

    const now = new Date();
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1)).toISOString().slice(0, 10);

    const docs = must(
      await db().from("documents").select("*").is("archived_at", null).lt("issued_on", cutoff)
        .order("issued_on").limit(MAX_DOCS_PER_RUN)
    );
    const groups = new Map();
    for (const d of docs) {
      const k = `${d.org_id}|${d.issued_on.slice(0, 7)}`;
      groups.set(k, [...(groups.get(k) || []), d]);
    }
    const orgIds = [...new Set(docs.map((d) => d.org_id))];
    const orgs = new Map(
      orgIds.length ? must(await db().from("organizations").select("id, slug").in("id", orgIds)).map((o) => [o.id, o]) : []
    );

    for (const [key, list] of [...groups].slice(0, MAX_GROUPS_PER_RUN)) {
      const [orgId, period] = key.split("|");
      try {
        const { count } = await db().from("archive_batches").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("period", period);
        const suffix = count ? `_${count + 1}` : ""; // une période archivée en plusieurs fois ne s'écrase pas
        const orgFolder = await ensureFolder(orgs.get(orgId).slug, process.env.DRIVE_ROOT_FOLDER_ID);
        const yearFolder = await ensureFolder(period.slice(0, 4), orgFolder);

        const gz = gzipSync(Buffer.from(list.map((d) => JSON.stringify(d)).join("\n") + "\n"), { level: 9 });
        const data = await uploadVerified({ name: `${period}_documents${suffix}.jsonl.gz`, parentId: yearFolder, buffer: gz, mimeType: "application/gzip" });
        const reg = await uploadVerified({ name: `${period}_registre${suffix}.csv`, parentId: yearFolder, buffer: Buffer.from(documentsToCsv(list)), mimeType: "text/csv" });

        const batch = must(
          await db().from("archive_batches")
            .insert({ org_id: orgId, period, drive_file_id: data.id, registre_file_id: reg.id, md5: data.md5, row_count: list.length })
            .select("id").single()
        );
        must(await db().from("documents").update({ archived_at: new Date().toISOString(), archive_batch_id: batch.id }).in("id", list.map((d) => d.id)));
        out.archivedGroups.push({ org: orgs.get(orgId).slug, period, rows: list.length, gzBytes: gz.length });
      } catch (e) {
        out.errors.push(`${key} : ${e.message}`); // rien n'est marqué archivé : repris au prochain passage
      }
    }

    // Allègement : uniquement ce qui est archivé depuis plus de GRACE_DAYS jours.
    const before = new Date(Date.now() - GRACE_DAYS * 86400_000).toISOString();
    const { count } = await db().from("documents").update({ payload: null }, { count: "exact" }).lt("archived_at", before).not("payload", "is", null);
    out.lightened = count || 0;
  } else {
    out.skipped = "Drive non configuré : aucune archive ni allègement.";
  }
  return out;
}

/**
 * Restaure le détail (payload) des documents d'un lot archivé, à partir du fichier .jsonl.gz sur le Drive.
 * Ne touche pas à `archived_at` (le document reste marqué archivé) : seul le détail redevient consultable
 * et téléchargeable (la route de téléchargement régénère le PDF depuis ce détail si besoin).
 */
export async function restoreBatch(orgId, batchId) {
  if (!driveConfigured()) throw new Error("Le Drive d'archives n'est pas configuré.");
  const batch = must(await db().from("archive_batches").select("*").eq("id", batchId).eq("org_id", orgId).maybeSingle());
  if (!batch) throw new Error("Archive introuvable.");

  const gz = await downloadFile(batch.drive_file_id);
  const lines = gunzipSync(gz).toString("utf8").split("\n").filter(Boolean);

  let restored = 0;
  for (const line of lines) {
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    if (!row?.id || !row?.payload) continue;
    const { error, count } = await db()
      .from("documents")
      .update({ payload: row.payload }, { count: "exact" })
      .eq("id", row.id).eq("org_id", orgId).is("payload", null);
    if (!error && count) restored += count;
  }
  return { total: lines.length, restored };
}

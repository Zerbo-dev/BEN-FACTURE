"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { SkeletonRows } from "./Skeleton.jsx";

const fmt = (iso) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default function AdminCron() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/cron").then(setRows).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="stack">
      <div className="rule-head"><i /><h2>Santé du cron d'archivage</h2></div>
      <p className="muted small">Les 20 dernières exécutions planifiées (chaque nuit). Un échec n'empêche pas l'application de fonctionner, mais la base ne sera pas archivée tant qu'il n'est pas résolu.</p>
      {err && <p className="msg err" role="alert">{err}</p>}
      {rows === null && <SkeletonRows n={4} />}
      {rows && rows.length === 0 && <p className="empty">Aucune exécution enregistrée pour l'instant.</p>}
      <div className="docs">
        {(rows || []).map((r) => (
          <div className="doc" key={r.id}>
            <div><span className={`tag ${r.ok ? "" : "archived"}`} style={!r.ok ? { background: "var(--danger-light)", color: "var(--danger-deep)" } : undefined}>{r.ok ? "OK" : "Échec"}</span>{fmt(r.ran_at)}</div>
            <div className="amt small">{r.summary?.archivedGroups?.length ?? 0} lot(s) archivé(s)</div>
            {!r.ok && (
              <div className="who" style={{ gridColumn: "1 / -1", color: "var(--danger-deep)" }}>
                {r.summary?.error || r.summary?.errors?.join("; ") || "Erreur non précisée."}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

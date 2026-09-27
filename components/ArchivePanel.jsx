"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { useAction, Msg } from "./ui.jsx";

const monthLabel = (period) => {
  const [y, m] = period.split("-");
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
};

export default function ArchivePanel({ onRestored }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const { busy, msg, run } = useAction();
  const [busyId, setBusyId] = useState(null);

  const load = () => api("/api/archive").then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function restore(batch_id) {
    setBusyId(batch_id);
    await run(async () => {
      const r = await api("/api/archive/restore", { method: "POST", body: { batch_id } });
      onRestored?.();
      return r;
    }, "Détail restauré : les documents de ce mois sont de nouveau téléchargeables.");
    setBusyId(null);
  }

  if (err) return <p className="msg err" role="alert">{err}</p>;
  if (rows && rows.length === 0) return null;

  return (
    <div className="stack" style={{ marginTop: 28 }}>
      <div className="rule-head"><i /><h3>Mois archivés sur le Drive</h3></div>
      <p className="muted small">Le détail des documents anciens est stocké hors de la base. Restaurez un mois pour retélécharger ses PDF.</p>
      <div className="docs">
        {(rows || []).map((b) => (
          <div className="doc" key={b.id}>
            <div style={{ textTransform: "capitalize" }}>{monthLabel(b.period)}</div>
            <div className="amt small">{b.row_count} document{b.row_count > 1 ? "s" : ""}</div>
            <div className="actions">
              <button className="btn" disabled={busy && busyId === b.id} onClick={() => restore(b.id)}>
                {busy && busyId === b.id ? "Restauration…" : "Restaurer"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Msg msg={msg} />
    </div>
  );
}

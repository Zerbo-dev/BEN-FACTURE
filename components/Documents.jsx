"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import ArchivePanel from "./ArchivePanel.jsx";

const LABEL = { devis: "Devis", facture: "Facture", proforma: "Proforma" };
const money = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR");

export default function Documents({ org }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const reload = () => api(`/api/documents?q=${encodeURIComponent(q)}`).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function download(d) {
    setErr("");
    try {
      const blob = await api(`/api/documents/${d.id}/file`, { raw: true });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${LABEL[d.doc_type]}_${d.number.replace("/", "-")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } catch (e) { setErr(e.message); }
  }

  return (
    <section>
      <div className="rule-head"><i /><h2>Documents</h2></div>
      <label className="f">Rechercher<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du client ou numéro" /></label>
      {err && <p className="msg err" role="alert">{err}</p>}
      {rows && rows.length === 0 && (
        <p className="empty">{q ? "Aucun document ne correspond." : org.bot_connected ? "Aucun document pour l'instant. Envoyez /devis à votre bot pour créer le premier." : "Connectez votre bot pour créer votre premier document."}</p>
      )}
      <div className="docs">
        {(rows || []).map((d) => (
          <div className="doc" key={d.id}>
            <div>
              <span className="tag">{LABEL[d.doc_type]}</span><span className="no">{d.number}</span>
              {d.archived_at && <span className="tag archived" style={{ marginLeft: 8 }}>Archivé</span>}
            </div>
            <div className="amt">{money(d.total_ttc)} {d.currency}</div>
            <div className="who">{d.client_name || "Client non précisé"}</div>
            <div className="when">{new Date(d.issued_on).toLocaleDateString("fr-FR")}</div>
            <div className="actions">
              {d.downloadable ? <button className="btn" onClick={() => download(d)}>Télécharger le PDF</button> : <span className="muted small">Détail conservé sur le Drive</span>}
            </div>
          </div>
        ))}
      </div>
      <ArchivePanel onRestored={reload} />
    </section>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import ArchivePanel from "./ArchivePanel.jsx";
import { SkeletonRows } from "./Skeleton.jsx";
import { useToast } from "./Toast.jsx";
import { busyLabel } from "./ui.jsx";

const LABEL = { devis: "Devis", facture: "Facture", proforma: "Proforma" };
const money = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR");
const todayIso = () => new Date().toISOString().slice(0, 10);
const startOfMonthIso = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);

export default function Documents({ org }) {
  const toast = useToast();
  const [data, setData] = useState(null); // { rows, total, page, pageSize, hasMore }
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [err, setErr] = useState("");
  const [dlId, setDlId] = useState(null);
  const [exporting, setExporting] = useState(false);

  function qs(extra = {}) {
    const p = new URLSearchParams({ q, from, to, page: String(page), ...extra });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return p.toString();
  }

  const reload = () => api(`/api/documents?${qs()}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { const t = setTimeout(reload, 250); return () => clearTimeout(t); }, [q, from, to, page]);
  useEffect(() => { setPage(0); }, [q, from, to]); // tout changement de filtre revient à la première page

  async function download(d) {
    setDlId(d.id);
    try {
      const blob = await api(`/api/documents/${d.id}/file`, { raw: true });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${LABEL[d.doc_type]}_${d.number.replace("/", "-")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } catch (e) { toast(e.message, "err"); }
    finally { setDlId(null); }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const exportFrom = from || startOfMonthIso();
      const exportTo = to || todayIso();
      const blob = await api(`/api/documents/export?from=${exportFrom}&to=${exportTo}`, { raw: true });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `documents_${exportFrom}_${exportTo}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } catch (e) { toast(e.message, "err"); }
    finally { setExporting(false); }
  }

  const rows = data?.rows;

  return (
    <section>
      <div className="rule-head"><i /><h2>Documents</h2></div>
      <div className="grid2" style={{ marginBottom: 14 }}>
        <label className="f">Rechercher<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du client ou numéro" /></label>
        <label className="f">Du<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="f">Au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn" disabled={exporting} onClick={exportCsv}>
          {busyLabel(from || to ? "Exporter cette période en CSV" : "Exporter le mois en cours en CSV", exporting, "Export…")}
        </button>
      </div>

      {err && <p className="msg err" role="alert">{err}</p>}
      {rows === undefined || rows === null ? <SkeletonRows n={4} /> : rows.length === 0 && (
        <p className="empty">{q || from || to ? "Aucun document ne correspond." : org.bot_connected ? "Aucun document pour l'instant. Envoyez /devis à votre bot pour créer le premier." : "Connectez votre bot pour créer votre premier document."}</p>
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
              {d.downloadable ? <button className="btn" disabled={dlId === d.id} onClick={() => download(d)}>{busyLabel("Télécharger le PDF", dlId === d.id, "Téléchargement…")}</button> : <span className="muted small">Détail conservé sur le Drive</span>}
            </div>
          </div>
        ))}
      </div>

      {data && data.total > data.pageSize && (
        <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
          <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
          <span className="muted small">Page {page + 1} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
          <button className="btn" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
        </div>
      )}

      <ArchivePanel onRestored={reload} />
    </section>
  );
}

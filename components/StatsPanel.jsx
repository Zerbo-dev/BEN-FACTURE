"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { SkeletonStats, SkeletonBlock, SkeletonRows } from "./Skeleton.jsx";

const LABEL = { devis: "Devis", facture: "Factures", proforma: "Proforma" };
const money = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR");
const short = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Petite courbe d'activité en barres, en SVG pur (pas de bibliothèque de graphiques). */
function WeekBars({ weeks }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const w = 44, gap = 10, h = 90;
  const width = weeks.length * (w + gap) - gap;
  return (
    <svg viewBox={`0 0 ${width} ${h + 22}`} role="img" aria-label="Documents émis par semaine, huit dernières semaines" style={{ width: "100%", height: "auto" }}>
      {weeks.map((wk, i) => {
        const bh = wk.count ? Math.max(6, (wk.count / max) * h) : 2;
        const x = i * (w + gap);
        return (
          <g key={wk.week}>
            <rect x={x} y={h - bh} width={w} height={bh} fill={wk.count ? "var(--green)" : "var(--rule-soft)"} />
            {wk.count > 0 && <text x={x + w / 2} y={h - bh - 6} textAnchor="middle" fontSize="12" fontFamily="IBM Plex Mono" fill="var(--ink)">{wk.count}</text>}
            <text x={x + w / 2} y={h + 16} textAnchor="middle" fontSize="10.5" fill="var(--ink-soft)">{short(wk.week)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function StatsPanel({ org, onNav }) {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/stats").then(setS).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="msg err" role="alert">{err}</p>;
  if (!s) {
    return (
      <div className="stack">
        <div className="rule-head"><i /><h2>Ce mois-ci</h2></div>
        <SkeletonStats />
        <div className="rule-head"><i /><h3>Activité, 8 dernières semaines</h3></div>
        <div className="card"><SkeletonBlock h={112} /></div>
        <div className="rule-head"><i /><h3>Derniers documents</h3></div>
        <SkeletonRows n={3} />
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="rule-head"><i /><h2>Ce mois-ci</h2></div>
      <div className="stats-grid">
        <div className="stat"><span className="stat-num mono">{s.month.count}</span><span className="stat-label">document{s.month.count > 1 ? "s" : ""}</span></div>
        <div className="stat"><span className="stat-num mono">{money(s.month.revenue)}</span><span className="stat-label">{s.month.currency} facturés (TTC)</span></div>
        {["devis", "facture", "proforma"].map((t) => s.month.byType[t] > 0 && (
          <div className="stat" key={t}><span className="stat-num mono">{s.month.byType[t]}</span><span className="stat-label">{LABEL[t].toLowerCase()}</span></div>
        ))}
      </div>

      <div className="rule-head"><i /><h3>Activité, 8 dernières semaines</h3></div>
      <div className="card"><WeekBars weeks={s.weeks} /></div>

      <div className="rule-head"><i /><h3>Derniers documents</h3></div>
      {s.recent.length === 0 ? (
        <p className="empty">Rien pour l'instant. {org.bot_connected ? "Envoyez /devis à votre bot pour créer le premier." : "Connectez votre bot pour commencer."}</p>
      ) : (
        <div className="docs">
          {s.recent.map((d) => (
            <div className="doc" key={d.id}>
              <div><span className="tag">{LABEL[d.doc_type] === "Factures" ? "Facture" : LABEL[d.doc_type]}</span><span className="no">{d.number}</span></div>
              <div className="amt">{money(d.total_ttc)} {d.currency}</div>
              <div className="who">{d.client_name || "Client non précisé"}</div>
              <div className="when">{new Date(d.issued_on).toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      )}
      <div><button className="btn" onClick={() => onNav("docs")}>Voir tous les documents</button></div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { SkeletonStats } from "./Skeleton.jsx";

const money = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR");

export default function AdminStats() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/stats").then(setS).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="msg err" role="alert">{err}</p>;
  if (!s) return <SkeletonStats />;

  const revenue = Object.entries(s.revenueByCurrency);
  return (
    <div className="stats-grid" style={{ marginBottom: 26 }}>
      <div className="stat"><span className="stat-num mono">{s.orgsTotal}</span><span className="stat-label">organisations</span></div>
      <div className="stat"><span className="stat-num mono">{s.orgsPro}</span><span className="stat-label">au forfait payant</span></div>
      <div className="stat"><span className="stat-num mono">{s.botsConnected}</span><span className="stat-label">bots connectés</span></div>
      <div className="stat"><span className="stat-num mono">{s.docsThisMonth}</span><span className="stat-label">documents ce mois-ci</span></div>
      {revenue.map(([cur, n]) => (
        <div className="stat" key={cur}><span className="stat-num mono">{money(n)}</span><span className="stat-label">{cur} facturés ce mois-ci</span></div>
      ))}
    </div>
  );
}

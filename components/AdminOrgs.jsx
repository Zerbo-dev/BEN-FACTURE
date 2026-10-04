"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { useAction, busyLabel } from "./ui.jsx";
import { SkeletonRows } from "./Skeleton.jsx";

const money = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR");

export default function AdminOrgs() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const { busy, run } = useAction();
  const [busyId, setBusyId] = useState(null);

  const load = () => api("/api/admin/orgs").then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function togglePlan(o) {
    const next = o.plan === "pro" ? "free" : "pro";
    setBusyId(o.id);
    await run(async () => {
      await api(`/api/admin/orgs/${o.id}/plan`, { method: "PUT", body: { plan: next } });
      setRows((rs) => rs.map((r) => (r.id === o.id ? { ...r, plan: next } : r)));
    }, next === "pro" ? "Organisation passée en payant." : "Organisation repassée en gratuit.");
    setBusyId(null);
  }

  const filtered = (rows || []).filter((o) => !q || [o.name, o.email, o.slug].some((v) => (v || "").toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="stack">
      <div className="rule-head"><i /><h2>Organisations</h2></div>
      <label className="f">Rechercher<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, identifiant" /></label>
      {err && <p className="msg err" role="alert">{err}</p>}
      {rows === null && <SkeletonRows n={5} />}
      {rows && filtered.length === 0 && <p className="empty">Aucune organisation{q ? " ne correspond." : " pour l'instant."}</p>}
      <div className="docs">
        {filtered.map((o) => (
          <div className="doc" key={o.id}>
            <div>
              <span className={`tag ${o.plan === "pro" ? "" : "archived"}`}>{o.plan === "pro" ? "Payant" : "Gratuit"}</span>
              <strong>{o.name || "(sans nom)"}</strong>
            </div>
            <div className="amt">{money(o.month_revenue)} {o.currency}</div>
            <div className="who">{o.email || "—"} {o.bot_connected ? `· @${o.bot_username}` : "· bot non connecté"}</div>
            <div className="when">{o.month_count} doc. ce mois-ci</div>
            <div className="actions">
              <button className="btn" disabled={busy && busyId === o.id} onClick={() => togglePlan(o)}>
                {busyLabel(o.plan === "pro" ? "Repasser en gratuit" : "Passer en payant", busy && busyId === o.id, "Mise à jour…")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

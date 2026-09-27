"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/browser.js";
import { SkeletonLine } from "./Skeleton.jsx";

export default function PlanPanel() {
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/plan").then(setP).catch((e) => setErr(e.message)); }, []);
  const contact = process.env.NEXT_PUBLIC_UPGRADE_CONTACT_URL;

  return (
    <section className="card stack">
      <div className="rule-head"><i /><h2>Votre forfait</h2></div>
      {err && <p className="msg err" role="alert">{err}</p>}
      {!p ? (
        <div className="stack"><SkeletonLine w="70%" /><SkeletonLine w="45%" /></div>
      ) : p.plan === "pro" ? (
        <>
          <p className="status"><span className="dot on" />Forfait payant — documents illimités</p>
          <p className="muted">{p.used} document{p.used > 1 ? "s" : ""} émis ce mois-ci.</p>
        </>
      ) : (
        <>
          <p className="status"><span className={`dot ${p.remaining > 0 ? "on" : ""}`} />Forfait gratuit — {p.used} / {p.limit} documents ce mois-ci</p>
          {p.remaining === 0 && <p className="msg err" role="alert">Limite atteinte : le bot ne peut plus générer de document jusqu'au mois prochain, sauf passage au forfait payant.</p>}
          <p className="muted">Le forfait gratuit se renouvelle chaque mois. Passez au forfait payant pour des documents illimités.</p>
          <div>
            {contact
              ? <a className="btn primary" href={contact} target="_blank" rel="noreferrer">Passer au forfait payant</a>
              : <p className="muted small">Contactez l'équipe {process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"} pour passer au forfait payant.</p>}
          </div>
        </>
      )}
    </section>
  );
}

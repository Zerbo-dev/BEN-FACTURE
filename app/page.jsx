"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser.js";
import { TEMPLATE_META, PALETTES, FREE_MONTHLY_LIMIT } from "@/lib/meta.js";

const APP = () => process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture";

function Nav({ signedIn }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <span className="brand"><i />{APP()}</span>
        <a className="btn" href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "Tableau de bord" : "Se connecter"}</a>
      </div>
    </header>
  );
}

/** Mock d'un devis, en CSS pur : illustre le rendu sans appeler le moteur de PDF (page publique, sans session). */
function MockSheet() {
  const rows = [["Diagnostic et repérage", "25 000"], ["Câblage du tableau électrique", "55 000"], ["Prise 16A encastrée", "36 000"]];
  return (
    <div className="mock-sheet" aria-hidden="true">
      <div className="mock-band"><span>Devis n° 0000001-09/26</span><i /></div>
      <div className="mock-rows">
        {rows.map(([d, a]) => <div key={d} className="mock-row"><span>{d}</span><span className="mono">{a}</span></div>)}
      </div>
      <div className="mock-total"><span>Total</span><span className="mono">136 880 FCFA</span></div>
    </div>
  );
}

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase().auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  return (
    <>
      <Nav signedIn={signedIn} />

      <main>
        <section className="hero wrap">
          <div>
            <h1>Vos devis et factures, écrits comme un message.</h1>
            <p className="lead">
              Décrivez la prestation dans une conversation Telegram : le PDF part en quelques secondes, à vos couleurs,
              avec votre logo, numéroté et archivé tout seul.
            </p>
            <div className="row">
              <a className="btn primary" href={signedIn ? "/dashboard" : "/login?mode=signup"}>
                {signedIn ? "Aller au tableau de bord" : "Créer un compte gratuit"}
              </a>
              <a className="btn link" href="#comment-ca-marche">Comment ça marche</a>
            </div>
          </div>
          <MockSheet />
        </section>

        <section className="wrap" id="comment-ca-marche">
          <div className="rule-head"><i /><h2>Comment ça marche</h2></div>
          <div className="grid3">
            <div className="feature"><span className="mono step-no">01</span><h3>Décrivez la prestation</h3><p className="muted">Dans Telegram : « Devis pour M. Sawadogo, câblage 55000, prise 16A 4500 » — ou répondez aux questions du bot, une par une.</p></div>
            <div className="feature"><span className="mono step-no">02</span><h3>Le PDF arrive</h3><p className="muted">À vos couleurs, avec votre logo et votre signature, numéroté automatiquement. Un aperçu image part avec, prêt pour WhatsApp.</p></div>
            <div className="feature"><span className="mono step-no">03</span><h3>C'est archivé</h3><p className="muted">Chaque document est conservé, consultable et retéléchargeable depuis votre tableau de bord, à tout moment.</p></div>
          </div>
        </section>

        <section className="wrap">
          <div className="rule-head"><i /><h2>Trois modèles, vos couleurs</h2></div>
          <div className="grid3">
            {TEMPLATE_META.map((t) => (
              <div className="feature" key={t.id}>
                <h3>{t.label}</h3>
                <p className="muted">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="palettes" style={{ marginTop: 6 }}>
            {PALETTES.map((p) => (
              <span className="pal" key={p.name} style={{ cursor: "default" }}>
                <i style={{ background: `linear-gradient(90deg, ${p.primary} 50%, ${p.accent} 50%)` }} />{p.name}
              </span>
            ))}
          </div>
        </section>

        <section className="wrap">
          <div className="rule-head"><i /><h2>Tarifs</h2></div>
          <div className="grid2">
            <div className="plan-card">
              <h3>Gratuit</h3>
              <p className="plan-price">0 FCFA</p>
              <p className="muted">{FREE_MONTHLY_LIMIT} documents par mois, tous types confondus. De quoi démarrer sans engagement.</p>
              <a className="btn" href={signedIn ? "/dashboard" : "/login?mode=signup"}>Commencer</a>
            </div>
            <div className="plan-card highlight">
              <h3>Payant</h3>
              <p className="plan-price">Sur devis</p>
              <p className="muted">Documents illimités. Pensé pour une activité régulière.</p>
              <a className="btn primary" href={signedIn ? "/dashboard" : "/login?mode=signup"}>Nous contacter</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap row" style={{ justifyContent: "space-between" }}>
          <span className="brand small"><i />{APP()}</span>
          <a href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "Tableau de bord" : "Se connecter"}</a>
        </div>
      </footer>
    </>
  );
}

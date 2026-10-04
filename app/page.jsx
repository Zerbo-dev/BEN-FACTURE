"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/browser.js";
import Logo from "@/components/Logo.jsx";
import Reveal from "@/components/Reveal.jsx";
import { StaggerGroup, StaggerItem } from "@/components/Stagger.jsx";
import { FREE_MONTHLY_LIMIT } from "@/lib/meta.js";
import {
  Zap, ShieldCheck, CheckCircle2, PlayCircle, Building2, Bot, Send, FileDown,
  FileText, FileCheck2, FileClock, FileStack, ListOrdered, Palette, Check, Paperclip,
} from "lucide-react";

function Nav({ signedIn }) {
  return (
    <header className="topbar" style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div className="wrap">
        <Logo />
        <nav className="row desktop-only" style={{ gap: 26, fontWeight: 600, fontSize: ".93rem" }}>
          <a href="#comment-ca-marche">Comment ça marche</a>
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#tarifs">Tarifs</a>
        </nav>
        <div className="row">
          <a className="btn" href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "Tableau de bord" : "Se connecter"}</a>
          {!signedIn && <a className="btn primary" href="/login?mode=signup">Commencer gratuitement</a>}
        </div>
      </div>
    </header>
  );
}

/** Illustration de l'accueil : un téléphone (conversation Telegram) + un aperçu de document, en CSS pur. */
function HeroVisual() {
  return (
    <motion.div
      className="hero-visual" aria-hidden="true" data-reveal=""
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
    >
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-bar"><span className="logo-mark" style={{ width: 24, height: 24 }}><FileText size={14} /></span>Votre bot</div>
          <div className="phone-body">
            <div className="bubble me">/facture</div>
            <div className="bubble">Client : M. Sawadogo<br />Câblage tableau : 55 000 FCFA</div>
            <div className="bubble" style={{ background: "var(--green-light)", color: "var(--green-deep)", fontWeight: 650 }}>✓ Facture générée !</div>
            <div className="bubble file"><FileDown size={16} />FAC-0000007-09/26.pdf</div>
          </div>
        </div>
      </div>
      <motion.div
        className="doc-preview"
        initial={{ opacity: 0, rotate: 0, x: 24 }} animate={{ opacity: 1, rotate: 3, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      >
        <div className="dp-head"><strong style={{ fontSize: ".85rem" }}>Facture</strong><span className="muted small">09/26</span></div>
        <div className="dp-row"><span>Câblage tableau</span><span>55 000</span></div>
        <div className="dp-row"><span>Prise 16A × 8</span><span>36 000</span></div>
        <div className="dp-total"><span>Total</span><span>91 000 FCFA</span></div>
      </motion.div>
    </motion.div>
  );
}

const STEPS = [
  { icon: Building2, title: "Connectez votre entreprise", desc: "Nom, logo, couleurs, modes de paiement — quelques champs, une fois." },
  { icon: Bot, title: "Créez votre bot Telegram", desc: "En deux minutes avec @BotFather ; il porte votre nom, personne d'autre ne peut l'utiliser." },
  { icon: Send, title: "Envoyez /devis, /facture ou /proforma", desc: "Répondez aux questions du bot, ou décrivez tout en un seul message." },
  { icon: FileDown, title: "Recevez votre PDF", desc: "Prêt à envoyer, avec un aperçu image pour WhatsApp, et archivé automatiquement." },
];

const FEATURES = [
  { icon: FileText, color: "blue", title: "Devis", desc: "Proposez vos services, tous les modes de paiement affichés." },
  { icon: FileCheck2, color: "green", title: "Factures", desc: "Formalisez la vente, seuls les paiements choisis apparaissent." },
  { icon: FileClock, color: "purple", title: "Proformas", desc: "Préparez une estimation, avant la facture définitive." },
  { icon: FileStack, color: "orange", title: "PDF A4 soigné", desc: "Généré en JavaScript pur — rapide, sans Chromium, pagination automatique." },
  { icon: ListOrdered, color: "cyan", title: "Numérotation automatique", desc: "Un numéro par organisation, type et année, jamais réutilisé." },
  { icon: Palette, color: "pink", title: "Modèles personnalisables", desc: "Trois mises en page, vos couleurs, votre logo et votre signature." },
];

const COMMANDS = [
  ["/devis", "Démarre un nouveau devis"],
  ["/facture", "Démarre une nouvelle facture"],
  ["/proforma", "Démarre une facture proforma"],
  ["/annuler", "Annule la commande en cours"],
];

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase().auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);
  const cta = signedIn ? "/dashboard" : "/login?mode=signup";
  const ctaLabel = signedIn ? "Aller au tableau de bord" : "Commencer gratuitement";

  return (
    <>
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <Nav signedIn={signedIn} />

      <main id="main-content">
        <section className="hero wrap">
          <StaggerGroup onView={false} as="div">
            <StaggerItem as="span" className="pill"><Send size={14} />Depuis Telegram</StaggerItem>
            <StaggerItem as="h1">Vos devis et factures.<br />Directement depuis <b>Telegram</b>.</StaggerItem>
            <StaggerItem as="p" className="lead">Créez un document professionnel en quelques secondes, envoyez-le à votre client, et gardez tout votre historique au même endroit.</StaggerItem>
            <StaggerItem as="div" className="row">
              <a className="btn primary" href={cta}>{ctaLabel} →</a>
              <a className="btn" href="#comment-ca-marche"><PlayCircle size={17} />Voir comment ça marche</a>
            </StaggerItem>
            <StaggerItem as="div" className="trust">
              <span><Zap size={15} />Rapide</span>
              <span><ShieldCheck size={15} />Sécurisé</span>
              <span><CheckCircle2 size={15} />Simple à utiliser</span>
            </StaggerItem>
          </StaggerGroup>
          <HeroVisual />
        </section>

        <Reveal as="section" className="wrap" id="comment-ca-marche">
          <p className="eyebrow">Comment ça marche</p>
          <h2>En 4 étapes simples</h2>
          <p className="muted" style={{ maxWidth: "54ch" }}>Créez votre entreprise, connectez votre bot Telegram, et envoyez vos commandes. Le reste se fait automatiquement.</p>
          <StaggerGroup as="div" className="grid3" style={{ marginTop: 26 }}>
            {STEPS.map((s, i) => (
              <StaggerItem as="div" className="step" key={s.title}>
                <span className="step-no">{i + 1}</span>
                <s.icon size={22} color="var(--blue-deep)" />
                <h3>{s.title}</h3>
                <p className="muted small">{s.desc}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Reveal>

        <Reveal as="section" className="wrap" id="fonctionnalites">
          <p className="eyebrow">Fonctionnalités</p>
          <h2>Une facturation pensée pour les pros</h2>
          <p className="muted" style={{ maxWidth: "54ch" }}>Tout ce dont vous avez besoin pour gérer vos devis, factures et proformas, sans prise de tête.</p>
          <StaggerGroup as="div" className="grid3" style={{ marginTop: 26 }}>
            {FEATURES.map((f) => (
              <StaggerItem as="div" className="feature-card" key={f.title} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                <span className={`icon-badge ${f.color}`}><f.icon size={20} /></span>
                <h3>{f.title}</h3>
                <p className="muted small">{f.desc}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Reveal>

        <Reveal as="section" className="wrap">
          <div className="split">
            <div>
              <p className="eyebrow">Votre identité, vos documents</p>
              <h2>À vos couleurs, partout</h2>
              <p className="muted">Ajoutez votre logo, vos couleurs, votre signature et les informations de votre entreprise — elles apparaissent sur chaque document, généré ou aperçu.</p>
              <ul>
                {["Logo d'entreprise", "Couleurs personnalisées", "Signature", "Informations légales en pied de page"].map((t) => (
                  <li key={t}><Check size={17} />{t}</li>
                ))}
              </ul>
            </div>
            <div className="mockcard">
              <p className="muted small" style={{ marginBottom: 10, fontWeight: 700 }}>Personnalisation</p>
              <div className="stack" style={{ gap: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="small">Logo</span><span className="tag">Ajouté</span></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="small">Couleur principale</span><span style={{ width: 20, height: 20, borderRadius: 5, background: "var(--blue)" }} /></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="small">Couleur d'accent</span><span style={{ width: 20, height: 20, borderRadius: 5, background: "var(--gold)" }} /></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="small">Signature</span><span className="tag">Ajoutée</span></div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="wrap">
          <div className="split rev">
            <div className="mockcard">
              <p className="muted small" style={{ marginBottom: 10, fontWeight: 700 }}>Aperçu — ce mois-ci</p>
              <div className="row" style={{ gap: 10 }}>
                {[["24", "Documents"], ["8", "Factures"], ["4", "Devis"]].map(([n, l]) => (
                  <div className="stat" key={l} style={{ flex: 1, padding: 12 }}><span className="stat-num" style={{ fontSize: "1.3rem" }}>{n}</span><span className="stat-label">{l}</span></div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Tout reste organisé</p>
              <h2>Un tableau de bord clair</h2>
              <p className="muted">Suivez vos documents, votre activité du mois, et gardez une trace de tout, en toute sécurité.</p>
              <ul>
                {["Aperçu et statistiques", "Historique complet des documents", "Archivage automatique", "Restauration en un clic"].map((t) => (
                  <li key={t}><Check size={17} />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="wrap">
          <p className="eyebrow">Telegram comme point d'entrée</p>
          <h2>Simple comme un message</h2>
          <p className="muted" style={{ maxWidth: "54ch", marginBottom: 26 }}>Restez dans votre environnement habituel et gérez tout avec des commandes Telegram.</p>
          <div className="split">
            <div className="phone-screen" style={{ maxWidth: 360 }}>
              <div className="phone-bar"><Paperclip size={15} />Conversation</div>
              <div className="phone-body">
                <div className="bubble me">/facture</div>
                <div className="bubble">Client : M. Sawadogo<br />Diagnostic électrique : 25 000 FCFA</div>
                <div className="bubble" style={{ background: "var(--green-light)", color: "var(--green-deep)", fontWeight: 650 }}>✓ Facture générée !</div>
              </div>
            </div>
            <StaggerGroup as="div" className="cmds">
              {COMMANDS.map(([c, d]) => (
                <StaggerItem as="div" className="cmd" key={c}><b>{c}</b><span className="muted small">{d}</span></StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Reveal>

        <Reveal as="section" className="wrap" id="tarifs">
          <p className="eyebrow">Tarification</p>
          <h2>Une offre adaptée à vos besoins</h2>
          <p className="muted" style={{ maxWidth: "54ch" }}>Commencez gratuitement et passez au forfait payant quand votre activité grandit.</p>
          <StaggerGroup as="div" className="grid2" style={{ marginTop: 26, maxWidth: 640 }}>
            <StaggerItem as="div" className="plan-card" whileHover={{ y: -3 }}>
              <h3>Gratuit</h3>
              <p className="muted small">Parfait pour démarrer</p>
              <p className="plan-price">0 FCFA</p>
              <ul>
                <li><Check size={16} />{FREE_MONTHLY_LIMIT} documents par mois</li>
                <li><Check size={16} />3 modèles, vos couleurs</li>
                <li><Check size={16} />Archivage automatique</li>
              </ul>
              <a className="btn primary" href={cta} style={{ marginTop: 8 }}>Commencer gratuitement</a>
            </StaggerItem>
            <StaggerItem as="div" className="plan-card highlight" whileHover={{ y: -3 }}>
              <h3>Payant</h3>
              <p className="muted small">Pour une activité régulière</p>
              <p className="plan-price">Sur devis</p>
              <ul>
                <li><Check size={16} />Documents illimités</li>
                <li><Check size={16} />Tout le forfait gratuit</li>
                <li><Check size={16} />Support prioritaire</li>
              </ul>
              <a className="btn" style={{ marginTop: 8, background: "#fff" }} href={cta}>Nous contacter</a>
            </StaggerItem>
          </StaggerGroup>
        </Reveal>
      </main>

      <Reveal as="div" className="cta-band">
        <div className="wrap">
          <div>
            <h2>Arrêtez de fabriquer vos factures une par une.</h2>
            <p>Passez à une facturation qui suit votre activité.</p>
          </div>
          <a className="btn primary" href={cta}>{ctaLabel} →</a>
        </div>
      </Reveal>
      <footer className="foot">
        <div className="wrap">
          <Logo size={24} dark />
          <span>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}. Tous droits réservés.</span>
        </div>
      </footer>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api, supabase } from "@/lib/browser.js";
import DashboardShell from "@/components/DashboardShell.jsx";
import CompanyForm from "@/components/CompanyForm.jsx";
import TemplatePanel from "@/components/TemplatePanel.jsx";
import BotPanel from "@/components/BotPanel.jsx";
import Documents from "@/components/Documents.jsx";
import PlanPanel from "@/components/PlanPanel.jsx";
import StatsPanel from "@/components/StatsPanel.jsx";
import { AnimatePresence, motion } from "motion/react";

const TABS = [["overview", "Aperçu"], ["docs", "Documents"], ["company", "Entreprise"], ["model", "Modèle"], ["bot", "Bot Telegram"], ["plan", "Forfait"]];

export default function Dashboard() {
  const [org, setOrg] = useState(null);
  const [tab, setTab] = useState("overview");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (!data.session) return location.replace("/login");
      try {
        const o = await api("/api/org");
        setOrg(o);
        setTab(!o.name ? "company" : !o.bot_connected ? "bot" : "overview");
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  async function logout() { await supabase().auth.signOut(); location.replace("/"); }

  if (err) return <main className="wrap" style={{ paddingTop: 24 }}><p className="msg err" role="alert">{err}</p></main>;
  if (!org) return <main className="wrap" style={{ paddingTop: 24 }}><p className="muted">Chargement…</p></main>;

  const todo = [
    ["company", "Renseigner votre entreprise", !!org.name],
    ["bot", "Connecter votre bot Telegram", org.bot_connected],
    ["bot", "Relier votre compte Telegram", org.authorized_count > 0],
  ];
  const remaining = todo.filter((t) => !t[2]);

  return (
    <DashboardShell brand={process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"} tabs={TABS} active={tab} onSelect={setTab} onLogout={logout}>
      {remaining.length > 0 && (
        <section className="card todo">
          <div className="rule-head" style={{ borderTop: "none", paddingTop: 0 }}><h3>Pour commencer</h3></div>
          <ul>
            {todo.map(([target, label, done], i) => (
              <li key={i}>
                <span className={done ? "done" : ""}>{label}</span>
                {!done && <button className="btn" onClick={() => setTab(target)}>Y aller</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {tab === "overview" && <StatsPanel org={org} onNav={setTab} />}
          {tab === "docs" && <Documents org={org} />}
          {tab === "company" && <CompanyForm org={org} onOrg={setOrg} />}
          {tab === "model" && <TemplatePanel org={org} onOrg={setOrg} />}
          {tab === "bot" && <BotPanel org={org} onOrg={setOrg} />}
          {tab === "plan" && <PlanPanel />}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api, supabase } from "@/lib/browser.js";
import CompanyForm from "@/components/CompanyForm.jsx";
import TemplatePanel from "@/components/TemplatePanel.jsx";
import BotPanel from "@/components/BotPanel.jsx";
import Documents from "@/components/Documents.jsx";

const TABS = [["docs", "Documents"], ["company", "Entreprise"], ["model", "Modèle"], ["bot", "Bot Telegram"]];

export default function Dashboard() {
  const [org, setOrg] = useState(null);
  const [tab, setTab] = useState("docs");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (!data.session) return location.replace("/");
      try {
        const o = await api("/api/org");
        setOrg(o);
        setTab(!o.name ? "company" : !o.bot_connected ? "bot" : "docs");
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  async function logout() { await supabase().auth.signOut(); location.replace("/"); }
  if (err) return <main className="wrap"><p className="msg err" role="alert">{err}</p></main>;
  if (!org) return <main className="wrap"><p className="muted">Chargement…</p></main>;

  const todo = [
    ["company", "Renseigner votre entreprise", !!org.name],
    ["bot", "Connecter votre bot Telegram", org.bot_connected],
    ["bot", "Relier votre compte Telegram", org.authorized_count > 0],
  ];
  const remaining = todo.filter((t) => !t[2]);

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <span className="brand">{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span>
          <button className="btn" onClick={logout}>Se déconnecter</button>
        </div>
      </header>
      <main className="wrap">
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {remaining.length > 0 && (
          <section className="card todo">
            <h3>Pour commencer</h3>
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

        {tab === "docs" && <Documents org={org} />}
        {tab === "company" && <CompanyForm org={org} onOrg={setOrg} />}
        {tab === "model" && <TemplatePanel org={org} onOrg={setOrg} />}
        {tab === "bot" && <BotPanel org={org} onOrg={setOrg} />}
      </main>
    </>
  );
}

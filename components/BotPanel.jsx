"use client";
import { useState } from "react";
import { api } from "@/lib/browser.js";
import { useAction, Msg } from "./ui.jsx";

const Status = ({ on, children }) => <span className="status"><span className={`dot ${on ? "on" : ""}`} />{children}</span>;

export default function BotPanel({ org, onOrg }) {
  const [token, setToken] = useState("");
  const { busy, msg, run } = useAction();
  const call = (path, body, ok) => run(async () => onOrg(await api(path, { method: "POST", body })), ok);

  if (!org.bot_connected) {
    return (
      <section className="card stack">
        <div className="rule-head"><i /><h2>Connectez votre bot Telegram</h2></div>
        <p className="muted">Chaque entreprise a son propre bot : il porte votre nom et n'est utilisable que par vous.</p>
        <ol className="steps">
          <li>Ouvrez <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> dans Telegram.</li>
          <li>Envoyez <b>/newbot</b>, puis choisissez un nom et un identifiant se terminant par « bot ».</li>
          <li>Copiez le token que BotFather vous donne et collez-le ci-dessous.</li>
        </ol>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); call("/api/bot/connect", { token }, "Bot connecté."); }}>
          <label className="f">Token du bot
            <input value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="123456789:AA…" required />
          </label>
          <div className="row"><button className="btn primary" disabled={busy}>Connecter le bot</button><Msg msg={msg} /></div>
        </form>
      </section>
    );
  }

  return (
    <>
      <section className="card stack">
        <div className="rule-head"><i /><h2>Votre bot</h2></div>
        <Status on>Connecté : <a href={org.bot_link} target="_blank" rel="noreferrer">@{org.bot_username}</a></Status>
        <div className="row">
          <button className="btn danger" disabled={busy}
            onClick={() => confirm("Déconnecter ce bot ? Vos documents restent enregistrés.") && call("/api/bot/disconnect", {}, "Bot déconnecté.")}>
            Déconnecter le bot
          </button>
          <Msg msg={msg} />
        </div>
      </section>

      <section className="card stack">
        <div className="rule-head"><i /><h2>Relier votre compte Telegram</h2></div>
        <Status on={org.authorized_count > 0}>{org.authorized_count > 0 ? `${org.authorized_count} compte(s) relié(s)` : "Aucun compte relié pour l'instant"}</Status>
        <p className="muted">Ouvrez le lien ci-dessous depuis Telegram et appuyez sur « Démarrer ». Il ne fonctionne qu'une fois : pour ajouter un collaborateur, générez-en un nouveau.</p>
        <div className="row">
          {org.claim_link && <a className="btn primary" href={org.claim_link} target="_blank" rel="noreferrer">Ouvrir dans Telegram</a>}
          <button className="btn" disabled={busy} onClick={() => call("/api/org", { action: "new_claim_code" }, "Nouveau lien prêt.")}>Générer un nouveau lien</button>
        </div>
      </section>

      <section className="card stack">
        <div className="rule-head"><i /><h2>Sauvegarde des PDF (facultatif)</h2></div>
        <Status on={org.channel_connected}>{org.channel_connected ? "Canal connecté : chaque PDF y est conservé" : "Aucun canal connecté"}</Status>
        <ol className="steps">
          <li>Dans Telegram, créez un canal <b>privé</b>.</li>
          <li>Ajoutez @{org.bot_username} comme administrateur, avec le droit « Publier des messages ».</li>
          <li>Le bot détecte le canal tout seul et vous le confirme dans la conversation.</li>
        </ol>
      </section>
    </>
  );
}

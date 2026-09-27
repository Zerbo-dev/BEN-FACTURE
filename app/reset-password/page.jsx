"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser.js";

// Arrivée depuis le lien "mot de passe oublié" : Supabase pose la session de récupération
// automatiquement à la lecture de l'URL, puis émet l'évènement PASSWORD_RECOVERY.
export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Si l'évènement a déjà été traité avant que ce composant ne s'affiche, la session existe déjà.
    supabase().auth.getSession().then(({ data }) => data.session && setReady(true));
    const t = setTimeout(() => setReady((r) => (r ? r : (setExpired(true), false))), 2500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message); else setDone(true);
  }

  if (done) {
    return (
      <main className="login">
        <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
        <h1>Mot de passe mis à jour.</h1>
        <a className="btn primary" href="/dashboard">Aller au tableau de bord</a>
      </main>
    );
  }
  if (expired && !ready) {
    return (
      <main className="login">
        <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
        <h1>Lien invalide ou expiré.</h1>
        <p className="lead">Redemandez un lien de réinitialisation depuis la page de connexion.</p>
        <a className="btn" href="/">Retour à la connexion</a>
      </main>
    );
  }
  return (
    <main className="login">
      <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
      <h1>Choisissez un nouveau mot de passe.</h1>
      {!ready ? (
        <p className="muted">Vérification du lien…</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="f">Nouveau mot de passe
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn primary" disabled={busy}>Enregistrer</button>
            {err && <span className="msg err" role="alert">{err}</span>}
          </div>
        </form>
      )}
    </main>
  );
}

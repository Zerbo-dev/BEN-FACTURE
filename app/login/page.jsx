"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/browser.js";

const ERR = {
  "Invalid login credentials": "E-mail ou mot de passe incorrect.",
  "User already registered": "Un compte existe déjà avec cet e-mail. Connectez-vous plutôt.",
  "Email not confirmed": "Confirmez d'abord votre e-mail (lien envoyé à l'inscription), ou désactivez la confirmation dans Supabase pour les tests.",
  "Password should be at least 6 characters.": "Le mot de passe doit faire au moins 6 caractères.",
};
const readable = (m) => ERR[m] || m;

function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // "signup" une fois inscrit

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => data.session && location.replace("/dashboard"));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    if (mode === "login") {
      const { error } = await supabase().auth.signInWithPassword({ email, password });
      if (error) setErr(readable(error.message)); else location.assign("/dashboard");
    } else {
      const { data, error } = await supabase().auth.signUp({ email, password });
      if (error) setErr(readable(error.message));
      else if (data.session) location.assign("/dashboard"); // confirmation e-mail désactivée : connecté tout de suite
      else setDone("signup");
    }
    setBusy(false);
  }

  async function forgot() {
    if (!email) return setErr("Indiquez votre e-mail ci-dessus, puis cliquez à nouveau sur ce lien.");
    setBusy(true); setErr("");
    const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` });
    setBusy(false);
    if (error) setErr(readable(error.message)); else setDone("reset");
  }

  if (done === "signup") {
    return (
      <main className="login">
        <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
        <h1>Compte créé.</h1>
        <p className="lead">Un e-mail de confirmation a été envoyé à {email}. Ouvrez-le, puis revenez vous connecter.</p>
        <button className="btn" onClick={() => { setDone(null); setMode("login"); }}>Retour à la connexion</button>
      </main>
    );
  }
  if (done === "reset") {
    return (
      <main className="login">
        <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
        <h1>Lien envoyé.</h1>
        <p className="lead">Vérifiez la boîte de {email} pour choisir un nouveau mot de passe.</p>
        <button className="btn" onClick={() => setDone(null)}>Retour à la connexion</button>
      </main>
    );
  }

  return (
    <main className="login">
      <div className="mark"><i /><span>{process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture"}</span></div>
      <h1>Vos devis et factures, écrits comme un message.</h1>
      <p className="lead">
        Décrivez la prestation dans une conversation Telegram : le PDF arrive en quelques secondes, à vos couleurs et avec votre logo.
      </p>
      <form className="stack" onSubmit={submit}>
        <label className="f">Adresse e-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="f">Mot de passe
          <input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn primary" disabled={busy}>{mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
          {mode === "login" && <button type="button" className="btn link" onClick={forgot} disabled={busy}>Mot de passe oublié ?</button>}
        </div>
        {err && <p className="msg err" role="alert">{err}</p>}
      </form>
      <p className="switch">
        {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <button type="button" className="btn link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </button>
      </p>
      {mode === "signup" && (
        <p className="hint">
          En test local : si Supabase exige la confirmation par e-mail et que vous n'avez pas configuré l'envoi,
          désactivez « Confirm email » dans Authentication → Providers → Email de votre projet Supabase.
        </p>
      )}
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

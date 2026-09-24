"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser.js";

export default function Home() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => data.session && location.replace("/dashboard"));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setState("sending"); setErr("");
    const { error } = await supabase().auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/dashboard` } });
    if (error) { setErr(error.message); setState("idle"); } else setState("sent");
  }

  return (
    <main className="login">
      <h1>Vos devis et factures, écrits comme un message.</h1>
      <p className="lead">
        Décrivez la prestation dans une conversation Telegram : le PDF prêt à envoyer arrive en quelques secondes, à vos couleurs et avec votre logo.
      </p>
      {state === "sent" ? (
        <p className="msg ok" role="status">Lien envoyé à {email}. Ouvrez-le depuis cet appareil pour entrer.</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="f">Adresse e-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn primary" disabled={state === "sending"}>Recevoir le lien de connexion</button>
            {err && <span className="msg err" role="alert">{err}</span>}
          </div>
        </form>
      )}
    </main>
  );
}

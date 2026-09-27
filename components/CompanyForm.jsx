"use client";
import { useState } from "react";
import { api } from "@/lib/browser.js";
import { useAction, Msg, shrinkImage } from "./ui.jsx";

function ImageField({ kind, label, hint, max, has, onOrg }) {
  const { busy, msg, run } = useAction();
  const [preview, setPreview] = useState(null);
  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await run(async () => {
      const dataUrl = await shrinkImage(file, max);
      setPreview(dataUrl);
      onOrg(await api("/api/upload", { method: "POST", body: { kind, dataUrl } }));
    }, "Image enregistrée.");
  }
  async function remove() {
    await run(async () => { onOrg(await api(`/api/upload?kind=${kind}`, { method: "DELETE" })); setPreview(null); }, "Image retirée.");
  }
  return (
    <div className="stack">
      <label className="f">{label}<small>{hint}</small>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} disabled={busy} />
      </label>
      <div className="row">
        {preview && <img src={preview} alt="" style={{ maxHeight: 56, maxWidth: 160, border: "1px solid var(--line)" }} />}
        {has && <button type="button" className="btn small" onClick={remove} disabled={busy}>Retirer</button>}
        <Msg msg={msg} />
      </div>
    </div>
  );
}

export default function CompanyForm({ org, onOrg }) {
  const [f, setF] = useState({
    name: org.name, phone: org.phone, email: org.email, address: org.address, footer_text: org.footer_text,
    currency: org.currency, default_tva: org.default_tva, default_terms: org.default_terms, default_garantie: org.default_garantie,
  });
  const [pm, setPm] = useState((org.payment_methods || []).map((m) => ({ label: m.label, lines: (m.lines || []).join("\n") })));
  const { busy, msg, run } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setMethod = (i, k, v) => setPm(pm.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      onOrg(await api("/api/org", {
        method: "PUT",
        body: { ...f, payment_methods: pm.map((m) => ({ label: m.label, lines: m.lines.split("\n") })) },
      }));
    });
  };

  return (
    <form onSubmit={save}>
      <section className="card stack">
        <div className="rule-head"><i /><h2>Votre entreprise</h2></div>
        <p className="muted">Ces informations apparaissent sur chaque document.</p>
        <div className="grid2">
          <label className="f">Nom de l'entreprise<input required value={f.name} onChange={set("name")} /></label>
          <label className="f">Téléphone<input value={f.phone} onChange={set("phone")} inputMode="tel" /></label>
          <label className="f">E-mail<input type="email" value={f.email} onChange={set("email")} /></label>
          <label className="f">Adresse<input value={f.address} onChange={set("address")} /></label>
        </div>
        <label className="f">Ligne en bas de chaque page
          <small>Vos identifiants légaux, par exemple : RCCM : … | IFU : …</small>
          <input value={f.footer_text} onChange={set("footer_text")} />
        </label>
        <div className="grid2">
          <ImageField kind="logo" label="Logo" hint="PNG ou JPEG, réduit automatiquement." max={320} has={org.has_logo} onOrg={onOrg} />
          <ImageField kind="signature" label="Signature ou cachet" hint="Idéalement un PNG à fond transparent." max={400} has={org.has_signature} onOrg={onOrg} />
        </div>
      </section>

      <section className="card stack">
        <div className="rule-head"><i /><h2>Valeurs par défaut</h2></div>
        <div className="grid2">
          <label className="f">Devise<input value={f.currency} onChange={set("currency")} /></label>
          <label className="f">TVA par défaut (%)<input type="number" min="0" max="100" step="0.5" value={f.default_tva} onChange={set("default_tva")} /></label>
        </div>
        <label className="f">Termes et conditions<small>Proposés à chaque document, vous pouvez toujours les changer dans Telegram.</small>
          <textarea value={f.default_terms} onChange={set("default_terms")} /></label>
        <label className="f">Garantie<textarea value={f.default_garantie} onChange={set("default_garantie")} /></label>
      </section>

      <section className="card stack">
        <div className="rule-head"><i /><h2>Modes de paiement</h2></div>
        <p className="muted">Une facture affiche ceux que vous cochez dans Telegram ; un devis les affiche tous.</p>
        {pm.map((m, i) => (
          <div className="pm" key={i}>
            <label className="f">Nom<input value={m.label} placeholder="Orange Money, Virement bancaire, Espèces…" onChange={(e) => setMethod(i, "label", e.target.value)} /></label>
            <label className="f">Détails<small>Une ligne par information (numéro, compte…).</small>
              <textarea value={m.lines} onChange={(e) => setMethod(i, "lines", e.target.value)} style={{ minHeight: 60 }} /></label>
            <div><button type="button" className="btn danger" onClick={() => setPm(pm.filter((_, j) => j !== i))}>Supprimer ce mode</button></div>
          </div>
        ))}
        {pm.length < 6 && <div><button type="button" className="btn" onClick={() => setPm([...pm, { label: "", lines: "" }])}>Ajouter un mode de paiement</button></div>}
      </section>

      <div className="row">
        <button className="btn primary" disabled={busy}>Enregistrer</button>
        <Msg msg={msg} />
      </div>
    </form>
  );
}

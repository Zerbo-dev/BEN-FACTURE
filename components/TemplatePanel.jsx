"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/browser.js";
import { TEMPLATE_META, PALETTES } from "@/lib/meta.js";
import { useAction, busyLabel } from "./ui.jsx";
import { SkeletonBlock } from "./Skeleton.jsx";
import TemplateThumb from "./TemplateThumb.jsx";

export default function TemplatePanel({ org, onOrg }) {
  const [tpl, setTpl] = useState(org.template);
  const [theme, setTheme] = useState(org.theme);
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { busy, run } = useAction();
  const seq = useRef(0);

  // Les vignettes réagissent tout de suite (SVG local). L'aperçu réel, lui, est généré par le serveur avec vos données :
  // on attend que vous ayez fini de choisir (550 ms) et l'ancienne image reste affichée, légèrement estompée, jusqu'à l'arrivée de la nouvelle.
  useEffect(() => {
    const id = ++seq.current;
    const ctl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ template: tpl, primary: theme.primary, accent: theme.accent });
        const blob = await api(`/api/preview?${qs}`, { raw: true, signal: ctl.signal });
        if (id !== seq.current) return;
        setImg((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        setErr("");
      } catch (e) { if (e.name !== "AbortError" && id === seq.current) setErr(e.message); }
      finally { if (id === seq.current) setLoading(false); }
    }, 550);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [tpl, theme.primary, theme.accent, org.has_logo, org.name]);

  const dirty = tpl !== org.template || theme.primary !== org.theme.primary || theme.accent !== org.theme.accent;
  const save = () => run(async () => onOrg(await api("/api/org", { method: "PUT", body: { template: tpl, theme } })), "Modèle enregistré.");

  return (
    <div className="studio">
      <div className="studio-controls">
        <section className="card stack">
          <div className="rule-head"><i /><h2>1. Choisissez un modèle</h2></div>
          <div className="tpl-grid" role="radiogroup" aria-label="Modèle de document">
            {TEMPLATE_META.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={tpl === t.id} className="tpl-card" onClick={() => setTpl(t.id)}>
                <span className="tpl-thumb"><TemplateThumb id={t.id} primary={theme.primary} accent={theme.accent} /></span>
                <b>{t.label}</b>
              </button>
            ))}
          </div>
          <p className="muted small">{TEMPLATE_META.find((t) => t.id === tpl)?.desc}</p>
        </section>

        <section className="card stack">
          <div className="rule-head"><i /><h2>2. Choisissez vos couleurs</h2></div>
          <div className="palettes">
            {PALETTES.map((p) => (
              <button key={p.name} type="button" className="pal" aria-pressed={theme.primary === p.primary && theme.accent === p.accent}
                onClick={() => setTheme({ primary: p.primary, accent: p.accent })}>
                <i style={{ background: `linear-gradient(90deg, ${p.primary} 50%, ${p.accent} 50%)` }} />{p.name}
              </button>
            ))}
          </div>
          <details className="custom-colors">
            <summary>Personnaliser les couleurs</summary>
            <div className="row" style={{ marginTop: 12 }}>
              <label className="f">Couleur principale
                <input type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} /></label>
              <label className="f">Couleur d'accent
                <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} /></label>
            </div>
          </details>
        </section>

        <div className="save-bar">
          <button className="btn primary" disabled={busy || !dirty} onClick={save}>{busyLabel("Enregistrer le modèle", busy, "Enregistrement…")}</button>
          <span className="muted small">{dirty ? "Modifications non enregistrées" : "Modèle enregistré"}</span>
        </div>
      </div>

      <div className="studio-preview">
        <p className="muted small" style={{ marginBottom: 8 }}>Aperçu du document réel, avec vos informations</p>
        <div className="desk" aria-live="polite">
          {loading && img && <span className="busy">Génération de l'aperçu…</span>}
          {!img && loading && <div style={{ width: "min(100%, 520px)" }}><SkeletonBlock h={420} /></div>}
          {img && <img className="sheet" src={img} alt={`Aperçu d'un devis, modèle ${tpl}`} style={{ opacity: loading ? 0.5 : 1 }} />}
          {err && <p className="msg err" role="alert">{err}</p>}
        </div>
      </div>
    </div>
  );
}

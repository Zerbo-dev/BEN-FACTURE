"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/browser.js";
import { TEMPLATE_META, PALETTES } from "@/lib/meta.js";
import { useAction, busyLabel } from "./ui.jsx";
import { SkeletonBlock } from "./Skeleton.jsx";

export default function TemplatePanel({ org, onOrg }) {
  const [tpl, setTpl] = useState(org.template);
  const [theme, setTheme] = useState(org.theme);
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { busy, run } = useAction();
  const seq = useRef(0);

  // Aperçu en direct : le serveur génère le vrai document avec vos données ; on attend 400 ms après le dernier changement.
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
    }, 400);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [tpl, theme.primary, theme.accent, org.has_logo, org.name]);

  const dirty = tpl !== org.template || theme.primary !== org.theme.primary || theme.accent !== org.theme.accent;

  return (
    <div className="studio">
      <div className="stack">
        <section className="card stack">
          <div className="rule-head"><i /><h2>Modèle</h2></div>
          <div className="choice">
            {TEMPLATE_META.map((t) => (
              <button key={t.id} type="button" aria-pressed={tpl === t.id} onClick={() => setTpl(t.id)}>
                <b>{t.label}</b><span className="muted small">{t.desc}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="card stack">
          <div className="rule-head"><i /><h2>Couleurs</h2></div>
          <div className="palettes">
            {PALETTES.map((p) => (
              <button key={p.name} type="button" className="pal" aria-pressed={theme.primary === p.primary && theme.accent === p.accent}
                onClick={() => setTheme({ primary: p.primary, accent: p.accent })}>
                <i style={{ background: `linear-gradient(90deg, ${p.primary} 50%, ${p.accent} 50%)` }} />{p.name}
              </button>
            ))}
          </div>
          <div className="row">
            <label className="f">Couleur principale
              <input type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} /></label>
            <label className="f">Couleur d'accent
              <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} /></label>
          </div>
        </section>
        <div className="row">
          <button className="btn primary" disabled={busy || !dirty}
            onClick={() => run(async () => onOrg(await api("/api/org", { method: "PUT", body: { template: tpl, theme } })), "Modèle enregistré.")}>
            {busyLabel("Enregistrer le modèle", busy, "Enregistrement…")}
          </button>
        </div>
      </div>

      <div className="desk" aria-live="polite">
        {loading && img && <span className="busy">Mise à jour…</span>}
        {!img && loading && <div style={{ width: "min(100%, 560px)" }}><SkeletonBlock h={400} /></div>}
        {img && <img className="sheet" src={img} alt={`Aperçu d'un devis, modèle ${tpl}`} />}
        {err && <p className="msg err" role="alert">{err}</p>}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, FileText, Building2, Palette, Bot, CreditCard, Menu, X, LogOut } from "lucide-react";

const ICON = { overview: LayoutDashboard, docs: FileText, company: Building2, model: Palette, bot: Bot, plan: CreditCard };

function NavItems({ tabs, active, onSelect }) {
  return (
    <nav aria-label="Sections du tableau de bord">
      {tabs.map(([id, label]) => {
        const Icon = ICON[id];
        return (
          <button key={id} className="nav-item" aria-current={active === id ? "page" : undefined} onClick={() => onSelect(id)}>
            <Icon size={18} strokeWidth={2} aria-hidden="true" /><span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Barre latérale fixe sur grand écran, tiroir coulissant sur mobile : une seule liste de sections, deux présentations. */
export default function DashboardShell({ brand, tabs, active, onSelect, onLogout, children }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const select = (id) => { onSelect(id); setOpen(false); };

  return (
    <div className="shell">
      <header className="topbar mobile-only">
        <div className="wrap">
          <button className="icon-btn" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="brand"><i />{brand}</span>
          <button className="icon-btn" aria-label="Se déconnecter" onClick={onLogout}><LogOut size={19} /></button>
        </div>
      </header>

      <aside className="side desktop-only">
        <div className="brand" style={{ padding: "0 20px", height: 58, borderBottom: "1px solid var(--rule)" }}><i />{brand}</div>
        <div style={{ padding: "14px 12px", flex: 1 }}><NavItems tabs={tabs} active={active} onSelect={onSelect} /></div>
        <button className="nav-item" style={{ margin: "12px", width: "calc(100% - 24px)" }} onClick={onLogout}>
          <LogOut size={18} strokeWidth={2} aria-hidden="true" /><span>Se déconnecter</span>
        </button>
      </aside>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between", padding: "0 16px", height: 58, borderBottom: "1px solid var(--rule)" }}>
              <span className="brand"><i />{brand}</span>
              <button className="icon-btn" ref={closeRef} aria-label="Fermer le menu" onClick={() => setOpen(false)}><X size={22} /></button>
            </div>
            <div style={{ padding: 12 }}><NavItems tabs={tabs} active={active} onSelect={select} /></div>
          </aside>
        </div>
      )}

      <main className="content">{children}</main>
    </div>
  );
}

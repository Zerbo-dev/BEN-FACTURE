"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import Logo from "./Logo.jsx";
import { AnimatePresence, motion } from "motion/react";

// tabs : [id, label, Icon][] — l'icône est fournie par l'appelant (dashboard client ou panneau admin).
function NavItems({ tabs, active, onSelect }) {
  return (
    <nav aria-label="Sections">
      {tabs.map(([id, label, Icon]) => (
        <button key={id} className="nav-item" aria-current={active === id ? "page" : undefined} onClick={() => onSelect(id)}>
          <Icon size={18} strokeWidth={2} aria-hidden="true" /><span>{label}</span>
        </button>
      ))}
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
          <button className="icon-btn" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button>
          <Logo size={28} name={brand} />
          <button className="icon-btn" aria-label="Se déconnecter" onClick={onLogout}><LogOut size={18} /></button>
        </div>
      </header>

      <aside className="side desktop-only">
        <div style={{ padding: "0 18px", height: 64, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.1)" }}><Logo size={30} name={brand} /></div>
        <div style={{ padding: "14px 12px", flex: 1 }}><NavItems tabs={tabs} active={active} onSelect={onSelect} /></div>
        <button className="nav-item" style={{ margin: "12px", width: "calc(100% - 24px)" }} onClick={onLogout}>
          <LogOut size={18} strokeWidth={2} aria-hidden="true" /><span>Se déconnecter</span>
        </button>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            className="drawer-overlay"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          >
            <motion.aside
              className="drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
            >
              <div className="row" style={{ justifyContent: "space-between", padding: "0 16px", height: 64, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                <Logo size={28} name={brand} />
                <button className="icon-btn" ref={closeRef} aria-label="Fermer le menu" onClick={() => setOpen(false)}><X size={20} /></button>
              </div>
              <div style={{ padding: 12 }}><NavItems tabs={tabs} active={active} onSelect={select} /></div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="content">{children}</main>
    </div>
  );
}

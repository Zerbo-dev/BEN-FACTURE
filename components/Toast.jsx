"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

const Ctx = createContext(null);
let uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback((text, type = "ok") => {
    const id = ++uid;
    setToasts((t) => [...t, { id, text, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 4200));
    return id;
  }, [dismiss]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role="status" aria-live="polite">
            <span>{t.text}</span>
            <button aria-label="Fermer" className="toast-x" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** push(text) pour une réussite, push(text, "err") pour une erreur. */
export function useToast() {
  const push = useContext(Ctx);
  if (!push) throw new Error("useToast doit être utilisé sous <ToastProvider>.");
  return push;
}

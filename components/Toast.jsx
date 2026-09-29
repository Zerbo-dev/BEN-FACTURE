"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast ${t.type}`}
              role="status"
              aria-live="polite"
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              <span>{t.text}</span>
              <button aria-label="Fermer" className="toast-x" onClick={() => dismiss(t.id)}>×</button>
            </motion.div>
          ))}
        </AnimatePresence>
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

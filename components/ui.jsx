"use client";
import { useState } from "react";
import { useToast } from "./Toast.jsx";

/** Exécute une action async : bascule busy, et signale le résultat par une notification (pas de texte inline qui reste collé à l'écran). */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run(fn, ok = "Enregistré.") {
    setBusy(true);
    try { await fn(); toast(ok, "ok"); }
    catch (e) { toast(e.message, "err"); }
    finally { setBusy(false); }
  }
  return { busy, run };
}

/** Libellé de bouton qui passe au participe présent pendant l'action ("Enregistrer" → "Enregistrement…"). */
export const busyLabel = (label, busy, ing) => (busy ? ing || `${label}…` : label);

/** Réduit l'image dans le navigateur (le stockage ne reçoit que quelques dizaines de Ko). */
export async function shrinkImage(file, max) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  const g = c.getContext("2d");
  g.drawImage(bmp, 0, 0, c.width, c.height);
  let url = c.toDataURL("image/png");
  if (url.length * 0.75 > 150 * 1024) { // PNG trop lourd : JPEG sur fond blanc
    g.globalCompositeOperation = "destination-over"; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    url = c.toDataURL("image/jpeg", 0.85);
  }
  return url;
}

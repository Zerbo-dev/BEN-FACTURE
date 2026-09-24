"use client";
import { useState } from "react";

/** Exécute une action async en suivant son état (en cours / succès / erreur). */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function run(fn, ok = "Enregistré.") {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  }
  return { busy, msg, run };
}

export const Msg = ({ msg }) =>
  msg ? <span role={msg.ok ? "status" : "alert"} className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</span> : null;

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

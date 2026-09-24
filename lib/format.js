export const DOC_LABELS = { devis: "Devis", facture: "Facture", proforma: "Proforma" };
export const DOC_TITLES = { devis: "Devis", facture: "Facture", proforma: "Facture proforma" };

/** 1 250 000 (espace simple : les espaces fines ne sont pas dans les polices PDF standard). */
export const fmtMoney = (n) =>
  Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");

export const todayFr = () =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Ouagadougou" }).format(new Date());

export const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Ouagadougou" }).format(new Date());

export const lineQty = (it) => (it.quantity && Number(it.quantity) > 0 ? Number(it.quantity) : 1);

export function totals(items = [], tvaRate = 0) {
  const ht = items.reduce((s, it) => s + Number(it.unitPrice) * lineQty(it), 0);
  const tva = Math.round(ht * ((Number(tvaRate) || 0) / 100));
  return { ht, tva, ttc: ht + tva };
}

/** 0000007-09/26 : Nᵒ du type dans l'année, mois et année d'émission. */
export function formatNumber(n, date = new Date()) {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${String(n).padStart(7, "0")}-${mm}/${yy}`;
}

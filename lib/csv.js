const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Registre CSV (BOM pour Excel, séparateur ;), partagé entre l'export à la demande et l'archivage automatique. */
export function documentsToCsv(docs) {
  return "\ufeff" + [
    ["Numéro", "Type", "Date", "Client", "Total HT", "Total TTC", "Devise"],
    ...docs.map((d) => [d.number, d.doc_type, d.issued_on, d.client_name, d.total_ht, d.total_ttc, d.currency]),
  ].map((r) => r.map(esc).join(";")).join("\r\n");
}

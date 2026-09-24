import { todayFr } from "../format.js";

/** Document d'exemple pour l'aperçu du modèle (utilise le vrai profil de l'organisation). */
export function sampleProps(org, branding, { template, theme, longList = false } = {}) {
  const base = [
    { description: "Diagnostic et repérage", unitPrice: 25000, quantity: null },
    { description: "Câblage du tableau électrique", unitPrice: 55000, quantity: 1 },
    { description: "Prise 16A encastrée", unitPrice: 4500, quantity: 8 },
  ];
  const items = longList
    ? Array.from({ length: 34 }, (_, i) => ({ description: `Prestation d'exemple n° ${i + 1}`, unitPrice: 5000 + i * 250, quantity: 1 + (i % 3) }))
    : base;
  const methods = org.payment_methods?.length ? org.payment_methods : [{ label: "Orange Money", lines: ["+226 70 00 00 00"] }];
  return {
    template: template || org.template,
    theme: theme || org.theme,
    org: { ...org, name: org.name || "Votre entreprise", address: org.address || "Quartier, Ville" },
    branding,
    doc: {
      docType: "devis",
      number: "0000001-09/26",
      date: todayFr(),
      client: { name: "M. Sawadogo", address: "Kamboinsin, Ouagadougou", phone: "70 24 52 68" },
      items,
      tvaRate: Number(org.default_tva) || 0,
      paymentBlocks: methods,
      termsAndConditions: org.default_terms || "Ce devis est valable 1 mois à compter de sa date d'émission.",
      garantie: org.default_garantie || "",
    },
  };
}

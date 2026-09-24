// Constantes partagées entre le serveur et le navigateur (aucune dépendance lourde ici).
export const DEFAULT_THEME = { primary: "#2a2f66", accent: "#c81e3b" };

export const TEMPLATE_META = [
  { id: "moderne", label: "Moderne", desc: "Bandeau de couleur et vague, comme un document de marque." },
  { id: "classique", label: "Classique", desc: "Typographie à empattements, tableau plein, aspect formel." },
  { id: "sobre", label: "Sobre", desc: "Fond blanc, lignes fines, une seule couleur d'accent." },
];

export const PALETTES = [
  { name: "Marine et rouge", primary: "#2a2f66", accent: "#c81e3b" },
  { name: "Vert et or", primary: "#0b5d3b", accent: "#d99a1c" },
  { name: "Ardoise et orange", primary: "#2b3440", accent: "#e0641b" },
  { name: "Bordeaux et sable", primary: "#6b1d2a", accent: "#b58b4c" },
  { name: "Bleu et turquoise", primary: "#12406b", accent: "#1a9aa0" },
  { name: "Noir et vert", primary: "#141414", accent: "#0a7a4b" },
];

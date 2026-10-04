import { FileText } from "lucide-react";

/** Marque : carré bleu arrondi + icône + nom. Réutilisée partout (landing, connexion, tableau de bord). */
export default function Logo({ size = 30, withName = true, dark = false, name }) {
  const label = name || process.env.NEXT_PUBLIC_APP_NAME || "BAG Facture";
  return (
    <span className="logo">
      <span className="logo-mark" style={{ width: size, height: size }}>
        <FileText size={Math.round(size * 0.58)} strokeWidth={2.3} />
      </span>
      {withName && <span className="logo-name" style={dark ? { color: "#fff" } : undefined}>{label}</span>}
    </span>
  );
}

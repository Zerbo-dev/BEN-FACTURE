import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vos devis et factures, directement depuis Telegram.";

// Généré à la volée (next/og, basé sur Satori) : pas de glyphes/emoji, pour garantir le rendu sans police externe.
export default function OgImage() {
  const name = process.env.APP_NAME || "BAG Facture";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "80px 90px", background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "#fff", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div style={{ width: 64, height: 64, background: "#2563eb", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ width: 30, height: 5, background: "#fff", borderRadius: 3, display: "flex" }} />
            <div style={{ width: 22, height: 5, background: "#fff", borderRadius: 3, display: "flex" }} />
            <div style={{ width: 26, height: 5, background: "#fff", borderRadius: 3, display: "flex" }} />
          </div>
          <div style={{ fontSize: 38, fontWeight: 700, display: "flex" }}>{name}</div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.18, maxWidth: 960, display: "flex" }}>
          Vos devis et factures, directement depuis Telegram.
        </div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#b9c2d6", display: "flex" }}>
          Créez un document professionnel en quelques secondes.
        </div>
      </div>
    ),
    { ...size }
  );
}

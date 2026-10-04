import "@fontsource-variable/inter";
import "./globals.css";
import { MotionConfig } from "motion/react";

const name = process.env.APP_NAME || "BAG Facture";
export const metadata = {
  title: name,
  description: "Devis, factures et proformas générés depuis Telegram, à vos couleurs.",
  // Nécessaire pour que l'image Open Graph (app/opengraph-image.jsx) soit servie en URL absolue.
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
};
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {/* Sans JavaScript, le contenu marqué data-reveal (apparition au défilement) reste pleinement visible,
            au lieu de rester bloqué à opacity: 0 pour toujours. */}
        <noscript>
          <style>{`[data-reveal] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {/* reducedMotion="user" : respecte automatiquement le réglage système, sur toute animation Motion de l'appli */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}

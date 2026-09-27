import "@fontsource-variable/fraunces";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";

const name = process.env.APP_NAME || "BAG Facture";
export const metadata = {
  title: name,
  description: "Devis, factures et proformas générés depuis Telegram, à vos couleurs.",
};
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

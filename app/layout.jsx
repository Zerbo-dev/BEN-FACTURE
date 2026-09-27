import "@fontsource-variable/inter";
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

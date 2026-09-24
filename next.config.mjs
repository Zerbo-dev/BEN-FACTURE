/** @type {import('next').NextConfig} */
export default {
  // Ces paquets doivent rester des dépendances Node natives (pas bundlées).
  serverExternalPackages: ["@react-pdf/renderer", "pdfjs-dist", "@napi-rs/canvas", "telegraf"],
  // pdfjs charge son worker et ses polices dynamiquement : on force leur inclusion sur Vercel.
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/standard_fonts/**",
    ],
  },
};

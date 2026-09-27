import React from "react";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "./templates.jsx";

/** Génère le PDF (JS pur : plus de Chromium). */
export const renderPdf = (props) => renderToBuffer(<InvoiceDocument {...props} />);

/** Convertit la première page du PDF en PNG (aperçu à partager sur WhatsApp). */
export async function pdfToPng(pdfBuffer, scale = 2.4) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const fonts = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + "/";
  const task = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    standardFontDataUrl: fonts,
    isEvalSupported: false,
    verbosity: 0,
  });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, canvas }).promise;
    return canvas.toBuffer("image/png");
  } finally {
    await task.destroy();
  }
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { extractInvoiceData } from "../lib/parseText.js";

test("extractInvoiceData : message complet avec client, prestations et TVA", () => {
  const r = extractInvoiceData("Facture pour M. Sawadogo, Kamboinsin, 70245268. Diagnostic 25000, câblage du tableau 55000 x2, tva 18%");
  assert.equal(r.docType, "facture");
  assert.equal(r.tvaRate, 18);
  assert.equal(r.client.name, "M. Sawadogo");
  assert.equal(r.client.address, "Kamboinsin");
  assert.match(r.client.phone, /70245268|70 24 52 68/);
  assert.equal(r.items.length, 2);
  assert.equal(r.items[0].unitPrice, 25000);
  assert.equal(r.items[1].unitPrice, 55000);
  assert.equal(r.items[1].quantity, 2);
});

test("extractInvoiceData : sans mot-clé 'facture'/'proforma' => devis par défaut", () => {
  assert.equal(extractInvoiceData("Câblage 50000").docType, "devis");
});

test("extractInvoiceData : 'proforma' prioritaire sur 'facture' si les deux apparaissent", () => {
  assert.equal(extractInvoiceData("Facture proforma pour test").docType, "proforma");
});

test("extractInvoiceData : format entre parenthèses avec quantité après le point", () => {
  const r = extractInvoiceData("Réservation de tuyauterie cuivre (75000F).5");
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].description, "Réservation de tuyauterie cuivre");
  assert.equal(r.items[0].unitPrice, 75000);
  assert.equal(r.items[0].quantity, 5);
});

test("extractInvoiceData : aucune prestation détectée => liste vide (pas d'erreur)", () => {
  const r = extractInvoiceData("Bonjour, comment ça va ?");
  assert.deepEqual(r.items, []);
});

test("extractInvoiceData : une ligne commençant par 'tva' seule n'est jamais prise pour une prestation", () => {
  const r = extractInvoiceData("Câblage 50000, tva 18%");
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].description, "Câblage");
});

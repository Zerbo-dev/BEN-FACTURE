import { test } from "node:test";
import assert from "node:assert/strict";
import { totals, fmtMoney, formatNumber, lineQty } from "../lib/format.js";

test("totals : calcule HT, TVA et TTC correctement", () => {
  const items = [
    { description: "A", unitPrice: 25000, quantity: null },   // pas de quantité => x1
    { description: "B", unitPrice: 4500, quantity: 8 },
  ];
  const t = totals(items, 18);
  assert.equal(t.ht, 25000 + 4500 * 8);
  assert.equal(t.tva, Math.round(t.ht * 0.18));
  assert.equal(t.ttc, t.ht + t.tva);
});

test("totals : TVA à 0% ne génère aucune taxe", () => {
  const t = totals([{ description: "A", unitPrice: 1000, quantity: 1 }], 0);
  assert.equal(t.tva, 0);
  assert.equal(t.ttc, t.ht);
});

test("totals : liste vide => tout à zéro", () => {
  const t = totals([], 18);
  assert.deepEqual(t, { ht: 0, tva: 0, ttc: 0 });
});

test("lineQty : une quantité à 0 ou absente compte pour 1", () => {
  assert.equal(lineQty({ quantity: null }), 1);
  assert.equal(lineQty({ quantity: 0 }), 1);
  assert.equal(lineQty({ quantity: 3 }), 3);
});

test("fmtMoney : sépare les milliers par un espace, sans décimales", () => {
  assert.equal(fmtMoney(1250000), "1 250 000");
  assert.equal(fmtMoney(0), "0");
  assert.equal(fmtMoney(999.6), "1 000"); // arrondi
});

test("formatNumber : 7 chiffres + mois/année d'émission", () => {
  assert.equal(formatNumber(7, new Date(Date.UTC(2026, 8, 24))), "0000007-09/26");
  assert.equal(formatNumber(123456, new Date(Date.UTC(2026, 0, 1))), "0123456-01/26");
});

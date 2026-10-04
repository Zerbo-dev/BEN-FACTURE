// Test anti-dérive : les identifiants de modèles et les couleurs déclarés dans lib/meta.js doivent rester
// cohérents avec ce que lib/pdf/templates.jsx sait effectivement dessiner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE_META, PALETTES, DEFAULT_THEME, FREE_MONTHLY_LIMIT } from "../lib/meta.js";

const HEX = /^#[0-9a-f]{6}$/i;

test("TEMPLATE_META : 3 modèles, identifiants uniques", () => {
  assert.equal(TEMPLATE_META.length, 3);
  assert.deepEqual(new Set(TEMPLATE_META.map((t) => t.id)).size, 3);
  for (const t of TEMPLATE_META) assert.ok(t.label && t.desc, `modèle ${t.id} sans label/description`);
});

test("PALETTES : 6 couleurs valides (#RRGGBB)", () => {
  assert.equal(PALETTES.length, 6);
  for (const p of PALETTES) {
    assert.match(p.primary, HEX, `${p.name} : primary invalide`);
    assert.match(p.accent, HEX, `${p.name} : accent invalide`);
  }
});

test("DEFAULT_THEME : couleurs valides", () => {
  assert.match(DEFAULT_THEME.primary, HEX);
  assert.match(DEFAULT_THEME.accent, HEX);
});

test("FREE_MONTHLY_LIMIT : un entier positif raisonnable", () => {
  assert.ok(Number.isInteger(FREE_MONTHLY_LIMIT) && FREE_MONTHLY_LIMIT > 0 && FREE_MONTHLY_LIMIT <= 1000);
});

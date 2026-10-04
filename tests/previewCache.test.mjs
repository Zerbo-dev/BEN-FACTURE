import { test } from "node:test";
import assert from "node:assert/strict";
import { presetIndex, cacheKey } from "../lib/previewCache.js";
import { PALETTES } from "../lib/meta.js";

test("presetIndex : reconnaît une palette prédéfinie exacte", () => {
  assert.equal(presetIndex(PALETTES[0].primary, PALETTES[0].accent), 0);
  assert.equal(presetIndex(PALETTES[2].primary, PALETTES[2].accent), 2);
});

test("presetIndex : une couleur personnalisée renvoie null (jamais mise en cache)", () => {
  assert.equal(presetIndex("#123456", "#abcdef"), null);
});

test("cacheKey : stable pour un même profil, change si le profil change", () => {
  const org1 = { id: "org1", name: "Atelier A", logo_path: "org1/logo.png" };
  const org1bis = { id: "org1", name: "Atelier A", logo_path: "org1/logo.png" };
  const org1Renamed = { ...org1, name: "Atelier A (renommé)" };

  assert.equal(cacheKey(org1, "moderne", 0), cacheKey(org1bis, "moderne", 0));
  assert.notEqual(cacheKey(org1, "moderne", 0), cacheKey(org1Renamed, "moderne", 0));
  assert.notEqual(cacheKey(org1, "moderne", 0), cacheKey(org1, "classique", 0));
  assert.notEqual(cacheKey(org1, "moderne", 0), cacheKey(org1, "moderne", 1));
});

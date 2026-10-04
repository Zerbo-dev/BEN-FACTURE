import { test } from "node:test";
import assert from "node:assert/strict";
import { safeColor, tint, readableOn, textSafe } from "../lib/pdf/colors.js";

test("safeColor : accepte un hex #RRGGBB valide, sinon renvoie le repli", () => {
  assert.equal(safeColor("#2a2f66", "#000000"), "#2a2f66");
  assert.equal(safeColor("pas-une-couleur", "#000000"), "#000000");
  assert.equal(safeColor(undefined, "#111111"), "#111111");
  assert.equal(safeColor("#fff", "#000000"), "#000000"); // 3 chiffres refusé (on attend #RRGGBB)
});

test("tint : t=0 renvoie la même couleur, t=1 renvoie blanc", () => {
  assert.equal(tint("#336699", 0), "#336699");
  assert.equal(tint("#336699", 1), "#ffffff");
});

test("readableOn : texte blanc sur fond sombre, noir sur fond clair", () => {
  assert.equal(readableOn("#000000"), "#ffffff");
  assert.equal(readableOn("#ffffff"), "#111111");
});

test("textSafe : assombrit une couleur trop claire pour rester lisible en texte", () => {
  const safe = textSafe("#f5e642"); // jaune clair
  assert.notEqual(safe, "#f5e642");
  // ne doit jamais assombrir une couleur déjà sombre
  assert.equal(textSafe("#111111"), "#111111");
});

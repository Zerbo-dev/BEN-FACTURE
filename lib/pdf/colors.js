export const safeColor = (c, fallback) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : fallback);

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Éclaircit une couleur vers le blanc (t = 0 → identique, 1 → blanc). */
export const tint = (h, t) =>
  "#" + rgb(h).map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0")).join("");

/** Texte noir ou blanc, selon ce qui reste lisible sur cette couleur de fond. */
export function readableOn(h) {
  const [r, g, b] = rgb(h).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
}

/** Assombrit une couleur trop claire pour qu'elle reste lisible en texte sur fond blanc. */
export function textSafe(h) {
  const lum = (c) => {
    const [r, g, b] = rgb(c).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  let c = h;
  for (let i = 0; i < 10 && lum(c) > 0.2; i++) {
    c = "#" + rgb(c).map((v) => Math.round(v * 0.85).toString(16).padStart(2, "0")).join("");
  }
  return c;
}

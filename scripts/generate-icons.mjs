import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Uangku mark: a "U" built from 2 straight lines + 1 arc, with a coin
// resting in its cup (savings) — the approved flat design (brand purple
// tile, white glyph, no gradients/rings), same construction used across
// the brand.
const BRAND = "#5643c9";
const GLYPH = `
  <path d="M32,26 L32,56 A18,18 0 0 0 68,56 L68,26" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="56" r="9" fill="#ffffff"/>`;

/** Rounded tile — for contexts that show the icon's own shape as-is (favicon, manifest "any" icons). */
function tileSvg(size) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill="${BRAND}"/>
    ${GLYPH}
  </svg>`;
}

/**
 * Full-bleed, no rounded corners — for contexts that apply their own mask
 * on top (iOS's own squircle for apple-touch-icon; Android's
 * adaptive-icon mask for the maskable manifest entry). The glyph's own
 * bounding box already sits inside a centered 80%-diameter circle (the
 * standard maskable "safe zone"), so it needs no extra scaling/padding.
 */
function fullBleedSvg(size) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${BRAND}"/>
    ${GLYPH}
  </svg>`;
}

const targets = [
  { name: "icon-192.png", svg: tileSvg(192) },
  { name: "icon-512.png", svg: tileSvg(512) },
  { name: "icon-maskable-512.png", svg: fullBleedSvg(512) },
  { name: "apple-touch-icon.png", svg: fullBleedSvg(180) },
];

for (const t of targets) {
  await sharp(Buffer.from(t.svg))
    .png()
    .toFile(path.join(outDir, t.name));
  console.log("wrote", t.name);
}

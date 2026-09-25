import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Uangku mark: a "U" built from 2 straight lines + 1 arc, with a coin
// resting in its cup (savings) — same construction used across the brand
// (brochures, in-app "what's new" assets), rendered here in a deep
// purple-to-indigo tile with a gold monoline glyph for a more premium/
// exclusive finish than the flat white-on-purple original.
const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#7a6cf0"/>
    <stop offset="100%" stop-color="#2f2066"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#f6e2ab"/>
    <stop offset="55%" stop-color="#d9b45f"/>
    <stop offset="100%" stop-color="#9c7a2e"/>
  </linearGradient>`;

const GLYPH = `
  <path d="M32,26 L32,56 A18,18 0 0 0 68,56 L68,26" fill="none" stroke="url(#gold)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="56" r="9" fill="url(#gold)"/>`;

/** Rounded tile with a thin gold ring — for contexts that show the icon's own shape as-is (favicon, manifest "any" icons). */
function tileSvg(size) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>${DEFS}</defs>
    <rect width="100" height="100" rx="22" fill="url(#bg)"/>
    <rect x="3" y="3" width="94" height="94" rx="19.5" fill="none" stroke="url(#gold)" stroke-width="1.4" opacity="0.55"/>
    ${GLYPH}
  </svg>`;
}

/**
 * Full-bleed, no rounded corners or ring — for contexts that apply their
 * own mask on top (iOS's own squircle for apple-touch-icon; Android's
 * adaptive-icon mask for the maskable manifest entry). The glyph's own
 * bounding box already sits inside a centered 80%-diameter circle (the
 * standard maskable "safe zone"), so it needs no extra scaling/padding.
 */
function fullBleedSvg(size) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>${DEFS}</defs>
    <rect width="100" height="100" fill="url(#bg)"/>
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

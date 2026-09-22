import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

function svg(size, { padding = 0 } = {}) {
  const inner = size - padding * 2;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f3d99a"/>
        <stop offset="55%" stop-color="#d3ae5c"/>
        <stop offset="100%" stop-color="#8a6a22"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="#15140f"/>
    <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${inner * 0.22}" fill="url(#g)"/>
    <text x="50%" y="${padding + inner * 0.68}" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif" font-size="${inner * 0.52}" fill="#2a2008" font-weight="600">U</text>
  </svg>`;
}

const targets = [
  { name: "icon-192.png", size: 192, padding: 0 },
  { name: "icon-512.png", size: 512, padding: 0 },
  { name: "icon-maskable-512.png", size: 512, padding: 64 },
  { name: "apple-touch-icon.png", size: 180, padding: 0 },
];

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, { padding: t.padding })))
    .png()
    .toFile(path.join(outDir, t.name));
  console.log("wrote", t.name);
}

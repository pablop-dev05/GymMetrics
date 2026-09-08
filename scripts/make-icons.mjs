/**
 * Genera los iconos PWA de GymMetrics a partir de un SVG.
 * Uso: pnpm icons
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT = 'public/icons';

/** @param {number} pad margen interior (0.18 = área segura de icono maskable) */
const svg = (pad = 0.10) => {
  const s = 512;
  const inner = s * (1 - pad * 2);
  const scale = inner / 512;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1428"/>
      <stop offset="100%" stop-color="#05070f"/>
    </linearGradient>
    <linearGradient id="bar" gradientUnits="userSpaceOnUse" x1="60" y1="150" x2="460" y2="380">
      <stop offset="0%" stop-color="#7ef0da"/>
      <stop offset="45%" stop-color="#38e2c4"/>
      <stop offset="100%" stop-color="#7c5cff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#38e2c4" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#38e2c4" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${s}" height="${s}" fill="url(#bg)"/>
  <rect width="${s}" height="${s}" fill="url(#glow)"/>

  <g transform="translate(${s * pad} ${s * pad}) scale(${scale})">
    <!-- mancuerna -->
    <g stroke="url(#bar)" stroke-width="34" stroke-linecap="round" fill="none">
      <path d="M138 170v172"/>
      <path d="M374 170v172"/>
      <path d="M78 214v84"/>
      <path d="M434 214v84"/>
      <path d="M138 256h236"/>
    </g>
    <!-- pulso de métricas -->
    <path d="M96 396h72l40-64 44 104 40-76h124"
          stroke="#ffffff" stroke-opacity="0.92" stroke-width="20"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
};

await mkdir(OUT, { recursive: true });

for (const size of SIZES) {
  const file = `${OUT}/icon-${size}x${size}.png`;
  await sharp(Buffer.from(svg(0.10))).resize(size, size).png().toFile(file);
  console.log('✓', file);
}

// Versión maskable: más margen para que Android no recorte el dibujo.
await sharp(Buffer.from(svg(0.20))).resize(512, 512).png().toFile(`${OUT}/maskable-512x512.png`);
console.log('✓', `${OUT}/maskable-512x512.png`);

// Favicon y SVG fuente
await sharp(Buffer.from(svg(0.10))).resize(64, 64).png().toFile('public/favicon.png');
await writeFile('public/icon.svg', svg(0.10).trim());
console.log('✓ public/favicon.png · public/icon.svg');

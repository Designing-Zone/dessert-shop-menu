/**
 * Generates lightweight SVG seed images for the demo menu into server/uploads/.
 * Each is a small designed tile (dark warm gradient + emoji art) so the seeded
 * menu looks polished while staying tiny (<1 KB per image).
 *   node scripts/seed-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'server', 'uploads');
fs.mkdirSync(OUT, { recursive: true });

// [filename, emoji, bgTop, bgBottom, glow]
const IMAGES = [
  ['classic-burger', '🍔', '#3a2a1c', '#1b130d', '#ff9a3d'],
  ['cheese-burger', '🍔', '#40301a', '#1e150a', '#ffc24d'],
  ['double-smash', '🥓', '#41301e', '#1e150c', '#ff8a3d'],
  ['chicken-burger', '🍗', '#3a2f1a', '#1c150c', '#ffc24d'],
  ['hot-wings', '🍗', '#422a16', '#1e1207', '#ff7043'],
  ['smash-combo', '🍟', '#38291a', '#1a120a', '#ff9a3d'],
  ['family-feast', '🍱', '#33261a', '#17110b', '#ff8a3d'],
  ['fries', '🍟', '#3d2d12', '#1d1407', '#ffb547'],
  ['loaded-fries', '🧀', '#403016', '#1e150a', '#ffb547'],
  ['cola', '🥤', '#1e2a33', '#0d1418', '#5bc8ff'],
  ['lemonade', '🍋', '#2c3320', '#131809', '#d6f35f'],
  ['garlic-sauce', '🧄', '#302a23', '#161310', '#e8dcc8'],
  ['bbq-dip', '🥫', '#38201c', '#190d0b', '#ff7d6b'],
  ['duo-deal', '💥', '#402410', '#1d0e04', '#ff7a1a'],
  ['wing-bucket', '🪣', '#3c2410', '#1c0f04', '#ff9a3d'],
];

const svg = ([name, emoji, top, bottom, glow]) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <radialGradient id="spot" cx="30%" cy="18%" r="95%">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="100%" stop-color="${bottom}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="46%" r="42%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#spot)"/>
  <rect width="400" height="300" fill="url(#glow)"/>
  <circle cx="200" cy="140" r="96" fill="none" stroke="${glow}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="3 9"/>
  <circle cx="356" cy="34" r="44" fill="${glow}" fill-opacity="0.10"/>
  <circle cx="30" cy="272" r="56" fill="${glow}" fill-opacity="0.08"/>
  <text x="200" y="182" font-size="118" text-anchor="middle" dominant-baseline="middle"
    font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${emoji}</text>
</svg>`.trim();

for (const spec of IMAGES) {
  fs.writeFileSync(path.join(OUT, `${spec[0]}.svg`), svg(spec) + '\n');
}
console.log(`Wrote ${IMAGES.length} seed images to ${OUT}`);

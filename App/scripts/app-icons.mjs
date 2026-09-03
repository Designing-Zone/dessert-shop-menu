/**
 * Generates the Android launcher icons (no image libraries needed):
 * orange gradient tile + flat burger mark, drawn per-pixel and encoded
 * as PNG with node:zlib. Overwrites the Capacitor template icons.
 *   node scripts/app-icons.mjs
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

/* ------------------------------- PNG writer ------------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function writePng(file, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

/* ------------------------------ pixel drawing ----------------------------- */

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const CREAM = hex('#FFF4E4');
const BROWN = hex('#4A2C15');
const GREEN = hex('#7CC24B');
const ORANGE = hex('#FF7A1A');
const GRAD_TOP = hex('#FFA149');
const GRAD_BOT = hex('#FF6A00');

const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inRRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
};

/** Burger mark in unit space; paints into rgba at scale s with top-left (ox, oy). */
function drawBurger(rgba, W, H, s, ox, oy) {
  const put = (px, py, col) => {
    const X = Math.floor(ox + px * s);
    const Y = Math.floor(oy + py * s);
    if (X < 0 || Y < 0 || X >= W || Y >= H) return;
    const i = (Y * W + X) * 4;
    rgba[i] = col[0];
    rgba[i + 1] = col[1];
    rgba[i + 2] = col[2];
    rgba[i + 3] = 255;
  };
  for (let py = 0; py <= 1; py += 0.5 / s) {
    for (let px = 0; px <= 1; px += 0.5 / s) {
      // bottom bun
      if (inRRect(px, py, 0.22, 0.635, 0.78, 0.765, 0.06)) put(px, py, CREAM);
      // patty
      else if (inRRect(px, py, 0.20, 0.51, 0.80, 0.595, 0.042)) put(px, py, BROWN);
      // lettuce
      else if (inRRect(px, py, 0.215, 0.452, 0.785, 0.497, 0.022)) put(px, py, GREEN);
      // top bun dome
      else if (py <= 0.44 && inEllipse(px, py, 0.5, 0.44, 0.30, 0.265)) put(px, py, CREAM);
    }
  }
  // sesame dots on the dome
  for (const [sx, sy] of [
    [0.435, 0.31],
    [0.545, 0.275],
    [0.585, 0.365],
  ]) {
    for (let py = 0; py <= 1; py += 0.5 / s)
      for (let px = 0; px <= 1; px += 0.5 / s)
        if (inEllipse(px, py, sx, sy, 0.024, 0.016)) put(px, py, ORANGE);
  }
}

function render(size, { mode }) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = size;
  const grad = (y) => {
    const t = y / S;
    return [0, 1, 2].map((i) => Math.round(GRAD_TOP[i] + (GRAD_BOT[i] - GRAD_TOP[i]) * t));
  };
  if (mode === 'square' || mode === 'round') {
    const r = mode === 'round' ? S / 2 : S * 0.22;
    for (let y = 0; y < S; y++) {
      const g = grad(y);
      for (let x = 0; x < S; x++) {
        const inside =
          mode === 'round'
            ? (x - S / 2) ** 2 + (y - S / 2) ** 2 <= (S / 2) ** 2
            : inRRect(x, y, 0, 0, S - 1, S - 1, r);
        if (inside) {
          const i = (y * S + x) * 4;
          rgba[i] = g[0];
          rgba[i + 1] = g[1];
          rgba[i + 2] = g[2];
          rgba[i + 3] = 255;
        }
      }
    }
    const s = S * 0.62;
    drawBurger(rgba, S, S, s, (S - s) / 2, (S - s) / 2);
  } else {
    // adaptive foreground: transparent, mark inside the 66/108 safe zone
    const s = S * 0.42;
    drawBurger(rgba, S, S, s, (S - s) / 2, (S - s) / 2);
  }
  return rgba;
}

const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
];

for (const [dpi, legacy, fg] of DENSITIES) {
  const dir = path.join(RES, `mipmap-${dpi}`);
  writePng(path.join(dir, 'ic_launcher.png'), legacy, legacy, render(legacy, { mode: 'square' }));
  writePng(path.join(dir, 'ic_launcher_round.png'), legacy, legacy, render(legacy, { mode: 'round' }));
  writePng(path.join(dir, 'ic_launcher_foreground.png'), fg, fg, render(fg, { mode: 'fg' }));
  console.log(`${dpi}: ${legacy}px + ${fg}px foreground`);
}

fs.writeFileSync(
  path.join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FF6A00</color>\n</resources>\n`
);
console.log('icons written');

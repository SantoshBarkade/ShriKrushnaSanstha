const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/Santosh/.gemini/antigravity-ide/brain/de16229d-9b2d-4bac-b922-2802f7de1ff3/.user_uploaded/media_1792929057867.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

let pos = 8;
const idatChunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}

const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const bpp = 4;
const stride = width * bpp;
const raw = Buffer.alloc(width * height * bpp);
let srcPos = 0;

for (let y = 0; y < height; y++) {
  const filter = decompressed[srcPos++];
  const lineStart = y * stride;
  const prevLineStart = (y - 1) * stride;

  for (let x = 0; x < stride; x++) {
    const val = decompressed[srcPos++];
    const left = x >= bpp ? raw[lineStart + x - bpp] : 0;
    const up = y > 0 ? raw[prevLineStart + x] : 0;
    const upLeft = (y > 0 && x >= bpp) ? raw[prevLineStart + x - bpp] : 0;

    let recon = val;
    if (filter === 1) recon = (val + left) & 0xFF;
    else if (filter === 2) recon = (val + up) & 0xFF;
    else if (filter === 3) recon = (val + Math.floor((left + up) / 2)) & 0xFF;
    else if (filter === 4) {
      const p = left + up - upLeft;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - up);
      const pc = Math.abs(p - upLeft);
      let pr = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : upLeft);
      recon = (val + pr) & 0xFF;
    }
    raw[lineStart + x] = recon;
  }
}

// Find colors in panel 1 (x: 0..512, y: 0..227)
let redPixels = [];
let bluePixels = [];
let textPixels = [];

for (let y = 10; y < 220; y++) {
  for (let x = 10; x < 500; x++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (r > 200 && g < 80 && b < 80) {
      redPixels.push({x, y, r, g, b});
    } else if (b > 120 && r < 50 && g < 120) {
      bluePixels.push({x, y, r, g, b});
    } else if (r < 80 && g < 80 && b < 80) {
      textPixels.push({x, y, r, g, b});
    }
  }
}

function stats(arr, name) {
  if (!arr.length) return console.log(name, 'none found');
  const minX = Math.min(...arr.map(p => p.x));
  const maxX = Math.max(...arr.map(p => p.x));
  const minY = Math.min(...arr.map(p => p.y));
  const maxY = Math.max(...arr.map(p => p.y));
  const avgR = Math.round(arr.reduce((s,p) => s+p.r, 0)/arr.length);
  const avgG = Math.round(arr.reduce((s,p) => s+p.g, 0)/arr.length);
  const avgB = Math.round(arr.reduce((s,p) => s+p.b, 0)/arr.length);
  const hex = '#' + [avgR, avgG, avgB].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
  console.log(`${name}: count=${arr.length}, bounds=[x:${minX}..${maxX}, y:${minY}..${maxY}], avgRGB=(${avgR},${avgG},${avgB}) -> ${hex}`);
}

stats(redPixels, 'Panel 1 Red Roof & Windows');
stats(bluePixels, 'Panel 1 Blue Base & Windows');
stats(textPixels, 'Panel 1 English Text');

// Check Panel 3 (symbol alone, x: 0..512, y: 228..454)
let p3Red = [], p3Blue = [];
for (let y = 230; y < 450; y++) {
  for (let x = 10; x < 500; x++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (r > 200 && g < 80 && b < 80) p3Red.push({x, y, r, g, b});
    else if (b > 120 && r < 50 && g < 120) p3Blue.push({x, y, r, g, b});
  }
}
stats(p3Red, 'Panel 3 Symbol Red');
stats(p3Blue, 'Panel 3 Symbol Blue');

// Check Panel 6 (bilingual text, x: 513..1023, y: 455..681)
let p6Red = [], p6Blue = [], p6Text = [];
for (let y = 455; y < 680; y++) {
  for (let x = 515; x < 1020; x++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (r > 200 && g < 80 && b < 80) p6Red.push({x, y, r, g, b});
    else if (b > 120 && r < 50 && g < 120) p6Blue.push({x, y, r, g, b});
    else if (r < 80 && g < 80 && b < 80) p6Text.push({x, y, r, g, b});
  }
}
stats(p6Red, 'Panel 6 Symbol Red');
stats(p6Blue, 'Panel 6 Symbol Blue');
stats(p6Text, 'Panel 6 Bilingual Text');

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

// Find horizontal lines where gray divider exists
console.log('Scanning for horizontal lines...');
for (let y = 0; y < height; y++) {
  let grayCount = 0;
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (r > 200 && r < 240 && g > 200 && g < 240 && b > 200 && b < 240) {
      grayCount++;
    }
  }
  if (grayCount > width * 0.7) {
    console.log(`Horizontal divider near y=${y} (${grayCount} gray pixels)`);
  }
}

// Scanning for vertical lines
console.log('Scanning for vertical lines...');
for (let x = 0; x < width; x++) {
  let grayCount = 0;
  for (let y = 0; y < height; y++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (r > 200 && r < 240 && g > 200 && g < 240 && b > 200 && b < 240) {
      grayCount++;
    }
  }
  if (grayCount > height * 0.7) {
    console.log(`Vertical divider near x=${x} (${grayCount} gray pixels)`);
  }
}

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

function getPanelBounds(xMin, yMin, xMax, yMax, isDarkBg = false) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const idx = (y * width + x) * 4;
      const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
      const isContent = isDarkBg 
        ? (r > 150 || g > 150 || b > 150) // white elements on dark bg
        : (r < 240 || g < 240 || b < 240); // non-white elements on light bg
      if (isContent) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

console.log('Panel 1 (English, top-left):', getPanelBounds(10, 5, 510, 230));
console.log('Panel 2 (Marathi, top-right):', getPanelBounds(520, 5, 1015, 230));
console.log('Panel 3 (Symbol, mid-left):', getPanelBounds(10, 245, 510, 450));
console.log('Panel 4 (Navy mono, mid-right):', getPanelBounds(520, 245, 1015, 450));
console.log('Panel 5 (White on Blue, bot-left):', getPanelBounds(10, 460, 510, 675, true));
console.log('Panel 6 (Bilingual, bot-right):', getPanelBounds(520, 460, 1015, 675));

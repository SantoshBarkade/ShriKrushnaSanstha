const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const scanlineLength = width * 4 + 1;
  const filtered = Buffer.alloc(height * scanlineLength);
  for (let y = 0; y < height; y++) {
    filtered[y * scanlineLength] = 0;
    rgbaBuffer.copy(filtered, y * scanlineLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatCompressed = zlib.deflateSync(filtered, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

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

function crop(x1, y1, x2, y2, makeTransparentWhite = false) {
  const w = x2 - x1;
  const h = y2 - y1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((y1 + y) * width + (x1 + x)) * 4;
      const dstIdx = (y * w + x) * 4;
      let r = raw[srcIdx];
      let g = raw[srcIdx + 1];
      let b = raw[srcIdx + 2];
      let a = raw[srcIdx + 3];

      if (makeTransparentWhite) {
        if (r > 245 && g > 245 && b > 245) {
          a = 0;
        } else if (r > 220 && g > 220 && b > 220) {
          const lum = (r + g + b) / 3;
          a = Math.max(0, Math.min(255, Math.round(255 * (255 - lum) / 35)));
        }
      }

      out[dstIdx] = r;
      out[dstIdx + 1] = g;
      out[dstIdx + 2] = b;
      out[dstIdx + 3] = a;
    }
  }
  return createPng(w, h, out);
}

const publicDir = 'c:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/public';

// 1. Bilingual Logo (Bottom Right): bounds [536..1001, 469..639] + 12px pad
const p6Bilingual = crop(526, 460, 1010, 649, true);
fs.writeFileSync(`${publicDir}/logo-bilingual.png`, p6Bilingual);
console.log('Saved public/logo-bilingual.png');

// 2. Marathi Logo (Top Right): bounds [619..920, 19..216] + 12px pad
const p2Marathi = crop(609, 10, 930, 225, true);
fs.writeFileSync(`${publicDir}/logo-mr.png`, p2Marathi);
console.log('Saved public/logo-mr.png');

// 3. English Logo (Top Left): bounds [56..457, 19..210] + 12px pad
const p1English = crop(46, 10, 467, 220, true);
fs.writeFileSync(`${publicDir}/logo-en.png`, p1English);
console.log('Saved public/logo-en.png');

// 4. Symbol Only (Mid Left): bounds [162..349, 275..428] + 10px pad
const p3Symbol = crop(152, 265, 359, 438, true);
fs.writeFileSync(`${publicDir}/logo-symbol.png`, p3Symbol);
console.log('Saved public/logo-symbol.png');

// 5. White on Blue Reverse (Bottom Left): bounds [10..510, 460..675]
const p5White = crop(15, 462, 508, 672, false);
fs.writeFileSync(`${publicDir}/logo-white-card.png`, p5White);
console.log('Saved public/logo-white-card.png');

// 6. Favicon SVG matching the exact registered geometric symbol!
// The symbol has:
// Red top chevron with left chimney
// Blue bottom chevron
// 4 square windows: 2 blue on left, 2 red on right
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" fill="none">
  <!-- Red Roof with Chimney -->
  <path d="M 17 44 L 17 26 L 27 26 L 27 34 L 50 14 L 83 40 L 73 48 L 50 30 L 26 50 Z" fill="#FD2336"/>
  <!-- Blue Foundation / Lower Chevron -->
  <path d="M 17 56 L 50 83 L 83 56 L 83 72 L 50 98 L 17 72 Z" fill="#065FB0"/>
  <!-- 4 Center Window Panes -->
  <!-- Left Windows (Blue) -->
  <rect x="40" y="44" width="8" height="8" rx="0.5" fill="#065FB0"/>
  <rect x="40" y="55" width="8" height="8" rx="0.5" fill="#065FB0"/>
  <!-- Right Windows (Red) -->
  <rect x="52" y="44" width="8" height="8" rx="0.5" fill="#FD2336"/>
  <rect x="52" y="55" width="8" height="8" rx="0.5" fill="#FD2336"/>
</svg>
`;
fs.writeFileSync(`${publicDir}/favicon.svg`, faviconSvg);
console.log('Saved public/favicon.svg');

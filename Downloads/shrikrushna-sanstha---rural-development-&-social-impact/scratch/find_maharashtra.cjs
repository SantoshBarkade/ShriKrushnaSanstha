const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.html') || f.endsWith('.json')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('महाराष्ट्') || line.includes('महाराष्ट्र')) {
          const matches = [...line.matchAll(/मह[\u0900-\u097F]+/g)];
          matches.forEach(m => {
            const word = m[0];
            const hex = [...word].map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
            console.log(`${p}:${idx + 1} -> ${word} [${hex}]`);
          });
        }
      });
    }
  }
}
walk('src');

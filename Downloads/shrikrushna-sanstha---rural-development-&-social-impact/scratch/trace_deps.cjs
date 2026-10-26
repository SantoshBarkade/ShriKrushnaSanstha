const fs = require('fs');
const path = require('path');

function searchFiles(dir, exts, pattern) {
  const results = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walk(full);
      } else if (stat.isFile() && exts.some((e) => f.endsWith(e))) {
        const content = fs.readFileSync(full, 'utf8');
        if (pattern.test(content)) {
          results.push(full);
        }
      }
    }
  }
  walk(dir);
  return results;
}

console.log('THREE.JS CONSUMERS:');
console.log(searchFiles('src', ['.ts', '.tsx', '.js', '.jsx'], /from ['"]three['"]|import\(['"]three['"]\)/));

console.log('\nMAHARASHTRA CANVAS CONSUMERS:');
console.log(searchFiles('src', ['.ts', '.tsx', '.js', '.jsx'], /MaharashtraCanvas/));

console.log('\nGSAP CONSUMERS:');
console.log(searchFiles('src', ['.ts', '.tsx', '.js', '.jsx'], /gsap/));

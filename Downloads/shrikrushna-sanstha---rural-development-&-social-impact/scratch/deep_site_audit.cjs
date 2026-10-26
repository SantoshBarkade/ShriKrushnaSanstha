const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('src');

function getAllFiles(dir, exts = ['.tsx', '.ts', '.html']) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

const allFiles = getAllFiles('src').concat([path.resolve('index.html')]);

console.log('Total files found:', allFiles.length);

// 1. Audit Registration Numbers and Darpan IDs
const idOccurrences = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/Darpan|दर्पण|दरपण|MH\/2023|रजि|नोंदणी|F-0008544|14668|१४६६८/i.test(line)) {
      idOccurrences.push({
        file: path.relative(process.cwd(), file),
        line: idx + 1,
        text: line.trim()
      });
    }
  });
});

console.log('\n=== REGISTRATION & DARPAN ID AUDIT ===');
console.log(`Found ${idOccurrences.length} occurrences:`);
idOccurrences.forEach(o => console.log(`  [${o.file}:${o.line}] ${o.text}`));

// 2. Audit Addresses
const addressOccurrences = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/नादरपूर|कन्नड|संभाजीनगर|औरंगाबाद/i.test(line)) {
      if (line.includes('address') || line.includes('पत्ता') || line.includes('मु.') || line.includes('जि.') || line.includes('ता.')) {
        addressOccurrences.push({
          file: path.relative(process.cwd(), file),
          line: idx + 1,
          text: line.trim()
        });
      }
    }
  });
});

console.log('\n=== ADDRESS AUDIT ===');
console.log(`Found ${addressOccurrences.length} address occurrences:`);
addressOccurrences.forEach(o => console.log(`  [${o.file}:${o.line}] ${o.text}`));

// 3. Audit Duplicate Scheme Names across codebase
const schemeOccurrences = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/योजना|Yojana/i.test(line) && (line.includes('title') || line.includes('name') || line.includes('`') || line.includes("'"))) {
      schemeOccurrences.push({
        file: path.relative(process.cwd(), file),
        line: idx + 1,
        text: line.trim()
      });
    }
  });
});

console.log('\n=== SCHEME NAMES AUDIT ===');
console.log(`Found ${schemeOccurrences.length} scheme name occurrences:`);
schemeOccurrences.slice(0, 25).forEach(o => console.log(`  [${o.file}:${o.line}] ${o.text}`));

fs.writeFileSync('scratch/deep_audit_results.json', JSON.stringify({
  ids: idOccurrences,
  addresses: addressOccurrences,
  schemes: schemeOccurrences
}, null, 2), 'utf8');

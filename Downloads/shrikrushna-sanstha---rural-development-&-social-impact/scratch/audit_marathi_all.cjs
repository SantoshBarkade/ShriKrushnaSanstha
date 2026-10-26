const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Scan Frontend files
const filesToScan = [
  'index.html',
  'src/data/initialData.ts',
  'src/experience/knowledge.ts',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/HeroSection.tsx',
  'src/components/HomeOverview.tsx',
  'src/components/AboutView.tsx',
  'src/components/OfficialsView.tsx',
  'src/components/InitiativesView.tsx',
  'src/components/WorkTimelineView.tsx',
  'src/components/SchemesView.tsx',
  'src/components/GalleryView.tsx',
  'src/components/VideoLibraryView.tsx',
  'src/components/ReportsView.tsx',
  'src/components/NewsView.tsx',
  'src/components/VolunteerView.tsx',
  'src/components/ContactView.tsx',
  'src/components/PrivacyPolicyView.tsx',
  'src/components/LightboxModal.tsx',
  'src/components/SansthaGuide.tsx',
  'src/components/SeoManager.tsx',
  'src/App.tsx'
];

const patterns = [
  { pattern: /समरपित/g, correct: 'समर्पित', reason: 'Missing repha on र्' },
  { pattern: /मारगदरशन/g, correct: 'मार्गदर्शन', reason: 'Missing repha on र्' },
  { pattern: /परिवरतनाच्या/g, correct: 'परिवर्तनाच्या', reason: 'Missing repha on र्' },
  { pattern: /सरवांच्या/g, correct: 'सर्वांच्या', reason: 'Missing repha on र्' },
  { pattern: /संवरधन/g, correct: 'संवर्धन', reason: 'Missing repha on र्' },
  { pattern: /कटिदध/g, correct: 'कटिबद्ध', reason: 'Incorrect conjunct' },
  { pattern: /कटिबध्द/g, correct: 'कटिबद्ध', reason: 'Standard Marathi conjunct द्ध' },
  { pattern: /समाजकारय/g, correct: 'समाजकार्य', reason: 'Missing repha on र्' },
  { pattern: /परयावरण/g, correct: 'पर्यावरण', reason: 'Missing repha on र्' },
  { pattern: /कलयाणकारी/g, correct: 'कल्याणकारी', reason: 'Missing conjunct ल्य' },
  { pattern: /मारगदरशक/g, correct: 'मार्गदर्शक', reason: 'Missing repha on र्' },
  { pattern: /वारषिक/g, correct: 'वार्षिक', reason: 'Missing repha on र्' },
  { pattern: /पारदरशकता/g, correct: 'पारदर्शकता', reason: 'Missing repha on र्' },
  { pattern: /पारदर्शक/g, correct: 'पारदर्शक', reason: 'Check context' },
  { pattern: /कारयकारिणी/g, correct: 'कार्यकारिणी', reason: 'Missing repha on र्' },
  { pattern: /कारयपदधती/g, correct: 'कार्यपद्धती', reason: 'Missing repha on र् and incorrect conjunct' },
  { pattern: /कार्यपदधती/g, correct: 'कार्यपद्धती', reason: 'Standard conjunct द्ध' },
  { pattern: /संपरक/g, correct: 'संपर्क', reason: 'Missing repha on र्' },
  { pattern: /लोककलयाण/g, correct: 'लोककल्याण', reason: 'Missing conjunct ल्य' },
  { pattern: /अरज/g, correct: 'अर्ज', reason: 'Missing repha on र्' },
  { pattern: /समृदधी/g, correct: 'समृद्धी', reason: 'Incorrect conjunct' },
  { pattern: /समृध्दी/g, correct: 'समृद्धी', reason: 'Standard Marathi conjunct द्ध' },
  { pattern: /कारयक्रम/g, correct: 'कार्यक्रम', reason: 'Missing repha on र्' },
  { pattern: /सारवजनिक/g, correct: 'सार्वजनिक', reason: 'Missing repha on र्' },
  { pattern: /पूरवसंवाद/g, correct: 'पूर्वसंवाद', reason: 'Missing repha on र्' },
  { pattern: /लाभारथी/g, correct: 'लाभार्थी', reason: 'Missing repha on र्' },
  { pattern: /पूरण/g, correct: 'पूर्ण', reason: 'Missing repha on र्' },
  { pattern: /महाराष्ट/g, correct: 'महाराष्ट्र', reason: 'Incomplete state name' },
  { pattern: /पहा\b/g, correct: 'पाहा', reason: 'Formal standard Marathi verb form' },
  { pattern: /बद्दल\b/g, correct: 'विषयी / संस्थेविषयी', reason: 'Formal institutional terminology' },
  { pattern: /@@@@/g, correct: '', reason: 'Accidental garbage prefix' },
  { pattern: /############/g, correct: '', reason: 'Accidental garbage prefix' },
  { pattern: /पाऊले/g, correct: 'पावले', reason: 'Standard Marathi spelling' },
  { pattern: /विद्यार्थी\s*हजेरी/g, correct: 'विद्यार्थी उपस्थिती', reason: 'Standard institutional Marathi terminology' }
];

const findings = [];

filesToScan.forEach(relPath => {
  if (!fs.existsSync(relPath)) return;
  const content = fs.readFileSync(relPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    patterns.forEach(({ pattern, correct, reason }) => {
      if (pattern.test(line)) {
        findings.push({
          source: relPath,
          line: idx + 1,
          matched: line.trim(),
          recommended: correct,
          reason
        });
      }
    });
  });
});

console.log('=== FRONTEND MARATHI AUDIT FINDINGS ===');
console.log(`Total occurrences found in frontend code: ${findings.length}`);
console.log(JSON.stringify(findings.slice(0, 30), null, 2));

// Save findings
fs.writeFileSync('scratch/frontend_marathi_findings.json', JSON.stringify(findings, null, 2), 'utf8');

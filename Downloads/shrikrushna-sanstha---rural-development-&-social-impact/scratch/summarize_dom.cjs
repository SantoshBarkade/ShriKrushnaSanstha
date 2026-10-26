const fs = require('fs');
const dom = JSON.parse(fs.readFileSync('scratch/home_rendered_dom.json', 'utf8'));

console.log("=== MARATHI SECTIONS ===");
console.log("Title:", dom.mr.title);
console.log("Main sections count:", dom.mr.mainSections.length);
dom.mr.mainSections.forEach((s, idx) => {
  console.log(`\n--- Section ${s.index} (Aria: ${s.ariaLabel || 'none'}) ---`);
  console.log("Headings:", s.headings);
  console.log("Paragraphs:", s.paragraphs);
  console.log("Buttons:", s.buttons);
  console.log("Images:", s.images);
});

console.log("\n=== ENGLISH SECTIONS ===");
console.log("Title:", dom.en.title);
console.log("Main sections count:", dom.en.mainSections.length);
dom.en.mainSections.forEach((s, idx) => {
  console.log(`\n--- Section ${s.index} (Aria: ${s.ariaLabel || 'none'}) ---`);
  console.log("Headings:", s.headings);
  console.log("Paragraphs:", s.paragraphs);
  console.log("Buttons:", s.buttons);
  console.log("Images:", s.images);
});

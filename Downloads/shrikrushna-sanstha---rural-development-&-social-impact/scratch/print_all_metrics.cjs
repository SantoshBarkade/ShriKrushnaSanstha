const fs = require('fs');

console.log("=== TEST 2 DETAILED BREAKDOWN ===");
const t2 = JSON.parse(fs.readFileSync('scratch/test2_results.json', 'utf8'));
console.log("--- Normal Motion ---");
console.table(t2.normalMotion.map(r => ({
  route: r.route,
  fps: r.fpsEstimate,
  meanFrameMs: r.meanFrameMs,
  p95Ms: r.p95Ms,
  droppedFramesPct: r.droppedFrames33msPct + '%',
  hitches50ms: r.hitches50msCount,
  maxHitchMs: r.maxFrameHitchMs,
  longTasksCount: r.longTasksCount,
  maxLongTaskMs: r.maxLongTaskMs
})));

console.log("--- Reduced Motion ---");
console.table(t2.reducedMotion.map(r => ({
  route: r.route,
  fps: r.fpsEstimate,
  meanFrameMs: r.meanFrameMs,
  p95Ms: r.p95Ms,
  droppedFramesPct: r.droppedFrames33msPct + '%',
  hitches50ms: r.hitches50msCount,
  maxHitchMs: r.maxFrameHitchMs
})));

console.log("\n=== TEST 3 DETAILED THREE.JS LIFECYCLE ===");
const t3 = JSON.parse(fs.readFileSync('scratch/test3_results.json', 'utf8'));
console.log(JSON.stringify(t3, null, 2));

console.log("\n=== TEST 4 DETAILED GSAP SCRUB ===");
const t4 = JSON.parse(fs.readFileSync('scratch/test4_results.json', 'utf8'));
console.log(JSON.stringify(t4, null, 2));

console.log("\n=== TEST 5 DETAILED REGRESSION ===");
const t5 = JSON.parse(fs.readFileSync('scratch/test5_results.json', 'utf8'));
console.log("Direct results count:", t5.directResults.length);
console.table(t5.directResults.map(r => ({
  route: r.route,
  hasContent: r.hasContent,
  hasCrash: r.hasCrash,
  bodyLen: r.bodyTextLen
})));
console.log("History:", t5.historyRes);
console.log("Typography:", t5.typographyRes);
console.log("Language Toggle:", t5.langToggleRes);
console.log("Overflow checks:", t5.allOverflowPass, "Checks total:", t5.overflowResults.length);

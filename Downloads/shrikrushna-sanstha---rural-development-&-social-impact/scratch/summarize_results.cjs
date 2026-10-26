const fs = require('fs');

console.log("=== TEST 1 SESSIONS ===");
const t1 = JSON.parse(fs.readFileSync('scratch/test1_results.json', 'utf8'));
console.table(t1.sessions.map(s => ({
  viewport: s.viewport,
  cache: s.cache,
  cls: s.cls,
  fcp: s.fcp,
  lcp: s.lcp,
  jsBeforeFCP_kB: s.jsTransferBeforeFCP_kB,
  js5s_kB: s.jsTransfer5s_kB,
  maxLongTaskMs: s.maxLongTaskDurationMs
})));

console.log("\n=== TEST 2 SCROLL FPS & JANK ===");
const t2 = JSON.parse(fs.readFileSync('scratch/test2_results.json', 'utf8'));
console.table(t2.routes.map(r => ({
  route: r.route,
  fps: r.fps,
  meanFrameMs: r.meanFrameTimeMs,
  p95FrameMs: r.p95FrameTimeMs,
  droppedPercent: r.droppedFramesPercent + '%',
  hitches: r.severeHitchesCount,
  maxHitchMs: r.maxHitchDurationMs
})));

console.log("\n=== TEST 3 THREE.JS LIFECYCLE ===");
const t3 = JSON.parse(fs.readFileSync('scratch/test3_results.json', 'utf8'));
console.log(JSON.stringify(t3, null, 2));

console.log("\n=== TEST 4 GSAP SCRUB ===");
const t4 = JSON.parse(fs.readFileSync('scratch/test4_results.json', 'utf8'));
console.log(JSON.stringify(t4, null, 2));

console.log("\n=== TEST 5 REGRESSION ===");
const t5 = JSON.parse(fs.readFileSync('scratch/test5_results.json', 'utf8'));
console.log("Total routes tested:", t5.routes.length);
console.log("All routes passed:", t5.routes.every(r => r.status === 200 || r.passed));
console.log("History working:", t5.historyWorking);
console.log("Horizontal overflow count:", t5.overflowChecks ? t5.overflowChecks.length : "N/A");

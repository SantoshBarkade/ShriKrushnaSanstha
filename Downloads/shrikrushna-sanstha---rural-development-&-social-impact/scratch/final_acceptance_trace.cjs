const { spawn } = require('child_process');
const fs = require('fs');

async function runFinalAcceptanceTrace() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9236',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9236/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Performance.enable');

  const finalTraceResults = {};

  // ==========================================
  // TEST 1: DESKTOP (1440x900) 1x CPU
  // ==========================================
  console.log('Testing Desktop 1x CPU scrolling & frame distribution...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 2000));

  const desktopScrollTrace = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      // Track Layout Shifts
      let cumulativeLayoutShift = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      // Track Long Tasks
      let longTasks = [];
      try {
        const taskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ duration: entry.duration, startTime: entry.startTime });
          }
        });
        taskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {}

      function step(now) {
        const delta = now - lastTime;
        lastTime = now;
        frameTimes.push(delta);

        if (scrollY < maxScroll) {
          scrollY += 40;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(step);
        } else {
          // Analyze frame distribution
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const p50 = sorted[Math.floor(sorted.length * 0.5)];
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const p99 = sorted[Math.floor(sorted.length * 0.99)];
          const avg = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          const longFrames = frameTimes.filter(t => t > 20);
          const severeDrops = frameTimes.filter(t => t > 33.3);

          resolve({
            totalFrames: frameTimes.length,
            avgFps: Number((1000 / avg).toFixed(1)),
            avgFrameTimeMs: Number(avg.toFixed(2)),
            minFrameTimeMs: Number(Math.min(...frameTimes).toFixed(2)),
            p50FrameTimeMs: Number(p50.toFixed(2)),
            p95FrameTimeMs: Number(p95.toFixed(2)),
            p99FrameTimeMs: Number(p99.toFixed(2)),
            maxFrameTimeMs: Number(Math.max(...frameTimes).toFixed(2)),
            framesExceeding20ms: longFrames.length,
            framesExceeding33ms: severeDrops.length,
            cumulativeLayoutShift: Number(cumulativeLayoutShift.toFixed(4)),
            longTasksCount: longTasks.length,
            longTasksDetails: longTasks
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  finalTraceResults.desktop1x = desktopScrollTrace.result.value;

  // ==========================================
  // TEST 2: MOBILE (390x844) 4x CPU THROTTLING
  // ==========================================
  console.log('Testing Mobile 390x844 with 4x CPU Throttling...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 2000));

  const mobileScrollTrace = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      let cumulativeLayoutShift = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      let longTasks = [];
      try {
        const taskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ duration: entry.duration, startTime: entry.startTime });
          }
        });
        taskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {}

      function step(now) {
        const delta = now - lastTime;
        lastTime = now;
        frameTimes.push(delta);

        if (scrollY < maxScroll) {
          scrollY += 45;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(step);
        } else {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const p50 = sorted[Math.floor(sorted.length * 0.5)];
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const p99 = sorted[Math.floor(sorted.length * 0.99)];
          const avg = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          const longFrames = frameTimes.filter(t => t > 20);
          const severeDrops = frameTimes.filter(t => t > 33.3);

          resolve({
            totalFrames: frameTimes.length,
            avgFps: Number((1000 / avg).toFixed(1)),
            avgFrameTimeMs: Number(avg.toFixed(2)),
            minFrameTimeMs: Number(Math.min(...frameTimes).toFixed(2)),
            p50FrameTimeMs: Number(p50.toFixed(2)),
            p95FrameTimeMs: Number(p95.toFixed(2)),
            p99FrameTimeMs: Number(p99.toFixed(2)),
            maxFrameTimeMs: Number(Math.max(...frameTimes).toFixed(2)),
            framesExceeding20ms: longFrames.length,
            framesExceeding33ms: severeDrops.length,
            cumulativeLayoutShift: Number(cumulativeLayoutShift.toFixed(4)),
            longTasksCount: longTasks.length,
            longTasksDetails: longTasks
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  finalTraceResults.mobile4x = mobileScrollTrace.result.value;

  // Reset CPU throttle
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // ==========================================
  // TEST 3: COUNT-UP ANIMATION VERIFICATION
  // ==========================================
  console.log('Verifying Count-Up Animation Output...');
  const countUpValues = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find stat numbers in the Stats section
      const statElements = Array.from(document.querySelectorAll('.font-serif.font-black'));
      return statElements.map(el => el.textContent.trim());
    })()`,
    returnByValue: true
  });
  finalTraceResults.countUpValues = countUpValues.result.value;

  // ==========================================
  // TEST 4: PREFERS-REDUCED-MOTION
  // ==========================================
  console.log('Verifying Prefers-Reduced-Motion Mode...');
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 800));

  const reducedMotionValues = await send('Runtime.evaluate', {
    expression: `(() => {
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const statElements = Array.from(document.querySelectorAll('.font-serif.font-black')).map(el => el.textContent.trim());
      return {
        mediaQueryMatched: isReduced,
        immediateValues: statElements
      };
    })()`,
    returnByValue: true
  });
  finalTraceResults.reducedMotion = reducedMotionValues.result.value;

  // ==========================================
  // TEST 5: IMAGES & OVERFLOW CHECK
  // ==========================================
  console.log('Verifying Image Loading and Horizontal Overflow...');
  const imagesAndOverflow = await send('Runtime.evaluate', {
    expression: `(() => {
      const allImgs = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        loaded: img.complete && img.naturalWidth > 0,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: img.clientWidth,
        renderedHeight: img.clientHeight
      }));
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      return {
        allImagesLoaded: allImgs.every(i => i.loaded),
        imagesCount: allImgs.length,
        images: allImgs,
        hasHorizontalOverflow: scrollW > clientW,
        scrollWidth: scrollW,
        clientWidth: clientW
      };
    })()`,
    returnByValue: true
  });
  finalTraceResults.imagesAndOverflow = imagesAndOverflow.result.value;

  console.log('\n--- FINAL ACCEPTANCE TRACE RESULTS ---');
  console.log(JSON.stringify(finalTraceResults, null, 2));
  fs.writeFileSync('scratch/final_acceptance_trace.json', JSON.stringify(finalTraceResults, null, 2));

  child.kill();
  process.exit(0);
}

runFinalAcceptanceTrace().catch((e) => {
  console.error(e);
  process.exit(1);
});

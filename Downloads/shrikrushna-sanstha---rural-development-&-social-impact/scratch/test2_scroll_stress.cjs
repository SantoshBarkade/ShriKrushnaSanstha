const { spawn } = require('child_process');
const fs = require('fs');

const ROUTES = [
  { id: 'home', hash: '#/home', name: 'Home' },
  { id: 'about', hash: '#/about', name: 'About' },
  { id: 'initiatives', hash: '#/initiatives', name: 'Initiatives' },
  { id: 'schemes', hash: '#/schemes', name: 'Schemes' },
  { id: 'gallery', hash: '#/gallery', name: 'Gallery' },
  { id: 'videos', hash: '#/videos', name: 'Videos' },
  { id: 'reports', hash: '#/reports', name: 'Reports' },
];

async function stressRoute(send, route, isReducedMotion = false) {
  console.log(`\n>>> Testing [${route.name}] | Motion: ${isReducedMotion ? 'REDUCED' : 'NORMAL'} <<<`);

  // Emulate reduced motion if requested
  if (isReducedMotion) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  } else {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
  }

  // Navigate to route
  await send('Page.navigate', { url: `http://localhost:4173/${route.hash}` });
  await new Promise((r) => setTimeout(r, 1200));

  // Initialize frame recorder and long task observer in page context
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.__stressData = {
        frames: [],
        longTasks: [],
        modalLatencyMs: null,
        active: true,
        startTime: performance.now()
      };

      let lastTime = performance.now();
      function onFrame(now) {
        if (!window.__stressData.active) return;
        const delta = now - lastTime;
        lastTime = now;
        window.__stressData.frames.push(delta);
        requestAnimationFrame(onFrame);
      }
      requestAnimationFrame(onFrame);

      try {
        const po = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            window.__stressData.longTasks.push({
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime)
            });
          }
        });
        po.observe({ type: 'longtask', buffered: true });
      } catch(e) {}
    })()`,
  });

  // Execute 3 scroll cycles
  // Cycle 1: Slow continuous scroll down and up
  console.log('  [Cycle 1] Slow continuous scroll...');
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      let pos = 0;
      // Scroll down
      while (pos < scrollMax) {
        pos = Math.min(scrollMax, pos + 90);
        window.scrollTo(0, pos);
        await new Promise(r => setTimeout(r, 20));
      }
      await new Promise(r => setTimeout(r, 100));
      // Scroll up
      while (pos > 0) {
        pos = Math.max(0, pos - 90);
        window.scrollTo(0, pos);
        await new Promise(r => setTimeout(r, 20));
      }
    })()`,
    awaitPromise: true,
  });

  // Cycle 2: Fast continuous scroll down and up
  console.log('  [Cycle 2] Fast scroll...');
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      let pos = 0;
      // Fast scroll down
      while (pos < scrollMax) {
        pos = Math.min(scrollMax, pos + 380);
        window.scrollTo(0, pos);
        await new Promise(r => setTimeout(r, 20));
      }
      await new Promise(r => setTimeout(r, 100));
      // Fast scroll up
      while (pos > 0) {
        pos = Math.max(0, pos - 380);
        window.scrollTo(0, pos);
        await new Promise(r => setTimeout(r, 20));
      }
    })()`,
    awaitPromise: true,
  });

  // Cycle 3: Repeated direction changes (zigzag scroll)
  console.log('  [Cycle 3] Direction reversals (zigzag scroll)...');
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      let pos = 0;
      const moves = [500, -250, 700, -350, 900, -400, scrollMax, -500, scrollMax, 0];
      for (const m of moves) {
        if (m === scrollMax) pos = scrollMax;
        else if (m === 0) pos = 0;
        else pos = Math.max(0, Math.min(scrollMax, pos + m));
        window.scrollTo({ top: pos, behavior: 'auto' });
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    })()`,
    awaitPromise: true,
  });

  // 3D Card Hover / Touch Stress
  console.log('  [Interaction] 3D cards hover / pointer stress...');
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const cards = document.querySelectorAll('.will-change-transform, [aria-label], button, a');
      const testCards = Array.from(cards).slice(0, 8);
      for (const el of testCards) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          for (let i = 0; i < 5; i++) {
            const x = rect.left + (rect.width * i) / 5;
            const y = rect.top + (rect.height * i) / 5;
            el.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
            await new Promise(r => setTimeout(r, 16));
          }
          el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
        }
      }
    })()`,
    awaitPromise: true,
  });

  // Modal / Lightbox Test if applicable
  console.log('  [Modal] Testing modal/lightbox open & close...');
  const modalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      // Find a clickable card that opens modal (e.g. gallery image, video item, or scheme/report button)
      const clickable = document.querySelector('[role="button"], button[aria-haspopup="dialog"], .cursor-pointer.group, [data-modal]');
      let openLatency = null;
      if (clickable) {
        const start = performance.now();
        clickable.click();
        // Wait up to 500ms for modal dialog
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 25));
          const dialog = document.querySelector('[role="dialog"], .fixed.inset-0, [aria-modal="true"]');
          if (dialog && window.getComputedStyle(dialog).display !== 'none') {
            openLatency = Math.round(performance.now() - start);
            // Click close button if found
            const closeBtn = dialog.querySelector('button[aria-label*="बंद"], button[aria-label*="close"], button svg, button');
            if (closeBtn) closeBtn.click();
            await new Promise(r => setTimeout(r, 150));
            break;
          }
        }
      }
      return openLatency;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  // Stop frame collection and retrieve stats
  const evalData = await send('Runtime.evaluate', {
    expression: `(() => {
      window.__stressData.active = false;
      const totalTime = performance.now() - window.__stressData.startTime;
      const rawFrames = window.__stressData.frames.slice(1); // skip initial bootstrap frame
      const frameCount = rawFrames.length;
      if (frameCount === 0) return { frameCount: 0 };

      let sum = 0;
      let slow25 = 0;
      let dropped33 = 0;
      let hitch50 = 0;
      let maxFrame = 0;

      for (const f of rawFrames) {
        sum += f;
        if (f > 25) slow25++;
        if (f > 33.3) dropped33++;
        if (f > 50) hitch50++;
        if (f > maxFrame) maxFrame = f;
      }

      const meanFrame = sum / frameCount;
      const sorted = [...rawFrames].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(frameCount * 0.95)] || 0;
      const p99 = sorted[Math.floor(frameCount * 0.99)] || 0;

      return {
        sampleDurationMs: Math.round(totalTime),
        frameCount,
        meanFrameMs: Number(meanFrame.toFixed(2)),
        fpsEstimate: Number((1000 / meanFrame).toFixed(1)),
        p95Ms: Number(p95.toFixed(2)),
        p99Ms: Number(p99.toFixed(2)),
        maxFrameHitchMs: Number(maxFrame.toFixed(2)),
        slowFrames25msCount: slow25,
        slowFrames25msPct: Number(((slow25 / frameCount) * 100).toFixed(2)),
        droppedFrames33msCount: dropped33,
        droppedFrames33msPct: Number(((dropped33 / frameCount) * 100).toFixed(2)),
        hitches50msCount: hitch50,
        longTasksCount: window.__stressData.longTasks.length,
        totalLongTaskMs: window.__stressData.longTasks.reduce((acc, t) => acc + t.duration, 0),
        maxLongTaskMs: window.__stressData.longTasks.reduce((m, t) => Math.max(m, t.duration), 0),
      };
    })()`,
    returnByValue: true,
  });

  const stats = evalData.result.value;
  stats.route = route.name;
  stats.routeId = route.id;
  stats.reducedMotion = isReducedMotion;
  stats.modalLatencyMs = modalRes.result?.value;

  console.log(`  -> Frames: ${stats.frameCount} over ${stats.sampleDurationMs}ms | Mean: ${stats.meanFrameMs}ms (~${stats.fpsEstimate} FPS)`);
  console.log(`  -> P95: ${stats.p95Ms}ms | P99: ${stats.p99Ms}ms | Max Hitch: ${stats.maxFrameHitchMs}ms`);
  console.log(`  -> Slow (>25ms): ${stats.slowFrames25msCount} (${stats.slowFrames25msPct}%) | Dropped (>33.3ms): ${stats.droppedFrames33msCount} (${stats.droppedFrames33msPct}%) | Hitches (>50ms): ${stats.hitches50msCount}`);
  console.log(`  -> Long Tasks during stress: ${stats.longTasksCount} (Total: ${stats.totalLongTaskMs}ms, Max: ${stats.maxLongTaskMs}ms)`);
  if (stats.modalLatencyMs !== null) console.log(`  -> Modal open latency: ${stats.modalLatencyMs}ms`);

  return stats;
}

async function runTest2() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9350;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1600));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('===============================================================');
    console.log('TEST 2: REAL SCROLL AND INTERACTION STRESS (7 KEY ROUTES)');
    console.log('Renderer: ANGLE Intel(R) Iris(R) Xe Graphics Direct3D11');
    console.log('===============================================================');

    const resultsNormal = [];
    for (const r of ROUTES) {
      const res = await stressRoute(send, r, false);
      resultsNormal.push(res);
    }

    console.log('\n===============================================================');
    console.log('TEST 2: REPEATING WITH PREFERS-REDUCED-MOTION: REDUCE');
    console.log('===============================================================');

    const resultsReduced = [];
    for (const r of ROUTES) {
      const res = await stressRoute(send, r, true);
      resultsReduced.push(res);
    }

    // Finally navigate back Home to test navigation roundtrip
    console.log('\n>>> Navigating back to Home from final route <<<');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 1500));
    const homeTitle = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    console.log(`Returned Home successfully: "${homeTitle.result?.value}"`);

    fs.writeFileSync(
      'scratch/test2_results.json',
      JSON.stringify({ normalMotion: resultsNormal, reducedMotion: resultsReduced }, null, 2)
    );
    console.log('\n>>> Successfully saved Test 2 results to scratch/test2_results.json');

    ws.close();
  } finally {
    child.kill();
  }
}

runTest2().catch(console.error);

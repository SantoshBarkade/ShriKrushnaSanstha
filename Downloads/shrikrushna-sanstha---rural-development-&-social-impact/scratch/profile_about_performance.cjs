const { spawn } = require('child_process');
const fs = require('fs');

async function profilePerformance() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9229/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Performance.enable');

  console.log('--- BASELINE PERFORMANCE PROFILING: ABOUT US PAGE ---');

  // Set desktop viewport 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to About page
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Initial Page Load Metrics
  const initialMetricsRaw = await send('Performance.getMetrics');
  const initialMetrics = {};
  for (const m of initialMetricsRaw.metrics) {
    initialMetrics[m.name] = m.value;
  }

  // 2. Evaluate in-page Core Web Vitals, DOM complexity, and CSS effects
  const pageDomAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find all backdrop-filter and blur elements
      const allElements = Array.from(document.querySelectorAll('*'));
      let backdropFilterCount = 0;
      let blurFilterCount = 0;
      let heavyShadowCount = 0;
      let willChangeCount = 0;

      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter !== 'none') backdropFilterCount++;
        if (style.filter && style.filter.includes('blur')) blurFilterCount++;
        if (style.boxShadow && (style.boxShadow.includes('25px') || style.boxShadow.includes('50px') || style.boxShadow.includes('rgba(0, 0, 0, 0.25)'))) heavyShadowCount++;
        if (style.willChange && style.willChange !== 'auto') willChangeCount++;
      });

      // Images audit
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        loading: img.loading,
        renderedWidth: img.clientWidth,
        renderedHeight: img.clientHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        hasExplicitAspect: !!img.getAttribute('class')?.includes('aspect-') || !!img.style.aspectRatio
      }));

      // In-page performance timings
      const navTiming = performance.getEntriesByType('navigation')[0] || {};
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

      return {
        domNodeCount: allElements.length,
        backdropFilterCount,
        blurFilterCount,
        heavyShadowCount,
        willChangeCount,
        images,
        fcp,
        navTiming: {
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
          loadComplete: navTiming.loadEventEnd - navTiming.startTime
        }
      };
    })()`,
    returnByValue: true
  });

  // 3. Scroll Profiling with FPS & Jitter test
  console.log('Running scroll performance test (Desktop 1x CPU)...');
  const scrollProfile1x = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      let isScrolling = true;

      function onFrame(time) {
        const delta = time - lastTime;
        lastTime = time;
        frameTimes.push(delta);

        if (scrollY < maxScroll) {
          scrollY += 45;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(onFrame);
        } else {
          // Analyze frame times
          const longFrames = frameTimes.filter(t => t > 20); // >20ms means dropped frame below 50fps
          const severeDrops = frameTimes.filter(t => t > 33.3); // >33.3ms drops below 30fps
          const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          resolve({
            totalFrames: frameTimes.length,
            avgFps: (1000 / avgFrameTime).toFixed(1),
            avgFrameTimeMs: avgFrameTime.toFixed(2),
            longFramesCount: longFrames.length,
            severeDropsCount: severeDrops.length,
            maxFrameTimeMs: Math.max(...frameTimes).toFixed(2)
          });
        }
      }
      requestAnimationFrame(onFrame);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  // 4. Scroll Profiling under 4x CPU Throttling (Simulate Mid-Range Mobile CPU)
  console.log('Running scroll performance test under 4x CPU Throttling...');
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 500));

  const scrollProfile4x = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      function onFrame(time) {
        const delta = time - lastTime;
        lastTime = time;
        frameTimes.push(delta);

        if (scrollY < maxScroll) {
          scrollY += 55;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(onFrame);
        } else {
          const longFrames = frameTimes.filter(t => t > 20);
          const severeDrops = frameTimes.filter(t => t > 33.3);
          const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          resolve({
            totalFrames: frameTimes.length,
            avgFps: (1000 / avgFrameTime).toFixed(1),
            avgFrameTimeMs: avgFrameTime.toFixed(2),
            longFramesCount: longFrames.length,
            severeDropsCount: severeDrops.length,
            maxFrameTimeMs: Math.max(...frameTimes).toFixed(2)
          });
        }
      }
      requestAnimationFrame(onFrame);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  // Reset CPU throttle
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // 5. Final Metrics After Scroll
  const finalMetricsRaw = await send('Performance.getMetrics');
  const finalMetrics = {};
  for (const m of finalMetricsRaw.metrics) {
    finalMetrics[m.name] = m.value;
  }

  const results = {
    initialMetrics: {
      JSHeapUsedSizeMB: (initialMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2),
      LayoutCount: initialMetrics.LayoutCount,
      RecalcStyleCount: initialMetrics.RecalcStyleCount,
      ScriptDurationSec: initialMetrics.ScriptDuration?.toFixed(3),
      LayoutDurationSec: initialMetrics.LayoutDuration?.toFixed(3),
      TaskDurationSec: initialMetrics.TaskDuration?.toFixed(3)
    },
    domAndCssAudit: pageDomAudit.result.value,
    scrollPerformanceDesktop1x: scrollProfile1x.result.value,
    scrollPerformanceMobile4x: scrollProfile4x.result.value,
    afterScrollMetrics: {
      JSHeapUsedSizeMB: (finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2),
      LayoutCountDelta: finalMetrics.LayoutCount - initialMetrics.LayoutCount,
      RecalcStyleCountDelta: finalMetrics.RecalcStyleCount - initialMetrics.RecalcStyleCount,
      ScriptDurationDeltaSec: (finalMetrics.ScriptDuration - initialMetrics.ScriptDuration)?.toFixed(3),
      LayoutDurationDeltaSec: (finalMetrics.LayoutDuration - initialMetrics.LayoutDuration)?.toFixed(3)
    }
  };

  console.log('Results:\n', JSON.stringify(results, null, 2));
  fs.writeFileSync('scratch/baseline_performance.json', JSON.stringify(results, null, 2));

  child.kill();
  process.exit(0);
}

profilePerformance().catch(err => {
  console.error(err);
  process.exit(1);
});

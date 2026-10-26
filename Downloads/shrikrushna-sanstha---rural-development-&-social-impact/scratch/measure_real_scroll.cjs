const { spawn } = require('child_process');
const fs = require('fs');

async function measureRealPerformance() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9303;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
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
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    // 1. Trace Homepage Scroll
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    // Install frame & long-task observer
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__perf = { longTasks: [], frameDeltas: [], totalScrollDelta: 0, layoutShifts: [] };
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              window.__perf.longTasks.push({ duration: Math.round(entry.duration), startTime: Math.round(entry.startTime) });
            }
          }).observe({ type: 'longtask', buffered: true });

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                window.__perf.layoutShifts.push(entry.value);
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch(e) {}

        let last = performance.now();
        window.__frameTracker = () => {
          const now = performance.now();
          window.__perf.frameDeltas.push(now - last);
          last = now;
          if (window.__tracking) requestAnimationFrame(window.__frameTracker);
        };
        window.__tracking = true;
        requestAnimationFrame(window.__frameTracker);
      })()`
    });

    // Perform smooth programmatic scrolling through Home
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const total = document.body.scrollHeight;
        const steps = 40;
        const step = total / steps;
        for (let i = 0; i <= steps; i++) {
          window.scrollTo(0, i * step);
          await new Promise(r => setTimeout(r, 25));
        }
      })()`,
      awaitPromise: true
    });

    const homeScrollStats = (
      await send('Runtime.evaluate', {
        expression: `(() => {
          window.__tracking = false;
          const deltas = window.__perf.frameDeltas.slice(5); // skip initial warm
          const totalFrames = deltas.length;
          const slowFrames = deltas.filter(d => d > 20).length; // >20ms is <50 FPS
          const droppedFrames = deltas.filter(d => d > 33.3).length; // >33ms is <30 FPS
          const avgDelta = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
          return {
            totalFrames,
            slowFrames,
            droppedFrames,
            avgFps: avgDelta > 0 ? Number((1000 / avgDelta).toFixed(1)) : 0,
            longTasksCount: window.__perf.longTasks.length,
            longTasks: window.__perf.longTasks,
            layoutShiftsCount: window.__perf.layoutShifts.length,
            totalCls: Number(window.__perf.layoutShifts.reduce((a, b) => a + b, 0).toFixed(4))
          };
        })()`,
        returnByValue: true
      })
    ).result.value;

    console.log('=== HOMEPAGE SCROLL PERFORMANCE ===');
    console.log(JSON.stringify(homeScrollStats, null, 2));

    // 2. Trace About Scroll
    await send('Page.navigate', { url: 'http://localhost:4173/#/about' });
    await new Promise((r) => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__perf = { longTasks: [], frameDeltas: [], layoutShifts: [] };
        let last = performance.now();
        window.__frameTracker = () => {
          const now = performance.now();
          window.__perf.frameDeltas.push(now - last);
          last = now;
          if (window.__tracking) requestAnimationFrame(window.__frameTracker);
        };
        window.__tracking = true;
        requestAnimationFrame(window.__frameTracker);
      })()`
    });

    await send('Runtime.evaluate', {
      expression: `(async () => {
        const total = document.body.scrollHeight;
        const steps = 30;
        const step = total / steps;
        for (let i = 0; i <= steps; i++) {
          window.scrollTo(0, i * step);
          await new Promise(r => setTimeout(r, 25));
        }
      })()`,
      awaitPromise: true
    });

    const aboutScrollStats = (
      await send('Runtime.evaluate', {
        expression: `(() => {
          window.__tracking = false;
          const deltas = window.__perf.frameDeltas.slice(5);
          const slowFrames = deltas.filter(d => d > 20).length;
          const droppedFrames = deltas.filter(d => d > 33.3).length;
          const avgDelta = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
          return {
            totalFrames: deltas.length,
            slowFrames,
            droppedFrames,
            avgFps: avgDelta > 0 ? Number((1000 / avgDelta).toFixed(1)) : 0
          };
        })()`,
        returnByValue: true
      })
    ).result.value;

    console.log('=== ABOUT SCROLL PERFORMANCE ===');
    console.log(JSON.stringify(aboutScrollStats, null, 2));

    // 3. Trace Initiatives Scroll
    await send('Page.navigate', { url: 'http://localhost:4173/#/initiatives' });
    await new Promise((r) => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__perf = { longTasks: [], frameDeltas: [], layoutShifts: [] };
        let last = performance.now();
        window.__frameTracker = () => {
          const now = performance.now();
          window.__perf.frameDeltas.push(now - last);
          last = now;
          if (window.__tracking) requestAnimationFrame(window.__frameTracker);
        };
        window.__tracking = true;
        requestAnimationFrame(window.__frameTracker);
      })()`
    });

    await send('Runtime.evaluate', {
      expression: `(async () => {
        const total = document.body.scrollHeight;
        const steps = 30;
        const step = total / steps;
        for (let i = 0; i <= steps; i++) {
          window.scrollTo(0, i * step);
          await new Promise(r => setTimeout(r, 25));
        }
      })()`,
      awaitPromise: true
    });

    const initiativesScrollStats = (
      await send('Runtime.evaluate', {
        expression: `(() => {
          window.__tracking = false;
          const deltas = window.__perf.frameDeltas.slice(5);
          const slowFrames = deltas.filter(d => d > 20).length;
          const droppedFrames = deltas.filter(d => d > 33.3).length;
          const avgDelta = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
          return {
            totalFrames: deltas.length,
            slowFrames,
            droppedFrames,
            avgFps: avgDelta > 0 ? Number((1000 / avgDelta).toFixed(1)) : 0
          };
        })()`,
        returnByValue: true
      })
    ).result.value;

    console.log('=== INITIATIVES SCROLL PERFORMANCE ===');
    console.log(JSON.stringify(initiativesScrollStats, null, 2));

    fs.writeFileSync(
      'scratch/scroll_baseline.json',
      JSON.stringify(
        {
          homeScrollStats,
          aboutScrollStats,
          initiativesScrollStats
        },
        null,
        2
      )
    );

    ws.close();
  } finally {
    child.kill();
  }
}

measureRealPerformance().catch(console.error);

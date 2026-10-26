const { spawn } = require('child_process');
const fs = require('fs');

async function profileHomeJank() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9390;
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
    await send('Profiler.enable');

    console.log('Navigating to http://localhost:4173/#/home...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    // Allow initial bundle load
    await new Promise((r) => setTimeout(r, 1200));

    // Start CPU Profiler during scrolling
    console.log('Starting CPU Profiler & Scroll Stress...');
    await send('Profiler.start');

    // Inject frame tracker and execute 3 scroll cycles
    const scrollEval = await send('Runtime.evaluate', {
      expression: `(async () => {
        const frames = [];
        let lastTime = performance.now();
        let active = true;
        function onFrame(now) {
          if (!active) return;
          frames.push(now - lastTime);
          lastTime = now;
          requestAnimationFrame(onFrame);
        }
        requestAnimationFrame(onFrame);

        // Long task observer
        const longTasks = [];
        try {
          const po = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              longTasks.push({
                name: entry.name,
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime)
              });
            }
          });
          po.observe({ type: 'longtask', buffered: true });
        } catch(e) {}

        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;

        // Cycle 1: Slow continuous scroll
        let pos = 0;
        while (pos < scrollMax) {
          pos = Math.min(scrollMax, pos + 90);
          window.scrollTo(0, pos);
          await new Promise(r => setTimeout(r, 20));
        }
        while (pos > 0) {
          pos = Math.max(0, pos - 90);
          window.scrollTo(0, pos);
          await new Promise(r => setTimeout(r, 20));
        }

        // Cycle 2: Fast scroll
        while (pos < scrollMax) {
          pos = Math.min(scrollMax, pos + 380);
          window.scrollTo(0, pos);
          await new Promise(r => setTimeout(r, 20));
        }
        while (pos > 0) {
          pos = Math.max(0, pos - 380);
          window.scrollTo(0, pos);
          await new Promise(r => setTimeout(r, 20));
        }

        // Cycle 3: Zigzag
        const moves = [500, -250, 700, -350, 900, -400, scrollMax, -500, scrollMax, 0];
        for (const m of moves) {
          if (m === scrollMax) pos = scrollMax;
          else if (m === 0) pos = 0;
          else pos = Math.max(0, Math.min(scrollMax, pos + m));
          window.scrollTo({ top: pos, behavior: 'auto' });
          await new Promise(r => setTimeout(r, 120));
        }

        active = false;
        return { frames, longTasks };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const profilerData = await send('Profiler.stop');
    console.log('CPU Profiler stopped.');

    const data = scrollEval.result.value;
    const rawFrames = (data.frames || []).slice(1);
    const count = rawFrames.length;
    let sum = 0, slow25 = 0, dropped33 = 0, hitches50 = 0, maxHitch = 0;
    for (const f of rawFrames) {
      sum += f;
      if (f > 25) slow25++;
      if (f > 33.3) dropped33++;
      if (f > 50) hitches50++;
      if (f > maxHitch) maxHitch = f;
    }
    const mean = sum / count;

    console.log('\n=== REPRODUCED HOME SCROLL STATS ===');
    console.log(`Frames: ${count} | Mean: ${mean.toFixed(2)}ms (~${(1000/mean).toFixed(1)} FPS)`);
    console.log(`Slow (>25ms): ${slow25} (${((slow25/count)*100).toFixed(2)}%) | Dropped (>33.3ms): ${dropped33} (${((dropped33/count)*100).toFixed(2)}%) | Hitches (>50ms): ${hitches50}`);
    console.log(`Max Hitch: ${maxHitch.toFixed(2)}ms`);
    console.log(`Long Tasks: ${data.longTasks.length} (Total: ${data.longTasks.reduce((a, b) => a + b.duration, 0)}ms, Max: ${Math.max(0, ...data.longTasks.map(t => t.duration))}ms)`);

    // Parse top CPU time consumers from profile
    const nodes = profilerData.profile.nodes || [];
    const samples = profilerData.profile.samples || [];
    const timeDeltas = profilerData.profile.timeDeltas || [];

    const hitCount = new Map();
    for (let i = 0; i < samples.length; i++) {
      const id = samples[i];
      const delta = timeDeltas[i] || 0;
      hitCount.set(id, (hitCount.get(id) || 0) + delta);
    }

    const nodeStats = nodes.map(n => ({
      id: n.id,
      functionName: n.callFrame.functionName || '(anonymous)',
      url: n.callFrame.url.split('/').pop().split('?')[0] || n.callFrame.url,
      lineNumber: n.callFrame.lineNumber,
      selfTimeMicrosec: hitCount.get(n.id) || 0,
    })).sort((a, b) => b.selfTimeMicrosec - a.selfTimeMicrosec).slice(0, 15);

    console.log('\n=== TOP 15 CPU FUNCTIONS DURING SCROLL ===');
    console.table(nodeStats.map(s => ({
      Function: s.functionName,
      File: s.url,
      Line: s.lineNumber,
      'Self Time (ms)': (s.selfTimeMicrosec / 1000).toFixed(2)
    })));

    fs.writeFileSync('scratch/home_scroll_profile.json', JSON.stringify({
      stats: { count, mean, slow25, dropped33, hitches50, maxHitch, longTasks: data.longTasks },
      topNodes: nodeStats,
      profile: profilerData.profile
    }, null, 2));

    ws.close();
  } finally {
    child.kill();
  }
}

profileHomeJank().catch(console.error);

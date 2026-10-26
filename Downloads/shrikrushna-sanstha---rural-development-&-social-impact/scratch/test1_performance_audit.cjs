const { spawn } = require('child_process');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'Desktop 1440', width: 1440, height: 900, isMobile: false, dpr: 1 },
  { name: 'Desktop 1280', width: 1280, height: 800, isMobile: false, dpr: 1 },
  { name: 'Mobile 390', width: 390, height: 844, isMobile: true, dpr: 3 },
  { name: 'Mobile 360', width: 360, height: 800, isMobile: true, dpr: 2 },
];

async function measureNavigation(send, ws, vp, isWarm) {
  // Navigate to about:blank first to completely reset the page context
  await send('Page.navigate', { url: 'about:blank' });
  await new Promise((r) => setTimeout(r, 400));

  await send('Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dpr,
    mobile: vp.isMobile,
  });

  if (!isWarm) {
    await send('Network.clearBrowserCache');
    await send('Network.clearBrowserCookies');
    await send('Network.setCacheDisabled', { cacheDisabled: false });
  } else {
    // Warm cache: ensure cache is enabled
    await send('Network.setCacheDisabled', { cacheDisabled: false });
  }

  const requests = new Map();
  const consoleLogs = [];
  const networkErrors = [];
  let navStart = 0;

  const onMsg = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Network.requestWillBeSent') {
      const p = msg.params;
      if (!navStart && p.type === 'Document') {
        navStart = p.timestamp;
      }
      requests.set(p.requestId, {
        requestId: p.requestId,
        url: p.request.url,
        filename: p.request.url.split('/').pop().split('?')[0] || p.request.url,
        type: p.type,
        initiator: p.initiator.type + (p.initiator.url ? ` (${p.initiator.url.split('/').pop()})` : ''),
        startTimeMs: navStart ? Math.round((p.timestamp - navStart) * 1000) : 0,
        endTimeMs: null,
        durationMs: null,
        status: null,
        transferSize: 0,
        decodedBodySize: 0,
      });
    } else if (msg.method === 'Network.responseReceived') {
      const p = msg.params;
      const req = requests.get(p.requestId);
      if (req) {
        req.status = p.response.status;
        req.mimeType = p.response.mimeType;
        if (p.response.fromDiskCache || p.response.fromPrefetchCache || p.response.fromServiceWorker) {
          req.fromCache = true;
        }
      }
    } else if (msg.method === 'Network.loadingFinished') {
      const p = msg.params;
      const req = requests.get(p.requestId);
      if (req) {
        req.endTimeMs = navStart ? Math.round((p.timestamp - navStart) * 1000) : 0;
        req.durationMs = req.endTimeMs - req.startTimeMs;
        req.transferSize = p.encodedDataLength || 0;
      }
    } else if (msg.method === 'Network.loadingFailed') {
      const p = msg.params;
      networkErrors.push({ url: requests.get(p.requestId)?.url || p.requestId, error: p.errorText });
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const p = msg.params;
      if (p.type === 'error' || p.type === 'warning') {
        consoleLogs.push({ type: p.type, text: p.args.map((a) => a.value || a.description || '').join(' ') });
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const p = msg.params;
      consoleLogs.push({ type: 'exception', text: p.exceptionDetails.text + (p.exceptionDetails.exception?.description || '') });
    }
  };

  ws.addEventListener('message', onMsg);

  // Navigate to target URL
  const targetUrl = 'http://localhost:4173/#/home';
  await send('Page.navigate', { url: targetUrl });

  // Wait 5200 ms to observe initial 5 seconds
  await new Promise((r) => setTimeout(r, 5200));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      return {
        dcl: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        metrics: window.__phase4Metrics || { fcp: 0, lcp: 0, lcpTag: '', cls: 0, longTasks: [] }
      };
    })()`,
    returnByValue: true,
  });

  const perfMetricsRes = await send('Performance.getMetrics');
  const metricsMap = {};
  if (perfMetricsRes && perfMetricsRes.metrics) {
    for (const m of perfMetricsRes.metrics) {
      metricsMap[m.name] = m.value;
    }
  }

  ws.removeEventListener('message', onMsg);

  const reqList = Array.from(requests.values());
  const jsReqs = reqList.filter((r) => r.type === 'Script' || r.url.endsWith('.js'));
  const fcpTime = evalRes.result?.value?.metrics?.fcp || 999999;

  let jsTransferBeforeFCP = 0;
  let jsTransfer5s = 0;
  for (const r of jsReqs) {
    if (r.startTimeMs <= fcpTime) {
      jsTransferBeforeFCP += r.transferSize;
    }
    jsTransfer5s += r.transferSize;
  }

  const threeReq = jsReqs.find((r) => r.url.includes('three') || r.url.includes('MaharashtraCanvas'));
  const gsapReq = jsReqs.find((r) => r.url.includes('gsap'));

  const longTasks = evalRes.result?.value?.metrics?.longTasks || [];

  return {
    viewport: vp.name,
    cache: isWarm ? 'warm' : 'cold',
    dcl: evalRes.result?.value?.dcl || 0,
    load: evalRes.result?.value?.load || 0,
    fcp: evalRes.result?.value?.metrics?.fcp || 0,
    lcp: evalRes.result?.value?.metrics?.lcp || 0,
    lcpTag: evalRes.result?.value?.metrics?.lcpTag || '',
    cls: Number((evalRes.result?.value?.metrics?.cls || 0).toFixed(4)),
    longTasksCount: longTasks.length,
    longTasks,
    totalLongTaskDurationMs: longTasks.reduce((acc, t) => acc + t.duration, 0),
    maxLongTaskDurationMs: longTasks.reduce((max, t) => Math.max(max, t.duration), 0),
    jsFilesCount: jsReqs.length,
    jsTransferBeforeFCP_kB: Number((jsTransferBeforeFCP / 1024).toFixed(2)),
    jsTransfer5s_kB: Number((jsTransfer5s / 1024).toFixed(2)),
    threeReq: threeReq ? {
      filename: threeReq.filename,
      startTimeMs: threeReq.startTimeMs,
      durationMs: threeReq.durationMs,
      transferSize: threeReq.transferSize,
      initiator: threeReq.initiator,
    } : null,
    gsapReq: gsapReq ? {
      filename: gsapReq.filename,
      startTimeMs: gsapReq.startTimeMs,
      durationMs: gsapReq.durationMs,
      transferSize: gsapReq.transferSize,
      initiator: gsapReq.initiator,
    } : null,
    cdpMetrics: {
      jsHeapUsedMB: Number(((metricsMap.JSHeapUsedSize || 0) / 1048576).toFixed(2)),
      taskDurationSec: Number((metricsMap.TaskDuration || 0).toFixed(3)),
      layoutDurationSec: Number((metricsMap.LayoutDuration || 0).toFixed(3)),
      recalcStyleDurationSec: Number((metricsMap.RecalcStyleDuration || 0).toFixed(3)),
      scriptDurationSec: Number((metricsMap.ScriptDuration || 0).toFixed(3)),
    },
    consoleErrors: consoleLogs,
    networkErrors,
  };
}

async function runTest1() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9310;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1600));
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

    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Performance.enable');

    // Add script once on new document
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__phase4Metrics = {
          fcp: 0,
          lcp: 0,
          lcpTag: '',
          cls: 0,
          longTasks: []
        };
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                window.__phase4Metrics.fcp = Math.round(entry.startTime);
              }
            }
          }).observe({ type: 'paint', buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__phase4Metrics.lcp = Math.round(entry.renderTime || entry.loadTime || entry.startTime);
              window.__phase4Metrics.lcpTag = entry.element ? entry.element.tagName : '';
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                window.__phase4Metrics.cls += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__phase4Metrics.longTasks.push({
                name: entry.name,
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime)
              });
            }
          }).observe({ type: 'longtask', buffered: true });
        } catch (e) {}
      `,
    });

    // Check hardware renderer
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 1000));

    const rendererEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return { webgl: false };
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        return {
          webgl: true,
          vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        };
      })()`,
      returnByValue: true,
    });
    console.log('=== GPU / HARDWARE RENDERER DETAILS ===');
    console.log(JSON.stringify(rendererEval.result.value, null, 2));

    const sessions = [];

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`Viewport: ${vp.name} (${vp.width}x${vp.height}, dpr=${vp.dpr})`);
      console.log(`========================================`);

      // 1. Cold Session
      console.log(`[1] Running COLD-CACHE session...`);
      const cold = await measureNavigation(send, ws, vp, false);
      sessions.push(cold);
      console.log(`  -> FCP: ${cold.fcp}ms | LCP: ${cold.lcp}ms (${cold.lcpTag}) | CLS: ${cold.cls}`);
      console.log(`  -> LongTasks (>50ms): ${cold.longTasksCount} (Total: ${cold.totalLongTaskDurationMs}ms, Max: ${cold.maxLongTaskDurationMs}ms)`);
      console.log(`  -> JS before FCP: ${cold.jsTransferBeforeFCP_kB} kB | JS in 5s: ${cold.jsTransfer5s_kB} kB (${cold.jsFilesCount} files)`);
      if (cold.threeReq) console.log(`  -> Three.js: start ${cold.threeReq.startTimeMs}ms, dur ${cold.threeReq.durationMs}ms, ${cold.threeReq.transferSize}B [${cold.threeReq.filename}]`);
      else console.log(`  -> Three.js: NOT REQUESTED (Mobile / Deferral in effect)`);
      if (cold.gsapReq) console.log(`  -> GSAP: start ${cold.gsapReq.startTimeMs}ms, dur ${cold.gsapReq.durationMs}ms, ${cold.gsapReq.transferSize}B [${cold.gsapReq.filename}]`);
      else console.log(`  -> GSAP: NOT REQUESTED`);

      // 2. Warm Session (Immediate second navigation with cache preserved)
      console.log(`[2] Running WARM-CACHE session...`);
      const warm = await measureNavigation(send, ws, vp, true);
      sessions.push(warm);
      console.log(`  -> FCP: ${warm.fcp}ms | LCP: ${warm.lcp}ms (${warm.lcpTag}) | CLS: ${warm.cls}`);
      console.log(`  -> LongTasks (>50ms): ${warm.longTasksCount} (Total: ${warm.totalLongTaskDurationMs}ms, Max: ${warm.maxLongTaskDurationMs}ms)`);
      console.log(`  -> JS before FCP: ${warm.jsTransferBeforeFCP_kB} kB | JS in 5s: ${warm.jsTransfer5s_kB} kB (${warm.jsFilesCount} files)`);
      if (warm.threeReq) console.log(`  -> Three.js: start ${warm.threeReq.startTimeMs}ms, dur ${warm.threeReq.durationMs}ms, ${warm.threeReq.transferSize}B`);
      if (warm.gsapReq) console.log(`  -> GSAP: start ${warm.gsapReq.startTimeMs}ms, dur ${warm.gsapReq.durationMs}ms, ${warm.gsapReq.transferSize}B`);
    }

    fs.writeFileSync('scratch/test1_results.json', JSON.stringify({ renderer: rendererEval.result.value, sessions }, null, 2));
    console.log('\n>>> Successfully saved Test 1 report to scratch/test1_results.json');
    ws.close();
  } finally {
    child.kill();
  }
}

runTest1().catch(console.error);

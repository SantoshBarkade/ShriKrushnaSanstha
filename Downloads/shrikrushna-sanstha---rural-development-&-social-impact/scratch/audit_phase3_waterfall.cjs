const { spawn } = require('child_process');

async function auditWaterfall() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9301;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
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

    const requests = new Map();
    let navStart = 0;

    ws.addEventListener('message', (e) => {
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
          decodedBodySize: 0
        });
      } else if (msg.method === 'Network.responseReceived') {
        const p = msg.params;
        const req = requests.get(p.requestId);
        if (req) {
          req.status = p.response.status;
          req.mimeType = p.response.mimeType;
        }
      } else if (msg.method === 'Network.loadingFinished') {
        const p = msg.params;
        const req = requests.get(p.requestId);
        if (req) {
          req.endTimeMs = navStart ? Math.round((p.timestamp - navStart) * 1000) : 0;
          req.durationMs = req.endTimeMs - req.startTimeMs;
          req.transferSize = p.encodedDataLength || 0;
        }
      } else if (msg.method === 'Network.dataReceived') {
        const p = msg.params;
        const req = requests.get(p.requestId);
        if (req) {
          req.decodedBodySize = (req.decodedBodySize || 0) + (p.dataLength || 0);
        }
      }
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');

    // Clear browser cache and cookies
    await send('Network.clearBrowserCache');
    await send('Network.clearBrowserCookies');

    // Add script to capture LCP and FCP
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__metrics = { fcp: 0, lcp: 0, lcpTag: '' };
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                window.__metrics.fcp = Math.round(entry.startTime);
              }
            }
          }).observe({ type: 'paint', buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__metrics.lcp = Math.round(entry.renderTime || entry.loadTime || entry.startTime);
              window.__metrics.lcpTag = entry.element ? entry.element.tagName : '';
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch(e) {}
      `
    });

    console.log('Navigating to http://localhost:4173/#/home...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });

    // Wait 3.5 seconds for all initial requests to finish
    await new Promise((r) => setTimeout(r, 3500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        return {
          dcl: Math.round(nav.domContentLoadedEventEnd || 0),
          load: Math.round(nav.loadEventEnd || 0),
          metrics: window.__metrics
        };
      })()`,
      returnByValue: true
    });

    const pageTimings = evalRes.result.value;

    const listReqs = Array.from(requests.values());

    console.log('=== PAGE LIFECYCLE TIMINGS ===');
    console.log(`DCL: ${pageTimings.dcl} ms | Load: ${pageTimings.load} ms | FCP: ${pageTimings.metrics.fcp} ms | LCP: ${pageTimings.metrics.lcp} ms (${pageTimings.metrics.lcpTag})`);

    console.log('\n=== COMPLETE NETWORK WATERFALL (Initial Home Load) ===');
    console.table(
      listReqs.map((r) => ({
        File: r.filename,
        Type: r.type,
        'Start (ms)': r.startTimeMs,
        'End (ms)': r.endTimeMs,
        'Duration (ms)': r.durationMs,
        'Transfer (Bytes)': r.transferSize,
        'Decoded (Bytes)': r.decodedBodySize,
        Initiator: r.initiator
      }))
    );

    // Filter specifically for JS files
    const jsReqs = listReqs.filter((r) => r.type === 'Script' || r.url.endsWith('.js'));
    let totalJsTransfer = 0;
    let totalJsDecoded = 0;
    for (const r of jsReqs) {
      totalJsTransfer += r.transferSize;
      totalJsDecoded += r.decodedBodySize;
    }

    console.log('\n=== JAVASCRIPT SUMMARY ===');
    console.log(`Total JS Files: ${jsReqs.length}`);
    console.log(`Total JS Transferred: ${(totalJsTransfer / 1024).toFixed(2)} kB (${totalJsTransfer} bytes)`);
    console.log(`Total JS Decoded / Uncompressed: ${(totalJsDecoded / 1024).toFixed(2)} kB (${totalJsDecoded} bytes)`);

    const fs = require('fs');
    fs.writeFileSync('scratch/waterfall_baseline.json', JSON.stringify({ pageTimings, requests: listReqs, jsSummary: { totalJsTransfer, totalJsDecoded, jsReqs } }, null, 2));

    ws.close();
  } finally {
    child.kill();
  }
}

auditWaterfall().catch(console.error);

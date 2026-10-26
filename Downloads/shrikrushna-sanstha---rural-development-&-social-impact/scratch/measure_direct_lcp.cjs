const { spawn } = require('child_process');

async function testDirect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9297;
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

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__lcp = 0;
        window.__lcpTag = '';
        window.__cls = 0;
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__lcp = Math.round(entry.renderTime || entry.loadTime || entry.startTime);
              window.__lcpTag = entry.element ? (entry.element.tagName + (entry.element.className ? '.' + entry.element.className.slice(0, 20) : '')) : '';
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                window.__cls += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch(e) {}
      `
    });

    const routes = [
      '#/home',
      '#/about',
      '#/initiatives',
      '#/schemes',
      '#/gallery',
      '#/videos',
      '#/reports',
      '#/news',
      '#/contact',
      '#/volunteer',
      '#/admin'
    ];

    const results = {};

    for (const r of routes) {
      // Direct navigation per route (reloading fresh page document for authentic route metrics)
      await send('Page.navigate', { url: `http://localhost:4173/${r}` });
      await new Promise((res) => setTimeout(res, 2500));

      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          return {
            lcpMs: window.__lcp || 0,
            lcpTag: window.__lcpTag || 'N/A',
            clsScore: Number((window.__cls || 0).toFixed(4)),
            dclMs: Math.round(nav.domContentLoadedEventEnd || 0),
            loadMs: Math.round(nav.loadEventEnd || 0)
          };
        })()`,
        returnByValue: true
      });
      results[r] = evalRes.result.value;
    }

    console.log('MEASURED DIRECT RESULTS:');
    console.log(JSON.stringify(results, null, 2));
    ws.close();
  } finally {
    child.kill();
  }
}

testDirect().catch(console.error);

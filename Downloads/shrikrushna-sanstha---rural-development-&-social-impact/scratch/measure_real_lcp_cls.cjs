const { spawn } = require('child_process');

async function measureLcpCls() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9295;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
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
    await send('Network.enable');

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
      await send('Page.navigate', { url: `http://localhost:4173/${r}` });
      await new Promise(res => setTimeout(res, 2000));

      const v = await send('Runtime.evaluate', {
        expression: `(() => {
          let lcp = 0;
          let lcpElement = '';
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            const last = lcpEntries[lcpEntries.length - 1];
            lcp = Math.round(last.renderTime || last.loadTime || last.startTime);
            lcpElement = last.element?.tagName || '';
          }

          let cls = 0;
          const clsEntries = performance.getEntriesByType('layout-shift');
          for (const entry of clsEntries) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }

          const nav = performance.getEntriesByType('navigation')[0] || {};
          const dcl = Math.round(nav.domContentLoadedEventEnd || 0);
          const load = Math.round(nav.loadEventEnd || 0);

          return {
            lcpMs: lcp,
            lcpTag: lcpElement,
            clsScore: Number(cls.toFixed(4)),
            dclMs: dcl,
            loadMs: load
          };
        })()`,
        returnByValue: true
      });

      results[r] = v.result.value;
    }

    console.log('REAL PRODUCTION LCP / CLS / DCL RESULTS:');
    console.log(JSON.stringify(results, null, 2));

    ws.close();
  } finally {
    child.kill();
  }
}

measureLcpCls().catch(console.error);

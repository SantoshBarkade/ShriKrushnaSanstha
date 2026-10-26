const { spawn } = require('child_process');
const fs = require('fs');

async function measureBaseline() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9245;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    if (!target) throw new Error('No page target found');

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
    await send('Network.enable');
    await send('Performance.enable');

    const routes = [
      { name: 'home', hash: '#/home' },
      { name: 'about', hash: '#/about' },
      { name: 'gallery', hash: '#/gallery' },
      { name: 'reports', hash: '#/reports' },
      { name: 'contact', hash: '#/contact' },
      { name: 'schemes', hash: '#/schemes' }
    ];

    const results = {};

    for (const route of routes) {
      console.log(`Measuring route: ${route.hash}`);
      await send('Page.navigate', { url: `http://localhost:5173/${route.hash}` });
      await new Promise((r) => setTimeout(r, 2000));

      const evalMetrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const resources = performance.getEntriesByType('resource');
          const totalTransferSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0) + (nav.transferSize || 0);
          const jsResources = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
          const jsTransferSize = jsResources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
          
          return {
            loadEventEnd: nav.loadEventEnd || 0,
            domContentLoadedEventEnd: nav.domContentLoadedEventEnd || 0,
            domInteractive: nav.domInteractive || 0,
            resourceCount: resources.length,
            totalTransferSize,
            jsResourceCount: jsResources.length,
            jsTransferSize,
            jsFiles: jsResources.map(r => ({ name: r.name.split('/').pop(), size: r.transferSize || 0 }))
          };
        })()`,
        returnByValue: true
      });

      const perfMetrics = await send('Performance.getMetrics');
      const metricsObj = {};
      if (perfMetrics && perfMetrics.metrics) {
        for (const m of perfMetrics.metrics) {
          metricsObj[m.name] = m.value;
        }
      }

      results[route.name] = {
        route: route.hash,
        timing: evalMetrics.result ? evalMetrics.result.value : null,
        domNodes: metricsObj.Nodes || 0,
        jsHeapUsedSize: metricsObj.JSHeapUsedSize || 0,
        jsHeapTotalSize: metricsObj.JSHeapTotalSize || 0,
        layoutCount: metricsObj.LayoutCount || 0,
        recalcStyleCount: metricsObj.RecalcStyleCount || 0
      };
    }

    fs.writeFileSync('scratch/performance_baseline_pre_optimization.json', JSON.stringify(results, null, 2));
    console.log('Saved scratch/performance_baseline_pre_optimization.json');

    ws.close();
  } finally {
    child.kill();
  }
}

measureBaseline().catch(err => {
  console.error('Measurement error:', err);
  process.exit(1);
});

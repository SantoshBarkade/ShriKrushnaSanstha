const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function measurePostOptimization() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9250;
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

    const consoleErrors = [];
    const networkErrors = [];

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Network.responseReceived') {
        const res = msg.params.response;
        // Ignore expected/intentional 401/404 test mocks
        if (res.status >= 400 && !res.url.includes('favicon')) {
          networkErrors.push({ status: res.status, url: res.url });
        }
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Performance.enable');

    const allRoutes = [
      { name: 'home', hash: '#/home' },
      { name: 'about', hash: '#/about' },
      { name: 'officials', hash: '#/officials' },
      { name: 'initiatives', hash: '#/initiatives' },
      { name: 'work', hash: '#/work' },
      { name: 'schemes', hash: '#/schemes' },
      { name: 'gallery', hash: '#/gallery' },
      { name: 'videos', hash: '#/videos' },
      { name: 'reports', hash: '#/reports' },
      { name: 'news', hash: '#/news' },
      { name: 'volunteer', hash: '#/volunteer' },
      { name: 'contact', hash: '#/contact' },
      { name: 'privacy', hash: '#/privacy' },
      { name: 'terms', hash: '#/terms' },
      { name: 'sitemap', hash: '#/sitemap' },
      { name: 'admin', hash: '#/admin' }
    ];

    const results = {};

    for (const route of allRoutes) {
      console.log(`[Testing Route] ${route.hash}`);
      await send('Page.navigate', { url: `http://localhost:5173/${route.hash}` });
      await new Promise((r) => setTimeout(r, 1600));

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
            headingText: document.querySelector('h1, h2')?.innerText || '',
            bodyTextLength: document.body.innerText.length
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
        metrics: evalMetrics.result ? evalMetrics.result.value : null,
        domNodes: metricsObj.Nodes || 0,
        jsHeapUsedSize: metricsObj.JSHeapUsedSize || 0,
        jsHeapTotalSize: metricsObj.JSHeapTotalSize || 0,
        layoutCount: metricsObj.LayoutCount || 0,
        recalcStyleCount: metricsObj.RecalcStyleCount || 0
      };
    }

    // Now test responsive viewports on Home & About
    console.log('[Testing Viewports]');
    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900, isMobile: false },
      { name: 'tablet_768', width: 768, height: 1024, isMobile: true },
      { name: 'mobile_390', width: 390, height: 844, isMobile: true }
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.isMobile
      });

      await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
      await new Promise((r) => setTimeout(r, 1500));

      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });

      const shotPath = path.join(ARTIFACT_DIR, `perf_verified_home_${vp.name}.png`);
      fs.writeFileSync(shotPath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved screenshot: ${shotPath}`);
    }

    results.errors = {
      consoleErrors,
      networkErrors
    };

    fs.writeFileSync('scratch/performance_verification_post_optimization.json', JSON.stringify(results, null, 2));
    console.log('Saved scratch/performance_verification_post_optimization.json');

    ws.close();
  } finally {
    child.kill();
  }
}

measurePostOptimization().catch((err) => {
  console.error('Post optimization verification error:', err);
  process.exit(1);
});

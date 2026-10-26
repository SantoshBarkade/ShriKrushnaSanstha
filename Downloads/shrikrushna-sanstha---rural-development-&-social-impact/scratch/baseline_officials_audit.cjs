const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function baselineOfficialsAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9237',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9237/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Performance.enable');

  console.log('--- BASELINE OFFICIALS PAGE AUDIT ---');

  // Viewport captures
  const viewports = [
    { name: 'officials_baseline_1440.png', width: 1440, height: 900, mobile: false },
    { name: 'officials_baseline_768.png', width: 768, height: 1024, mobile: true },
    { name: 'officials_baseline_390.png', width: 390, height: 844, mobile: true }
  ];

  const auditData = {
    viewports: [],
    scrollMetrics: null
  };

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });
    await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const outPath = path.join(ARTIFACTS_DIR, vp.name);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));

    const evalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const cardsCount = document.querySelectorAll('.grid > div').length;
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';
        return {
          name: '${vp.name}',
          scrollWidth: scrollW,
          clientWidth: clientW,
          hasHorizontalOverflow: scrollW > clientW,
          cardsCount,
          h1
        };
      })()`,
      returnByValue: true
    });
    auditData.viewports.push(evalData.result.value);
  }

  // Measure scroll frame-time on desktop
  console.log('Measuring desktop scroll performance...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise((r) => setTimeout(r, 1500));

  const scrollEval = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      function step(now) {
        const delta = now - lastTime;
        lastTime = now;
        frameTimes.push(delta);

        if (scrollY < maxScroll && maxScroll > 0) {
          scrollY += 40;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(step);
        } else {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          resolve({
            totalFrames: frameTimes.length,
            avgFps: Number((1000 / avg).toFixed(1)),
            avgFrameTimeMs: Number(avg.toFixed(2)),
            minFrameTimeMs: Number(Math.min(...frameTimes).toFixed(2)),
            maxFrameTimeMs: Number(Math.max(...frameTimes).toFixed(2))
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  auditData.scrollMetrics = scrollEval.result.value;

  console.log('Baseline Audit Results:\n', JSON.stringify(auditData, null, 2));
  fs.writeFileSync('scratch/officials_baseline_audit.json', JSON.stringify(auditData, null, 2));

  child.kill();
  process.exit(0);
}

baselineOfficialsAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});

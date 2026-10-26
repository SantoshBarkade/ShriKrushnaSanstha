const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function baselineInitiativesAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9238',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9238/json').then((r) => r.json());
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

  console.log('--- BASELINE INITIATIVES AUDIT ---');

  // Viewport captures
  const viewports = [
    { name: 'initiatives_baseline_1440.png', width: 1440, height: 900, mobile: false },
    { name: 'initiatives_baseline_768.png', width: 768, height: 1024, mobile: true },
    { name: 'initiatives_baseline_390.png', width: 390, height: 844, mobile: true }
  ];

  const auditData = {
    viewports: [],
    initiativesList: [],
    categories: []
  };

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${vp.name}`);

    // Check overflow & element counts
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth,
          cardsCount: document.querySelectorAll('.grid > div').length,
          filterButtons: Array.from(document.querySelectorAll('button')).filter(b => b.textContent && !b.querySelector('svg')).map(b => b.textContent.trim())
        };
      })()`,
      returnByValue: true
    });

    auditData.viewports.push({
      viewport: vp.name,
      ...evalRes.value
    });
  }

  // Inspect page DOM and React initiatives data
  const inspectRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return cards.map(c => {
        const title = c.querySelector('h3')?.textContent?.trim() || '';
        const category = c.querySelector('span')?.textContent?.trim() || '';
        const summary = c.querySelector('p')?.textContent?.trim() || '';
        const img = c.querySelector('img')?.src || '';
        return { title, category, summary, img };
      });
    })()`,
    returnByValue: true
  });
  auditData.initiativesList = inspectRes.value;

  // Baseline performance check
  console.log('Running baseline performance scroll trace...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  const perfEval = await send('Runtime.evaluate', {
    expression: `(async () => {
      let frames = [];
      let lastTime = performance.now();
      let animId;
      function record(t) {
        frames.push(t - lastTime);
        lastTime = t;
        animId = requestAnimationFrame(record);
      }
      animId = requestAnimationFrame(record);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      for (let i = steps; i >= 0; i--) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      cancelAnimationFrame(animId);

      const frameTimes = frames.slice(2);
      const totalTime = frameTimes.reduce((a, b) => a + b, 0);
      const avgFrameTime = totalTime / frameTimes.length;
      const avgFps = 1000 / avgFrameTime;
      const longFrames = frameTimes.filter(f => f > 20).length;

      return {
        totalFrames: frameTimes.length,
        avgFps: Math.round(avgFps * 10) / 10,
        avgFrameTimeMs: Math.round(avgFrameTime * 100) / 100,
        longFramesCount: longFrames
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  auditData.baselinePerf = perfEval.value;
  console.log('Baseline Performance:', auditData.baselinePerf);

  fs.writeFileSync('scratch/initiatives_baseline_audit.json', JSON.stringify(auditData, null, 2));
  console.log('Baseline audit saved to scratch/initiatives_baseline_audit.json');

  ws.close();
  child.kill();
}

baselineInitiativesAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

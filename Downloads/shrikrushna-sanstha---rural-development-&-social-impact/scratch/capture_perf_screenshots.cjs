const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function captureScreenshots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9235/json').then(r => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === cur) { ws.removeEventListener('message', h); res(msg.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const configs = [
    { name: 'about_perf_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'about_perf_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'about_perf_390_mobile.png', width: 390, height: 844, mobile: true }
  ];

  for (const cfg of configs) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: cfg.width,
      height: cfg.height,
      deviceScaleFactor: 2,
      mobile: cfg.mobile
    });
    await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to stats to ensure counter has settled
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 500)' });
    await new Promise(r => setTimeout(r, 1200));

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const outPath = path.join(ARTIFACTS_DIR, cfg.name);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved:', outPath);
  }

  child.kill();
  process.exit(0);
}

captureScreenshots().catch(e => { console.error(e); process.exit(1); });

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function captureBaselines() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9267',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);

  await new Promise((r) => setTimeout(r, 2200));

  let list = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      list = await fetch('http://127.0.0.1:9267/json').then((r) => r.json());
      if (list && list.length) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

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

  console.log('Capturing Gallery baselines...');
  const viewports = [
    { name: 'gallery_baseline_1440.png', w: 1440, h: 900, m: false },
    { name: 'gallery_baseline_1280.png', w: 1280, h: 800, m: false },
    { name: 'gallery_baseline_768.png', w: 768, h: 1024, m: true },
    { name: 'gallery_baseline_390.png', w: 390, h: 844, m: true },
    { name: 'gallery_baseline_360.png', w: 360, h: 640, m: true }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.m
    });
    await new Promise((r) => setTimeout(r, 500));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    console.log(`Captured: ${vp.name}`);
  }

  // Navigate to #/videos
  console.log('Navigating to #/videos and capturing baselines...');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/videos'` });
  await new Promise((r) => setTimeout(r, 1200));

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 500));
  const v1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'videos_baseline_1440.png'), Buffer.from(v1440.data, 'base64'));
  console.log('Captured: videos_baseline_1440.png');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 500));
  const v390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'videos_baseline_390.png'), Buffer.from(v390.data, 'base64'));
  console.log('Captured: videos_baseline_390.png');

  ws.close();
  child.kill();
  console.log('Baselines captured successfully.');
}

captureBaselines().catch(console.error);

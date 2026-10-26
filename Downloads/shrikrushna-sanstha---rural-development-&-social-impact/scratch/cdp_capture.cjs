const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const dir = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

const targets = [
  { name: 'desktop_1440.png', w: 1440, h: 2900, mobile: false },
  { name: 'tablet_768.png',    w: 768,  h: 3400, mobile: true },
  { name: 'mobile_390.png',    w: 390,  h: 4200, mobile: true },
  { name: 'mobile_360.png',    w: 360,  h: 4400, mobile: true }
];

async function captureAll() {
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--hide-scrollbars',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

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
  await send('DOM.enable');

  for (const target of targets) {
    console.log(`Setting device metrics for ${target.name}: ${target.w}x${target.h}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: target.w,
      height: target.h,
      deviceScaleFactor: 1,
      mobile: target.mobile
    });

    // Wait a brief moment for layout settling & animations
    await new Promise(r => setTimeout(r, 1200));

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const outPath = path.join(dir, target.name);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved ${target.name} (${fs.statSync(outPath).size} bytes)`);
  }

  ws.close();
  child.kill();
  console.log('All viewports captured with true device emulation!');
}

captureAll().catch(console.error);

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function capture() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9243',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9243/json').then(r => r.json());
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise(resolve => {
    const cur = id++;
    const handler = evt => {
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
  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture initiatives baseline across 3 viewports
  const viewports = [
    { name: 'initiatives_baseline_1440.png', width: 1440, height: 900, mobile: false },
    { name: 'initiatives_baseline_768.png', width: 768, height: 1024, mobile: true },
    { name: 'initiatives_baseline_390.png', width: 390, height: 844, mobile: true }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise(r => setTimeout(r, 500));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    console.log('Saved baseline:', vp.name);
  }

  // 2. Also capture work baseline for reference
  await send('Page.navigate', { url: 'http://localhost:5173/#/work' });
  await new Promise(r => setTimeout(r, 1000));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const workShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'work_baseline_1440.png'), Buffer.from(workShot.data, 'base64'));
  console.log('Saved baseline: work_baseline_1440.png');

  ws.close();
  child.kill();
}
capture().catch(console.error);

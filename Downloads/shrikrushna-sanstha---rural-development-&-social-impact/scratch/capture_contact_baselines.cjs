const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function captureBaselines() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9258',
    '--disable-gpu',
    'http://localhost:5173/#/contact'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9258/json').then((r) => r.json());
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
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- CAPTURING CONTACT BASELINE SCREENSHOTS ---');

  const viewports = [
    { name: 'contact_baseline_1440.png', width: 1440, height: 900, mobile: false },
    { name: 'contact_baseline_1280.png', width: 1280, height: 800, mobile: false },
    { name: 'contact_baseline_768.png', width: 768, height: 1024, mobile: true },
    { name: 'contact_baseline_390.png', width: 390, height: 844, mobile: true },
    { name: 'contact_baseline_360.png', width: 360, height: 640, mobile: true }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    console.log(`Saved baseline: ${vp.name}`);
  }

  // Inspect contactInfo loaded in browser
  const infoRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const text = document.body.innerText;
      return {
        h1,
        containsNadarpur: text.includes('नादपूर') || text.includes('नादरपूर'),
        containsPhone: text.includes('+91') || text.includes('98'),
        containsEmail: text.includes('@')
      };
    })()`,
    returnByValue: true
  });
  console.log('Baseline Contact DOM status:', infoRes.result.value);

  ws.close();
  child.kill();
}

captureBaselines().catch(console.error);

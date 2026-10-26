const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9336;

async function checkBreakpoints() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let list = [];
  for (let i = 0; i < 10; i++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');

  const viewports = [1440, 1280, 768, 390, 360];
  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 1,
      mobile: w < 768
    });
    await new Promise(r => setTimeout(r, 500));
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/hero_${w}.png`, Buffer.from(ss.data, 'base64'));
    console.log(`Saved scratch/hero_${w}.png`);
  }

  ws.close();
  child.kill();
}

checkBreakpoints();

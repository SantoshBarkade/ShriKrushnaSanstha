const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9332;

async function checkHeadings() {
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
  await send('DOM.enable');
  await send('CSS.enable');
  await new Promise(r => setTimeout(r, 2000));

  // Check computed font for h1 and text
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1');
      const cs = window.getComputedStyle(h1);
      return {
        fontFamily: cs.fontFamily,
        letterSpacing: cs.letterSpacing,
        fontFeatureSettings: cs.fontFeatureSettings,
        text: h1 ? h1.innerText : ''
      };
    })()`,
    returnByValue: true
  });

  console.log('H1 Computed Style:', JSON.stringify(res.result.value, null, 2));

  // Capture screenshot of hero
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/current_home_hero.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved scratch/current_home_hero.png');

  ws.close();
  child.kill();
}

checkHeadings();

const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9505;
const p = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--window-size=390,1100',
  'http://localhost:5173/#/home'
]);

setTimeout(async () => {
  try {
    const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
    const target = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const send = (m, params = {}) => new Promise((resolve) => {
      const mid = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === mid) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: mid, method: m, params }));
    });

    await new Promise(r => ws.addEventListener('open', r));
    await new Promise(r => setTimeout(r, 2500));

    // Capture mobile hero screenshot
    const snap = await send('Page.captureScreenshot', {
      clip: {
        x: 0,
        y: 650,
        width: 390,
        height: 500,
        scale: 2
      }
    });

    const outPath = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/proof_hero_mobile_quote_fixed.png';
    fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
    console.log('SAVED proof_hero_mobile_quote_fixed.png');

    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

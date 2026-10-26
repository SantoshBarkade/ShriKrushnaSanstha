const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9465;
const p = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--window-size=1440,900',
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

    // Wait 3 seconds for data and fonts
    await new Promise(r => setTimeout(r, 3000));

    // Get exact footer page coordinates
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const f = document.querySelector('footer');
        const r = f.getBoundingClientRect();
        return {
          x: r.x + window.scrollX,
          y: r.y + window.scrollY,
          width: r.width,
          height: r.height,
          scrollY: window.scrollY
        };
      })()`,
      returnByValue: true
    });
    console.log('Footer absolute pos:', res.result.value);
    const rect = res.result.value;

    // Capture screenshot using absolute page clip
    const snap = await send('Page.captureScreenshot', {
      clip: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scale: 2
      },
      captureBeyondViewport: true
    });

    const outPath = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/verified_footer_live.png';
    fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
    console.log('SAVED verified_footer_live.png');

    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

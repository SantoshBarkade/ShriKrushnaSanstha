const { spawn } = require('child_process');
const fs = require('fs');

async function captureHeroScreenshots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9304;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--window-size=1440,900',
    'http://localhost:4173/#/home'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    // Wait for canvas to render
    await new Promise((r) => setTimeout(r, 2000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/hero_current_with_3d.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved scratch/hero_current_with_3d.png');

    ws.close();
  } finally {
    child.kill();
  }
}

captureHeroScreenshots().catch(console.error);

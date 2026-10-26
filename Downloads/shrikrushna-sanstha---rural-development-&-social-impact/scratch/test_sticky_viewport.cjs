const { spawn } = require('child_process');
const fs = require('fs');

async function testStickyViewport() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9310;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'about:blank'
  ]);
  await new Promise((r) => setTimeout(r, 1500));
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
  await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
  await new Promise((r) => setTimeout(r, 1500));

  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise((r) => setTimeout(r, 500));

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });
  fs.writeFileSync(
    'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/header_sticky_viewport.png',
    Buffer.from(shot.data, 'base64')
  );
  console.log('Saved header_sticky_viewport.png');

  ws.close();
  child.kill();
}

testStickyViewport().catch(console.error);

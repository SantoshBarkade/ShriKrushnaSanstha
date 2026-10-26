const { spawn } = require('child_process');

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9306;
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

  await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
  await new Promise((r) => setTimeout(r, 2000));

  const res = await send('Runtime.evaluate', {
    expression:
      'JSON.stringify({ innerWidth: window.innerWidth, isMobile: window.innerWidth < 768, webgl: Boolean(document.createElement("canvas").getContext("webgl")) })',
    returnByValue: true
  });
  console.log('VIEWPORT & WEBGL:', res.result.value);
  ws.close();
  child.kill();
}

check().catch(console.error);

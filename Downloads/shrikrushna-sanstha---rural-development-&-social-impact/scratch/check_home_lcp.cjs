const { spawn } = require('child_process');

async function testHome() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9299;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:4173/#/home'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2500));
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

    await send('Runtime.enable');
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const entries = performance.getEntriesByType('resource');
        const heroImg = entries.find(e => e.name.includes('shrikrushna') || e.name.includes('hero') || e.name.includes('images'));
        return {
          resourceCount: entries.length,
          heroImgTiming: heroImg ? Math.round(heroImg.responseEnd) : null,
          allImages: entries.filter(e => e.initiatorType === 'img').map(e => ({ name: e.name.split('/').pop(), end: Math.round(e.responseEnd) }))
        };
      })()`,
      returnByValue: true
    });
    console.log('HOME RESULT:', JSON.stringify(res.result.value, null, 2));
    ws.close();
  } finally {
    child.kill();
  }
}
testHome().catch(console.error);

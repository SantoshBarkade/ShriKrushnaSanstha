const { spawn } = require('child_process');

async function testIdleWindow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9305;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'about:blank'
  ]);
  try {
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

    const events = [];
    let navStart = 0;
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Network.requestWillBeSent') {
        const p = d.params;
        if (!navStart && p.type === 'Document') navStart = p.timestamp;
        events.push({
          file: p.request.url.split('/').pop().split('?')[0],
          timeMs: navStart ? Math.round((p.timestamp - navStart) * 1000) : 0,
          type: p.type
        });
      }
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 6000));

    console.log('ALL REQUESTS OVER 6 SECONDS:');
    console.table(events);
    ws.close();
  } finally {
    child.kill();
  }
}
testIdleWindow().catch(console.error);

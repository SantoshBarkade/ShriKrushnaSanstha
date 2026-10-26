const { spawn } = require('child_process');

async function testEvalContext() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9345;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    console.log('Targets with --disable-extensions:', list.map(t => ({ id: t.id, type: t.type, url: t.url })));
    const target = list.find((t) => t.type === 'page') || list[0];
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
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__testVar = 42;`
    });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    const res = await send('Runtime.evaluate', {
      expression: `window.__testVar`,
      returnByValue: true
    });
    console.log('Result evaluated:', res);
    ws.close();
  } finally {
    child.kill();
  }
}

testEvalContext().catch(console.error);

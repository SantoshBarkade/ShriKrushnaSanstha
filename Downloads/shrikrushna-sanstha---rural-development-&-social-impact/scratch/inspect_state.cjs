const { spawn } = require('child_process');

async function inspectState() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9269',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);

  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9269/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find react state or dom
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim());
      return { buttons, headings };
    })()`,
    returnByValue: true
  });

  console.log('DOM Evaluation:', JSON.stringify(evalResult.result.value, null, 2));
  ws.close();
  child.kill();
}

inspectState().catch(console.error);

const { spawn } = require('child_process');

async function inspectContextData() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9239',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9239/json').then(r => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === cur) { ws.removeEventListener('message', h); res(msg.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise(r => setTimeout(r, 1500));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find react fiber or inspect window
      const app = document.querySelector('#root');
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('Page Title & H1:', res.result.value);
  child.kill();
  process.exit(0);
}
inspectContextData().catch(e => { console.error(e); process.exit(1); });

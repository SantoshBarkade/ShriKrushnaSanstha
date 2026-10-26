const { spawn } = require('child_process');

async function checkButtons() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9233/json').then(r => r.json());
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
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise(r => setTimeout(r, 2000));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().replace(/\\s+/g, ' '));
    })()`,
    returnByValue: true
  });
  console.log('Buttons:', res.result.value);
  child.kill();
  process.exit(0);
}
checkButtons().catch(e => { console.error(e); process.exit(1); });

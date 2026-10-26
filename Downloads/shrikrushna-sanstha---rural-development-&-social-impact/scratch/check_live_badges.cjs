const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9342;

async function check() {
  const child = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', 'http://localhost:5173/#/about']);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const mid = id++;
    const h = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('h2')).map(h => h.innerText.replace(/\\s+/g, ' '));
    })()`,
    returnByValue: true
  });
  console.log('All H2 on #/about:', JSON.stringify(res.result.value, null, 2));
  ws.close();
  child.kill();
}
check();

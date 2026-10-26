const { spawn } = require('child_process');

async function inspectOfficials() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9238',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9238/json').then(r => r.json());
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
      const cards = Array.from(document.querySelectorAll('.grid > div')).map(card => {
        const h2 = card.querySelector('h2')?.textContent?.trim();
        const role = card.querySelector('span.truncate')?.textContent?.trim();
        const bio = card.querySelector('p')?.textContent?.trim();
        const img = card.querySelector('img')?.src;
        return { name: h2, role, bio, img };
      });
      return cards;
    })()`,
    returnByValue: true
  });
  console.log('Current Published Officials (from live app state):', JSON.stringify(res.result.value, null, 2));
  child.kill();
  process.exit(0);
}
inspectOfficials().catch(e => { console.error(e); process.exit(1); });

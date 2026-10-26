const { spawn } = require('child_process');

async function testCat() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9246',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9246/json').then((r) => r.json());
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
  await new Promise((r) => setTimeout(r, 1000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('article'));
      return cards.map(c => {
        return {
          title: c.querySelector('h3')?.textContent?.trim() || '',
          categoryBadge: c.querySelector('.text-amber-300')?.textContent?.trim() || '',
          date: c.querySelector('.lucide-calendar')?.parentElement?.textContent?.trim() || '',
          location: c.querySelector('.lucide-map-pin')?.parentElement?.textContent?.trim() || ''
        };
      });
    })()`,
    returnByValue: true
  });

  console.log('Cards details:', JSON.stringify(res.result.value, null, 2));

  ws.close();
  child.kill();
}

testCat().catch(console.error);

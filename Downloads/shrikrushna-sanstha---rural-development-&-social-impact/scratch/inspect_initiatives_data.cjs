const { spawn } = require('child_process');

async function test() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9242',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9242/json').then(r => r.json());
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise(resolve => {
    const cur = id++;
    const handler = evt => {
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
  await new Promise(r => setTimeout(r, 2000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent || '';
      const filterButtons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0 && !t.includes('<'));
      const cards = Array.from(document.querySelectorAll('.grid > div')).map(c => {
        return {
          title: c.querySelector('h3')?.textContent?.trim() || '',
          category: c.querySelector('span')?.textContent?.trim() || '',
          summary: c.querySelector('p')?.textContent?.trim() || '',
          image: c.querySelector('img')?.src || ''
        };
      });
      return {
        url: window.location.href,
        h1,
        cardsCount: cards.length,
        filterButtons: filterButtons.slice(0, 10),
        cardsSample: cards.slice(0, 5)
      };
    })()`,
    returnByValue: true
  });
  console.log('Result:', JSON.stringify(res.result.value, null, 2));

  ws.close();
  child.kill();
}
test().catch(console.error);

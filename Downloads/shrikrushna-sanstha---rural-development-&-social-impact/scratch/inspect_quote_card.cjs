const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9496;
const p = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--window-size=1440,900',
  'http://localhost:5173/#/home'
]);

setTimeout(async () => {
  try {
    const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
    const target = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const send = (m, params = {}) => new Promise((resolve) => {
      const mid = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === mid) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: mid, method: m, params }));
    });

    await new Promise(r => ws.addEventListener('open', r));
    await new Promise(r => setTimeout(r, 2000));

    const info = await send('Runtime.evaluate', {
      expression: `(() => {
        const quoteEl = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('सेवा परमो धर्मः'));
        if (!quoteEl) return 'QUOTE NOT FOUND';
        const card = quoteEl.closest('.rounded-2xl') || quoteEl;
        return {
          tag: card.tagName,
          className: card.className,
          style: card.getAttribute('style'),
          computedTransform: window.getComputedStyle(card).transform,
          computedZIndex: window.getComputedStyle(card).zIndex,
          rect: card.getBoundingClientRect(),
          imgParentStyle: card.previousElementSibling ? card.previousElementSibling.getAttribute('style') : null
        };
      })()`,
      returnByValue: true
    });
    console.log('INFO:', info);

    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

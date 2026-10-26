const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9490;
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

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.querySelector('section');
        const imgCard = hero.querySelector('.aspect-\\[4\\/3\\], .aspect-\\[16\\/11\\]')?.parentElement;
        const quoteCard = hero.querySelector('.rounded-2xl.shadow-2xl');
        
        return {
          imgCard: imgCard ? {
            transform: window.getComputedStyle(imgCard).transform,
            zIndex: window.getComputedStyle(imgCard).zIndex,
            rect: imgCard.getBoundingClientRect()
          } : null,
          quoteCard: quoteCard ? {
            transform: window.getComputedStyle(quoteCard).transform,
            zIndex: window.getComputedStyle(quoteCard).zIndex,
            text: quoteCard.textContent.trim(),
            rect: quoteCard.getBoundingClientRect(),
            parentTransformStyle: window.getComputedStyle(quoteCard.parentElement).transformStyle
          } : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Hero elements inspect:', JSON.stringify(evalRes.result.value, null, 2));

    // Capture screenshot of hero image area
    const snap = await send('Page.captureScreenshot', {
      clip: {
        x: 750,
        y: 100,
        width: 600,
        height: 500,
        scale: 2
      }
    });
    const fs = require('fs');
    fs.writeFileSync('C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/hero_inspect_quote.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved hero_inspect_quote.png');

    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

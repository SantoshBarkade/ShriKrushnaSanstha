const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9347;

const routes = ['#/home', '#/about', '#/officials', '#/initiatives', '#/schemes'];

async function checkHeadingsAndGuide() {
  const child = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', 'http://localhost:5173/']);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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

  await send('Page.enable');

  const results = {};
  for (const r of routes) {
    await send('Page.navigate', { url: `http://localhost:5173/${r}` });
    await new Promise(res => setTimeout(res, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const h1Font = h1 ? window.getComputedStyle(h1).fontFamily : '';
        const h1Spacing = h1 ? window.getComputedStyle(h1).letterSpacing : '';
        const guide = document.querySelector('button[aria-expanded]');
        const guideRect = guide ? guide.getBoundingClientRect() : null;

        return {
          h1Text: h1 ? h1.innerText.replace(/\\s+/g, ' ').substring(0, 50) : '',
          h1Font,
          h1Spacing,
          h2Font: h2 ? window.getComputedStyle(h2).fontFamily : '',
          guideButton: guideRect ? {
            left: guideRect.left,
            right: guideRect.right,
            top: guideRect.top,
            bottom: guideRect.bottom,
            isRightSide: guideRect.left > 800
          } : null
        };
      })()`,
      returnByValue: true
    });
    results[r] = evalRes.result.value;
  }

  console.log('Headings & Guide Inspection Results:', JSON.stringify(results, null, 2));
  ws.close();
  child.kill();
}

checkHeadingsAndGuide();

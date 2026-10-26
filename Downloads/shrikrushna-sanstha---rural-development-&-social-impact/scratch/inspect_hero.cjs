const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9335;

async function inspectHero() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let list = [];
  for (let i = 0; i < 10; i++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const p = Array.from(document.querySelectorAll('p')).find(el => el.innerText.includes('ग्रामीण भागातील शिक्षण'));
      if (!p) return { found: false };
      const rect = p.getBoundingClientRect();
      const elementsAtRect = document.elementsFromPoint(rect.left + 20, rect.top + 10);
      return {
        found: true,
        pRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        elements: elementsAtRect.map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          innerText: el.innerText ? el.innerText.substring(0, 30) : ''
        }))
      };
    })()`,
    returnByValue: true
  });

  console.log('Hero inspect result:', JSON.stringify(result.result.value, null, 2));

  ws.close();
  child.kill();
}

inspectHero();

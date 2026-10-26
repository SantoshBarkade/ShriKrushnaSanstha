const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9348;

async function checkGuidePosition() {
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(res => setTimeout(res, 2000));

  const guideRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const guideContainer = Array.from(document.querySelectorAll('div')).find(d => d.className && d.className.includes('fixed bottom-6 right-'));
      if (!guideContainer) return { found: false };
      const rect = guideContainer.getBoundingClientRect();
      const btn = guideContainer.querySelector('button');
      return {
        found: true,
        className: guideContainer.className,
        rect: {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        },
        buttonText: btn ? btn.innerText.trim() : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('SansthaGuide Position Evaluation (1440x900):', JSON.stringify(guideRes.result.value, null, 2));
  ws.close();
  child.kill();
}

checkGuidePosition();

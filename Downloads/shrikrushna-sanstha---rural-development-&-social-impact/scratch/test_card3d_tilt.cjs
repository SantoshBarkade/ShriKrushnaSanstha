const { spawn } = require('child_process');

async function test3DTilt() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9253',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9253/json').then((r) => r.json());
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- TESTING REAL CDP MOUSE 3D TILT ---');

  // Get card position
  const posRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.grid > div');
      const r = card.getBoundingClientRect();
      return { x: r.left + r.width / 4, y: r.top + r.height / 4, outX: 10, outY: 10 };
    })()`,
    returnByValue: true
  });
  const { x, y, outX, outY } = posRes.result.value;

  // 1. Initial transform
  const initRes = await send('Runtime.evaluate', {
    expression: `document.querySelector('.grid > div').style.transform`,
    returnByValue: true
  });

  // 2. Move mouse onto card
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await new Promise((r) => setTimeout(r, 250));

  const activeRes = await send('Runtime.evaluate', {
    expression: `document.querySelector('.grid > div').style.transform`,
    returnByValue: true
  });

  // 3. Move mouse off card
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: outX, y: outY });
  await new Promise((r) => setTimeout(r, 250));

  const resetRes = await send('Runtime.evaluate', {
    expression: `document.querySelector('.grid > div').style.transform`,
    returnByValue: true
  });

  console.log('Results with Native CDP Mouse:');
  console.log('Initial Transform:', initRes.result.value);
  console.log('Active Transform (Hover):', activeRes.result.value);
  console.log('Reset Transform (Leave):', resetRes.result.value);

  ws.close();
  child.kill();
}

test3DTilt().catch(console.error);

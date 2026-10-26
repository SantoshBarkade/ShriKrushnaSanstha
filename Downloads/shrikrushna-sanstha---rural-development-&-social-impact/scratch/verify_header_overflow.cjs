const { spawn } = require('child_process');

async function testHeader() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9295;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let i = 0; i < 10; i++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          res(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 640 },
  ];

  console.log('Testing Header across viewports:');
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 1024
    });

    await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
    await new Promise((r) => setTimeout(r, 1200));

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sw = document.documentElement.scrollWidth;
          const cw = document.documentElement.clientWidth;
          const navItems = Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.trim());
          return {
            scrollWidth: sw,
            clientWidth: cw,
            overflowPx: Math.max(0, sw - cw),
            navItemCount: navItems.length
          };
        })()
      `,
      returnByValue: true
    });

    console.log(`Viewport ${vp.width}x${vp.height}:`, evalRes.result.value);
  }

  ws.close();
  child.kill();
}

testHeader().catch(console.error);

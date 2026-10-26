const { spawn } = require('child_process');

async function inspectMobileCLS() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9325;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 3500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const shifts = performance.getEntriesByType('layout-shift');
        return shifts.map(s => {
          return {
            value: s.value,
            hadRecentInput: s.hadRecentInput,
            startTime: Math.round(s.startTime),
            sources: (s.sources || []).map(src => {
              return {
                nodeName: src.node ? src.node.nodeName : 'unknown',
                id: src.node ? src.node.id : '',
                className: src.node ? (src.node.className?.baseVal || src.node.className || '') : '',
                prevRect: src.previousRect ? { x: src.previousRect.x, y: src.previousRect.y, w: src.previousRect.width, h: src.previousRect.height } : null,
                currRect: src.currentRect ? { x: src.currentRect.x, y: src.currentRect.y, w: src.currentRect.width, h: src.currentRect.height } : null,
              };
            })
          };
        });
      })()`,
      returnByValue: true
    });

    console.log('Mobile Layout Shifts:', JSON.stringify(evalRes.result.value, null, 2));
    ws.close();
  } finally {
    child.kill();
  }
}

inspectMobileCLS().catch(console.error);

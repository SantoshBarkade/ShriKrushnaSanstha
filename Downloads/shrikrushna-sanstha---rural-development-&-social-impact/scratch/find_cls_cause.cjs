const { spawn } = require('child_process');

async function findCLS() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9330;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
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

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__shifts = [];
        try {
          const po = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__shifts.push({
                val: entry.value,
                hadInput: entry.hadRecentInput,
                time: Math.round(entry.startTime),
                sources: (entry.sources || []).map(s => {
                  let tag = 'none';
                  let cls = '';
                  let id = '';
                  if (s.node) {
                    tag = s.node.nodeName;
                    id = s.node.id || '';
                    cls = typeof s.node.className === 'string' ? s.node.className.slice(0, 60) : '';
                  }
                  return {
                    tag,
                    id,
                    cls,
                    prev: s.previousRect ? [Math.round(s.previousRect.top), Math.round(s.previousRect.height)] : null,
                    curr: s.currentRect ? [Math.round(s.currentRect.top), Math.round(s.currentRect.height)] : null
                  };
                })
              });
            }
          });
          po.observe({ type: 'layout-shift', buffered: true });
        } catch(e) {}
      `
    });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 4000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `window.__shifts`,
      returnByValue: true
    });

    console.log('Mobile 390 Shifts:', JSON.stringify(evalRes.result.value, null, 2));
    ws.close();
  } finally {
    child.kill();
  }
}

findCLS().catch(console.error);

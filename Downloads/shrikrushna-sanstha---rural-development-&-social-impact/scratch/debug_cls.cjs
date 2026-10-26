const { spawn } = require('child_process');

async function debugMobileCLS() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9315;
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
            res(d.result);
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
        window.__clsEvents = [];
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                const item = {
                  value: entry.value,
                  startTime: Math.round(entry.startTime),
                  sourcesCount: (entry.sources || []).length,
                  details: []
                };
                if (entry.sources) {
                  for (const s of entry.sources) {
                    let desc = 'unknown';
                    try {
                      if (s.node) {
                        desc = s.node.nodeName + (s.node.id ? '#' + s.node.id : '') + (s.node.className ? '.' + String(s.node.className).slice(0, 30) : '');
                      }
                    } catch(e) {}
                    item.details.push({
                      desc,
                      prevRect: s.previousRect ? { top: s.previousRect.top, height: s.previousRect.height } : null,
                      currRect: s.currentRect ? { top: s.currentRect.top, height: s.currentRect.height } : null
                    });
                  }
                }
                window.__clsEvents.push(item);
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch(e) {}
      `
    });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 4500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        return window.__clsEvents;
      })()`,
      returnByValue: true
    });

    console.log('CLS Events on Mobile 390:', JSON.stringify(evalRes.result.value, null, 2));

    ws.close();
  } finally {
    child.kill();
  }
}

debugMobileCLS().catch(console.error);

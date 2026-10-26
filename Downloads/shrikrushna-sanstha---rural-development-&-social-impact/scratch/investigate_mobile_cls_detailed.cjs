const { spawn } = require('child_process');
const fs = require('fs');

async function profileCLS(isWarm) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9380;
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
    await send('Network.enable');

    if (!isWarm) {
      await send('Network.clearBrowserCache');
      await send('Network.clearBrowserCookies');
    }

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__clsDetailed = [];
        try {
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                const shift = {
                  value: entry.value,
                  time: Math.round(entry.startTime),
                  sources: (entry.sources || []).map((s) => ({
                    nodeName: s.node ? s.node.nodeName : 'unknown',
                    className: s.node && s.node.className ? (typeof s.node.className === 'string' ? s.node.className : s.node.className.baseVal || '') : '',
                    id: s.node ? s.node.id : '',
                    previousRect: s.previousRect ? { x: Math.round(s.previousRect.x), y: Math.round(s.previousRect.y), w: Math.round(s.previousRect.width), h: Math.round(s.previousRect.height) } : null,
                    currentRect: s.currentRect ? { x: Math.round(s.currentRect.x), y: Math.round(s.currentRect.y), w: Math.round(s.currentRect.width), h: Math.round(s.currentRect.height) } : null,
                  }))
                };
                window.__clsDetailed.push(shift);
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
      `,
    });

    if (isWarm) {
      // Prime the cache once
      await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
      await new Promise((r) => setTimeout(r, 2000));
      await send('Page.navigate', { url: 'about:blank' });
      await new Promise((r) => setTimeout(r, 400));
    }

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 4000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const shifts = window.__clsDetailed || [];
        const total = shifts.reduce((acc, s) => acc + s.value, 0);
        return {
          totalCLS: Number(total.toFixed(4)),
          shifts,
        };
      })()`,
      returnByValue: true,
    });

    console.log(`\n=== 390px ${isWarm ? 'WARM' : 'COLD'} CACHE CLS AUDIT ===`);
    console.log(`Total CLS: ${evalRes.result.value.totalCLS}`);
    console.log('Detailed Shifts:');
    console.log(JSON.stringify(evalRes.result.value.shifts, null, 2));

    ws.close();
    return evalRes.result.value;
  } finally {
    child.kill();
  }
}

async function run() {
  const cold = await profileCLS(false);
  const warm = await profileCLS(true);
  fs.writeFileSync('scratch/cls_investigation.json', JSON.stringify({ cold, warm }, null, 2));
}

run().catch(console.error);

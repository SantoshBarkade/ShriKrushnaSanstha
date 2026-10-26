const { spawn } = require('child_process');

async function measureHeader() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9385;
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

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });

    // Measure at intervals
    for (const ms of [100, 300, 600, 900, 1500]) {
      await new Promise(r => setTimeout(r, ms === 100 ? 100 : ms - [100, 300, 600, 900, 1500][[100, 300, 600, 900, 1500].indexOf(ms) - 1]));
      const m = await send('Runtime.evaluate', {
        expression: `(() => {
          const topRow = document.querySelector('.header-top-row');
          const navRow = document.querySelector('.header-navigation-row');
          const header = document.querySelector('header');
          const section = document.querySelector('section');
          const fontLoaded = document.fonts.check('16px "Noto Sans Devanagari"');
          return {
            time: performance.now(),
            fontLoaded,
            headerH: header ? header.offsetHeight : 0,
            topRowH: topRow ? topRow.offsetHeight : 0,
            navRowTop: navRow ? navRow.offsetTop : 0,
            sectionTop: section ? section.getBoundingClientRect().top : 0
          };
        })()`,
        returnByValue: true
      });
      console.log(`At ~${ms}ms:`, JSON.stringify(m.result.value));
    }

    ws.close();
  } finally {
    child.kill();
  }
}

measureHeader().catch(console.error);

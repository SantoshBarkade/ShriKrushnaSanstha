const { spawn } = require('child_process');

async function test() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9287',
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch('http://127.0.0.1:9287/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
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
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    const consoleMessages = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push(d.params.args.map(a => a.value).join(' '));
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/#/initiatives' });
    await new Promise((r) => setTimeout(r, 3000));

    const pageInfo = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.href,
        title: document.title,
        heading: document.querySelector('h1, h2')?.innerText || '',
        btnCount: document.querySelectorAll('button').length,
        btns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 15)
      })`,
      returnByValue: true
    });
    console.log('Page Info:', pageInfo.result.value);

    // Modal test
    const modalTiming = await send('Runtime.evaluate', {
      expression: `(async () => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText.includes('वाचा') || b.innerText.includes('तपशील') || b.innerText.includes('माहिती') || b.getAttribute('aria-label')?.includes('माहिती'));
        if (!target) return { error: 'No matching button', allBtns: btns.map(b => b.innerText) };

        const t0 = performance.now();
        target.click();

        let opened = false;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 20));
          if (document.querySelector('[role="dialog"]')) {
            opened = true;
            break;
          }
        }
        const openTimeMs = Math.round(performance.now() - t0);

        const closeBtn = document.querySelector('[role="dialog"] button');
        const t1 = performance.now();
        if (closeBtn) closeBtn.click();

        let closed = false;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 20));
          if (!document.querySelector('[role="dialog"]')) {
            closed = true;
            break;
          }
        }
        const closeTimeMs = Math.round(performance.now() - t1);

        return {
          opened,
          openTimeMs,
          closed,
          closeTimeMs
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Modal Timing:', modalTiming.result.value);

    if (consoleMessages.length > 0) {
      console.log('Console messages:', consoleMessages);
    }

    ws.close();
  } finally {
    child.kill();
  }
}
test().catch(console.error);

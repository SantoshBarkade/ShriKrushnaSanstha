const { spawn } = require('child_process');

async function testModalTiming() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9280;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:4173/#/initiatives'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise((res) => ws.addEventListener('open', res));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/#/initiatives' });
    await new Promise(r => setTimeout(r, 2000));

    const result = await send('Runtime.evaluate', {
      expression: `(async () => {
        const actionBtn = document.querySelector('article button');
        if (!actionBtn) return { error: 'No article button found' };

        const t0 = performance.now();
        actionBtn.click();
        
        let opened = false;
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 16));
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
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 16));
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

    console.log('Initiative Modal Timing Result:', result.result.value);
    ws.close();
  } finally {
    child.kill();
  }
}

testModalTiming().catch(console.error);

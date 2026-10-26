const { spawn } = require('child_process');

async function testLightboxDirect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9291;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/#/gallery' });
    await new Promise((r) => setTimeout(r, 2500));

    const result = await send('Runtime.evaluate', {
      expression: `(async () => {
        const allPhotosBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('सर्व छायाचित्रे'));
        if (!allPhotosBtn) return { error: 'No all photos button' };

        allPhotosBtn.click();
        await new Promise(r => setTimeout(r, 300));

        const photoCards = document.querySelectorAll('.will-change-transform');
        if (photoCards.length === 0) return { error: 'No photo cards in all view' };

        const t0 = performance.now();
        photoCards[0].click();

        let opened = false;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 20));
          if (document.querySelector('[role="dialog"]')) {
            opened = true;
            break;
          }
        }
        const openMs = Math.round(performance.now() - t0);

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
        const closeMs = Math.round(performance.now() - t1);

        return {
          opened,
          openMs,
          closed,
          closeMs,
          photosCount: photoCards.length
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Direct Lightbox Result:', result.result.value);
    ws.close();
  } finally {
    child.kill();
  }
}
testLightboxDirect().catch(console.error);

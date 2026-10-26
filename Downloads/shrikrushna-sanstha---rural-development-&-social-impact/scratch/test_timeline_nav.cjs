const { spawn } = require('child_process');

async function testTimelineNavigation() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9251',
    '--disable-gpu',
    'http://localhost:5173/#/work'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9251/json').then((r) => r.json());
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

  console.log('--- TESTING TIMELINE TO INITIATIVES DETAIL MODAL FLOW ---');

  const navRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const timelineBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('सविस्तर'));
      if (timelineBtns.length === 0) return { error: 'No timeline detail button found' };

      // Click the first timeline card's detail button
      timelineBtns[0].click();
      await new Promise(r => setTimeout(r, 500));

      const currentHash = window.location.hash;
      const modal = document.querySelector('[role="dialog"]');
      const modalOpen = Boolean(modal);
      const modalTitle = document.getElementById('initiative-modal-title')?.textContent?.trim() || '';
      const closeBtn = modal?.querySelector('button[aria-label*="खिडकी"], button[aria-label*="Close"]');
      const closeBtnVisible = closeBtn ? closeBtn.getBoundingClientRect().top >= 0 : false;

      // Close modal
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const modalClosed = document.querySelector('[role="dialog"]') === null;

      return {
        currentHash,
        modalOpen,
        modalTitle,
        closeBtnVisible,
        modalClosed
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Timeline-to-Modal Result:', navRes.result.value);

  ws.close();
  child.kill();
}

testTimelineNavigation().catch(console.error);

const { spawn } = require('child_process');

async function testModalScroll() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9249',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9249/json').then((r) => r.json());
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
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- TESTING MODAL INTERNAL SCROLL ---');

  const scrollRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const btns = Array.from(document.querySelectorAll('article button')).filter(b => b.textContent.includes('वाचा') || b.textContent.includes('Read') || b.textContent.includes('माहिती'));
      if (btns.length === 0) return { error: 'No read more buttons' };

      // Open first modal
      btns[0].click();
      await new Promise(r => setTimeout(r, 400));

      const innerScroll = document.querySelector('[role="dialog"] .flex-1.min-h-0');
      if (!innerScroll) return { error: 'Inner scroll not found' };

      const scrollHeight = innerScroll.scrollHeight;
      const clientHeight = innerScroll.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      innerScroll.scrollTop = maxScroll;
      await new Promise(r => setTimeout(r, 200));

      return {
        scrollHeight,
        clientHeight,
        maxScroll,
        scrollTopAfterScroll: innerScroll.scrollTop,
        isScrollable: maxScroll > 0,
        reachedEnd: Math.abs(innerScroll.scrollTop - maxScroll) <= 2
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Inner Modal Scroll Result:', scrollRes.result.value);

  ws.close();
  child.kill();
}

testModalScroll().catch(console.error);

const { spawn } = require('child_process');

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9296;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'http://localhost:5173/#/volunteer'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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
  await new Promise((r) => setTimeout(r, 1200));

  const clickResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('स्वयंसेवक नोंदणी सबमिट करा') || b.textContent.includes('Submit Volunteer Application'));
      if (btn) {
        btn.click();
        return { clicked: true, text: btn.textContent.trim() };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Click result:', clickResult.result.value);

  await new Promise((r) => setTimeout(r, 800));

  const errorCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const errorEls = Array.from(document.querySelectorAll('[role="alert"], .text-rose-600, .text-red-500'));
      return {
        count: errorEls.length,
        messages: errorEls.map(el => el.textContent.trim())
      };
    })()`,
    returnByValue: true
  });
  console.log('Error check:', errorCheck.result.value);

  ws.close();
  child.kill();
}

check().catch(console.error);

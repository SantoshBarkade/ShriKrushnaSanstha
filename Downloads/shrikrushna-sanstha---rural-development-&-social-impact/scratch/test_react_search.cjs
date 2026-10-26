const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function testReactSearch() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9276;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/reports'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

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
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Search for 'पर्यावरण' using native descriptor setter
  console.log('Testing React search with "पर्यावरण"...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'पर्यावरण');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const countAfterParyavaran = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('main div.grid > div').length`,
    returnByValue: true
  });
  console.log(`Cards after searching "पर्यावरण": ${countAfterParyavaran.result.value}`);

  const searchShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_search_active_1440.png'), Buffer.from(searchShot.data, 'base64'));

  // 2. Search for non-existent term 'xyznonexistent123' to test Empty State
  console.log('Testing React search with non-existent query...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'xyznonexistent123');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const emptyInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('main div.grid > div').length;
      const text = document.querySelector('main')?.textContent || '';
      const hasEmptyTitle = text.includes('कोणतेही अहवाल सापडले नाहीत');
      const resetBtn = Array.from(document.querySelectorAll('main button')).some(b => b.textContent && b.textContent.includes('सर्व अहवाल पहा'));
      return {
        cards,
        hasEmptyTitle,
        hasResetBtn: resetBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('Empty state verification:', emptyInfo.result.value);

  const emptyShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_empty_search_1440.png'), Buffer.from(emptyShot.data, 'base64'));

  ws.close();
  child.kill();
  console.log('Search & Empty state tests passed!');
}

testReactSearch().catch(console.error);

const { spawn } = require('child_process');

async function testSearch() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9263',
    '--disable-gpu',
    'http://localhost:5173/#/schemes'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9263/json').then((r) => r.json());
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

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return { error: 'no input' };

      // React native value setter trigger
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(input, 'श्रावणबाळ');
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const cards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      return { searchedQuery: input.value, cards, count: cards.length };
    })()`,
    returnByValue: true
  });

  console.log('Search test result:', JSON.stringify(result.result.value, null, 2));
  ws.close();
  child.kill();
}

testSearch().catch(console.error);

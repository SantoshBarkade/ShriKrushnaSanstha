const { spawn } = require('child_process');

async function debugState() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9275',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9275/json').then((r) => r.json());
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

  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find react element
      const el = document.querySelector('h1');
      // let's check localStorage
      const local = localStorage.getItem('shrikrushna_sanstha_state');
      const local2 = localStorage.getItem('sanstha_state_v1');
      return {
        allLocalStorageKeys: Object.keys(localStorage),
        localStorageValues: Object.keys(localStorage).map(k => ({ key: k, valSnippet: localStorage.getItem(k).slice(0, 100) }))
      };
    })()`,
    returnByValue: true
  });

  console.log('LocalStorage keys:', JSON.stringify(evalResult.result.value, null, 2));
  ws.close();
  child.kill();
}

debugState().catch(console.error);

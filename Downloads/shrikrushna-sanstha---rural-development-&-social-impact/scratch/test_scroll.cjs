const { spawn } = require('child_process');

async function checkWhereSectionsComeFrom() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--disable-gpu',
    'http://localhost:5173/#/privacy'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9288/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 1;
  const send = (m, p = {}) =>
    new Promise((res) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          res(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1200));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const rawStored = localStorage.getItem('shrikrushna_sanstha_state_v2');
      const parsed = rawStored ? JSON.parse(rawStored) : null;
      return {
        pageSectionsInStorage: parsed?.pageSections || []
      };
    })()`,
    returnByValue: true
  });
  console.log('Sections from localStorage:', JSON.stringify(check.result.value, null, 2));

  ws.close();
  child.kill();
}

checkWhereSectionsComeFrom().catch(console.error);

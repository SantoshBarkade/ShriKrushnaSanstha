const { spawn } = require('child_process');

async function checkSavedGallery() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9277',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9277/json').then((r) => r.json());
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
      const saved = localStorage.getItem('shrikrushna_sanstha_state_v9_news_slider');
      const parsed = JSON.parse(saved);
      return {
        gallery: parsed.gallery,
        albums: parsed.albums,
        videos: parsed.videos
      };
    })()`,
    returnByValue: true
  });

  console.log('Saved Gallery in localStorage:', JSON.stringify(evalResult.result.value, null, 2));
  ws.close();
  child.kill();
}

checkSavedGallery().catch(console.error);

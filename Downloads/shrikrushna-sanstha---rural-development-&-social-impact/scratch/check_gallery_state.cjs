const { spawn } = require('child_process');

async function checkGalleryState() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9271',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9271/json').then((r) => r.json());
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
      // Check localStorage cached state
      const local = localStorage.getItem('sanstha_state_v1');
      let parsed = null;
      if (local) {
        try { parsed = JSON.parse(local); } catch (e) {}
      }
      return {
        hasLocalStorage: Boolean(local),
        galleryLength: parsed && parsed.gallery ? parsed.gallery.length : 'none',
        albumsLength: parsed && parsed.albums ? parsed.albums.length : 'none',
        gallerySample: parsed && parsed.gallery ? parsed.gallery.slice(0, 2) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Browser LocalStorage state:', JSON.stringify(result.result.value, null, 2));
  ws.close();
  child.kill();
}

checkGalleryState().catch(console.error);

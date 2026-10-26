const { spawn } = require('child_process');

async function testAbout() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9271',
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch('http://127.0.0.1:9271/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res) => ws.addEventListener('open', res));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const js = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (
        m.method === 'Network.responseReceived' &&
        (m.params.response.url.endsWith('.js') || m.params.response.mimeType?.includes('javascript'))
      ) {
        js.push({
          name: m.params.response.url.split('/').pop(),
          size: m.params.response.encodedDataLength
        });
      }
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Network.clearBrowserCache');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Page.navigate', { url: 'http://localhost:4173/#/about' });
    await new Promise((r) => setTimeout(r, 2500));

    console.log('--- JS FETCHED ON FRESH DIRECT LOAD OF #/about ---');
    console.log(`Total JS chunks: ${js.length}`);
    for (const f of js) {
      console.log(` - ${f.name} (${f.size} bytes)`);
    }

    ws.close();
  } finally {
    child.kill();
  }
}

testAbout().catch(console.error);

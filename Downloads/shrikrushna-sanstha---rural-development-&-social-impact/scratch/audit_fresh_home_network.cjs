const { spawn } = require('child_process');

async function testFreshHome() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9266;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
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

    const fetchedFiles = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Network.responseReceived') {
        const resp = msg.params.response;
        fetchedFiles.push({
          url: resp.url,
          status: resp.status,
          mimeType: resp.mimeType,
          encodedDataLength: resp.encodedDataLength
        });
      }
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Network.clearBrowserCache');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('--- STRICT FRESH HOMEPAGE NETWORK FETCHES ---');
    const jsFiles = fetchedFiles.filter(f => f.url.endsWith('.js') || f.mimeType?.includes('javascript'));
    console.log(`Total JS requests on fresh home: ${jsFiles.length}`);
    for (const f of jsFiles) {
      const name = f.url.split('/').pop();
      console.log(` - ${name} (${f.encodedDataLength} bytes transfer)`);
    }

    const cssFiles = fetchedFiles.filter(f => f.url.endsWith('.css') || f.mimeType?.includes('css'));
    console.log(`Total CSS requests: ${cssFiles.length}`);
    for (const f of cssFiles) {
      console.log(` - ${f.url.split('/').pop()} (${f.encodedDataLength} bytes transfer)`);
    }

    const apiCalls = fetchedFiles.filter(f => f.url.includes('/api/'));
    console.log(`Total API requests: ${apiCalls.length}`);
    for (const f of apiCalls) {
      console.log(` - ${f.url} (${f.encodedDataLength} bytes transfer)`);
    }

    ws.close();
  } finally {
    child.kill();
  }
}

testFreshHome().catch(console.error);

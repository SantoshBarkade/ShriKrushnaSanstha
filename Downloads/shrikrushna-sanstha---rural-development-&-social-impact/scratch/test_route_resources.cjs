const { spawn } = require('child_process');

async function testRouteNetwork(route) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9302;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'about:blank'
  ]);
  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    const urls = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Network.requestWillBeSent') {
        urls.push(d.params.request.url);
      }
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: `http://localhost:4173/${route}` });
    await new Promise((r) => setTimeout(r, 2200));

    const jsUrls = urls.filter((u) => u.includes('.js'));
    console.log(`=== ROUTE ${route} JS RESOURCES ===`);
    console.log(jsUrls.map((u) => u.split('/').pop().split('?')[0]));
    console.log('Contains vendor-three:', jsUrls.some((u) => u.includes('vendor-three')));
    console.log('Contains vendor-gsap:', jsUrls.some((u) => u.includes('vendor-gsap')));
    ws.close();
  } finally {
    child.kill();
  }
}

const targetRoute = process.argv[2] || '#/about';
testRouteNetwork(targetRoute).catch(console.error);

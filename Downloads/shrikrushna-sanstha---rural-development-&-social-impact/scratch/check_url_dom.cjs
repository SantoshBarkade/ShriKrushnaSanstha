const { spawn } = require('child_process');

async function checkUrlAndDom() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9396',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1200));
  const list = await fetch('http://127.0.0.1:9396/json').then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((res) => {
      const mid = id++;
      const h = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === mid) {
          ws.removeEventListener('message', h);
          res(d.result || d);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
  await new Promise((r) => setTimeout(r, 2200));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        rootChildren: document.getElementById('root') ? document.getElementById('root').innerHTML.slice(0, 300) : 'no root',
        allTags: Array.from(new Set(Array.from(document.querySelectorAll('*')).map(el => el.tagName.toLowerCase())))
      };
    })()`,
    returnByValue: true,
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  child.kill();
}

checkUrlAndDom();

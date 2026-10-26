const { spawn } = require('child_process');

async function checkSections() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9395',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1200));
  const list = await fetch('http://127.0.0.1:9395/json').then((r) => r.json());
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
      const sections = Array.from(document.querySelectorAll('section')).map(s => ({
        tag: s.tagName,
        ariaLabel: s.getAttribute('aria-label'),
        id: s.id,
        className: s.className.slice(0, 50),
        firstFewWords: s.innerText ? s.innerText.slice(0, 100).replace(/\\n/g, ' ') : ''
      }));
      return sections;
    })()`,
    returnByValue: true,
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  child.kill();
}

checkSections();

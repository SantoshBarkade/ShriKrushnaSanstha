const { spawn } = require('child_process');
const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9363',
  '--disable-gpu',
  'http://localhost:5173/#/home'
]);

setTimeout(async () => {
  const list = await fetch('http://127.0.0.1:9363/json').then(r => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const els = Array.from(document.querySelectorAll('*'));
          const found = els.filter(s => s.children.length === 0 && s.innerText && s.innerText.includes('महा'));
          return found.map(s => ({
            tag: s.tagName,
            className: s.className,
            text: s.innerText,
            codepoints: Array.from(s.innerText).map(c => c.charCodeAt(0).toString(16)).join(' ')
          }));
        })()`,
        returnByValue: true
      }
    }));
  });
  ws.addEventListener('message', d => {
    const res = JSON.parse(d.data);
    if (res.id === 1) {
      console.log('DOM Nodes with महा:\n', JSON.stringify(res.result.result.value, null, 2));
      child.kill();
      process.exit(0);
    }
  });
}, 2500);

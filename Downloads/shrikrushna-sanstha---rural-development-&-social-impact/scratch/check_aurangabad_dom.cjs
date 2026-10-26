const { spawn } = require('child_process');
const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9352',
  '--disable-gpu',
  'http://localhost:5173/#/about'
]);

setTimeout(async () => {
  const list = await fetch('http://127.0.0.1:9352/json').then(r => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const lines = document.body.innerText.split('\\n');
          return lines.filter(l => l.includes('औरंगाबाद'));
        })()`,
        returnByValue: true
      }
    }));
  });
  ws.addEventListener('message', d => {
    const res = JSON.parse(d.data);
    if (res.id === 1) {
      console.log('Result:\n', JSON.stringify(res.result.result.value, null, 2));
      child.kill();
      process.exit(0);
    }
  });
}, 2500);

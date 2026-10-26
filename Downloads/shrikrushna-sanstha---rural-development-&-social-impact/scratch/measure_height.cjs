const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9455', 'http://localhost:5173']);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9455/json').then(r => r.json());
    const target = list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'document.body.scrollHeight' } }));
    });
    ws.addEventListener('message', evt => {
      console.log('MEASURED HEIGHT:', JSON.parse(evt.data).result.value);
      p.kill();
      process.exit(0);
    });
  } catch (e) {
    console.error(e);
    p.kill();
    process.exit(1);
  }
}, 3000);

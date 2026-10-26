const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9370;

async function run() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'file:///C:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/scratch/test_maharashtra.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const mid = id++;
    const h = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) {
        ws.removeEventListener('message', h);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 1200,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1500));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/snap_maharashtra_comparison.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved snap_maharashtra_comparison.png');
  child.kill();
}

run().catch(console.error);

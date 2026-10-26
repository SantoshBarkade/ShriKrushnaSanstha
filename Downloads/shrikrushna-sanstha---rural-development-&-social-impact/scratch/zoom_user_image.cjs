const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9371;

async function run() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'file:///C:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/scratch/crop_inspect.html'
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
    ws.send(JSON.stringify({ id, method: m, params: p }));
  });

  // Get image dimensions
  const dims = await send('Runtime.evaluate', {
    expression: `(() => {
      const img = document.getElementById('img');
      return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
    })()`,
    returnByValue: true
  });
  console.log('Image dimensions:', dims.result.value);

  const { naturalWidth, naturalHeight } = dims.result.value;

  // Set viewport to the natural image dimensions
  await send('Emulation.setDeviceMetricsOverride', {
    width: naturalWidth,
    height: naturalHeight,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  // In media_1792999008227_685be89b.png:
  // Footer logo is roughly left: 50..400, top: 150..300
  // Address is roughly left: 700..1000, top: 150..350
  // Let's take screenshots of both regions!
  
  const snapLogo = await send('Page.captureScreenshot', {
    clip: { x: 50, y: 150, width: 350, height: 180, scale: 3 }
  });
  fs.writeFileSync('scratch/user_footer_logo_zoomed.png', Buffer.from(snapLogo.data, 'base64'));

  const snapAddress = await send('Page.captureScreenshot', {
    clip: { x: 740, y: 150, width: 350, height: 250, scale: 3 }
  });
  fs.writeFileSync('scratch/user_footer_address_zoomed.png', Buffer.from(snapAddress.data, 'base64'));

  console.log('Saved zoomed crops');
  child.kill();
}

run().catch(console.error);

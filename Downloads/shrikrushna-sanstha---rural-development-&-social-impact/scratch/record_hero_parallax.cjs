const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const framesDir = path.join(__dirname, 'hero_frames');

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Clean old frames
fs.readdirSync(framesDir).forEach(f => {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(framesDir, f));
});

async function record() {
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

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

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for initial render
  await new Promise(r => setTimeout(r, 1200));

  // Trajectory over right column hero artwork (roughly x: 850-1350, y: 150-550)
  const trajectory = [
    { x: 720, y: 350 },
    { x: 920, y: 220 },
    { x: 1050, y: 160 },
    { x: 1200, y: 140 },
    { x: 1320, y: 190 },
    { x: 1380, y: 290 },
    { x: 1350, y: 410 },
    { x: 1260, y: 500 },
    { x: 1100, y: 520 },
    { x: 980, y: 460 },
    { x: 900, y: 350 },
    { x: 1050, y: 300 },
    { x: 1180, y: 310 }
  ];

  console.log(`Capturing ${trajectory.length} parallax frames...`);

  for (let i = 0; i < trajectory.length; i++) {
    const pt = trajectory[i];
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: pt.x,
      y: pt.y
    });

    // Allow spring physics to settle slightly
    await new Promise(r => setTimeout(r, 100));

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 720,
        scale: 1
      }
    });

    const fName = `frame_${String(i).padStart(2, '0')}.png`;
    fs.writeFileSync(path.join(framesDir, fName), Buffer.from(shot.data, 'base64'));
  }

  console.log('Parallax frames captured successfully.');

  ws.close();
  child.kill();
}

record().catch(console.error);

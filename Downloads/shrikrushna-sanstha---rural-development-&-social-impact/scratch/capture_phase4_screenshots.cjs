const { spawn } = require('child_process');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'phase4_desktop_1440', width: 1440, height: 900, isMobile: false, dpr: 1 },
  { name: 'phase4_desktop_1280', width: 1280, height: 800, isMobile: false, dpr: 1 },
  { name: 'phase4_mobile_390', width: 390, height: 844, isMobile: true, dpr: 3 },
  { name: 'phase4_mobile_360', width: 360, height: 800, isMobile: true, dpr: 2 },
];

async function captureScreenshots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9375;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1600));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
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
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    const artifactDir = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.isMobile,
      });

      await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
      await new Promise((r) => setTimeout(r, 2200));

      const snap = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(snap.data, 'base64');
      const filename = `${vp.name}.png`;
      fs.writeFileSync(`scratch/${filename}`, buffer);
      fs.writeFileSync(`${artifactDir}\\${filename}`, buffer);
      console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
    }

    // Capture reduced motion view
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));
    const snapReduced = await send('Page.captureScreenshot', { format: 'png' });
    const bufReduced = Buffer.from(snapReduced.data, 'base64');
    fs.writeFileSync(`scratch/phase4_reduced_motion.png`, bufReduced);
    fs.writeFileSync(`${artifactDir}\\phase4_reduced_motion.png`, bufReduced);
    console.log('Saved screenshot: phase4_reduced_motion.png');

    ws.close();
  } finally {
    child.kill();
  }
}

captureScreenshots().catch(console.error);

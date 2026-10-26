const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9380;

async function run() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  // Wait for Chrome to boot
  let connected = false;
  let target = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
      target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
      if (target && target.webSocketDebuggerUrl) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    console.error('Failed to connect to Chrome on port ' + port);
    child.kill();
    return;
  }

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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Wait 3 seconds for data to load and fonts to settle
  await new Promise(r => setTimeout(r, 3000));

  // Get header logo rect
  const headerInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const logo = header ? header.querySelector('div.inline-flex') : null;
      if (!logo) return null;
      const rect = logo.getBoundingClientRect();
      const sub = logo.querySelector('span.font-serif');
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        subText: sub ? sub.textContent : null,
        subFont: sub ? window.getComputedStyle(sub).fontFamily : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Header Logo Info:', headerInfo.result.value);

  // Capture close-up of header logo with padding
  const headerSnap = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: 0,
      width: 550,
      height: 120,
      scale: 2
    }
  });
  const headerPath = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/verified_header_maharashtra.png';
  fs.writeFileSync(headerPath, Buffer.from(headerSnap.data, 'base64'));
  console.log('Saved verified_header_maharashtra.png');

  // Scroll to footer
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Get footer info
  const footerInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('footer');
      if (!footer) return null;
      const rect = footer.getBoundingClientRect();
      const logoSub = footer.querySelector('span.font-serif');
      const addrP = footer.querySelector('p.text-slate-300');
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        logoSubText: logoSub ? logoSub.textContent : null,
        addressText: addrP ? addrP.textContent.trim() : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Footer Info:', footerInfo.result.value);

  // Capture footer close-up
  const footerSnap = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: 100, // in current scrolled viewport
      width: 1440,
      height: 600,
      scale: 2
    }
  });
  const footerPath = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/verified_footer_maharashtra.png';
  fs.writeFileSync(footerPath, Buffer.from(footerSnap.data, 'base64'));
  console.log('Saved verified_footer_maharashtra.png');

  child.kill();
}

run().catch(console.error);

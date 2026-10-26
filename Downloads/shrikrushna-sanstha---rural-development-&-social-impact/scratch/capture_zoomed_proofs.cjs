const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9475;
const p = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--window-size=1440,900',
  'http://localhost:5173/#/home'
]);

setTimeout(async () => {
  try {
    const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
    const target = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const send = (m, params = {}) => new Promise((resolve) => {
      const mid = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === mid) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: mid, method: m, params }));
    });

    await new Promise(r => ws.addEventListener('open', r));
    await new Promise(r => setTimeout(r, 2500));

    // Address paragraph under मुख्य कार्यालय
    const footerAddrRect = await send('Runtime.evaluate', {
      expression: `(() => {
        const footer = document.querySelector('footer');
        // Find p that contains महाराष्ट्र
        const ps = Array.from(footer.querySelectorAll('p'));
        const addrP = ps.find(p => p.textContent.includes('महाराष्ट्र'));
        if (!addrP) return null;
        const r = addrP.getBoundingClientRect();
        return {
          x: r.x + window.scrollX,
          y: r.y + window.scrollY,
          width: r.width,
          height: r.height,
          text: addrP.textContent.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log('Footer address rect & text:', footerAddrRect.result.value);
    const ar = footerAddrRect.result.value;

    const snapFooterAddr = await send('Page.captureScreenshot', {
      clip: {
        x: Math.floor(ar.x - 10),
        y: Math.floor(ar.y - 10),
        width: Math.ceil(ar.width + 20),
        height: Math.ceil(ar.height + 20),
        scale: 4
      },
      captureBeyondViewport: true
    });
    fs.writeFileSync('C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/proof_footer_address_maharashtra_zoomed.png', Buffer.from(snapFooterAddr.data, 'base64'));

    console.log('FOOTER ADDRESS PROOF SAVED');
    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

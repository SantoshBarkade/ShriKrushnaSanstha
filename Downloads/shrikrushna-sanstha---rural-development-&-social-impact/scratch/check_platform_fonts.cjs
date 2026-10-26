const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9480;
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

    await send('DOM.enable');
    await send('CSS.enable');

    const nodeRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const footer = document.querySelector('footer');
        const ps = Array.from(footer.querySelectorAll('p'));
        const addrP = ps.find(p => p.textContent.includes('महाराष्ट्र'));
        return addrP;
      })()`
    });

    const doc = await send('DOM.getDocument');
    const { nodeId } = await send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'footer p.overflow-visible'
    });

    const fonts = await send('CSS.getPlatformFontsForNode', { nodeId });
    console.log('PLATFORM FONTS FOR FOOTER ADDRESS:', fonts);

    // Also check header logo subtitle
    const headerSub = await send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'header span.overflow-visible'
    });
    const headerFonts = await send('CSS.getPlatformFontsForNode', { nodeId: headerSub.nodeId });
    console.log('PLATFORM FONTS FOR HEADER LOGO SUBTITLE:', headerFonts);

    p.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    p.kill();
    process.exit(1);
  }
}, 3000);

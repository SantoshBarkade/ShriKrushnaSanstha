const { spawn } = require('child_process');
const fs = require('fs');

async function testSticky() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9309;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'about:blank'
  ]);
  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
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
          res(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll down 800px
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise((r) => setTimeout(r, 500));

  const stickyEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const rect = header.getBoundingClientRect();
      const topRow = document.querySelector('.header-top-row').getBoundingClientRect();
      const navRow = document.querySelector('.header-navigation-row').getBoundingClientRect();
      return {
        headerTop: Math.round(rect.top),
        isPinnedToTop: Math.round(rect.top) === 0,
        topRowHeight: Math.round(topRow.height),
        navRowTop: Math.round(navRow.top),
        isStackedBelow: navRow.top >= topRow.bottom - 2
      };
    })()`,
    returnByValue: true
  });
  console.log('STICKY SCROLL EVALUATION:', stickyEval.result.value);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 260, scale: 1 }
  });
  fs.writeFileSync(
    'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/header_sticky_scrolled.png',
    Buffer.from(shot.data, 'base64')
  );
  console.log('Saved header_sticky_scrolled.png');

  ws.close();
  child.kill();
}

testSticky().catch(console.error);

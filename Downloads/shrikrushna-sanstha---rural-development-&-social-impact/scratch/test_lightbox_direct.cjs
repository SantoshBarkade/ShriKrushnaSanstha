const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9316;

async function runDirectLightboxTest() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('1. Navigating to Gallery...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/gallery' });
  await new Promise((r) => setTimeout(r, 1500));

  console.log('2. Opening first album card...');
  // Find album card by clicking the first card button in albums grid
  const albumClickResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const albumCards = Array.from(document.querySelectorAll('.cursor-pointer')).filter(el => el.innerText.includes('अल्बम') || el.innerText.includes('तपासा') || el.innerText.includes('CSC बाल विद्यालय'));
        if (albumCards.length > 0) {
          albumCards[0].click();
          return { clicked: true, text: albumCards[0].innerText.slice(0, 50) };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Album click result:', albumClickResult.result.value);
  await new Promise((r) => setTimeout(r, 1200));

  console.log('3. Clicking Fullscreen / View Photo button...');
  const triggerResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const fsBtn = document.querySelector('button[aria-label="Fullscreen"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('मोठे') || b.innerText.includes('Fullsize'));
        if (fsBtn) {
          fsBtn.click();
          return { clicked: true, label: fsBtn.getAttribute('aria-label') || fsBtn.innerText };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Trigger result:', triggerResult.result.value);
  await new Promise((r) => setTimeout(r, 1000));

  // Check if Lightbox modal is open
  const modalCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('[role="dialog"][aria-label="छायाचित्र दर्शक"]') ||
                      document.querySelector('[role="dialog"]');
        return {
          isOpen: !!modal,
          ariaLabel: modal ? modal.getAttribute('aria-label') : null,
          titleText: modal ? modal.querySelector('h3')?.innerText : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Lightbox Modal check:', modalCheck.result.value);

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/evidence_lightbox_confirmed_open.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved screenshot to scratch/evidence_lightbox_confirmed_open.png');

  // Test Next photo inside lightbox
  console.log('4. Testing Next slide inside Lightbox...');
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await new Promise((r) => setTimeout(r, 500));

  const afterNext = await send('Runtime.evaluate', {
    expression: `document.querySelector('[role="dialog"] h3')?.innerText`,
    returnByValue: true
  });
  console.log('Photo title after ArrowRight:', afterNext.result.value);

  // Close lightbox via Escape
  console.log('5. Closing Lightbox via Escape...');
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 500));

  const afterEscape = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('[role="dialog"]')`,
    returnByValue: true
  });
  console.log('Lightbox closed after Escape:', !afterEscape.result.value);

  ws.close();
  child.kill();
}

runDirectLightboxTest().catch(console.error);

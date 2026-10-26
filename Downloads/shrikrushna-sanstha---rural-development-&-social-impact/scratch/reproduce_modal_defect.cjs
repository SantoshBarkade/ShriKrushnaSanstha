const { spawn } = require('child_process');
const fs = require('fs');

async function testModalDefects() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9247',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9247/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- REPRODUCING MODAL OVERFLOW & POSITION DEFECTS ---');

  const viewports = [
    { name: 'desktop_1440x900', w: 1440, h: 900 },
    { name: 'laptop_1280x800', w: 1280, h: 800 },
    { name: 'tablet_768x1024', w: 768, h: 1024 },
    { name: 'mobile_390x844', w: 390, h: 844 },
    { name: 'mobile_small_360x640', w: 360, h: 640 }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 800
    });
    await new Promise((r) => setTimeout(r, 400));

    // Open first card with long description
    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        // Find read more button
        const btns = Array.from(document.querySelectorAll('article button')).filter(b => b.textContent.includes('वाचा') || b.textContent.includes('Read') || b.textContent.includes('माहिती'));
        if (btns.length === 0) return { error: 'No read more buttons' };

        btns[0].click();
        await new Promise(r => setTimeout(r, 400));

        const dialog = document.querySelector('[role="dialog"]');
        const modalBox = dialog ? dialog.querySelector('.bg-white') : null;
        const closeBtn = dialog ? dialog.querySelector('button[aria-label*="बंद"], button[aria-label*="Close"]') : null;

        if (!modalBox) return { error: 'Modal box not rendered' };

        const boxRect = modalBox.getBoundingClientRect();
        const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;

        const result = {
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          modalTop: Math.round(boxRect.top),
          modalBottom: Math.round(boxRect.bottom),
          modalHeight: Math.round(boxRect.height),
          modalWidth: Math.round(boxRect.width),
          isTopClipped: boxRect.top < 0,
          isBottomClipped: boxRect.bottom > window.innerHeight,
          isOverflowingViewport: boxRect.height > window.innerHeight,
          closeBtnTop: closeRect ? Math.round(closeRect.top) : null,
          closeBtnVisible: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false
        };

        // Close modal
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 300));

        return result;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log(`Viewport ${vp.name} result:`, evalRes.result.value);
  }

  ws.close();
  child.kill();
}

testModalDefects().catch(console.error);

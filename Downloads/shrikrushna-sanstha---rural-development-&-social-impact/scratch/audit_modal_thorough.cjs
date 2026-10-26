const { spawn } = require('child_process');
const fs = require('fs');

async function auditModalThorough() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9256',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9256/json').then((r) => r.json());
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

  console.log('--- THOROUGH MODAL ACCEPTANCE AUDIT ---');

  const testViewports = [
    { name: 'small_mobile_360x640', w: 360, h: 640 },
    { name: 'mobile_390x844', w: 390, h: 844 }
  ];

  const results = {};

  for (const vp of testViewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: true });
    await new Promise((r) => setTimeout(r, 500));

    const vpResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const tests = {};
        const btns = Array.from(document.querySelectorAll('article button')).filter(b => b.textContent.includes('वाचा') || b.textContent.includes('Read') || b.textContent.includes('माहिती'));
        if (btns.length === 0) return { error: 'No read more buttons' };

        const firstBtn = btns[0];
        firstBtn.focus();

        // 1. Open modal
        firstBtn.click();
        await new Promise(r => setTimeout(r, 350));

        const dialog = document.querySelector('[role="dialog"]');
        const modalBox = dialog?.querySelector('.bg-white');
        const stickyHeader = dialog?.querySelector('.sticky.top-0');
        const closeBtn = dialog?.querySelector('button[aria-label*="खिडकी"], button[aria-label*="Close"]');
        const scrollBody = dialog?.querySelector('.flex-1.min-h-0');
        const stickyFooter = dialog?.querySelector('.sticky.bottom-0');

        tests.bodyOverflowLocked = document.body.style.overflow === 'hidden';
        tests.modalRendered = Boolean(dialog && modalBox);

        const headerRect = stickyHeader?.getBoundingClientRect();
        const closeRect = closeBtn?.getBoundingClientRect();
        const footerRect = stickyFooter?.getBoundingClientRect();

        tests.headerVisibleAtTop = headerRect ? (headerRect.top >= 0 && headerRect.top < 50) : false;
        tests.closeBtnVisibleAtTop = closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false;
        tests.footerVisibleAtBottom = footerRect ? (footerRect.bottom <= window.innerHeight + 1) : false;

        // 2. Scroll to bottom
        if (scrollBody) {
          scrollBody.scrollTop = scrollBody.scrollHeight;
          await new Promise(r => setTimeout(r, 200));

          const closeRectAfterScroll = closeBtn?.getBoundingClientRect();
          const footerRectAfterScroll = stickyFooter?.getBoundingClientRect();

          tests.scrolledToBottom = (scrollBody.scrollHeight - scrollBody.clientHeight - scrollBody.scrollTop) <= 2;
          tests.closeBtnStillVisibleAfterScroll = closeRectAfterScroll ? (closeRectAfterScroll.top >= 0 && closeRectAfterScroll.bottom <= window.innerHeight) : false;
          tests.footerStillVisibleAfterScroll = footerRectAfterScroll ? (footerRectAfterScroll.bottom <= window.innerHeight + 1) : false;
        }

        // 3. Test Escape key dismissal & focus restoration
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 300));

        tests.dismissedViaEscape = document.querySelector('[role="dialog"]') === null;
        tests.bodyOverflowRestoredAfterEscape = document.body.style.overflow === '';
        tests.focusRestoredToButton = document.activeElement === firstBtn;

        // 4. Test Backdrop Click
        firstBtn.click();
        await new Promise(r => setTimeout(r, 350));
        const overlay = document.querySelector('[role="dialog"]');
        if (overlay) {
          // Click on the overlay (backdrop) outside the modal box
          overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5 }));
          await new Promise(r => setTimeout(r, 300));
        }
        tests.dismissedViaBackdrop = document.querySelector('[role="dialog"]') === null;

        // 5. Test Close Button Click
        firstBtn.click();
        await new Promise(r => setTimeout(r, 350));
        const closeBtn2 = document.querySelector('[role="dialog"] button[aria-label*="खिडकी"], [role="dialog"] button[aria-label*="Close"]');
        if (closeBtn2) {
          closeBtn2.click();
          await new Promise(r => setTimeout(r, 300));
        }
        tests.dismissedViaCloseButton = document.querySelector('[role="dialog"]') === null;

        return tests;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    results[vp.name] = vpResult.result.value;
    console.log(`${vp.name} results:`, vpResult.result.value);
  }

  fs.writeFileSync('scratch/modal_thorough_audit.json', JSON.stringify(results, null, 2));

  ws.close();
  child.kill();
}

auditModalThorough().catch(console.error);

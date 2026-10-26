const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runEventsAcceptanceAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9278;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/events'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

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

  const consoleErrors = [];
  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        consoleErrors.push(data.params.args.map((a) => a.value || a.description).join(' '));
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1200));

  const results = {
    viewports: [],
    overflowTests: [],
    filterTests: {},
    searchTests: {},
    modalTests: {},
    scrollFps: 60,
    consoleErrors: []
  };

  const viewports = [
    { name: 'events_1440_desktop.png', w: 1440, h: 900, m: false, label: '1440x900 Desktop' },
    { name: 'events_1280_laptop.png', w: 1280, h: 800, m: false, label: '1280x800 Laptop' },
    { name: 'events_768_tablet.png', w: 768, h: 1024, m: true, label: '768x1024 Tablet' },
    { name: 'events_390_mobile.png', w: 390, h: 844, m: true, label: '390x844 Mobile' },
    { name: 'events_360_mobile.png', w: 360, h: 640, m: true, label: '360x640 Small Mobile' }
  ];

  // 1. Viewport captures and overflow checks
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.m
    });
    await new Promise((r) => setTimeout(r, 600));

    const overflowEval = await send('Runtime.evaluate', {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    results.overflowTests.push({
      viewport: vp.label,
      ...overflowEval.result.value
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    results.viewports.push({ name: vp.name, viewport: vp.label });
    console.log(`Captured ${vp.name} (Overflow: ${overflowEval.result.value.hasHorizontalOverflow})`);
  }

  // Set back to 1440 desktop for interaction testing
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 500));

  // 2. Test Tab Switch: Filter to Events (0 items)
  const clickEventsTab = await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const eventTab = tabs.find(t => t.textContent.includes('कार्यक्रम'));
      if (eventTab) {
        eventTab.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));
  const eventTabShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'events_tab_empty_1440.png'), Buffer.from(eventTabShot.data, 'base64'));
  results.filterTests.eventsTabClicked = clickEventsTab.result.value;

  // 3. Test Tab Switch: Filter to Announcements (2 items)
  const clickAnnouncementsTab = await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const annTab = tabs.find(t => t.textContent.includes('बातम्या व सूचना'));
      if (annTab) {
        annTab.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));
  const annTabShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'events_announcements_tab_1440.png'), Buffer.from(annTabShot.data, 'base64'));
  results.filterTests.announcementsTabClicked = clickAnnouncementsTab.result.value;

  // 4. Test Tab Switch back to All
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const allTab = tabs.find(t => t.textContent.includes('सर्व'));
      if (allTab) allTab.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Test Real-time Search
  const searchEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'RTE');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));
  const searchShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'events_search_rte_1440.png'), Buffer.from(searchShot.data, 'base64'));
  results.searchTests.searchedRte = searchEval.result.value;

  // Clear search
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // 6. Test Interactive Details Modal
  const openModalEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const detailBtns = Array.from(document.querySelectorAll('button')).filter(b =>
        b.textContent.includes('सविस्तर सूचना वाचा') || b.textContent.includes('सविस्तर माहिती पहा')
      );
      if (detailBtns.length > 0) {
        detailBtns[0].click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 700));

  // Verify modal is open in DOM
  const modalCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      return {
        isOpen: Boolean(modal),
        title: modal?.querySelector('#news-modal-title')?.textContent?.trim() || null,
        bodyLocked: document.body.style.overflow === 'hidden'
      };
    })()`,
    returnByValue: true
  });
  results.modalTests = modalCheck.result.value;

  const modalShot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'events_modal_open_1440.png'), Buffer.from(modalShot1440.data, 'base64'));
  console.log('Captured events_modal_open_1440.png');

  // Also capture modal on 390 mobile
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 600));
  const modalShot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'events_modal_open_390.png'), Buffer.from(modalShot390.data, 'base64'));
  console.log('Captured events_modal_open_390.png');

  // Dismiss modal via Escape key
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 600));

  const modalDismissCheck = await send('Runtime.evaluate', {
    expression: `({
      modalStillPresent: Boolean(document.querySelector('[role="dialog"]')),
      bodyOverflowRestored: document.body.style.overflow !== 'hidden'
    })`,
    returnByValue: true
  });
  results.modalTests.dismissalVerified = !modalDismissCheck.result.value.modalStillPresent;
  results.modalTests.bodyRestored = modalDismissCheck.result.value.bodyOverflowRestored;

  // 7. Measure Scroll FPS
  const fpsEval = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function check(now) {
        frames++;
        if (now - start >= 600) {
          resolve(Math.round((frames * 1000) / (now - start)));
        } else {
          window.scrollBy(0, 10);
          requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  results.scrollFps = fpsEval.result.value;

  results.consoleErrors = consoleErrors;

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'events_live_audit_results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('Audit Results:', JSON.stringify(results, null, 2));

  ws.close();
  child.kill();
  console.log('Events acceptance audit completed successfully.');
}

runEventsAcceptanceAudit().catch(console.error);

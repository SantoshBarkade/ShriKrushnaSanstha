const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function validateReportsLive() {
  console.log('=== STARTING LIVE REPORTS AUDIT ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9274;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/reports'
  ]);

  await new Promise((r) => setTimeout(r, 2200));

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
  if (!target) {
    console.error('No page target found');
    child.kill();
    return;
  }

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
  const networkErrors = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Network.responseReceived') {
      const { response } = msg.params;
      if (response && response.status >= 400) {
        networkErrors.push(`${response.status} ${response.url}`);
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const auditReport = {
    timestamp: new Date().toISOString(),
    viewports: {},
    interactions: {},
    performance: {},
    consoleErrors,
    networkErrors
  };

  // Wait 1.5s for React render and state hydration
  await new Promise((r) => setTimeout(r, 1500));

  console.log('--- Step 1: Multi-Viewport Inspection of #/reports ---');
  const viewports = [
    { key: '1440_desktop', file: 'reports_1440_desktop.png', w: 1440, h: 900, m: false },
    { key: '1280_laptop', file: 'reports_1280_laptop.png', w: 1280, h: 800, m: false },
    { key: '768_tablet', file: 'reports_768_tablet.png', w: 768, h: 1024, m: true },
    { key: '390_mobile', file: 'reports_390_mobile.png', w: 390, h: 844, m: true },
    { key: '360_mobile', file: 'reports_360_mobile.png', w: 360, h: 640, m: true },
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.m
    });
    await new Promise((r) => setTimeout(r, 600));

    const metrics = await send('Runtime.evaluate', {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        reportCards: document.querySelectorAll('main div.grid > div').length
      })`,
      returnByValue: true
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACTS_DIR, vp.file);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

    auditReport.viewports[vp.key] = {
      ...metrics.result.value,
      screenshot: vp.file
    };
    console.log(`- Reports ${vp.key}: overflow=${metrics.result.value.hasOverflow}, cards=${metrics.result.value.reportCards}`);
  }

  console.log('--- Step 2: Testing Category Filter Interaction ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 300));

  // Click second category button (e.g. शैक्षणिक अहवाल)
  const catClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('main button'));
      const eduBtn = btns.find(b => b.textContent && b.textContent.includes('शैक्षणिक अहवाल'));
      if (eduBtn) {
        eduBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const filteredCatCount = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('main div.grid > div').length`,
    returnByValue: true
  });
  const catFilterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_category_filter_1440.png'), Buffer.from(catFilterShot.data, 'base64'));

  auditReport.interactions.categoryFilter = {
    clicked: catClick.result.value,
    renderedCards: filteredCatCount.result.value,
    screenshot: 'reports_category_filter_1440.png'
  };
  console.log(`- Category filter clicked: rendered=${filteredCatCount.result.value}`);

  // Reset category filter
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('main button'));
      const allBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('सर्व'));
      if (allBtn) allBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- Step 3: Testing Search Filter Interaction ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"text\"]');
      if (input) {
        input.value = 'पर्यावरण';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const searchCount = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('main div.grid > div').length`,
    returnByValue: true
  });
  const searchShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_search_active_1440.png'), Buffer.from(searchShot.data, 'base64'));

  auditReport.interactions.searchFilter = {
    searchTerm: 'पर्यावरण',
    renderedCards: searchCount.result.value,
    screenshot: 'reports_search_active_1440.png'
  };
  console.log(`- Search query applied: rendered=${searchCount.result.value}`);

  // Clear search input
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"text\"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- Step 4: Testing Document Details Modal Dialog ---');
  // Click first card's "तपशील पहा" button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('main button'));
      const detailsBtn = btns.find(b => b.textContent && b.textContent.includes('तपशील पहा'));
      if (detailsBtn) detailsBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const modalVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('div[role=\"dialog\"][aria-modal=\"true\"]')`,
    returnByValue: true
  });

  const modalShot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_modal_open_1440.png'), Buffer.from(modalShot1440.data, 'base64'));

  // Mobile modal capture
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 400));
  const modalShot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_modal_open_390.png'), Buffer.from(modalShot390.data, 'base64'));

  // Press Escape to close modal
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const modalClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('div[role=\"dialog\"]')`,
    returnByValue: true
  });

  auditReport.interactions.detailsModal = {
    visible: modalVisible.result.value,
    closedOnEscape: modalClosed.result.value,
    screenshots: ['reports_modal_open_1440.png', 'reports_modal_open_390.png']
  };
  console.log(`- Document Details Modal: visible=${modalVisible.result.value}, closedOnEscape=${modalClosed.result.value}`);

  console.log('--- Step 5: Testing Document Download Action & Toast Notice ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 300));

  // Click first card's download button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('main div.grid > div button'));
      const dlBtn = btns[btns.length - 1];
      if (dlBtn) dlBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const noticeVisible = await send('Runtime.evaluate', {
    expression: `(() => {
      const statusDiv = document.querySelector('div[role=\"status\"]');
      return statusDiv ? statusDiv.textContent.trim() : null;
    })()`,
    returnByValue: true
  });

  const noticeShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_download_notice_1440.png'), Buffer.from(noticeShot.data, 'base64'));

  auditReport.interactions.downloadAction = {
    noticeMessage: noticeVisible.result.value,
    screenshot: 'reports_download_notice_1440.png'
  };
  console.log(`- Download action notice triggered: "${noticeVisible.result.value?.slice(0, 60)}..."`);

  console.log('--- Step 6: Testing Empty Search State ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"text\"]');
      if (input) {
        input.value = 'xyznonexistent123';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const emptyStateRendered = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('main div.grid > div').length === 0 && document.body.textContent.includes('कोणतेही अहवाल सापडले नाहीत')`,
    returnByValue: true
  });
  const emptyShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_empty_search_1440.png'), Buffer.from(emptyShot.data, 'base64'));

  auditReport.interactions.emptyState = {
    rendered: emptyStateRendered.result.value,
    screenshot: 'reports_empty_search_1440.png'
  };
  console.log(`- Empty search state rendered: ${emptyStateRendered.result.value}`);

  // Reset back to normal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('main button'));
      const resetBtn = btns.find(b => b.textContent && b.textContent.includes('सर्व अहवाल पहा'));
      if (resetBtn) resetBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('--- Step 7: Scroll Performance Benchmark ---');
  const perfData = await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      let frames = 0;
      let start = performance.now();
      let lastTime = start;
      const frameDeltas = [];

      function step(now) {
        frameDeltas.push(now - lastTime);
        lastTime = now;
        frames++;
        window.scrollBy(0, 35);

        if (now - start < 1500) {
          requestAnimationFrame(step);
        } else {
          const durationSec = (now - start) / 1000;
          const fps = frames / durationSec;
          const jankFrames = frameDeltas.filter(d => d > 33.3).length;
          resolve({
            fps: parseFloat(fps.toFixed(1)),
            frames,
            jankFrames,
            avgFrameMs: parseFloat((1000 / fps).toFixed(2))
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  auditReport.performance = perfData.result.value;
  console.log(`- Scroll Performance: ${perfData.result.value.fps} FPS, avg ${perfData.result.value.avgFrameMs}ms, jank=${perfData.result.value.jankFrames}`);

  ws.close();
  child.kill();

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reports_live_audit_results.json'), JSON.stringify(auditReport, null, 2));
  console.log('=== LIVE REPORTS AUDIT FINISHED SUCCESSFULLY ===');
}

validateReportsLive().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});

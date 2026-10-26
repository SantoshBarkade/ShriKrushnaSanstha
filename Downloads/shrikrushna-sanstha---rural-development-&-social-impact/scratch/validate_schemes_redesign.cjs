const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function validateSchemes() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9261',
    '--disable-gpu',
    'http://localhost:5173/#/schemes'
  ]);

  await new Promise((r) => setTimeout(r, 2200));

  let list = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      list = await fetch('http://127.0.0.1:9261/json').then((r) => r.json());
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
      const { status, url } = msg.params.response;
      if (status >= 400 && !url.includes('favicon')) {
        networkErrors.push({ url, status });
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('--- VALIDATING GOVERNMENT SCHEMES REDESIGN ---');

  // Verify navigation to #/schemes
  await send('Runtime.evaluate', {
    expression: `(() => {
      if (!window.location.hash.includes('schemes')) {
        window.location.hash = '#/schemes';
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Initial Content Audit
  const initialAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent.trim());
      const schemeCards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      const officialLinks = Array.from(document.querySelectorAll('a[href*="gov.in"]')).map(a => a.href);
      return {
        hash: window.location.hash,
        headings,
        schemeCards,
        officialLinks,
        cardsCount: schemeCards.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Initial Audit Result:', JSON.stringify(initialAudit.result.value, null, 2));

  // 1. Multi-Viewport Captures & Overflow Audits
  const viewports = [
    { name: 'schemes_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'schemes_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'schemes_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'schemes_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'schemes_360_mobile.png', width: 360, height: 640, mobile: true }
  ];

  const overflowResults = [];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    console.log(`Captured: ${vp.name}`);

    const docEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        return {
          viewport: '${vp.name}',
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth
        };
      })()`,
      returnByValue: true
    });
    overflowResults.push(docEval.result.value);
  }
  console.log('Overflow Results:', JSON.stringify(overflowResults, null, 2));

  // 2. Modal Open Test & Viewport Clipping Verification
  console.log('Testing Scheme Details Modal...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  // Click the first "तपशील व निकष" button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const detailsBtn = btns.find(b => b.textContent.includes('तपशील') || b.textContent.includes('Details'));
      if (detailsBtn) detailsBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const modalDesktopShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'schemes_modal_open_1440.png'), Buffer.from(modalDesktopShot.data, 'base64'));
  console.log('Captured: schemes_modal_open_1440.png');

  // Also capture modal on mobile (390px) to verify zero clipping
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 600));

  const modalAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { open: false };
      const dialogBox = modal.querySelector('.max-h-\\\\[90vh\\\\]');
      const rect = dialogBox ? dialogBox.getBoundingClientRect() : null;
      return {
        open: true,
        dialogRect: rect ? { top: rect.top, bottom: rect.bottom, height: rect.height, windowHeight: window.innerHeight } : null,
        fitsInViewport: rect ? (rect.bottom <= window.innerHeight && rect.top >= 0) : true
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Modal Audit:', JSON.stringify(modalAudit.result.value, null, 2));

  const modalMobileShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'schemes_modal_open_390.png'), Buffer.from(modalMobileShot.data, 'base64'));
  console.log('Captured: schemes_modal_open_390.png');

  // Close modal via Escape
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 500));

  // 3. Search and Filter Interactivity Test
  console.log('Testing Search & Department Filter...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const searchTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return { success: false, reason: 'Input not found' };

      // Simulate typing 'श्रावणबाळ'
      input.value = 'श्रावणबाळ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { success: true };
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const afterSearchAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      return { cards, count: cards.length };
    })()`,
    returnByValue: true
  });
  console.log('Search Filter Result ("श्रावणबाळ"):', JSON.stringify(afterSearchAudit.result.value, null, 2));

  // Reset search
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Bilingual Language Switch Test
  console.log('Testing Bilingual Language Switch...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const langBtns = Array.from(document.querySelectorAll('button'));
      const enBtn = langBtns.find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const englishAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const title = document.querySelector('h1')?.textContent.trim();
      const cards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      return { h1: title, cards };
    })()`,
    returnByValue: true
  });
  console.log('English Mode Audit:', JSON.stringify(englishAudit.result.value, null, 2));

  // Switch back to Marathi
  await send('Runtime.evaluate', {
    expression: `(() => {
      const langBtns = Array.from(document.querySelectorAll('button'));
      const mrBtn = langBtns.find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Scroll Performance Test
  console.log('Profiling Scroll Performance...');
  const perfResult = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frames = [];
      let lastTime = performance.now();
      let longFrames = 0;

      function onFrame(now) {
        const delta = now - lastTime;
        lastTime = now;
        frames.push(delta);
        if (delta > 33.3) longFrames++;

        window.scrollBy(0, 15);
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
        }

        if (frames.length < 60) {
          requestAnimationFrame(onFrame);
        } else {
          const totalMs = frames.reduce((a, b) => a + b, 0);
          const avgFps = Math.round((frames.length / (totalMs / 1000)) * 10) / 10;
          resolve({
            totalFrames: frames.length,
            avgFps,
            avgFrameTimeMs: Math.round((totalMs / frames.length) * 100) / 100,
            longFramesCount: longFrames
          });
        }
      }
      requestAnimationFrame(onFrame);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Performance Audit Result:', JSON.stringify(perfResult.result.value, null, 2));

  console.log('Console Errors:', consoleErrors);
  console.log('Network Errors:', networkErrors);

  ws.close();
  child.kill();
  console.log('Validation complete.');
}

validateSchemes().catch((err) => {
  console.error('Validation script error:', err);
  process.exit(1);
});

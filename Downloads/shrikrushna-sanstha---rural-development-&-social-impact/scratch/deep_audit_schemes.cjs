const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runDeepAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9265',
    '--disable-gpu',
    'http://localhost:5173/#/schemes'
  ]);

  await new Promise((r) => setTimeout(r, 2200));

  let list = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      list = await fetch('http://127.0.0.1:9265/json').then((r) => r.json());
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

  console.log('=== STARTING DEEP AUDIT FOR GOVERNMENT SCHEMES ===');

  // Set default desktop metrics
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 1000));

  // TEST 1: End-to-End Data Model & Card Inventory
  console.log('\n--- 1. CARD INVENTORY AUDIT ---');
  const cardInventory = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('h2')).map((h2, idx) => {
        const cardElem = h2.closest('.rounded-2xl');
        const dept = cardElem ? cardElem.querySelector('.text-\\\\[11px\\\\] span:last-child')?.textContent.trim() : null;
        const beneficiary = cardElem ? cardElem.querySelector('.bg-slate-50 span:last-child')?.textContent.trim() : null;
        const summary = cardElem ? cardElem.querySelector('p')?.textContent.trim() : null;
        const portalLink = cardElem ? cardElem.querySelector('a[href]')?.href : null;
        return {
          idx,
          title: h2.textContent.trim(),
          dept,
          beneficiary,
          summary,
          portalLink
        };
      });
      return { totalCards: cards.length, cards };
    })()`,
    returnByValue: true
  });
  console.log('Card Inventory:', JSON.stringify(cardInventory.result.value, null, 2));

  // TEST 2: Individual Card-to-Modal Matching & State Cleanup
  console.log('\n--- 2. PER-SCHEME CARD-TO-MODAL ACCURACY AUDIT ---');
  const modalAuditResults = [];

  for (let cardIdx = 0; cardIdx < 3; cardIdx++) {
    // Click View Details button for specific card
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const detailBtns = btns.filter(b => b.textContent.includes('तपशील व निकष') || b.textContent.includes('View Details'));
        if (detailBtns[${cardIdx}]) {
          detailBtns[${cardIdx}].click();
        }
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Inspect modal contents
    const modalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return { open: false };
        const title = modal.querySelector('#modal-scheme-title')?.textContent.trim();
        const dept = modal.querySelector('.text-amber-300 span')?.textContent.trim();
        const beneficiary = modal.querySelector('.bg-blue-50\\\\/70 p')?.textContent.trim();
        const summary = modal.querySelector('.text-slate-600')?.textContent.trim();
        const portalLink = modal.querySelector('a[href]')?.href;
        return {
          open: true,
          cardIdx: ${cardIdx},
          title,
          dept,
          beneficiary,
          summary,
          portalLink
        };
      })()`,
      returnByValue: true
    });
    modalAuditResults.push(modalData.result.value);

    // Dismiss modal via Escape key
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log('Modal Audit Results (3 cards):', JSON.stringify(modalAuditResults, null, 2));

  // TEST 3: Bilingual Language Switch Audit
  console.log('\n--- 3. BILINGUAL LANGUAGE SWITCH AUDIT ---');
  // Switch to EN
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const enCards = await send('Runtime.evaluate', {
    expression: `(() => {
      const pageH1 = document.querySelector('h1')?.textContent.trim();
      const cards = Array.from(document.querySelectorAll('h2')).map(h2 => h2.textContent.trim());
      return { pageH1, cards };
    })()`,
    returnByValue: true
  });
  console.log('English Mode Cards:', JSON.stringify(enCards.result.value, null, 2));

  // Open first modal in English to verify English fields
  await send('Runtime.evaluate', {
    expression: `(() => {
      const detailBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('View Details'));
      if (detailBtns[0]) detailBtns[0].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const enModalData = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return null;
      return {
        title: modal.querySelector('#modal-scheme-title')?.textContent.trim(),
        dept: modal.querySelector('.text-amber-300 span')?.textContent.trim(),
        beneficiary: modal.querySelector('.bg-blue-50\\\\/70 p')?.textContent.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('English Modal 1 Content:', JSON.stringify(enModalData.result.value, null, 2));

  // Close modal and switch back to Marathi
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // TEST 4: Search & Category Filter Interactivity
  console.log('\n--- 4. SEARCH & FILTER INTERACTIVITY AUDIT ---');
  // 4a. Search "श्रावणबाळ"
  const searchTest1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, 'श्रावणबाळ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const cards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      return { query: 'श्रावणबाळ', cards, count: cards.length };
    })()`,
    returnByValue: true
  });
  console.log('Search "श्रावणबाळ":', JSON.stringify(searchTest1.result.value, null, 2));

  // 4b. Search English "e-shram"
  const searchTest2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, 'e-shram');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const cards = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      return { query: 'e-shram', cards, count: cards.length };
    })()`,
    returnByValue: true
  });
  console.log('Search "e-shram" (Bilingual match):', JSON.stringify(searchTest2.result.value, null, 2));

  // 4c. Search Non-existent
  const searchTest3 = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, 'XYZNOTFOUND');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const emptyMsg = document.querySelector('.max-w-xl h2')?.textContent.trim();
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('फिल्टर पुसा') || b.textContent.includes('Clear Filters'));
      return { query: 'XYZNOTFOUND', emptyStateShown: Boolean(emptyMsg), emptyMsg, hasResetBtn: Boolean(resetBtn) };
    })()`,
    returnByValue: true
  });
  console.log('Search "XYZNOTFOUND" (Empty state):', JSON.stringify(searchTest3.result.value, null, 2));

  // 4d. Clear search
  await send('Runtime.evaluate', {
    expression: `(() => {
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('फिल्टर पुसा') || b.textContent.includes('Clear Filters'));
      if (resetBtn) resetBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // TEST 5: Route Navigation & History Regression
  console.log('\n--- 5. NAVIGATION & ROUTE REGRESSION AUDIT ---');
  // 5a. Check direct #/schemes load
  const routeCheck1 = await send('Runtime.evaluate', {
    expression: `({ hash: window.location.hash, title: document.title })`,
    returnByValue: true
  });
  console.log('Direct Route State:', routeCheck1.result.value);

  // 5b. Navigate to About Us
  await send('Runtime.evaluate', {
    expression: `(() => {
      const navBtns = Array.from(document.querySelectorAll('header nav button, header nav a'));
      const aboutBtn = navBtns.find(b => b.textContent.includes('संस्थेविषयी') || b.textContent.includes('About'));
      if (aboutBtn) aboutBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const aboutState = await send('Runtime.evaluate', {
    expression: `({ hash: window.location.hash, title: document.title })`,
    returnByValue: true
  });
  console.log('Navigated to About State:', aboutState.result.value);

  // 5c. On About page, click "शासकीय योजना कक्ष" button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const schemesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('शासकीय योजना कक्ष') || b.textContent.includes('Explore Welfare Desk'));
      if (schemesBtn) schemesBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const returnFromAbout = await send('Runtime.evaluate', {
    expression: `({ hash: window.location.hash, title: document.title })`,
    returnByValue: true
  });
  console.log('Returned to Schemes from About:', returnFromAbout.result.value);

  // 5d. In Footer, click "शासकीय योजना" link
  await send('Runtime.evaluate', {
    expression: `(() => {
      const footerLinks = Array.from(document.querySelectorAll('footer a, footer button'));
      const schemesLink = footerLinks.find(b => b.textContent.includes('शासकीय योजना') || b.textContent.includes('Government Schemes'));
      if (schemesLink) schemesLink.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const footerState = await send('Runtime.evaluate', {
    expression: `({ hash: window.location.hash, title: document.title })`,
    returnByValue: true
  });
  console.log('Footer link navigation State:', footerState.result.value);

  // TEST 6: Multi-Viewport & Layout Shifts
  console.log('\n--- 6. MULTI-VIEWPORT AUDIT ---');
  const viewports = [
    { name: 'schemes_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'schemes_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'schemes_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'schemes_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'schemes_360_mobile.png', width: 360, height: 640, mobile: true }
  ];

  const viewportMetrics = [];
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

    const evalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        return {
          viewport: '${vp.name}',
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth
        };
      })()`,
      returnByValue: true
    });
    viewportMetrics.push(evalData.result.value);
  }
  console.log('Viewport metrics:', JSON.stringify(viewportMetrics, null, 2));

  // TEST 7: High-Precision Scroll Performance & Frame-Time Distribution
  console.log('\n--- 7. PERFORMANCE BENCHMARKS ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 500));

  const perfAudit = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let deltas = [];
      let lastTime = performance.now();
      let longTasks = 0;

      function onFrame(now) {
        const delta = now - lastTime;
        lastTime = now;
        deltas.push(delta);
        if (delta > 33.3) longTasks++;

        window.scrollBy(0, 15);
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
        }

        if (deltas.length < 80) {
          requestAnimationFrame(onFrame);
        } else {
          const totalMs = deltas.reduce((a, b) => a + b, 0);
          const avgFps = Math.round((deltas.length / (totalMs / 1000)) * 10) / 10;
          const p95 = deltas.slice().sort((a,b)=>a-b)[Math.floor(deltas.length * 0.95)];
          resolve({
            totalFrames: deltas.length,
            avgFps,
            avgFrameTimeMs: Math.round((totalMs / deltas.length) * 100) / 100,
            p95FrameTimeMs: Math.round(p95 * 100) / 100,
            longTasksCount: longTasks
          });
        }
      }
      requestAnimationFrame(onFrame);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Desktop Scroll Performance:', JSON.stringify(perfAudit.result.value, null, 2));

  console.log('\nConsole Errors:', consoleErrors);
  console.log('Network Errors:', networkErrors);

  ws.close();
  child.kill();
  console.log('=== DEEP AUDIT COMPLETE ===');
}

runDeepAudit().catch((err) => {
  console.error('Deep audit script error:', err);
  process.exit(1);
});

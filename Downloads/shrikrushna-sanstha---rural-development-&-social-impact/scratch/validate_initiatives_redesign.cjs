const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runValidation() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9244',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9244/json').then((r) => r.json());
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

  // Track errors
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

  console.log('--- VALIDATING INITIATIVES REDESIGN ---');

  const report = {
    viewports: [],
    interactions: {},
    bilingual: {},
    desktopPerf: {},
    mobilePerf4x: {},
    consoleErrors,
    networkErrors
  };

  // 1. Viewport Tests & Screenshots
  const viewports = [
    { name: 'initiatives_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'initiatives_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'initiatives_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'initiatives_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'initiatives_360_mobile.png', width: 360, height: 740, mobile: true }
  ];

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
    console.log(`Saved screenshot: ${vp.name}`);

    const docEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth === 0 && !img.src.includes('data:'));
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth,
          cardsCount: document.querySelectorAll('article').length,
          brokenImagesCount: brokenImages.length
        };
      })()`,
      returnByValue: true
    });

    report.viewports.push({
      viewport: vp.name,
      ...docEval.result.value
    });
  }

  // Also capture work timeline screenshot
  await send('Page.navigate', { url: 'http://localhost:5173/#/work' });
  await new Promise((r) => setTimeout(r, 800));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const workShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'work_1440_desktop.png'), Buffer.from(workShot.data, 'base64'));
  console.log('Saved screenshot: work_1440_desktop.png');

  // Navigate back to initiatives
  await send('Page.navigate', { url: 'http://localhost:5173/#/initiatives' });
  await new Promise((r) => setTimeout(r, 800));

  // 2. Interactive Search Test
  console.log('Testing live search filtering...');
  const searchTest = await send('Runtime.evaluate', {
    expression: `(async () => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return { error: 'Search input not found' };

      // Type "शिक्षण"
      input.value = 'शिक्षण';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      const filteredCount = document.querySelectorAll('article').length;

      // Clear search
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      const resetCount = document.querySelectorAll('article').length;

      return {
        typedQuery: 'शिक्षण',
        filteredCount,
        resetCount
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.interactions.search = searchTest.result.value;
  console.log('Search test result:', report.interactions.search);

  // 3. Category Filter Test
  console.log('Testing category filter tabs...');
  const categoryTest = await send('Runtime.evaluate', {
    expression: `(async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const schemesBtn = buttons.find(b => b.textContent && b.textContent.includes('शासकीय योजना'));
      if (!schemesBtn) return { error: 'Schemes button not found' };

      schemesBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const schemesCount = document.querySelectorAll('article').length;

      // Click "All"
      const allBtn = buttons.find(b => b.textContent && b.textContent.includes('सर्व उपक्रम'));
      if (allBtn) allBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const allCount = document.querySelectorAll('article').length;

      return {
        schemesCategoryItems: schemesCount,
        allCategoryItems: allCount
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.interactions.category = categoryTest.result.value;
  console.log('Category filter test result:', report.interactions.category);

  // 4. Modal Open, Escape Dismissal, and Close Button Test
  console.log('Testing detail modal interactions...');
  const modalTest = await send('Runtime.evaluate', {
    expression: `(async () => {
      const readMoreButtons = Array.from(document.querySelectorAll('article button'));
      if (readMoreButtons.length === 0) return { error: 'No read more buttons found' };

      // Step 1: Click first card button
      readMoreButtons[0].click();
      await new Promise(r => setTimeout(r, 350));

      const modalDialog = document.querySelector('[role="dialog"]');
      const modalOpen = Boolean(modalDialog);
      const modalTitle = document.getElementById('initiative-modal-title')?.textContent?.trim() || '';

      // Step 2: Test Escape key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(r => setTimeout(r, 350));
      const modalDismissedViaEscape = document.querySelector('[role="dialog"]') === null;

      // Step 3: Open second card
      if (readMoreButtons[1]) {
        readMoreButtons[1].click();
        await new Promise(r => setTimeout(r, 350));
      }
      const modal2Open = Boolean(document.querySelector('[role="dialog"]'));
      const modal2Title = document.getElementById('initiative-modal-title')?.textContent?.trim() || '';

      // Step 4: Click Close button
      const closeButtons = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const closeBtn = closeButtons.find(b => b.textContent?.includes('बंद करा') || b.getAttribute('aria-label')?.includes('बंद करा'));
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 350));
      const modalDismissedViaButton = document.querySelector('[role="dialog"]') === null;

      return {
        step1_modalOpen: modalOpen,
        step1_modalTitle: modalTitle,
        step2_escapeDismissed: modalDismissedViaEscape,
        step3_modal2Open: modal2Open,
        step3_modal2Title: modal2Title,
        step4_buttonDismissed: modalDismissedViaButton
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.interactions.modal = modalTest.result.value;
  console.log('Modal test result:', report.interactions.modal);

  // 5. Bilingual Rendering Test
  console.log('Testing bilingual Marathi/English rendering...');
  const marathiState = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const firstCardTitle = document.querySelector('article h3')?.textContent?.trim() || '';
      const firstCardCategory = document.querySelector('article span')?.textContent?.trim() || '';
      return { h1, firstCardTitle, firstCardCategory };
    })()`,
    returnByValue: true
  });
  report.bilingual.marathi = marathiState.result.value;

  // Toggle to English by clicking header language toggle
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('header button, nav button'));
      const langBtn = btns.find(b => b.textContent && (b.textContent.includes('English') || b.textContent.includes('EN')));
      if (langBtn) langBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const englishState = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const firstCardTitle = document.querySelector('article h3')?.textContent?.trim() || '';
      const firstCardCategory = document.querySelector('article span')?.textContent?.trim() || '';
      return { h1, firstCardTitle, firstCardCategory };
    })()`,
    returnByValue: true
  });
  report.bilingual.english = englishState.result.value;

  // Toggle back to Marathi
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('header button, nav button'));
      const langBtn = btns.find(b => b.textContent && (b.textContent.includes('मराठी') || b.textContent.includes('MR')));
      if (langBtn) langBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // 6. Desktop Scroll Performance Benchmark (1x)
  console.log('Profiling desktop scroll performance (1x)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  const desktopPerf = await send('Runtime.evaluate', {
    expression: `(async () => {
      let frames = [];
      let lastTime = performance.now();
      let animId;
      function record(t) {
        frames.push(t - lastTime);
        lastTime = t;
        animId = requestAnimationFrame(record);
      }
      animId = requestAnimationFrame(record);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      for (let i = steps; i >= 0; i--) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      cancelAnimationFrame(animId);

      const frameTimes = frames.slice(2);
      const totalTime = frameTimes.reduce((a, b) => a + b, 0);
      const avgFrameTime = totalTime / frameTimes.length;
      const avgFps = 1000 / avgFrameTime;
      const longFrames = frameTimes.filter(f => f > 20).length;

      let cls = 0;
      try {
        const entries = performance.getEntriesByType('layout-shift');
        for (const entry of entries) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
      } catch (e) {}

      return {
        totalFrames: frameTimes.length,
        avgFps: Math.round(avgFps * 10) / 10,
        avgFrameTimeMs: Math.round(avgFrameTime * 100) / 100,
        longFramesCount: longFrames,
        cls: Math.round(cls * 10000) / 10000
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.desktopPerf = desktopPerf.result.value;
  console.log('Desktop Performance:', report.desktopPerf);

  // 7. Mobile Scroll Performance Benchmark (4x CPU Throttled)
  console.log('Profiling mobile scroll performance (4x CPU throttle)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const mobilePerf = await send('Runtime.evaluate', {
    expression: `(async () => {
      let frames = [];
      let lastTime = performance.now();
      let animId;
      function record(t) {
        frames.push(t - lastTime);
        lastTime = t;
        animId = requestAnimationFrame(record);
      }
      animId = requestAnimationFrame(record);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      for (let i = steps; i >= 0; i--) {
        window.scrollTo(0, (maxScroll / steps) * i);
        await new Promise(r => setTimeout(r, 16));
      }
      cancelAnimationFrame(animId);

      const frameTimes = frames.slice(2);
      const totalTime = frameTimes.reduce((a, b) => a + b, 0);
      const avgFrameTime = totalTime / frameTimes.length;
      const avgFps = 1000 / avgFrameTime;
      const longFrames = frameTimes.filter(f => f > 20).length;

      let cls = 0;
      try {
        const entries = performance.getEntriesByType('layout-shift');
        for (const entry of entries) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
      } catch (e) {}

      return {
        totalFrames: frameTimes.length,
        avgFps: Math.round(avgFps * 10) / 10,
        avgFrameTimeMs: Math.round(avgFrameTime * 100) / 100,
        longFramesCount: longFrames,
        cls: Math.round(cls * 10000) / 10000
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.mobilePerf4x = mobilePerf.result.value;
  console.log('Mobile 4x Performance:', report.mobilePerf4x);

  fs.writeFileSync('scratch/initiatives_redesign_validation.json', JSON.stringify(report, null, 2));
  console.log('Full report written to scratch/initiatives_redesign_validation.json');

  ws.close();
  child.kill();
}

runValidation().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});

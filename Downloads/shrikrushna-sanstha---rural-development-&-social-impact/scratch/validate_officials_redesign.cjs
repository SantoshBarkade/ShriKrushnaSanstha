const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function validateOfficialsRedesign() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9240/json').then((r) => r.json());
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

  const networkErrors = [];
  const consoleErrors = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.responseReceived') {
      const res = msg.params.response;
      if (res.status >= 400) {
        networkErrors.push({ status: res.status, url: res.url });
      }
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Performance.enable');

  const validationResults = {
    viewports: [],
    desktopPerformance: null,
    mobilePerformance4x: null,
    interactions: {},
    consoleErrors,
    networkErrors
  };

  // 1. Viewports Audit & Screenshots
  const testViewports = [
    { name: 'officials_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'officials_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'officials_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'officials_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'officials_360_mobile.png', width: 360, height: 740, mobile: true }
  ];

  for (const vp of testViewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });

    await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
    await new Promise((r) => setTimeout(r, 1200));

    // Capture screenshot for major viewports
    if (['officials_1440_desktop.png', 'officials_768_tablet.png', 'officials_390_mobile.png'].includes(vp.name)) {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const outPath = path.join(ARTIFACTS_DIR, vp.name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot:', outPath);
    }

    const vpData = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const brokenImgs = Array.from(document.querySelectorAll('img')).filter(
          img => img.naturalWidth === 0
        ).map(img => img.src);
        return {
          name: '${vp.name}',
          scrollWidth: scrollW,
          clientWidth: clientW,
          hasHorizontalOverflow: scrollW > clientW,
          brokenImagesCount: brokenImgs.length,
          brokenImages: brokenImgs,
          officialsRendered: document.querySelectorAll('.grid > div').length
        };
      })()`,
      returnByValue: true
    });
    validationResults.viewports.push(vpData.result.value);
  }

  // 2. Desktop Performance Trace (1440x900)
  console.log('Measuring desktop performance...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise((r) => setTimeout(r, 1500));

  const deskTrace = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      let cls = 0;
      try {
        const obs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
        });
        obs.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      let longTasks = [];
      try {
        const tobs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) longTasks.push(e.duration);
        });
        tobs.observe({ type: 'longtask', buffered: true });
      } catch (e) {}

      function step(now) {
        frameTimes.push(now - lastTime);
        lastTime = now;
        if (scrollY < maxScroll) {
          scrollY += 45;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(step);
        } else {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          resolve({
            totalFrames: frameTimes.length,
            avgFps: Number((1000 / avg).toFixed(1)),
            avgFrameTimeMs: Number(avg.toFixed(2)),
            cls: Number(cls.toFixed(4)),
            longTasksCount: longTasks.length
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  validationResults.desktopPerformance = deskTrace.result.value;

  // 3. Mobile Performance Trace with 4x CPU Throttling
  console.log('Measuring mobile 4x CPU performance...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise((r) => setTimeout(r, 1500));

  const mobTrace = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frameTimes = [];
      let lastTime = performance.now();
      let scrollY = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      let cls = 0;
      try {
        const obs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
        });
        obs.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      function step(now) {
        frameTimes.push(now - lastTime);
        lastTime = now;
        if (scrollY < maxScroll) {
          scrollY += 50;
          window.scrollTo(0, scrollY);
          requestAnimationFrame(step);
        } else {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
          const longFrames = frameTimes.filter(t => t > 20);
          resolve({
            totalFrames: frameTimes.length,
            avgFps: Number((1000 / avg).toFixed(1)),
            avgFrameTimeMs: Number(avg.toFixed(2)),
            longFramesCount: longFrames.length,
            cls: Number(cls.toFixed(4))
          });
        }
      }
      requestAnimationFrame(step);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  validationResults.mobilePerformance4x = mobTrace.result.value;
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // 4. Test Interactive Profile Modal & Accessibility
  console.log('Testing interactive modal dialog...');
  const modalTest = await send('Runtime.evaluate', {
    expression: `(() => {
      // 1. Click first official card
      const firstCard = document.querySelector('.grid > div');
      if (firstCard) firstCard.click();
      const modalOpen = !!document.querySelector('[role="dialog"]');
      const modalTitle = document.querySelector('#official-modal-title')?.textContent?.trim();

      // 2. Test Escape key close
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      const modalClosedAfterEsc = !document.querySelector('[role="dialog"]');

      return {
        modalOpenedSuccessfully: modalOpen,
        modalOfficialName: modalTitle,
        modalDismissedViaEscape: modalClosedAfterEsc
      };
    })()`,
    returnByValue: true
  });
  validationResults.interactions.modal = modalTest.result.value;

  // 5. Test Language Switch (मराठी <-> English)
  console.log('Testing language switcher...');
  const langTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1Mr = document.querySelector('h1')?.textContent?.trim();
      const firstRoleMr = document.querySelector('.truncate')?.textContent?.trim();

      // Click English
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();

      return { h1Mr, firstRoleMr };
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 400));
  const langAfter = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1En = document.querySelector('h1')?.textContent?.trim();
      const firstRoleEn = document.querySelector('.truncate')?.textContent?.trim();

      // Switch back to Marathi
      const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();

      return { h1En, firstRoleEn };
    })()`,
    returnByValue: true
  });
  validationResults.interactions.languageSwitch = {
    ...langTest.result.value,
    ...langAfter.result.value
  };

  console.log('\n--- VALIDATION RESULTS SUMMARY ---');
  console.log(JSON.stringify(validationResults, null, 2));
  fs.writeFileSync('scratch/officials_redesign_validation.json', JSON.stringify(validationResults, null, 2));

  child.kill();
  process.exit(0);
}

validateOfficialsRedesign().catch((e) => {
  console.error(e);
  process.exit(1);
});

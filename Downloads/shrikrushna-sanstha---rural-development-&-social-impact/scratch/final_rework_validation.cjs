const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runMasterValidation() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9254',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9254/json').then((r) => r.json());
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

  console.log('--- MASTER REWORK VALIDATION ---');

  const report = {
    viewports: [],
    modalBoundingTests: [],
    desktopPerf: {},
    mobilePerf4x: {},
    consoleErrors,
    networkErrors
  };

  // 1. Capture 5 standard viewports
  const viewports = [
    { name: 'initiatives_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'initiatives_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'initiatives_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'initiatives_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'initiatives_360_mobile.png', width: 360, height: 640, mobile: true }
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
    console.log(`Captured: ${vp.name}`);

    const docEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth === 0 && !img.src.includes('data:'));
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth,
          cardsCount: document.querySelectorAll('.grid > div').length,
          brokenImagesCount: brokenImages.length
        };
      })()`,
      returnByValue: true
    });

    report.viewports.push({
      viewport: vp.name,
      ...docEval.result.value
    });

    // Also test modal bounding box in this viewport!
    const modalBoundEval = await send('Runtime.evaluate', {
      expression: `(async () => {
        const btns = Array.from(document.querySelectorAll('article button')).filter(b => b.textContent.includes('वाचा') || b.textContent.includes('Read') || b.textContent.includes('माहिती'));
        if (btns.length === 0) return { error: 'No read more buttons' };

        btns[0].click();
        await new Promise(r => setTimeout(r, 350));

        const dialog = document.querySelector('[role="dialog"]');
        const modalBox = dialog ? dialog.querySelector('.bg-white') : null;
        const closeBtn = dialog ? dialog.querySelector('button[aria-label*="खिडकी"], button[aria-label*="Close"]') : null;

        if (!modalBox) return { error: 'Modal box not rendered' };

        const boxRect = modalBox.getBoundingClientRect();
        const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;

        const boundData = {
          viewportHeight: window.innerHeight,
          modalTop: Math.round(boxRect.top),
          modalBottom: Math.round(boxRect.bottom),
          modalHeight: Math.round(boxRect.height),
          isTopClipped: boxRect.top < 0,
          isBottomClipped: boxRect.bottom > window.innerHeight,
          isOverflowingViewport: boxRect.height > window.innerHeight,
          closeBtnTop: closeRect ? Math.round(closeRect.top) : null,
          closeBtnVisible: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false
        };

        // Capture screenshot with modal open!
        return boundData;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    // Capture modal open screenshot for 1440 and 390
    if (vp.width === 1440) {
      const modalShot1440 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, 'initiatives_modal_open_1440.png'), Buffer.from(modalShot1440.data, 'base64'));
      console.log('Captured modal open: initiatives_modal_open_1440.png');
    }
    if (vp.width === 390) {
      const modalShot390 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, 'initiatives_modal_open_390.png'), Buffer.from(modalShot390.data, 'base64'));
      console.log('Captured modal open: initiatives_modal_open_390.png');
    }

    // Close modal via Escape
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`
    });
    await new Promise((r) => setTimeout(r, 300));

    report.modalBoundingTests.push({
      viewport: vp.name,
      ...modalBoundEval.result.value
    });
  }

  // 2. Capture Work Timeline Screenshot
  await send('Page.navigate', { url: 'http://localhost:5173/#/work' });
  await new Promise((r) => setTimeout(r, 800));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const workShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'work_1440_desktop.png'), Buffer.from(workShot.data, 'base64'));
  console.log('Captured: work_1440_desktop.png');

  // 3. Navigate back to Initiatives for Performance Profiling
  await send('Page.navigate', { url: 'http://localhost:5173/#/initiatives' });
  await new Promise((r) => setTimeout(r, 800));

  // Desktop Performance (1x)
  console.log('Profiling desktop performance (1x)...');
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
  console.log('Desktop Performance (1x):', report.desktopPerf);

  // Mobile Performance (4x CPU Throttled)
  console.log('Profiling mobile performance (4x CPU throttled)...');
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
  console.log('Mobile Performance (4x Throttled):', report.mobilePerf4x);

  fs.writeFileSync('scratch/master_rework_validation.json', JSON.stringify(report, null, 2));
  console.log('Validation results saved to scratch/master_rework_validation.json');

  ws.close();
  child.kill();
}

runMasterValidation().catch((err) => {
  console.error('Master validation failed:', err);
  process.exit(1);
});

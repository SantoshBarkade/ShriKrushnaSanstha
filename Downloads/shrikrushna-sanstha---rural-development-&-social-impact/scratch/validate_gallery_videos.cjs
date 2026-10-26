const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function validateGalleryAndVideos() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9268;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
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

  const auditResults = {
    viewports: {},
    interactions: {},
    performance: {},
    consoleErrors,
    networkErrors
  };

  console.log('--- Step 1: Multi-Viewport Validation on #/gallery ---');
  const viewports = [
    { key: '1440_desktop', file: 'gallery_1440_desktop.png', w: 1440, h: 900, m: false },
    { key: '1280_laptop', file: 'gallery_1280_laptop.png', w: 1280, h: 800, m: false },
    { key: '768_tablet', file: 'gallery_768_tablet.png', w: 768, h: 1024, m: true },
    { key: '390_mobile', file: 'gallery_390_mobile.png', w: 390, h: 844, m: true },
    { key: '360_mobile', file: 'gallery_360_mobile.png', w: 360, h: 640, m: true },
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
        albumCards: document.querySelectorAll('main div.grid > div').length
      })`,
      returnByValue: true
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACTS_DIR, vp.file);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

    auditResults.viewports[vp.key] = {
      ...metrics.result.value,
      screenshot: vp.file
    };
    console.log(`- ${vp.key}: overflow=${metrics.result.value.hasOverflow}, albums=${metrics.result.value.albumCards}`);
  }

  console.log('--- Step 2: Test Switching to "All Photos" View ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  const allPhotosClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allBtn = btns.find(b => b.textContent && b.textContent.includes('सर्व छायाचित्रे'));
      if (allBtn) {
        allBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });

  await new Promise((r) => setTimeout(r, 600));
  const allPhotosCount = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('main div.grid > div').length`,
    returnByValue: true
  });
  auditResults.interactions.allPhotosView = {
    clicked: allPhotosClick.result.value,
    renderedPhotos: allPhotosCount.result.value
  };
  console.log(`- Switch to All Photos: rendered=${allPhotosCount.result.value}`);

  console.log('--- Step 3: Switch back to Albums and Click Album 1 ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const albBtn = btns.find(b => b.textContent && b.textContent.includes('अल्बमनुसार'));
      if (albBtn) albBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click first album
  const albumClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('main div.grid > div');
      if (card) {
        card.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 700));

  const albumDetailInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const h2 = document.querySelector('main h2');
      const photos = document.querySelectorAll('main div.grid > div').length;
      return {
        title: h2 ? h2.textContent : '',
        photosInAlbum: photos
      };
    })()`,
    returnByValue: true
  });

  const albDetailShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gallery_album_detail_1440.png'), Buffer.from(albDetailShot.data, 'base64'));

  auditResults.interactions.albumDetail = {
    ...albumDetailInfo.result.value,
    screenshot: 'gallery_album_detail_1440.png'
  };
  console.log(`- Opened Album Detail: "${albumDetailInfo.result.value.title}", photos=${albumDetailInfo.result.value.photosInAlbum}`);

  console.log('--- Step 4: Open Lightbox Modal and Test Controls ---');
  // Click first photo in album to open Lightbox
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('main div.grid > div');
      if (card) card.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const lightboxVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('div[role="dialog"][aria-modal="true"]')`,
    returnByValue: true
  });

  // Capture desktop lightbox
  const lb1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gallery_lightbox_open_1440.png'), Buffer.from(lb1440.data, 'base64'));

  // Emulate mobile and capture mobile lightbox
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 400));
  const lb390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gallery_lightbox_open_390.png'), Buffer.from(lb390.data, 'base64'));

  // Press Escape to close Lightbox
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const lbClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('div[role="dialog"]')`,
    returnByValue: true
  });

  auditResults.interactions.lightbox = {
    visible: lightboxVisible.result.value,
    closedOnEscape: lbClosed.result.value,
    screenshots: ['gallery_lightbox_open_1440.png', 'gallery_lightbox_open_390.png']
  };
  console.log(`- Lightbox: visible=${lightboxVisible.result.value}, closedOnEscape=${lbClosed.result.value}`);

  console.log('--- Step 5: Validate #/videos View ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/videos'` });
  await new Promise((r) => setTimeout(r, 1200));

  const vMetrics1440 = await send('Runtime.evaluate', {
    expression: `({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      videoCards: document.querySelectorAll('main div.grid > div').length
    })`,
    returnByValue: true
  });

  const v1440Shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'videos_1440_desktop.png'), Buffer.from(v1440Shot.data, 'base64'));

  // Mobile videos view
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 500));

  const vMetrics390 = await send('Runtime.evaluate', {
    expression: `({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      videoCards: document.querySelectorAll('main div.grid > div').length
    })`,
    returnByValue: true
  });

  const v390Shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'videos_390_mobile.png'), Buffer.from(v390Shot.data, 'base64'));

  auditResults.viewports.videos_1440 = { ...vMetrics1440.result.value, screenshot: 'videos_1440_desktop.png' };
  auditResults.viewports.videos_390 = { ...vMetrics390.result.value, screenshot: 'videos_390_mobile.png' };
  console.log(`- Videos 1440: overflow=${vMetrics1440.result.value.hasOverflow}, cards=${vMetrics1440.result.value.videoCards}`);
  console.log(`- Videos 390: overflow=${vMetrics390.result.value.hasOverflow}, cards=${vMetrics390.result.value.videoCards}`);

  console.log('--- Step 6: Test Video Playback Modal ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  // Click first video card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('main div.grid > div');
      if (card) card.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 700));

  const vidModalVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('div[role="dialog"][aria-modal="true"]')`,
    returnByValue: true
  });

  const vModalShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'videos_modal_open_1440.png'), Buffer.from(vModalShot.data, 'base64'));

  // Press Escape to close video modal
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const vidModalClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('div[role="dialog"]')`,
    returnByValue: true
  });

  auditResults.interactions.videoModal = {
    visible: vidModalVisible.result.value,
    closedOnEscape: vidModalClosed.result.value,
    screenshot: 'videos_modal_open_1440.png'
  };
  console.log(`- Video Modal: visible=${vidModalVisible.result.value}, closedOnEscape=${vidModalClosed.result.value}`);

  console.log('--- Step 7: Scroll Performance Benchmark on #/gallery ---');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/gallery'` });
  await new Promise((r) => setTimeout(r, 1000));

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

  auditResults.performance = perfData.result.value;
  console.log(`- Scroll Performance: ${perfData.result.value.fps} FPS, avg ${perfData.result.value.avgFrameMs}ms, jank=${perfData.result.value.jankFrames}`);

  ws.close();
  child.kill();

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gallery_videos_validation_results.json'), JSON.stringify(auditResults, null, 2));
  console.log('Audit complete! Results saved to gallery_videos_validation_results.json');
}

validateGalleryAndVideos().catch((e) => {
  console.error('Validation error:', e);
  process.exit(1);
});

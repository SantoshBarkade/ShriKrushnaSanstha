const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runLiveAcceptanceAudit() {
  console.log('=== STARTING LIVE ACCEPTANCE AUDIT ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9271;
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
  const networkRequests = [];
  const networkErrors = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Network.requestWillBeSent') {
      networkRequests.push(msg.params.request.url);
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
    navigation: {},
    performance: {},
    consoleErrors,
    networkErrors
  };

  // Wait 1.5s for initial React render and API hydration
  await new Promise((r) => setTimeout(r, 1500));

  console.log('--- Step 1: Multi-Viewport Inspection of #/gallery ---');
  const viewports = [
    { key: '1440_desktop', file: 'live_gallery_1440_desktop.png', w: 1440, h: 900, m: false },
    { key: '1280_laptop', file: 'live_gallery_1280_laptop.png', w: 1280, h: 800, m: false },
    { key: '768_tablet', file: 'live_gallery_768_tablet.png', w: 768, h: 1024, m: true },
    { key: '390_mobile', file: 'live_gallery_390_mobile.png', w: 390, h: 844, m: true },
    { key: '360_mobile', file: 'live_gallery_360_mobile.png', w: 360, h: 640, m: true },
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

    auditReport.viewports[`gallery_${vp.key}`] = {
      ...metrics.result.value,
      screenshot: vp.file
    };
    console.log(`- Gallery ${vp.key}: overflow=${metrics.result.value.hasOverflow}, albums=${metrics.result.value.albumCards}`);
  }

  console.log('--- Step 2: Testing View Switcher (All Photos) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 300));

  const clickAll = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('सर्व छायाचित्रे'));
      if (btn) {
        btn.click();
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
  const allPhotosShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_gallery_all_photos_1440.png'), Buffer.from(allPhotosShot.data, 'base64'));

  auditReport.interactions.allPhotosView = {
    clicked: clickAll.result.value,
    renderedPhotos: allPhotosCount.result.value,
    screenshot: 'live_gallery_all_photos_1440.png'
  };
  console.log(`- All Photos count: ${allPhotosCount.result.value}`);

  console.log('--- Step 3: Switch back to Albums and Open Album 1 ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('अल्बमनुसार'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click first album card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('main div.grid > div');
      if (card) card.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const albumDetailInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const h2 = document.querySelector('main h2');
      const cards = document.querySelectorAll('main div.grid > div').length;
      return {
        title: h2 ? h2.textContent.trim() : '',
        photosInAlbum: cards
      };
    })()`,
    returnByValue: true
  });
  const albDetailShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_gallery_album_detail_1440.png'), Buffer.from(albDetailShot.data, 'base64'));

  auditReport.interactions.albumDetail = {
    ...albumDetailInfo.result.value,
    screenshot: 'live_gallery_album_detail_1440.png'
  };
  console.log(`- Opened Album: "${albumDetailInfo.result.value.title}", photos=${albumDetailInfo.result.value.photosInAlbum}`);

  console.log('--- Step 4: Toggle Display Mode to Carousel ---');
  const toggleCarousel = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('कॅरोसेल'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const carouselVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('button[aria-label="Previous Slide"]') || !!document.querySelector('img[loading="eager"]')`,
    returnByValue: true
  });
  const carouselShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_gallery_carousel_mode_1440.png'), Buffer.from(carouselShot.data, 'base64'));

  auditReport.interactions.carouselMode = {
    toggled: toggleCarousel.result.value,
    carouselVisible: carouselVisible.result.value,
    screenshot: 'live_gallery_carousel_mode_1440.png'
  };
  console.log(`- Carousel mode toggled: visible=${carouselVisible.result.value}`);

  console.log('--- Step 5: Test Lightbox Modal (Open, Next, Prev, Escape) ---');
  // Click fullscreen/lightbox button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[aria-label="Fullscreen"]') || document.querySelector('main button[title="Fullscreen"]');
      if (btn) btn.click();
      else {
        const viewFullBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('मोठे पहा'));
        if (viewFullBtn) viewFullBtn.click();
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const lbVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('div[role="dialog"][aria-modal="true"]')`,
    returnByValue: true
  });

  const lbShot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_lightbox_open_1440.png'), Buffer.from(lbShot1440.data, 'base64'));

  // Mobile lightbox
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 400));
  const lbShot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_lightbox_open_390.png'), Buffer.from(lbShot390.data, 'base64'));

  // Press ArrowRight to test Next
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await new Promise((r) => setTimeout(r, 300));

  // Press Escape to test close
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const lbClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('div[role="dialog"]')`,
    returnByValue: true
  });

  auditReport.interactions.lightbox = {
    visible: lbVisible.result.value,
    closedOnEscape: lbClosed.result.value,
    screenshots: ['live_lightbox_open_1440.png', 'live_lightbox_open_390.png']
  };
  console.log(`- Lightbox: visible=${lbVisible.result.value}, closedOnEscape=${lbClosed.result.value}`);

  console.log('--- Step 6: Test Navigation to #/videos via Page Link ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 300));

  // Click the video library button in the bottom banner or top header
  const navToVideos = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const vidBtn = btns.find(b => b.textContent && (b.textContent.includes('व्हिडिओ दालन') || b.textContent.includes('व्हिडिओ दालन उघडा')));
      if (vidBtn) {
        vidBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1200));

  const currentHash = await send('Runtime.evaluate', {
    expression: `window.location.hash`,
    returnByValue: true
  });
  auditReport.navigation.galleryToVideos = {
    clickedLink: navToVideos.result.value,
    resultingHash: currentHash.result.value
  };
  console.log(`- Navigated to videos: linkClicked=${navToVideos.result.value}, hash="${currentHash.result.value}"`);

  console.log('--- Step 7: Multi-Viewport Inspection of #/videos ---');
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
        videoCards: document.querySelectorAll('main div.grid > div').length
      })`,
      returnByValue: true
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACTS_DIR, `live_videos_${vp.key}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

    auditReport.viewports[`videos_${vp.key}`] = {
      ...metrics.result.value,
      screenshot: `live_videos_${vp.key}.png`
    };
    console.log(`- Videos ${vp.key}: overflow=${metrics.result.value.hasOverflow}, cards=${metrics.result.value.videoCards}`);
  }

  console.log('--- Step 8: Test Video Playback Modal (Open, Backdrop, Escape) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  // Click first video card to open modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('main div.grid > div');
      if (card) card.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const vidModalVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('div[role="dialog"][aria-modal="true"]')`,
    returnByValue: true
  });

  const vModalShot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_videos_modal_open_1440.png'), Buffer.from(vModalShot1440.data, 'base64'));

  // Mobile video modal
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((r) => setTimeout(r, 400));
  const vModalShot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_videos_modal_open_390.png'), Buffer.from(vModalShot390.data, 'base64'));

  // Press Escape to close modal
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const vidModalClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('div[role="dialog"]')`,
    returnByValue: true
  });

  auditReport.interactions.videoModal = {
    visible: vidModalVisible.result.value,
    closedOnEscape: vidModalClosed.result.value,
    screenshots: ['live_videos_modal_open_1440.png', 'live_videos_modal_open_390.png']
  };
  console.log(`- Video Modal: visible=${vidModalVisible.result.value}, closedOnEscape=${vidModalClosed.result.value}`);

  console.log('--- Step 9: Test Navigation Back to #/gallery via Page Link ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  const navBackToGallery = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const galBtn = btns.find(b => b.textContent && (b.textContent.includes('छायाचित्र दालन पहा') || b.textContent.includes('छायाचित्रे पहा')));
      if (galBtn) {
        galBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1200));

  const returnHash = await send('Runtime.evaluate', {
    expression: `window.location.hash`,
    returnByValue: true
  });
  auditReport.navigation.videosToGallery = {
    clickedLink: navBackToGallery.result.value,
    resultingHash: returnHash.result.value
  };
  console.log(`- Navigated back to gallery: linkClicked=${navBackToGallery.result.value}, hash="${returnHash.result.value}"`);

  console.log('--- Step 10: Scroll Performance Measurement ---');
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
        window.scrollBy(0, 30);

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

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_acceptance_audit_results.json'), JSON.stringify(auditReport, null, 2));
  console.log('=== LIVE ACCEPTANCE AUDIT FINISHED SUCCESSFULLY ===');
}

runLiveAcceptanceAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});

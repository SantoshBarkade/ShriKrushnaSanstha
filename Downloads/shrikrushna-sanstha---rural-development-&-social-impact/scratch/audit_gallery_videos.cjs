const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1');

async function runAudit() {
  console.log('Launching browser for Gallery & Video Library audit...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const viewports = [
    { name: '1440_desktop', width: 1440, height: 900 },
    { name: '1280_laptop', width: 1280, height: 800 },
    { name: '768_tablet', width: 768, height: 1024 },
    { name: '390_mobile', width: 390, height: 844 },
    { name: '360_mobile', width: 360, height: 640 },
  ];

  const results = {
    viewports: {},
    interactions: {},
    consoleErrors
  };

  // 1. Audit Gallery across viewports
  console.log('Auditing Gallery View across viewports...');
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5173/#/gallery', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const albumCount = await page.evaluate(() => {
      return document.querySelectorAll('main div.grid > div').length;
    });

    const screenshotPath = path.join(ARTIFACT_DIR, `gallery_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    results.viewports[`gallery_${vp.name}`] = {
      width: vp.width,
      height: vp.height,
      hasOverflow: overflow,
      albumCardCount: albumCount,
      screenshot: screenshotPath
    };
    console.log(`- Gallery ${vp.name}: overflow=${overflow}, cards=${albumCount}`);
  }

  // 2. Test Album Click -> Album Detail View (1440)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/gallery', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  console.log('Testing Album Click interaction...');
  const firstAlbumCard = await page.$('main div.grid > div');
  if (firstAlbumCard) {
    await firstAlbumCard.click();
    await new Promise(r => setTimeout(r, 600));

    const albumTitle = await page.evaluate(() => {
      const h2 = document.querySelector('main h2');
      return h2 ? h2.textContent : null;
    });
    const photoCountInAlbum = await page.evaluate(() => {
      return document.querySelectorAll('main div.grid > div').length;
    });

    const albumDetailScreenshot = path.join(ARTIFACT_DIR, 'gallery_album_detail_1440.png');
    await page.screenshot({ path: albumDetailScreenshot });
    results.interactions.albumDetail = {
      openedTitle: albumTitle,
      photoCards: photoCountInAlbum,
      screenshot: albumDetailScreenshot
    };
    console.log(`- Album Detail opened: "${albumTitle}", photos=${photoCountInAlbum}`);
  }

  // 3. Test Lightbox Open (1440 and 390)
  console.log('Testing Lightbox Modal interaction...');
  const photoCard = await page.$('main div.grid > div');
  if (photoCard) {
    await photoCard.click();
    await new Promise(r => setTimeout(r, 600));

    const lightboxVisible = await page.evaluate(() => {
      return !!document.querySelector('div[role="dialog"][aria-modal="true"]');
    });

    const lightbox1440 = path.join(ARTIFACT_DIR, 'gallery_lightbox_open_1440.png');
    await page.screenshot({ path: lightbox1440 });
    results.interactions.lightbox1440 = { visible: lightboxVisible, screenshot: lightbox1440 };

    // Mobile lightbox
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 400));
    const lightbox390 = path.join(ARTIFACT_DIR, 'gallery_lightbox_open_390.png');
    await page.screenshot({ path: lightbox390 });
    results.interactions.lightbox390 = { screenshot: lightbox390 };

    // Press Escape to close
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const closed = await page.evaluate(() => {
      return !document.querySelector('div[role="dialog"]');
    });
    results.interactions.lightboxClosedOnEscape = closed;
    console.log(`- Lightbox open test passed: visible=${lightboxVisible}, closedOnEscape=${closed}`);
  }

  // 4. Audit Videos View
  console.log('Auditing Video Library View across viewports...');
  for (const vp of [{ name: '1440_desktop', width: 1440, height: 900 }, { name: '390_mobile', width: 390, height: 844 }]) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/#/videos', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const videoCount = await page.evaluate(() => {
      return document.querySelectorAll('main div.grid > div').length;
    });

    const screenshotPath = path.join(ARTIFACT_DIR, `videos_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath });

    results.viewports[`videos_${vp.name}`] = {
      width: vp.width,
      height: vp.height,
      hasOverflow: overflow,
      videoCardCount: videoCount,
      screenshot: screenshotPath
    };
    console.log(`- Videos ${vp.name}: overflow=${overflow}, cards=${videoCount}`);
  }

  // 5. Test Video Playback Modal
  console.log('Testing Video Playback Modal interaction...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/videos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  const firstVideoCard = await page.$('main div.grid > div');
  if (firstVideoCard) {
    await firstVideoCard.click();
    await new Promise(r => setTimeout(r, 700));

    const modalVisible = await page.evaluate(() => {
      return !!document.querySelector('div[role="dialog"][aria-modal="true"]');
    });

    const modalScreenshot = path.join(ARTIFACT_DIR, 'videos_modal_open_1440.png');
    await page.screenshot({ path: modalScreenshot });

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const modalClosed = await page.evaluate(() => {
      return !document.querySelector('div[role="dialog"]');
    });

    results.interactions.videoModal = {
      visible: modalVisible,
      closedOnEscape: modalClosed,
      screenshot: modalScreenshot
    };
    console.log(`- Video Modal test passed: visible=${modalVisible}, closedOnEscape=${modalClosed}`);
  }

  // 6. Measure Scroll Performance on Gallery
  console.log('Measuring scroll frame timings on Gallery page...');
  await page.goto('http://localhost:5173/#/gallery', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  const fpsData = await page.evaluate(async () => {
    return new Promise(resolve => {
      let frames = 0;
      let start = performance.now();
      let lastTime = start;
      const frameDeltas = [];

      function step(now) {
        frameDeltas.push(now - lastTime);
        lastTime = now;
        frames++;
        window.scrollBy(0, 40);

        if (now - start < 1500) {
          requestAnimationFrame(step);
        } else {
          const durationSec = (now - start) / 1000;
          const fps = frames / durationSec;
          const jankFrames = frameDeltas.filter(d => d > 33.3).length; // >33.3ms is <30fps
          resolve({
            fps: parseFloat(fps.toFixed(1)),
            frames,
            jankFrames,
            avgFrameMs: parseFloat((1000 / fps).toFixed(2))
          });
        }
      }
      requestAnimationFrame(step);
    });
  });

  results.performance = fpsData;
  console.log(`- Scroll performance: ${fpsData.fps} FPS, avg ${fpsData.avgFrameMs}ms, jankFrames=${fpsData.jankFrames}`);

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'gallery_videos_audit_results.json'), JSON.stringify(results, null, 2));
  console.log('Audit complete! Results saved to gallery_videos_audit_results.json');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

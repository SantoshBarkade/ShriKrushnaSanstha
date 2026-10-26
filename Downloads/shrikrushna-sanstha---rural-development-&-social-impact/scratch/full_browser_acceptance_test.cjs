const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9312;

async function runAcceptanceTest() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const target = list.find((t) => t.type === 'page');
  if (!target) throw new Error('Could not find chrome target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    viewportsTested: [],
    interactionsTested: [],
    marathiAudit: {}
  };

  const setViewport = async (w, h, isMobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
  };

  const captureSS = async (filename) => {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.resolve(`scratch/${filename}`);
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    return ssPath;
  };

  console.log('--- TEST 1: Inspecting Home at 1440x900 ---');
  await setViewport(1440, 900);
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise((r) => setTimeout(r, 1500));

  const homeDocTitle = await send('Runtime.evaluate', { expression: 'document.title' });
  const homeMarathiCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const text = document.body.innerText;
        return {
          hasPaha: text.includes('पहा'),
          hasBaddal: text.includes('बद्दल'),
          hasDhule: text.includes('धुळे') || text.includes('Dhule'),
          hasNadarpurTypo: text.includes('नादपूर'),
          hasPauleTypo: text.includes('पाऊले'),
          hasAsciiDanda: text.includes('।। '),
          hasRegCorrect: text.includes('एक १४६६८ (औ)'),
          title: document.title
        };
      })()
    `,
    returnByValue: true
  });
  await captureSS('evidence_home_1440.png');
  report.tests.push({ name: 'Home 1440 Inspection', results: homeMarathiCheck.result.value });

  console.log('--- TEST 2: Inspecting Responsive Viewports for Gallery & Videos ---');
  const viewports = [
    { w: 1440, h: 900, name: '1440' },
    { w: 1280, h: 800, name: '1280' },
    { w: 768, h: 1024, name: '768' },
    { w: 390, h: 844, name: '390', mobile: true },
    { w: 360, h: 640, name: '360', mobile: true }
  ];

  for (const vp of viewports) {
    await setViewport(vp.w, vp.h, vp.mobile);
    // Gallery
    await send('Page.navigate', { url: 'http://localhost:5173/#/gallery' });
    await new Promise((r) => setTimeout(r, 1000));
    await captureSS(`evidence_gallery_${vp.name}.png`);

    // Videos
    await send('Page.navigate', { url: 'http://localhost:5173/#/videos' });
    await new Promise((r) => setTimeout(r, 1000));
    await captureSS(`evidence_videos_${vp.name}.png`);

    report.viewportsTested.push(vp.name);
  }

  console.log('--- TEST 3: Video Library Content & Playback Modal ---');
  await setViewport(1440, 900);
  await send('Page.navigate', { url: 'http://localhost:5173/#/videos' });
  await new Promise((r) => setTimeout(r, 1500));

  const videoCardTitles = await send('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('h3, h2')).map(el => el.innerText.trim()).filter(Boolean)
    `,
    returnByValue: true
  });
  console.log('Video titles rendered:', videoCardTitles.result.value);

  // Click on the first video Play button to test modal opening
  const playClicked = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const playBtn = btns.find(b => b.innerText.includes('व्हिडिओ पाहा') || b.innerText.includes('Watch Video'));
        if (playBtn) {
          playBtn.click();
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1000));
  await captureSS('evidence_video_modal_opened.png');

  const modalOpened = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('[role="dialog"]')`,
    returnByValue: true
  });

  report.interactionsTested.push({
    action: 'Open Video Playback Modal',
    success: modalOpened.result.value,
    videoTitlesRendered: videoCardTitles.result.value
  });

  // Close modal via Escape
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- TEST 4: Photo Gallery Lightbox Modal ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/gallery' });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Open the first album
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h3 = Array.from(document.querySelectorAll('main h3'))[0];
        if (h3) h3.closest('[aria-label]').click();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Click on the first photo card inside the opened album
  const photoClicked = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const img = document.querySelector('main img');
        if (img) {
          const card = img.closest('[aria-label]');
          if (card) {
            card.click();
            return true;
          }
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1000));
  await captureSS('evidence_gallery_lightbox_opened.png');

  const lightboxOpened = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('[role="dialog"][aria-label="छायाचित्र दर्शक"]')`,
    returnByValue: true
  });

  report.interactionsTested.push({
    action: 'Open Photo Gallery Lightbox',
    success: lightboxOpened.result.value
  });

  // Close lightbox via Escape
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- TEST 5: Language Switcher (मराठी -> English -> मराठी) ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise((r) => setTimeout(r, 1000));

  // Click 'EN'
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'EN');
        if (enBtn) enBtn.click();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureSS('evidence_home_english.png');
  const enHeading = await send('Runtime.evaluate', {
    expression: `document.querySelector('h1')?.innerText || ''`,
    returnByValue: true
  });

  // Click 'मराठी' back
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'मराठी');
        if (mrBtn) mrBtn.click();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  const mrHeading = await send('Runtime.evaluate', {
    expression: `document.querySelector('h1')?.innerText || ''`,
    returnByValue: true
  });

  report.interactionsTested.push({
    action: 'Language Switcher Toggle',
    enHeading: enHeading.result.value,
    mrHeading: mrHeading.result.value,
    success: enHeading.result.value.includes('Culture') && mrHeading.result.value.includes('संस्कृती')
  });

  console.log('--- TEST 6: All Routes Marathi & Correctness Audit ---');
  const allRoutes = [
    'home', 'about', 'officials', 'initiatives', 'work', 'schemes',
    'gallery', 'videos', 'reports', 'contact', 'news', 'volunteer', 'privacy'
  ];

  for (const r of allRoutes) {
    await send('Page.navigate', { url: `http://localhost:5173/#/${r}` });
    await new Promise((res) => setTimeout(res, 1000));

    const audit = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          return {
            hasPaha: text.includes('पहा'),
            hasBaddal: text.includes('बद्दल'),
            hasDhule: text.includes('धुळे') || text.includes('Dhule'),
            hasNadarpurTypo: text.includes('नादपूर'),
            hasPauleTypo: text.includes('पाऊले'),
            hasAsciiDanda: text.includes('।। '),
            hasUndefined: text.includes('undefined'),
            hasNull: text.includes('null'),
            hasObjectObject: text.includes('[object Object]'),
            heading: document.querySelector('h1')?.innerText || document.querySelector('h2')?.innerText || ''
          };
        })()
      `,
      returnByValue: true
    });
    report.marathiAudit[r] = audit.result.value;
  }

  fs.writeFileSync('scratch/acceptance_test_report.json', JSON.stringify(report, null, 2));
  console.log('Full Acceptance Test completed! Report written to scratch/acceptance_test_report.json');

  ws.close();
  child.kill();
}

runAcceptanceTest().catch(console.error);

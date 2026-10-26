const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runPrivacyAcceptanceAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9283;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/privacy'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

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
  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        consoleErrors.push(data.params.args.map((a) => a.value || a.description).join(' '));
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1500));

  const results = {
    viewports: [],
    overflowTests: [],
    navJumpTests: {},
    languageToggleTest: {},
    scrollFps: 60,
    consoleErrors: []
  };

  const viewports = [
    { name: 'privacy_1440_desktop.png', w: 1440, h: 900, m: false, label: '1440x900 Desktop' },
    { name: 'privacy_1280_laptop.png', w: 1280, h: 800, m: false, label: '1280x800 Laptop' },
    { name: 'privacy_768_tablet.png', w: 768, h: 1024, m: true, label: '768x1024 Tablet' },
    { name: 'privacy_390_mobile.png', w: 390, h: 844, m: true, label: '390x844 Mobile' },
    { name: 'privacy_360_mobile.png', w: 360, h: 640, m: true, label: '360x640 Small Mobile' }
  ];

  // 1. Viewport captures and overflow checks
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.m
    });
    await new Promise((r) => setTimeout(r, 600));

    const overflowEval = await send('Runtime.evaluate', {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    results.overflowTests.push({
      viewport: vp.label,
      ...overflowEval.result.value
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, vp.name), Buffer.from(shot.data, 'base64'));
    results.viewports.push({ name: vp.name, viewport: vp.label });
    console.log(`Captured ${vp.name} (Overflow: ${overflowEval.result.value.hasHorizontalOverflow})`);
  }

  // Set back to 1440 desktop for interaction testing
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 600));

  // Reset scroll to top
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise((r) => setTimeout(r, 400));

  // 2. Test Section Navigator Jump
  const jumpTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('nav[aria-label="Privacy sections navigation"] button'));
      const dignityBtn = buttons.find(b => b.textContent.includes('लाभार्थी सन्मान') || b.textContent.includes('Beneficiary'));
      if (dignityBtn) {
        dignityBtn.click();
        return { clicked: true, text: dignityBtn.textContent.trim() };
      }
      return { clicked: false, buttons: buttons.map(b => b.textContent.trim()) };
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1500));

  const scrollPosAfterJump = await send('Runtime.evaluate', {
    expression: 'window.pageYOffset || document.documentElement.scrollTop',
    returnByValue: true
  });
  results.navJumpTests = {
    ...jumpTest.result.value,
    scrollPos: scrollPosAfterJump.result.value,
    jumpSuccess: scrollPosAfterJump.result.value > 100
  };

  const jumpShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'privacy_section_jump_1440.png'), Buffer.from(jumpShot.data, 'base64'));
  console.log(`Captured privacy_section_jump_1440.png (Scroll Y: ${scrollPosAfterJump.result.value}, Jump Success: ${results.navJumpTests.jumpSuccess})`);

  // 3. Test Language Switching to English
  const langToggle = await send('Runtime.evaluate', {
    expression: `(() => {
      const headerBtns = Array.from(document.querySelectorAll('header button, nav button'));
      const enBtn = headerBtns.find(b => b.textContent.trim() === 'EN' || b.textContent.trim() === 'English');
      if (enBtn) {
        enBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const englishPageCheck = await send('Runtime.evaluate', {
    expression: `({
      h1Text: document.querySelector('h1')?.textContent?.trim() || '',
      htmlLang: document.documentElement.lang
    })`,
    returnByValue: true
  });
  results.languageToggleTest = englishPageCheck.result.value;

  const englishShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'privacy_english_1440.png'), Buffer.from(englishShot.data, 'base64'));
  console.log('Captured privacy_english_1440.png');

  // Toggle back to Marathi
  await send('Runtime.evaluate', {
    expression: `(() => {
      const headerBtns = Array.from(document.querySelectorAll('header button, nav button'));
      const mrBtn = headerBtns.find(b => b.textContent.trim() === 'मराठी' || b.textContent.trim() === 'MR');
      if (mrBtn) mrBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Measure Scroll FPS
  const fpsEval = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function check(now) {
        frames++;
        if (now - start >= 600) {
          resolve(Math.round((frames * 1000) / (now - start)));
        } else {
          window.scrollBy(0, 10);
          requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  results.scrollFps = fpsEval.result.value;

  results.consoleErrors = consoleErrors;

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'privacy_live_audit_results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('Audit Results:', JSON.stringify(results, null, 2));

  ws.close();
  child.kill();
  console.log('Privacy acceptance audit completed successfully.');
}

runPrivacyAcceptanceAudit().catch(console.error);

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runVolunteerAcceptanceAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9280;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/volunteer'
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
  await new Promise((r) => setTimeout(r, 1200));

  const results = {
    viewports: [],
    overflowTests: [],
    validationTest: {},
    fieldInteractions: {},
    scrollFps: 60,
    consoleErrors: []
  };

  const viewports = [
    { name: 'volunteer_1440_desktop.png', w: 1440, h: 900, m: false, label: '1440x900 Desktop' },
    { name: 'volunteer_1280_laptop.png', w: 1280, h: 800, m: false, label: '1280x800 Laptop' },
    { name: 'volunteer_768_tablet.png', w: 768, h: 1024, m: true, label: '768x1024 Tablet' },
    { name: 'volunteer_390_mobile.png', w: 390, h: 844, m: true, label: '390x844 Mobile' },
    { name: 'volunteer_360_mobile.png', w: 360, h: 640, m: true, label: '360x640 Small Mobile' }
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
  await new Promise((r) => setTimeout(r, 500));

  // 2. Safe Local Validation Test: Submit without filling required fields
  const triggerValidation = await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  // Check if errors appear
  const validationCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
      return {
        hasErrors: alerts.length > 0,
        errorCount: alerts.length,
        errorTexts: alerts.map(a => a.textContent?.trim()).filter(Boolean)
      };
    })()`,
    returnByValue: true
  });
  results.validationTest = validationCheck.result.value;

  const valShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'volunteer_validation_errors_1440.png'), Buffer.from(valShot.data, 'base64'));
  console.log('Captured volunteer_validation_errors_1440.png');

  // 3. Test Field Interactions: Enter text into fields and verify controlled state
  const fieldInteractionTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const nameInput = document.getElementById('volunteer-fullName');
      const phoneInput = document.getElementById('volunteer-phone');
      const villageInput = document.getElementById('volunteer-village');

      if (nameInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(nameInput, 'सचिन निकम');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (phoneInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(phoneInput, '9876543210');
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (villageInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(villageInput, 'नादरपूर');
        villageInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return {
        nameVal: nameInput?.value,
        phoneVal: phoneInput?.value,
        villageVal: villageInput?.value
      };
    })()`,
    returnByValue: true
  });
  results.fieldInteractions = fieldInteractionTest.result.value;

  const filledShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'volunteer_form_filled_1440.png'), Buffer.from(filledShot.data, 'base64'));
  console.log('Captured volunteer_form_filled_1440.png');

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
    path.join(ARTIFACTS_DIR, 'volunteer_live_audit_results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('Audit Results:', JSON.stringify(results, null, 2));

  ws.close();
  child.kill();
  console.log('Volunteer acceptance audit completed successfully.');
}

runVolunteerAcceptanceAudit().catch(console.error);

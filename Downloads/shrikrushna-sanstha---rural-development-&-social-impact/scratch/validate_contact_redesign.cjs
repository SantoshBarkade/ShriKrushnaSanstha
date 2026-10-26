const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function validateContact() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9259',
    '--disable-gpu',
    'http://localhost:5173/#/contact'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9259/json').then((r) => r.json());
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

  console.log('--- VALIDATING CONTACT US REDESIGN ---');

  const report = {
    viewports: [],
    linksAudit: {},
    formValidationAudit: {},
    bilingualAudit: {},
    desktopPerf: {},
    mobilePerf4x: {},
    consoleErrors,
    networkErrors
  };

  // 1. Multi-Viewport Captures & Overflow Audits
  const viewports = [
    { name: 'contact_1440_desktop.png', width: 1440, height: 900, mobile: false },
    { name: 'contact_1280_laptop.png', width: 1280, height: 800, mobile: false },
    { name: 'contact_768_tablet.png', width: 768, height: 1024, mobile: true },
    { name: 'contact_390_mobile.png', width: 390, height: 844, mobile: true },
    { name: 'contact_360_mobile.png', width: 360, height: 640, mobile: true }
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
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth,
          hasForm: Boolean(document.querySelector('form')),
          hasOfficeCard: Boolean(document.querySelector('.lg\\:col-span-5'))
        };
      })()`,
      returnByValue: true
    });

    report.viewports.push({
      viewport: vp.name,
      ...docEval.result.value
    });
  }

  // 2. Links & Contact Details Audit
  const linksEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const phoneLink = document.querySelector('a[href^="tel:"]');
      const emailLink = document.querySelector('a[href^="mailto:"]');
      const mapLink = document.querySelector('a[href*="maps"]');

      return {
        phoneHref: phoneLink ? phoneLink.getAttribute('href') : null,
        phoneText: phoneLink ? phoneLink.textContent.trim() : null,
        isTelLink: phoneLink ? phoneLink.getAttribute('href').startsWith('tel:') : false,
        emailHref: emailLink ? emailLink.getAttribute('href') : null,
        emailText: emailLink ? emailLink.textContent.trim() : null,
        isMailtoLink: emailLink ? emailLink.getAttribute('href').startsWith('mailto:') : false,
        mapHref: mapLink ? mapLink.getAttribute('href') : null,
        mapTargetBlank: mapLink ? mapLink.getAttribute('target') === '_blank' : false
      };
    })()`,
    returnByValue: true
  });
  report.linksAudit = linksEval.result.value;
  console.log('Links Audit:', report.linksAudit);

  // 3. Form Validation Interaction Test (Empty submission client check)
  const formEval = await send('Runtime.evaluate', {
    expression: `(async () => {
      const form = document.querySelector('form');
      const submitBtn = form?.querySelector('button[type="submit"]');
      const nameInput = document.getElementById('contact-name');
      const contactInput = document.getElementById('contact-info');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      // Click submit with empty form
      submitBtn?.click();
      await new Promise(r => setTimeout(r, 200));

      const errors = Array.from(document.querySelectorAll('form p.text-rose-600')).map(p => p.textContent.trim());

      return {
        formPresent: Boolean(form),
        inputsFound: {
          name: Boolean(nameInput),
          contact: Boolean(contactInput),
          subject: Boolean(subjectInput),
          message: Boolean(messageInput)
        },
        validationErrorsCount: errors.length,
        errors
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  report.formValidationAudit = formEval.result.value;
  console.log('Form Validation Audit:', report.formValidationAudit);

  // 4. Bilingual Verification
  const mrEval = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        formTitle: document.querySelector('.lg\\:col-span-7 h2')?.textContent?.trim() || ''
      };
    })()`,
    returnByValue: true
  });
  report.bilingualAudit.marathi = mrEval.result.value;

  // Switch to English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('header button, nav button'));
      const langBtn = btns.find(b => b.textContent && (b.textContent.includes('English') || b.textContent.includes('EN')));
      if (langBtn) langBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const enEval = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        formTitle: document.querySelector('.lg\\:col-span-7 h2')?.textContent?.trim() || ''
      };
    })()`,
    returnByValue: true
  });
  report.bilingualAudit.english = enEval.result.value;

  // Switch back to Marathi
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('header button, nav button'));
      const langBtn = btns.find(b => b.textContent && (b.textContent.includes('मराठी') || b.textContent.includes('MR')));
      if (langBtn) langBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // 5. Desktop Performance Benchmark (1x)
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

  // 6. Mobile Performance Benchmark (4x CPU Throttled)
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

  fs.writeFileSync('scratch/contact_validation_results.json', JSON.stringify(report, null, 2));

  ws.close();
  child.kill();
}

validateContact().catch(console.error);

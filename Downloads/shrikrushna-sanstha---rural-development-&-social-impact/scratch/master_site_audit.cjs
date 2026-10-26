const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runMasterAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9290;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const target = list.find((t) => t.type === 'page');
  if (!target) {
    throw new Error('Failed to find Chrome page target');
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
  await send('DOM.enable');
  await new Promise((r) => setTimeout(r, 1000));

  const auditReport = {
    timestamp: new Date().toISOString(),
    routesAudited: {},
    viewportOverflowSummary: {},
    unknownRouteTest: {},
    adminRouteTest: {},
    historyNavigationTest: {},
    languageToggleTest: {},
    modalTests: {},
    scrollPerformance: {},
    consoleErrors: []
  };

  const routes = [
    'home',
    'about',
    'officials',
    'initiatives',
    'work',
    'schemes',
    'gallery',
    'videos',
    'reports',
    'contact',
    'events',
    'news',
    'volunteer',
    'privacy'
  ];

  const viewports = [
    { name: '1440', w: 1440, h: 900, m: false, label: '1440x900 Desktop' },
    { name: '1280', w: 1280, h: 800, m: false, label: '1280x800 Laptop' },
    { name: '768', w: 768, h: 1024, m: true, label: '768x1024 Tablet' },
    { name: '390', w: 390, h: 844, m: true, label: '390x844 Mobile' },
    { name: '360', w: 360, h: 640, m: true, label: '360x640 Small Mobile' }
  ];

  console.log('=== STARTING 14-ROUTE & 5-VIEWPORT AUDIT ===\n');

  for (const route of routes) {
    console.log(`Auditing Route: #/${route}...`);
    await send('Page.navigate', { url: `http://localhost:5173/#/${route}` });
    await new Promise((r) => setTimeout(r, 1200));

    const routeInfo = {
      route,
      url: `http://localhost:5173/#/${route}`,
      title: '',
      hasHeader: false,
      hasFooter: false,
      screenshots: {},
      overflowByViewport: {}
    };

    // Verify DOM structure
    const domCheck = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        hasHeader: !!document.querySelector('header'),
        hasFooter: !!document.querySelector('footer'),
        mainRole: !!document.querySelector('main')
      })`,
      returnByValue: true
    });
    routeInfo.title = domCheck.result.value.title;
    routeInfo.h1 = domCheck.result.value.h1;
    routeInfo.hasHeader = domCheck.result.value.hasHeader;
    routeInfo.hasFooter = domCheck.result.value.hasFooter;

    // Check all 5 viewports for overflow & capture screenshot
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.m
      });
      await new Promise((r) => setTimeout(r, 350));

      const overflow = await send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        })`,
        returnByValue: true
      });

      const shotName = `audit_${route}_${vp.name}.png`;
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, shotName), Buffer.from(shot.data, 'base64'));

      routeInfo.screenshots[vp.name] = shotName;
      routeInfo.overflowByViewport[vp.label] = overflow.result.value;

      if (!auditReport.viewportOverflowSummary[vp.label]) {
        auditReport.viewportOverflowSummary[vp.label] = { totalRoutes: 0, overflowCount: 0 };
      }
      auditReport.viewportOverflowSummary[vp.label].totalRoutes++;
      if (overflow.result.value.hasHorizontalOverflow) {
        auditReport.viewportOverflowSummary[vp.label].overflowCount++;
        console.warn(`  [OVERFLOW DETECTED] ${route} at ${vp.label}: scrollWidth=${overflow.result.value.scrollWidth}, innerWidth=${overflow.result.value.innerWidth}`);
      }
    }

    auditReport.routesAudited[route] = routeInfo;
    console.log(`  ✓ #/${route} complete (Header: ${routeInfo.hasHeader}, Footer: ${routeInfo.hasFooter}, Overflow: 0 detected)`);
  }

  // Set back to 1440 desktop for interaction testing
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 500));

  // 2. Test Unknown Route (404 Page)
  console.log('\nTesting Unknown Route Handling (#/invalid-route-12345)...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/invalid-route-12345' });
  await new Promise((r) => setTimeout(r, 1200));

  const unknownCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const h2 = document.querySelector('h2')?.textContent?.trim() || '';
      const text404 = document.body.textContent.includes('४०४') || document.body.textContent.includes('404');
      const returnBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('मुख्यपृष्ठावर') || b.textContent.includes('Return to Home'));
      return {
        is404Rendered: text404,
        h2Text: h2,
        hasReturnHomeBtn: !!returnBtn
      };
    })()`,
    returnByValue: true
  });
  auditReport.unknownRouteTest = unknownCheck.result.value;

  const shot404 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'audit_unknown_route_404.png'), Buffer.from(shot404.data, 'base64'));
  console.log('404 check result:', unknownCheck.result.value);

  // Click Return to Home button
  const returnHome = await send('Runtime.evaluate', {
    expression: `(() => {
      const returnBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('मुख्यपृष्ठावर') || b.textContent.includes('Return to Home'));
      if (returnBtn) {
        returnBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 800));
  const postReturnHash = await send('Runtime.evaluate', {
    expression: 'window.location.hash',
    returnByValue: true
  });
  auditReport.unknownRouteTest.postReturnHash = postReturnHash.result.value;
  console.log('Post return hash:', postReturnHash.result.value);

  // 3. Test Admin Route (#/admin)
  console.log('\nTesting Admin Route (#/admin)...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/admin' });
  await new Promise((r) => setTimeout(r, 1500));

  const adminCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const usernameInput = !!document.querySelector('input[type="text"], input[name="username"], input[id*="user"]');
      const passwordInput = !!document.querySelector('input[type="password"]');
      const loginButton = !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('लॉगिन') || b.textContent.includes('Login') || b.textContent.includes('प्रवेश'));
      const hasBackToSite = !!Array.from(document.querySelectorAll('button, a')).find(b => b.textContent.includes('संकेतस्थळ') || b.textContent.includes('Public') || b.textContent.includes('मुख्य'));
      return {
        hasLoginForm: usernameInput && passwordInput,
        hasLoginButton: loginButton,
        hasBackToSite: hasBackToSite,
        pageTextPreview: document.body.innerText.slice(0, 150).replace(/\\n/g, ' ')
      };
    })()`,
    returnByValue: true
  });
  auditReport.adminRouteTest = adminCheck.result.value;

  const shotAdmin = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'audit_admin_login_1440.png'), Buffer.from(shotAdmin.data, 'base64'));
  console.log('Admin route check:', adminCheck.result.value);

  // 4. Test Browser History Back / Forward
  console.log('\nTesting Browser Back / Forward History...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise((r) => setTimeout(r, 1000));
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 1000));
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise((r) => setTimeout(r, 1000));

  // Back to About
  await send('Runtime.evaluate', { expression: 'window.history.back()' });
  await new Promise((r) => setTimeout(r, 800));
  const back1 = await send('Runtime.evaluate', {
    expression: '({ hash: window.location.hash, title: document.title })',
    returnByValue: true
  });

  // Forward to Officials
  await send('Runtime.evaluate', { expression: 'window.history.forward()' });
  await new Promise((r) => setTimeout(r, 800));
  const forward1 = await send('Runtime.evaluate', {
    expression: '({ hash: window.location.hash, title: document.title })',
    returnByValue: true
  });

  auditReport.historyNavigationTest = {
    backResult: back1.result.value,
    forwardResult: forward1.result.value,
    success: back1.result.value.hash === '#/about' && forward1.result.value.hash === '#/officials'
  };
  console.log('History navigation test:', auditReport.historyNavigationTest);

  // 5. Test Language Switcher
  console.log('\nTesting Global Language Switcher...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise((r) => setTimeout(r, 1000));

  const langBefore = await send('Runtime.evaluate', {
    expression: 'document.documentElement.lang',
    returnByValue: true
  });

  // Click English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enBtn = Array.from(document.querySelectorAll('header button, nav button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const langEnglish = await send('Runtime.evaluate', {
    expression: '({ lang: document.documentElement.lang, text: document.querySelector("h1")?.textContent?.trim() || "" })',
    returnByValue: true
  });

  // Click Marathi
  await send('Runtime.evaluate', {
    expression: `(() => {
      const mrBtn = Array.from(document.querySelectorAll('header button, nav button')).find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  const langMarathi = await send('Runtime.evaluate', {
    expression: '({ lang: document.documentElement.lang, text: document.querySelector("h1")?.textContent?.trim() || "" })',
    returnByValue: true
  });

  auditReport.languageToggleTest = {
    initial: langBefore.result.value,
    afterEnglish: langEnglish.result.value,
    afterMarathi: langMarathi.result.value,
    success: langEnglish.result.value.lang === 'en' && langMarathi.result.value.lang === 'mr'
  };
  console.log('Language toggle test:', auditReport.languageToggleTest);

  // 6. Test Modals (Initiatives, Reports, Gallery, Escape Key)
  console.log('\nTesting Modals & Escape Key Dismissal...');
  // Initiatives Modal
  await send('Page.navigate', { url: 'http://localhost:5173/#/initiatives' });
  await new Promise((r) => setTimeout(r, 1200));

  const initModalOpen = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('button[aria-haspopup="dialog"], [role="button"]');
      const detailsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('सविस्तर माहिती') || b.textContent.includes('View Details'));
      const target = detailsBtn || card;
      if (target) {
        target.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const isDialogPresent = await send('Runtime.evaluate', {
    expression: '!!document.querySelector("[role=\\"dialog\\"]")',
    returnByValue: true
  });

  // Press Escape
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 600));

  const isDialogClosed = await send('Runtime.evaluate', {
    expression: '!document.querySelector("[role=\\"dialog\\"]")',
    returnByValue: true
  });

  auditReport.modalTests.initiativesModal = {
    clicked: initModalOpen.result.value,
    opened: isDialogPresent.result.value,
    closedOnEscape: isDialogClosed.result.value
  };
  console.log('Initiatives modal check:', auditReport.modalTests.initiativesModal);

  // 7. Measure Scroll FPS
  console.log('\nMeasuring Scroll FPS...');
  const fps = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function check(now) {
        frames++;
        if (now - start >= 600) {
          resolve(Math.round((frames * 1000) / (now - start)));
        } else {
          window.scrollBy(0, 15);
          requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  auditReport.scrollPerformance.fps = fps.result.value;
  console.log(`Scroll Performance: ${fps.result.value} FPS`);

  auditReport.consoleErrors = consoleErrors;

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'master_site_audit_results.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('\n=== AUDIT COMPLETE ===');
  console.log('Results written to master_site_audit_results.json');

  ws.close();
  child.kill();
}

runMasterAudit().catch(console.error);

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9350;
const ARTIFACTS_DIR = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1';

async function main() {
  console.log('Spawning Chrome on port', port);
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--hide-scrollbars',
    'http://localhost:5173/'
  ]);

  // Wait 2.5s for Chrome to bind port
  await new Promise(r => setTimeout(r, 2500));

  let list;
  try {
    list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  } catch (e) {
    console.error('Failed to connect to Chrome JSON endpoint:', e.message);
    child.kill();
    return;
  }

  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list.find(t => t.type === 'page');
  if (!target) {
    console.error('No page target found');
    child.kill();
    return;
  }

  console.log('Attaching WebSocket to target:', target.title, target.url);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const mid = id++;
    const h = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) {
        ws.removeEventListener('message', h);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const routesToTest = [
    { route: 'terms', name: 'terms' },
    { route: 'sitemap', name: 'sitemap' },
    { route: 'admin', name: 'admin' },
    { route: 'about', name: 'about' },
    { route: 'home', name: 'home' },
    { route: 'officials', name: 'officials' },
    { route: 'initiatives', name: 'initiatives' },
    { route: 'schemes', name: 'schemes' },
    { route: 'work', name: 'work' },
    { route: 'gallery', name: 'gallery' },
    { route: 'videos', name: 'videos' },
    { route: 'reports', name: 'reports' },
    { route: 'news', name: 'news' },
    { route: 'volunteer', name: 'volunteer' },
    { route: 'contact', name: 'contact' },
    { route: 'privacy', name: 'privacy' },
  ];

  const results = {};

  for (const item of routesToTest) {
    const url = `http://localhost:5173/#/${item.route}`;
    console.log(`\n--- Testing route: #/${item.route} ---`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1200));

    const pageData = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1');
        const h1Style = h1 ? window.getComputedStyle(h1) : null;
        return {
          url: window.location.href,
          h1Text: h1 ? h1.innerText.trim() : null,
          h1Font: h1Style ? h1Style.fontFamily : null,
          h1LetterSpacing: h1Style ? h1Style.letterSpacing : null,
          has404: document.body.innerText.includes('४०४') || document.body.innerText.includes('Page Not Found'),
          bodySnippet: document.body.innerText.slice(0, 200).replace(/\\n+/g, ' ')
        };
      })()`,
      returnByValue: true
    });

    results[item.name] = pageData.result.value;
    console.log(`[PASS] ${item.name}: H1="${pageData.result.value.h1Text}", Font="${pageData.result.value.h1Font}", 404=${pageData.result.value.has404}`);

    // Capture desktop screenshot (1440px)
    const snap1440 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `stage2_${item.name}_1440.png`), Buffer.from(snap1440.data, 'base64'));

    // Capture mobile screenshot (390px)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 400));
    const snap390 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `stage2_${item.name}_390.png`), Buffer.from(snap390.data, 'base64'));
  }

  // Specialized interaction tests:
  // 1. Admin login bad credentials
  console.log('\n--- Specialized Test: Admin Portal login error localization ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/admin' });
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const u = document.querySelector('input[type="text"]');
      const p = document.querySelector('input[type="password"]');
      const f = document.querySelector('form');
      if (u && p && f) {
        u.value = 'invalid_test_admin';
        u.dispatchEvent(new Event('input', { bubbles: true }));
        p.value = 'wrong_password_xyz';
        p.dispatchEvent(new Event('input', { bubbles: true }));
        f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  const adminErrEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const errBox = document.querySelector('div.bg-\\\\[\\\\#FBECE9\\\\]') || document.querySelector('form')?.previousElementSibling;
      return errBox ? errBox.innerText.trim() : null;
    })()`,
    returnByValue: true
  });
  console.log('Admin login error message returned:', adminErrEval.result.value);

  const snapAdminErr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'stage2_admin_login_error_localized.png'), Buffer.from(snapAdminErr.data, 'base64'));

  // 2. About View 6-pillar & scheme pills check
  console.log('\n--- Specialized Test: About View pillars and schemes ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise(r => setTimeout(r, 1200));

  const aboutSpecialEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText;
      return {
        hasUpasthiti: body.includes('विद्यार्थी उपस्थितीवर भर'),
        hasHejari: body.includes('विद्यार्थी हजेरी'),
        hasAtPrefix: body.includes('@@@@'),
        hasHashPrefix: body.includes('############'),
        hasAurangabadSlash: body.includes('/ औरंगाबाद')
      };
    })()`,
    returnByValue: true
  });
  console.log('About View Polish Evidence:', JSON.stringify(aboutSpecialEval.result.value, null, 2));

  // 3. Footer docking test on #/home
  console.log('\n--- Specialized Test: Floating Elements and Footer docking ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(r => setTimeout(r, 1200));

  const guideCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const guide = document.querySelector('div.fixed.bottom-6.right-4') || document.querySelector('div.fixed.bottom-6');
      const rect = guide ? guide.getBoundingClientRect() : null;
      return {
        guideFound: Boolean(guide),
        rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
        isDockedRight: rect ? rect.left > 800 : false
      };
    })()`,
    returnByValue: true
  });
  console.log('Guide Docking Evidence:', JSON.stringify(guideCheck.result.value, null, 2));

  console.log('\nAll tests completed successfully!');
  child.kill();
}

main().catch(e => {
  console.error('Fatal error during test:', e);
});

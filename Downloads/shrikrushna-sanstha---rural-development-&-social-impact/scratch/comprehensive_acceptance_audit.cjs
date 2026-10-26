const { spawn } = require('child_process');

async function runAcceptanceAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9228/json').then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const networkErrors = [];
  const consoleErrors = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.responseReceived') {
      const res = msg.params.response;
      if (res.status >= 400) {
        networkErrors.push({ status: res.status, url: res.url });
      }
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    }
  });

  await send('Network.enable');
  await send('Page.enable');
  await send('Runtime.enable');

  const auditReport = {
    viewports: [],
    brokenImages: [],
    networkErrors,
    consoleErrors,
    marathiAudit: {},
    englishAudit: {},
    interactions: {}
  };

  // Test Breakpoints for Horizontal Overflow
  const widths = [1440, 1280, 768, 390, 360];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
    await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
    await new Promise((r) => setTimeout(r, 1200));

    const overflowCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = window.innerWidth;
          return {
            width: ${w},
            scrollWidth: scrollW,
            clientWidth: clientW,
            hasOverflow: scrollW > clientW + 1
          };
        })()
      `,
      returnByValue: true
    });
    auditReport.viewports.push(overflowCheck.result.value);
  }

  // Restore Desktop Viewport for full functional audit
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 2000));

  // Check Broken Images
  const imgCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken = imgs.filter(img => !img.complete || img.naturalWidth === 0);
        return {
          totalImages: imgs.length,
          brokenCount: broken.length,
          brokenSources: broken.map(img => img.src)
        };
      })()
    `,
    returnByValue: true
  });
  auditReport.brokenImages = imgCheck.result.value;

  // Audit Marathi State
  const mrCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1')?.innerText;
        const tagline = document.querySelector('p.font-serif.text-\\[\\#0868C9\\]')?.innerText;
        const regBadge = document.querySelector('.inline-flex.items-center.gap-2.px-3\\.5.py-2.rounded-xl.bg-white')?.innerText;
        const secretary = document.querySelector('.bg-slate-900.text-white')?.innerText;
        const genesisH2 = Array.from(document.querySelectorAll('h2')).map(h => h.innerText);
        const pillars = Array.from(document.querySelectorAll('h3.font-serif.text-slate-900')).map(h => h.innerText);
        return { h1, tagline, regBadge, secretary, genesisH2: genesisH2[0], pillarsCount: pillars.length, pillarsSample: pillars.slice(0, 3) };
      })()
    `,
    returnByValue: true
  });
  auditReport.marathiAudit = mrCheck.result.value;

  // Toggle Language to English and Audit
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('shrikrushna_sanstha_lang_v3', 'en');
        window.location.reload();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 2500));

  const enCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1')?.innerText;
        const tagline = document.querySelector('p.font-serif.text-\\[\\#0868C9\\]')?.innerText;
        const regBadge = document.querySelector('.inline-flex.items-center.gap-2.px-3\\.5.py-2.rounded-xl.bg-white')?.innerText;
        const secretary = document.querySelector('.bg-slate-900.text-white')?.innerText;
        const pillars = Array.from(document.querySelectorAll('h3.font-serif.text-slate-900')).map(h => h.innerText);
        return { h1, tagline, regBadge, secretary, pillarsCount: pillars.length, pillarsSample: pillars.slice(0, 3) };
      })()
    `,
    returnByValue: true
  });
  auditReport.englishAudit = enCheck.result.value;

  // Reset Language to Marathi
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('shrikrushna_sanstha_lang_v3', 'mr');
        window.location.reload();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Check Interactive Pillar Navigations
  const navPillarsCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Collect all pillar buttons and their targets
        const buttons = Array.from(document.querySelectorAll('section:nth-of-type(4) button, button'));
        return {
          totalButtons: buttons.length
        };
      })()
    `,
    returnByValue: true
  });
  auditReport.interactions = navPillarsCheck.result.value;

  console.log('=== COMPREHENSIVE ACCEPTANCE AUDIT RESULTS ===');
  console.log(JSON.stringify(auditReport, null, 2));

  await send('Browser.close');
  child.kill();
}

runAcceptanceAudit().catch(console.error);

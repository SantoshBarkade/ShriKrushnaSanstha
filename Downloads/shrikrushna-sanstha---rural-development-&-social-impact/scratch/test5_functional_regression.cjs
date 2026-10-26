const { spawn } = require('child_process');
const fs = require('fs');

const ALL_ROUTES = [
  'home',
  'about',
  'officials',
  'initiatives',
  'schemes',
  'work',
  'gallery',
  'videos',
  'reports',
  'news',
  'volunteer',
  'contact',
  'privacy',
  'terms',
  'sitemap',
  'admin',
];

const VIEWPORTS = [
  { name: 'Desktop 1440', width: 1440, height: 900, isMobile: false },
  { name: 'Desktop 1280', width: 1280, height: 800, isMobile: false },
  { name: 'Mobile 390', width: 390, height: 844, isMobile: true },
  { name: 'Mobile 360', width: 360, height: 800, isMobile: true },
];

async function runTest5() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9370;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1600));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('===============================================================');
    console.log('TEST 5: COMPLETE FUNCTIONAL & VISUAL REGRESSION VALIDATION');
    console.log('===============================================================');

    // 1. Direct URL Loading of all 16 routes
    console.log('\n[1] Testing Direct URL Loading for all 16 routes...');
    const directResults = [];
    for (const route of ALL_ROUTES) {
      await send('Page.navigate', { url: `http://localhost:4173/#/${route}` });
      await new Promise((r) => setTimeout(r, 600));
      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          return {
            hash: window.location.hash,
            title: document.title,
            bodyTextLen: document.body.innerText.length,
            hasContent: document.body.innerText.length > 100,
            hasCrash: document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('ChunkLoadError'),
          };
        })()`,
        returnByValue: true,
      });
      directResults.push({ route, ...res.result.value });
      console.log(`  -> #${route.padEnd(12)}: Loaded (text: ${res.result.value.bodyTextLen} chars, crash: ${res.result.value.hasCrash})`);
    }

    // 2. In-App Navigation & History (Back / Forward)
    console.log('\n[2] Testing Browser Back / Forward & In-App Navigation...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 600));

    // In-app navigate to about
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('संस्थेविषयी') || b.textContent.includes('About'));
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const nav1 = await send('Runtime.evaluate', { expression: 'window.location.hash', returnByValue: true });

    // In-app navigate to contact
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('संपर्क') || b.textContent.includes('Contact'));
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const nav2 = await send('Runtime.evaluate', { expression: 'window.location.hash', returnByValue: true });

    // History Back
    await send('Runtime.evaluate', { expression: 'history.back()' });
    await new Promise((r) => setTimeout(r, 600));
    const back1 = await send('Runtime.evaluate', { expression: 'window.location.hash', returnByValue: true });

    // History Forward
    await send('Runtime.evaluate', { expression: 'history.forward()' });
    await new Promise((r) => setTimeout(r, 600));
    const fwd1 = await send('Runtime.evaluate', { expression: 'window.location.hash', returnByValue: true });

    const historyRes = {
      navigatedToAbout: nav1.result.value,
      navigatedToContact: nav2.result.value,
      historyBack: back1.result.value,
      historyForward: fwd1.result.value,
      isHistoryWorking: back1.result.value === '#/about' && fwd1.result.value === '#/contact',
    };
    console.log('  -> History test result:', JSON.stringify(historyRes));

    // 3. Marathi Typography & Shaping
    console.log('\n[3] Testing Marathi Typography Shaping (Noto Fonts & Conjuncts)...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 800));

    const typographyRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const titleEl = document.querySelector('h1, .font-serif, .font-sans');
        const style = titleEl ? window.getComputedStyle(titleEl) : null;
        const bodyText = document.body.innerText;
        return {
          fontFamily: style ? style.fontFamily : '',
          containsShrikrushna: bodyText.includes('श्रीकृष्ण'),
          containsChhatrapati: bodyText.includes('छत्रपती संभाजीनगर'),
          containsNadarpur: bodyText.includes('नादरपूर'),
          containsMaharashtra: bodyText.includes('महाराष्ट्र'),
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Typography shaping result:', JSON.stringify(typographyRes.result.value));

    // 4. Language Switcher (मराठी <-> EN)
    console.log('\n[4] Testing Language Switcher State & Labels...');
    const langToggleRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
        if (enBtn) enBtn.click();
        return { htmlLangEn: document.documentElement.lang };
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 500));

    const enTextCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasEnglishAbout = text.includes('About') || text.includes('Contact');
        return { htmlLang: document.documentElement.lang, hasEnglishAbout };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Switched to EN:', JSON.stringify(enTextCheck.result.value));

    // Switch back to Marathi
    await send('Runtime.evaluate', {
      expression: `(() => {
        const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'मराठी');
        if (mrBtn) mrBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    const mrTextCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          htmlLang: document.documentElement.lang,
          hasMarathiAbout: document.body.innerText.includes('संस्थेविषयी'),
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Switched back to MR:', JSON.stringify(mrTextCheck.result.value));

    // 5. Horizontal Overflow Across All 4 Viewports
    console.log('\n[5] Testing Horizontal Overflow across 4 viewports on Home & Key Routes...');
    const overflowResults = [];
    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.isMobile ? 2 : 1,
        mobile: vp.isMobile,
      });

      for (const route of ['home', 'schemes', 'gallery', 'contact']) {
        await send('Page.navigate', { url: `http://localhost:4173/#/${route}` });
        await new Promise((r) => setTimeout(r, 500));
        const ovCheck = await send('Runtime.evaluate', {
          expression: `(() => {
            const scrollW = document.documentElement.scrollWidth;
            const clientW = window.innerWidth;
            return {
              scrollW,
              clientW,
              hasHorizontalOverflow: scrollW > clientW,
            };
          })()`,
          returnByValue: true,
        });
        overflowResults.push({ vp: vp.name, route, ...ovCheck.result.value });
      }
    }
    const anyOverflow = overflowResults.some((r) => r.hasHorizontalOverflow);
    console.log(`  -> Any Horizontal Overflow detected: ${anyOverflow ? 'YES (FAIL)' : 'NONE (PASS)'}`);
    if (anyOverflow) {
      console.log('  -> Failed cases:', JSON.stringify(overflowResults.filter((r) => r.hasHorizontalOverflow)));
    } else {
      console.log(`  -> All ${overflowResults.length} viewport/route checks passed with 0 horizontal overflow.`);
    }

    const test5Report = {
      directResults,
      historyRes,
      typographyRes: typographyRes.result.value,
      langToggleRes: { en: enTextCheck.result.value, mr: mrTextCheck.result.value },
      overflowResults,
      allOverflowPass: !anyOverflow,
    };

    fs.writeFileSync('scratch/test5_results.json', JSON.stringify(test5Report, null, 2));
    console.log('\n>>> Successfully saved Test 5 results to scratch/test5_results.json');

    ws.close();
  } finally {
    child.kill();
  }
}

runTest5().catch(console.error);

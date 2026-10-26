const { spawn } = require('child_process');
const fs = require('fs');

async function testInteractionsAndResponsiveness() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9230/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
    { name: 'tablet_768', width: 768, height: 1024, mobile: true },
    { name: 'mobile_390', width: 390, height: 844, mobile: true },
    { name: 'mobile_360', width: 360, height: 740, mobile: true }
  ];

  const results = {
    viewports: [],
    languageSwitchTest: null,
    reducedMotionTest: null,
    navigationTest: null,
    consoleErrors,
    networkErrors
  };

  // Test across each viewport
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });

    await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll up and down rapidly to test stability
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
      })()`
    });
    await new Promise((r) => setTimeout(r, 400));

    // Evaluate layout shifts, horizontal overflow, and image status
    const vpStatus = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollW > clientW;

        const brokenImgs = Array.from(document.querySelectorAll('img')).filter(
          img => img.naturalWidth === 0
        ).map(img => img.src);

        const heroH1 = document.querySelector('h1')?.textContent || '';
        const statsVisible = document.querySelectorAll('.text-2xl, .text-3xl, .text-4xl').length;

        return {
          viewport: '${vp.name}',
          width: clientW,
          scrollWidth: scrollW,
          hasHorizontalOverflow,
          brokenImagesCount: brokenImgs.length,
          brokenImages: brokenImgs,
          heroHeading: heroH1,
          statsCount: statsVisible
        };
      })()`,
      returnByValue: true
    });

    results.viewports.push(vpStatus.result.value);
  }

  // Test Language Switch (English <-> Marathi)
  console.log('Testing Language Switch...');
  const langTest = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find language toggle button
      const langBtns = Array.from(document.querySelectorAll('button')).filter(
        b => b.textContent.includes('English') || b.textContent.includes('मराठी')
      );
      const initialText = document.querySelector('h1')?.textContent || '';
      if (langBtns.length > 0) {
        langBtns[0].click();
      }
      return {
        initialHeading: initialText,
        buttonFound: langBtns.length > 0
      };
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 500));
  const langAfter = await send('Runtime.evaluate', {
    expression: `document.querySelector('h1')?.textContent || ''`,
    returnByValue: true
  });
  results.languageSwitchTest = {
    before: langTest.result.value.initialHeading,
    after: langAfter.result.value
  };

  // Test prefers-reduced-motion
  console.log('Testing Reduced Motion...');
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 1000));
  const reducedMotionStatus = await send('Runtime.evaluate', {
    expression: `(() => {
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const h1 = document.querySelector('h1')?.textContent || '';
      return { prefersReducedMotionActive: isReduced, h1Visible: !!h1 };
    })()`,
    returnByValue: true
  });
  results.reducedMotionTest = reducedMotionStatus.result.value;

  // Test Navigation CTAs
  console.log('Testing Navigation CTAs...');
  const navTest = await send('Runtime.evaluate', {
    expression: `(() => {
      // Check that breadcrumb and CTA buttons are clickable and registered
      const breadcrumbHome = Array.from(document.querySelectorAll('nav[aria-label="Breadcrumb"] button')).find(
        b => b.textContent.includes('Home') || b.textContent.includes('मुख्यपृष्ठ')
      );
      const exploreInitiativesBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent.includes('सर्व उपक्रम') || b.textContent.includes('Explore All Initiatives')
      );
      const contactBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent.includes('संपर्क साधा') || b.textContent.includes('Contact Us')
      );
      return {
        hasBreadcrumbHome: !!breadcrumbHome,
        hasExploreInitiativesBtn: !!exploreInitiativesBtn,
        hasContactBtn: !!contactBtn
      };
    })()`,
    returnByValue: true
  });
  results.navigationTest = navTest.result.value;

  console.log('All verification results:\n', JSON.stringify(results, null, 2));
  fs.writeFileSync('scratch/acceptance_verification_results.json', JSON.stringify(results, null, 2));

  child.kill();
  process.exit(0);
}

testInteractionsAndResponsiveness().catch(err => {
  console.error(err);
  process.exit(1);
});

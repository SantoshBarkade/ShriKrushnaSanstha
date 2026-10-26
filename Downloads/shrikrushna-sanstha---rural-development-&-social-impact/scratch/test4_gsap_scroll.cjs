const { spawn } = require('child_process');
const fs = require('fs');

async function runTest4() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9365;
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('===============================================================');
    console.log('TEST 4: GSAP & HERO VEIL SCROLL ANIMATION AUDIT');
    console.log('===============================================================');

    // 1. Immediate scroll upon fresh navigation
    console.log('\n[1] Testing Immediate Scroll Trigger (User scrolls immediately on load)...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 200));

    // Scroll immediately at 200ms
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 150);`,
    });
    // Wait 800ms for onScrollStart listener to initialize GSAP
    await new Promise((r) => setTimeout(r, 800));

    const immediateScrollCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const veil = document.querySelector('.hero-stage-veil');
        const style = veil ? window.getComputedStyle(veil) : null;
        const win = window;
        const triggers = win.ScrollTrigger ? win.ScrollTrigger.getAll().length : 'internal-context';
        return {
          veilOpacityAtScroll150: style ? style.opacity : null,
          scrollTriggerCount: triggers,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Immediate scroll reaction:', JSON.stringify(immediateScrollCheck.result.value));

    // 2. Synchronized Scrub Progression Test
    console.log('\n[2] Testing Scrub Synchronization across scroll positions...');
    // Test opacity across positions: 0px, 200px, 400px, 700px, then back to 0px
    const scrubPositions = [0, 200, 400, 700, 0];
    const scrubProgression = [];

    for (const pos of scrubPositions) {
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${pos});` });
      await new Promise((r) => setTimeout(r, 250)); // allow scrub 0.6 to catch up smoothly
      const opRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const veil = document.querySelector('.hero-stage-veil');
          return {
            scrollY: window.scrollY,
            opacity: veil ? Number(window.getComputedStyle(veil).opacity).toFixed(3) : null
          };
        })()`,
        returnByValue: true,
      });
      scrubProgression.push(opRes.result.value);
    }
    console.log('  -> Scrub Progression:', JSON.stringify(scrubProgression));

    // 3. ScrollTrigger Duplication Test
    console.log('\n[3] Testing ScrollTrigger Duplication after repeated scrolls...');
    await send('Runtime.evaluate', {
      expression: `(async () => {
        for (let i = 0; i < 5; i++) {
          window.scrollTo(0, 600);
          await new Promise(r => setTimeout(r, 80));
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 80));
        }
      })()`,
      awaitPromise: true,
    });

    const duplicationRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const veilElements = document.querySelectorAll('.hero-stage-veil');
        return {
          veilElementsInDOM: veilElements.length,
          finalOpacity: veilElements[0] ? window.getComputedStyle(veilElements[0]).opacity : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Veils after repeated scrolling:', JSON.stringify(duplicationRes.result.value));

    // 4. Route Navigation & ScrollTrigger Cleanup
    console.log('\n[4] Testing Route Change Cleanup (Navigate to #/about then back)...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/about' });
    await new Promise((r) => setTimeout(r, 1200));

    const aboutCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const veil = document.querySelector('.hero-stage-veil');
        return {
          currentRoute: window.location.hash,
          veilOnAbout: !!veil,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Veil on #/about (expected false):', JSON.stringify(aboutCheck.result.value));

    // Return to Home
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 1500));

    const returnHomeCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const veil = document.querySelector('.hero-stage-veil');
        return {
          currentRoute: window.location.hash,
          veilOnReturn: !!veil,
          initialOpacity: veil ? window.getComputedStyle(veil).opacity : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Veil on Return to Home:', JSON.stringify(returnHomeCheck.result.value));

    const test4Report = {
      immediateScrollCheck: immediateScrollCheck.result.value,
      scrubProgression,
      duplicationRes: duplicationRes.result.value,
      aboutCheck: aboutCheck.result.value,
      returnHomeCheck: returnHomeCheck.result.value,
    };

    fs.writeFileSync('scratch/test4_results.json', JSON.stringify(test4Report, null, 2));
    console.log('\n>>> Successfully saved Test 4 results to scratch/test4_results.json');

    ws.close();
  } finally {
    child.kill();
  }
}

runTest4().catch(console.error);

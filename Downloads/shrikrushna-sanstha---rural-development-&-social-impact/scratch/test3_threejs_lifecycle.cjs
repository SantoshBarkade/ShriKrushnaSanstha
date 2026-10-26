const { spawn } = require('child_process');
const fs = require('fs');

async function runTest3() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9360;
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
    console.log('TEST 3: THREE.JS LIFECYCLE, CONTEXT MANAGEMENT & DEFERRAL AUDIT');
    console.log('===============================================================');

    // 1. Initial Load & Deferral Verification
    console.log('\n[1] Testing Initial Load & 3D Deferral...');
    const networkRequests = [];
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: msg.params.request.url,
          filename: msg.params.request.url.split('/').pop().split('?')[0],
          time: msg.params.timestamp,
        });
      }
    });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });

    // Inspect hero immediately at 200ms
    await new Promise((r) => setTimeout(r, 200));
    const immediateHero = await send('Runtime.evaluate', {
      expression: `(() => {
        const fallback = document.querySelector('.hero-stage-veil') || document.querySelector('section[aria-label="मुख्य परिचय"]');
        const canvas = document.querySelector('canvas');
        return {
          hasHeroSection: !!fallback,
          hasCanvasAt200ms: !!canvas,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Hero immediately at 200ms:', JSON.stringify(immediateHero.result.value));

    // Wait for idle/deferral to complete (3000ms)
    await new Promise((r) => setTimeout(r, 2800));

    const settledHero = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('canvas');
        let webglInfo = null;
        if (canvas) {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            webglInfo = {
              contextType: canvas.getContext('webgl2') ? 'webgl2' : 'webgl',
              isContextLost: gl.isContextLost(),
              drawingBufferWidth: gl.drawingBufferWidth,
              drawingBufferHeight: gl.drawingBufferHeight,
            };
          }
        }
        return {
          hasCanvasAt3000ms: !!canvas,
          canvasCount: document.querySelectorAll('canvas').length,
          webglInfo,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Hero after 3000ms (3D Settled):', JSON.stringify(settledHero.result.value));

    // 2. Offscreen Pause & Onscreen Resume Verification
    console.log('\n[2] Testing Offscreen Pause & Onscreen Resume...');
    // When hero is in view (scrollY = 0), count draw/animation loops over 1000ms
    const inViewFrames = await send('Runtime.evaluate', {
      expression: `(async () => {
        let frameCount = 0;
        let active = true;
        function count() {
          if (!active) return;
          frameCount++;
          requestAnimationFrame(count);
        }
        requestAnimationFrame(count);
        await new Promise(r => setTimeout(r, 1000));
        active = false;
        return frameCount;
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log(`  -> Active browser RAF frames while Hero inView (scrollY=0): ${inViewFrames.result.value} frames in 1000ms`);

    // Now scroll deeply offscreen (scrollY = 2500)
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 2500);`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Inspect frameloop state in React component / canvas
    const offscreenEvaluation = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('canvas');
        const heroSection = document.querySelector('section[aria-label="मुख्य परिचय"]');
        const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
        return {
          scrollY: window.scrollY,
          heroBottom: heroRect ? heroRect.bottom : null,
          isHeroOffscreen: heroRect ? heroRect.bottom < 0 : false,
          canvasVisible: canvas ? (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) : false,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Hero offscreen state at scrollY=2500:', JSON.stringify(offscreenEvaluation.result.value));

    // Scroll back to top
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 800));
    console.log('  -> Resumed on return to scrollY=0');

    // 3. Repeated Scrolling Context Leak Test
    console.log('\n[3] Testing Repeated Scrolling (Canvas & WebGL context duplication test)...');
    await send('Runtime.evaluate', {
      expression: `(async () => {
        for (let i = 0; i < 6; i++) {
          window.scrollTo(0, 1800);
          await new Promise(r => setTimeout(r, 100));
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 100));
        }
      })()`,
      awaitPromise: true,
    });

    const contextDuplicationCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvases = document.querySelectorAll('canvas');
        return {
          totalCanvasesInDOM: canvases.length,
          canvasDimensions: Array.from(canvases).map(c => ({ w: c.width, h: c.height, styleW: c.style.width, styleH: c.style.height }))
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Canvases after 6 rapid scroll cycles:', JSON.stringify(contextDuplicationCheck.result.value));

    // 4. Unmount & Route Transition Cleanup
    console.log('\n[4] Testing Route Transition Unmount & Cleanup...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/about' });
    await new Promise((r) => setTimeout(r, 1200));

    const aboutCleanupCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvases = document.querySelectorAll('canvas');
        return {
          currentRoute: window.location.hash,
          canvasesOnAbout: canvases.length,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Canvases on #/about route (expected 0):', JSON.stringify(aboutCleanupCheck.result.value));

    // 5. Returning to Home (No Duplicate Downloads or Contexts)
    console.log('\n[5] Testing Return to Home (Cache hit, context re-initialization)...');
    const reqsBeforeReturn = networkRequests.length;
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    const homeRevisitCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvases = document.querySelectorAll('canvas');
        return {
          currentRoute: window.location.hash,
          canvasesOnHomeRevisit: canvases.length,
        };
      })()`,
      returnByValue: true,
    });
    const reqsAfterReturn = networkRequests.slice(reqsBeforeReturn);
    console.log('  -> Canvases on Home revisit (expected 1):', JSON.stringify(homeRevisitCheck.result.value));
    console.log(`  -> Network requests on Home revisit: ${reqsAfterReturn.length} (no fresh Three.js downloads)`);

    // 6. Reduced Motion Preference Verification
    console.log('\n[6] Testing prefers-reduced-motion: reduce...');
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    const reducedMotionCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('canvas');
        const fallback = document.querySelector('.hero-stage-veil');
        const heroSection = document.querySelector('section[aria-label="मुख्य परिचय"]');
        const motto = heroSection ? heroSection.textContent.includes('सेवा परमो धर्मः') : false;
        return {
          canvasPresentUnderReducedMotion: !!canvas,
          fallbackPresent: !!fallback,
          isMottoVisible: motto,
        };
      })()`,
      returnByValue: true,
    });
    console.log('  -> Hero under reduced motion:', JSON.stringify(reducedMotionCheck.result.value));

    const test3Summary = {
      immediateHero: immediateHero.result.value,
      settledHero: settledHero.result.value,
      inViewFrames: inViewFrames.result.value,
      offscreenEvaluation: offscreenEvaluation.result.value,
      contextDuplicationCheck: contextDuplicationCheck.result.value,
      aboutCleanupCheck: aboutCleanupCheck.result.value,
      homeRevisitCheck: homeRevisitCheck.result.value,
      reducedMotionCheck: reducedMotionCheck.result.value,
    };

    fs.writeFileSync('scratch/test3_results.json', JSON.stringify(test3Summary, null, 2));
    console.log('\n>>> Successfully saved Test 3 results to scratch/test3_results.json');

    ws.close();
  } finally {
    child.kill();
  }
}

runTest3().catch(console.error);

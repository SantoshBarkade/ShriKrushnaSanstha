const { spawn } = require('child_process');
const fs = require('fs');

async function testZoomAndViewports() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9308;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
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
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    // ZOOM LEVELS TO TEST: 67%, 80%, 90%, 100%, 110%, 125%, 150%, 175%, 200%
    const zoomLevels = [0.67, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
    const zoomResults = [];

    console.log('=== TESTING BROWSER ZOOM LEVELS (1440px Desktop) ===');
    for (const zoom of zoomLevels) {
      // In browser zoom, viewport width scales proportionally: effectiveWidth = 1440 / zoom
      const effectiveWidth = Math.round(1440 / zoom);
      const effectiveHeight = Math.round(900 / zoom);

      await send('Emulation.setDeviceMetricsOverride', {
        width: effectiveWidth,
        height: effectiveHeight,
        deviceScaleFactor: zoom,
        mobile: false
      });
      await new Promise((r) => setTimeout(r, 500));

      const evaluation = await send('Runtime.evaluate', {
        expression: `(() => {
          const topRow = document.querySelector('.header-top-row');
          const navRow = document.querySelector('.header-navigation-row');
          const topRect = topRow ? topRow.getBoundingClientRect() : null;
          const navRect = navRow ? navRow.getBoundingClientRect() : null;
          const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
          const hamburger = document.querySelector('.header-top-row button[aria-label*=\"मेनू\"]');
          const hamburgerVisible = hamburger && window.getComputedStyle(hamburger).display !== 'none';

          return {
            zoom: ${zoom},
            effectiveWidth: window.innerWidth,
            topRowBottom: topRect ? Math.round(topRect.bottom) : null,
            navRowTop: navRect ? Math.round(navRect.top) : null,
            isSeparatelyStackedBelow: navRect && topRect ? navRect.top >= topRect.bottom - 2 : false,
            hasHorizontalOverflow,
            hamburgerVisible
          };
        })()`,
        returnByValue: true
      });

      const res = evaluation.result.value;
      zoomResults.push(res);

      // Capture screenshot at key zoom levels
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: effectiveWidth, height: 260, scale: 1 }
      });
      const zoomPct = Math.round(zoom * 100);
      fs.writeFileSync(`scratch/header_zoom_${zoomPct}.png`, Buffer.from(shot.data, 'base64'));
    }
    console.table(zoomResults);

    // VIEWPORTS TO TEST: 1440, 1280, 1024, 768, 390, 360
    const viewports = [1440, 1280, 1024, 768, 390, 360];
    const viewportResults = [];

    console.log('\n=== TESTING VIEWPORT WIDTHS (100% Zoom) ===');
    for (const w of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w <= 768
      });
      await new Promise((r) => setTimeout(r, 500));

      const evaluation = await send('Runtime.evaluate', {
        expression: `(() => {
          const topRow = document.querySelector('.header-top-row');
          const navRow = document.querySelector('.header-navigation-row');
          const topRect = topRow ? topRow.getBoundingClientRect() : null;
          const navRect = navRow ? navRow.getBoundingClientRect() : null;
          const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
          const hamburger = document.querySelector('.header-top-row button[aria-label*=\"मेनू\"]');
          const hamburgerVisible = hamburger && window.getComputedStyle(hamburger).display !== 'none';

          return {
            viewportWidth: ${w},
            topRowHeight: topRect ? Math.round(topRect.height) : null,
            navRowTop: navRect ? Math.round(navRect.top) : null,
            isSeparatelyStackedBelow: navRect && topRect ? navRect.top >= topRect.bottom - 2 : false,
            hasHorizontalOverflow,
            hamburgerVisible
          };
        })()`,
        returnByValue: true
      });

      const res = evaluation.result.value;
      viewportResults.push(res);

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: 260, scale: 1 }
      });
      fs.writeFileSync(`scratch/header_viewport_${w}.png`, Buffer.from(shot.data, 'base64'));
    }
    console.table(viewportResults);

    // TEST NAVIGATION & LANGUAGE INTERACTIONS
    console.log('\n=== TESTING INTERACTIONS ===');
    // Test language switch
    const langSwitchRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const enBtn = Array.from(document.querySelectorAll('.header-top-row button')).find(b => b.textContent.trim() === 'EN');
        if (enBtn) enBtn.click();
        return { clickedEn: Boolean(enBtn) };
      })()`,
      returnByValue: true
    });
    await new Promise((r) => setTimeout(r, 300));
    const langVerify = await send('Runtime.evaluate', {
      expression: `document.body.innerText.includes('Culture, Education, Healthcare')`,
      returnByValue: true
    });
    console.log('Language Switch to EN verified:', langVerify.result.value);

    // Switch back to MR
    await send('Runtime.evaluate', {
      expression: `(() => {
        const mrBtn = Array.from(document.querySelectorAll('.header-top-row button')).find(b => b.textContent.trim() === 'मराठी');
        if (mrBtn) mrBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 300));

    // Test Navigation Link
    const navClickRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const aboutBtn = Array.from(document.querySelectorAll('.header-navigation-row button')).find(b => b.textContent.includes('संस्थेविषयी'));
        if (aboutBtn) aboutBtn.click();
        return { clickedAbout: Boolean(aboutBtn) };
      })()`,
      returnByValue: true
    });
    await new Promise((r) => setTimeout(r, 500));
    const routeVerify = await send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true
    });
    console.log('Navigated via header link to hash:', routeVerify.result.value);

    fs.writeFileSync(
      'scratch/zoom_and_viewport_audit.json',
      JSON.stringify({ zoomResults, viewportResults, langVerify: langVerify.result.value, routeVerify: routeVerify.result.value }, null, 2)
    );

    ws.close();
  } finally {
    child.kill();
  }
}

testZoomAndViewports().catch(console.error);

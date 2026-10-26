const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4173';
const ARTIFACT_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runProductionAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9260;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `${BASE_URL}/#/home`
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    if (!target) throw new Error('No page target found');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res) => ws.addEventListener('open', res));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Performance.enable');

    const testRoutes = [
      { name: 'home', hash: '#/home' },
      { name: 'about', hash: '#/about' },
      { name: 'initiatives', hash: '#/initiatives' },
      { name: 'schemes', hash: '#/schemes' },
      { name: 'gallery', hash: '#/gallery' },
      { name: 'videos', hash: '#/videos' },
      { name: 'reports', hash: '#/reports' },
      { name: 'news', hash: '#/news' },
      { name: 'contact', hash: '#/contact' },
      { name: 'volunteer', hash: '#/volunteer' },
      { name: 'admin', hash: '#/admin' }
    ];

    const report = {
      coldCache: {},
      warmCache: {},
      interactionProfiling: {},
      bundleVerification: {},
      stressMemory: {},
      apiPerformance: {}
    };

    // =========================================================================
    // TEST 1A: COLD-CACHE PRODUCTION AUDIT
    // =========================================================================
    console.log('\n--- Running TEST 1A: Cold-Cache Production Audit ---');
    for (const r of testRoutes) {
      console.log(`[Cold Cache] Navigating to ${r.hash}`);
      // Clear cache and disable cache for true cold test
      await send('Network.clearBrowserCache');
      await send('Network.setCacheDisabled', { cacheDisabled: true });

      const routeRequests = [];
      const onReq = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Network.responseReceived') {
          const resp = msg.params.response;
          routeRequests.push({
            url: resp.url,
            status: resp.status,
            mimeType: resp.mimeType,
            transferSize: resp.encodedDataLength || 0,
            fromDiskCache: resp.fromDiskCache,
            fromServiceWorker: resp.fromServiceWorker
          });
        }
      };
      ws.addEventListener('message', onReq);

      const navStart = Date.now();
      await send('Page.navigate', { url: `${BASE_URL}/${r.hash}` });
      await new Promise((res) => setTimeout(res, 2200));
      ws.removeEventListener('message', onReq);

      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const resources = performance.getEntriesByType('resource');
          const jsResources = resources.filter(res => res.initiatorType === 'script' || res.name.endsWith('.js'));
          const cssResources = resources.filter(res => res.initiatorType === 'link' || res.name.endsWith('.css'));
          const apiResources = resources.filter(res => res.name.includes('/api/'));

          // Web Vitals extraction
          let lcpVal = 0;
          try {
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries.length) lcpVal = lcpEntries[lcpEntries.length - 1].startTime;
          } catch(e) {}

          let clsVal = 0;
          try {
            const clsEntries = performance.getEntriesByType('layout-shift');
            for (const entry of clsEntries) {
              if (!entry.hadRecentInput) clsVal += entry.value;
            }
          } catch(e) {}

          let longTasks = [];
          try {
            longTasks = performance.getEntriesByType('longtask').map(t => ({ duration: t.duration, startTime: t.startTime }));
          } catch(e) {}

          return {
            loadEventEnd: nav.loadEventEnd || 0,
            domContentLoadedEventEnd: nav.domContentLoadedEventEnd || 0,
            domInteractive: nav.domInteractive || 0,
            lcp: lcpVal,
            cls: clsVal,
            longTaskCount: longTasks.length,
            longestTaskMs: longTasks.reduce((max, t) => Math.max(max, t.duration), 0),
            totalResources: resources.length,
            totalTransferBytes: resources.reduce((acc, res) => acc + (res.transferSize || 0), 0) + (nav.transferSize || 0),
            jsTransferBytes: jsResources.reduce((acc, res) => acc + (res.transferSize || 0), 0),
            cssTransferBytes: cssResources.reduce((acc, res) => acc + (res.transferSize || 0), 0),
            apiTransferBytes: apiResources.reduce((acc, res) => acc + (res.transferSize || 0), 0),
            apiCallCount: apiResources.length,
            apiUrls: apiResources.map(a => a.name)
          };
        })()`,
        returnByValue: true
      });

      report.coldCache[r.name] = {
        route: r.hash,
        durationMs: Date.now() - navStart,
        data: metrics.result ? metrics.result.value : null,
        capturedRequests: routeRequests.length
      };
    }

    // =========================================================================
    // TEST 1B: WARM-CACHE PRODUCTION AUDIT
    // =========================================================================
    console.log('\n--- Running TEST 1B: Warm-Cache Production Audit ---');
    await send('Network.setCacheDisabled', { cacheDisabled: false });
    for (const r of testRoutes) {
      console.log(`[Warm Cache] Navigating to ${r.hash}`);
      const navStart = Date.now();
      await send('Page.navigate', { url: `${BASE_URL}/${r.hash}` });
      await new Promise((res) => setTimeout(res, 1800));

      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const resources = performance.getEntriesByType('resource');
          const jsResources = resources.filter(res => res.initiatorType === 'script' || res.name.endsWith('.js'));
          const cssResources = resources.filter(res => res.initiatorType === 'link' || res.name.endsWith('.css'));

          let lcpVal = 0;
          try {
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries.length) lcpVal = lcpEntries[lcpEntries.length - 1].startTime;
          } catch(e) {}

          let clsVal = 0;
          try {
            const clsEntries = performance.getEntriesByType('layout-shift');
            for (const entry of clsEntries) {
              if (!entry.hadRecentInput) clsVal += entry.value;
            }
          } catch(e) {}

          return {
            loadEventEnd: nav.loadEventEnd || 0,
            domContentLoadedEventEnd: nav.domContentLoadedEventEnd || 0,
            domInteractive: nav.domInteractive || 0,
            lcp: lcpVal,
            cls: clsVal,
            totalResources: resources.length,
            totalTransferBytes: resources.reduce((acc, res) => acc + (res.transferSize || 0), 0) + (nav.transferSize || 0),
            jsTransferBytes: jsResources.reduce((acc, res) => acc + (res.transferSize || 0), 0),
            cssTransferBytes: cssResources.reduce((acc, res) => acc + (res.transferSize || 0), 0)
          };
        })()`,
        returnByValue: true
      });

      report.warmCache[r.name] = {
        route: r.hash,
        durationMs: Date.now() - navStart,
        data: metrics.result ? metrics.result.value : null
      };
    }

    // =========================================================================
    // TEST 2: REAL INTERACTION PROFILING
    // =========================================================================
    console.log('\n--- Running TEST 2: Real Interaction Profiling ---');

    // 1. Homepage Scroll Profiling
    await send('Page.navigate', { url: `${BASE_URL}/#/home` });
    await new Promise((r) => setTimeout(r, 1500));
    const scrollPerf = await send('Runtime.evaluate', {
      expression: `(async () => {
        const start = performance.now();
        let droppedFrames = 0;
        let lastFrameTime = performance.now();
        let frameCount = 0;

        const measureFrames = () => {
          const now = performance.now();
          const delta = now - lastFrameTime;
          lastFrameTime = now;
          frameCount++;
          if (delta > 22) droppedFrames++; // standard frame budget is 16.6ms
        };

        const rafHandle = () => {
          measureFrames();
          if (performance.now() - start < 1000) {
            requestAnimationFrame(rafHandle);
          }
        };
        requestAnimationFrame(rafHandle);

        // Perform programmatic smooth scroll
        window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 500));
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 500));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 500));

        return {
          totalDurationMs: performance.now() - start,
          totalFrames: frameCount,
          droppedFrames,
          fps: Math.round((frameCount / ((performance.now() - start) / 1000)))
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    report.interactionProfiling.homeScroll = scrollPerf.result.value;

    // 2. Card3D Pointer Move Profiling on Gallery
    await send('Page.navigate', { url: `${BASE_URL}/#/gallery` });
    await new Promise((r) => setTimeout(r, 1500));
    const cardHoverPerf = await send('Runtime.evaluate', {
      expression: `(async () => {
        const card = document.querySelector('div[style*="perspective"]');
        if (!card) return { status: 'No 3D card found' };

        const start = performance.now();
        let droppedFrames = 0;
        let lastFrame = performance.now();
        let count = 0;

        for (let i = 0; i < 30; i++) {
          const now = performance.now();
          if (now - lastFrame > 22) droppedFrames++;
          lastFrame = now;
          count++;

          const event = new PointerEvent('pointermove', {
            clientX: 200 + (i * 5),
            clientY: 300 + (i * 3),
            pointerType: 'mouse',
            bubbles: true
          });
          card.dispatchEvent(event);
          await new Promise(r => setTimeout(r, 16));
        }

        const leaveEvent = new PointerEvent('pointerleave', { bubbles: true });
        card.dispatchEvent(leaveEvent);

        return {
          totalDurationMs: performance.now() - start,
          eventsDispatched: count,
          droppedFrames,
          fps: Math.round(count / ((performance.now() - start) / 1000))
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    report.interactionProfiling.cardHover = cardHoverPerf.result.value;

    // 3. Opening & Closing Initiative Modal
    await send('Page.navigate', { url: `${BASE_URL}/#/initiatives` });
    await new Promise((r) => setTimeout(r, 1500));
    const modalPerf = await send('Runtime.evaluate', {
      expression: `(async () => {
        const cardBtn = document.querySelector('button[aria-label*="सविस्तर माहिती"], button[aria-label*="अधिक माहिती"], div[style*="perspective"]');
        if (!cardBtn) return { status: 'No modal trigger found' };

        const t0 = performance.now();
        cardBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const modalVisible = Boolean(document.querySelector('[role="dialog"]'));
        const openDelayMs = performance.now() - t0;

        const tClose0 = performance.now();
        const closeBtn = document.querySelector('[role="dialog"] button[aria-label*="बंद"], [role="dialog"] button');
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const closeDelayMs = performance.now() - tClose0;

        return {
          modalOpened: modalVisible,
          openDelayMs: Math.round(openDelayMs),
          closeDelayMs: Math.round(closeDelayMs)
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    report.interactionProfiling.modal = modalPerf.result.value;

    // 4. Searching & Filtering Schemes
    await send('Page.navigate', { url: `${BASE_URL}/#/schemes` });
    await new Promise((r) => setTimeout(r, 1500));
    const searchPerf = await send('Runtime.evaluate', {
      expression: `(async () => {
        const input = document.querySelector('input[type="text"], input[placeholder*="शोधा"]');
        if (!input) return { status: 'No search input found' };

        const t0 = performance.now();
        input.value = 'शेतकरी';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 100));
        const filterDurationMs = performance.now() - t0;

        const initialCards = document.querySelectorAll('div[style*="perspective"]').length;

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 100));

        return {
          searchQueryApplied: 'शेतकरी',
          filterDurationMs: Math.round(filterDurationMs),
          cardsRendered: initialCards
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    report.interactionProfiling.schemeSearch = searchPerf.result.value;

    // 5. Language Switching Delay
    const langPerf = await send('Runtime.evaluate', {
      expression: `(async () => {
        const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English') || b.innerText.includes('मराठी'));
        if (!langBtn) return { status: 'No language button found' };

        const t0 = performance.now();
        langBtn.click();
        await new Promise(r => setTimeout(r, 150));
        const toggleDurationMs = performance.now() - t0;

        // Switch back
        const langBtn2 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English') || b.innerText.includes('मराठी'));
        if (langBtn2) langBtn2.click();

        return {
          languageToggleMs: Math.round(toggleDurationMs)
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    report.interactionProfiling.langSwitch = langPerf.result.value;

    // =========================================================================
    // TEST 3: BUNDLE AND ROUTE-LOADING VERIFICATION
    // =========================================================================
    console.log('\n--- Running TEST 3: Bundle and Route-Loading Verification ---');
    await send('Network.clearBrowserCache');
    await send('Page.navigate', { url: `${BASE_URL}/#/home` });
    await new Promise((r) => setTimeout(r, 1800));

    const bundleInspect = await send('Runtime.evaluate', {
      expression: `(() => {
        const resources = performance.getEntriesByType('resource');
        const js = resources.filter(r => r.name.endsWith('.js') || r.initiatorType === 'script');
        
        return {
          homeJsFetched: js.map(j => ({
            name: j.name.split('/').pop().split('?')[0],
            transferBytes: j.transferSize || 0,
            encodedBodySize: j.encodedBodySize || 0,
            decodedBodySize: j.decodedBodySize || 0
          })),
          isThreeFetchedOnHome: js.some(j => j.name.includes('vendor-three')),
          isGsapFetchedOnHome: js.some(j => j.name.includes('vendor-gsap')),
          isCard3DFetchedOnHome: js.some(j => j.name.includes('Card3D'))
        };
      })()`,
      returnByValue: true
    });
    report.bundleVerification = bundleInspect.result.value;

    // Check direct refresh on deep routes
    console.log('[Direct Refresh Verification]');
    const directRefreshResults = {};
    for (const route of ['#/gallery', '#/schemes', '#/reports', '#/admin']) {
      await send('Page.navigate', { url: `${BASE_URL}/${route}` });
      await new Promise((r) => setTimeout(r, 1500));
      const status = await send('Runtime.evaluate', {
        expression: `(() => {
          return {
            title: document.title,
            heading: document.querySelector('h1, h2')?.innerText || '',
            hasContent: document.body.innerText.length > 100
          };
        })()`,
        returnByValue: true
      });
      directRefreshResults[route] = status.result.value;
    }
    report.bundleVerification.directRefresh = directRefreshResults;

    // =========================================================================
    // TEST 4: STRESS AND MEMORY REGRESSION (10 ROUTE TRANSITIONS)
    // =========================================================================
    console.log('\n--- Running TEST 4: Stress and Memory Regression ---');
    await send('Page.navigate', { url: `${BASE_URL}/#/home` });
    await new Promise((r) => setTimeout(r, 1500));

    const initialMetrics = await send('Performance.getMetrics');
    const initHeap = initialMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    const initNodes = initialMetrics.metrics.find(m => m.name === 'Nodes')?.value || 0;

    const stressRoutes = [
      '#/about', '#/initiatives', '#/schemes', '#/gallery', '#/videos',
      '#/reports', '#/news', '#/contact', '#/volunteer', '#/terms', '#/home'
    ];

    for (let i = 0; i < stressRoutes.length; i++) {
      const r = stressRoutes[i];
      await send('Page.navigate', { url: `${BASE_URL}/${r}` });
      await new Promise(res => setTimeout(res, 400));
    }

    const postStressMetrics = await send('Performance.getMetrics');
    const postHeap = postStressMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    const postNodes = postStressMetrics.metrics.find(m => m.name === 'Nodes')?.value || 0;

    // Return to home and measure retained footprint
    await send('Page.navigate', { url: `${BASE_URL}/#/home` });
    await new Promise((r) => setTimeout(r, 1500));

    const finalMetrics = await send('Performance.getMetrics');
    const finalHeap = finalMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    const finalNodes = finalMetrics.metrics.find(m => m.name === 'Nodes')?.value || 0;

    report.stressMemory = {
      initialHeapBytes: initHeap,
      initialNodes: initNodes,
      post10RoutesHeapBytes: postHeap,
      post10RoutesNodes: postNodes,
      returnHomeHeapBytes: finalHeap,
      returnHomeNodes: finalNodes,
      heapGrowthBytes: finalHeap - initHeap,
      nodeGrowth: finalNodes - initNodes
    };

    // =========================================================================
    // TEST 5: API AND ASSET PERFORMANCE
    // =========================================================================
    console.log('\n--- Running TEST 5: API and Asset Performance ---');
    await send('Page.navigate', { url: `${BASE_URL}/#/home` });
    await new Promise((r) => setTimeout(r, 1800));

    const assetReport = await send('Runtime.evaluate', {
      expression: `(() => {
        const resources = performance.getEntriesByType('resource');
        const sorted = [...resources].sort((a, b) => (b.duration || 0) - (a.duration || 0));
        const slowest = sorted.slice(0, 10).map(r => ({
          name: r.name.split('/').pop().split('?')[0],
          fullUrl: r.name,
          initiator: r.initiatorType,
          durationMs: Math.round(r.duration),
          transferBytes: r.transferSize || 0
        }));

        const images = resources.filter(r => r.initiatorType === 'img' || /\\.(jpg|jpeg|png|webp|svg)/i.test(r.name));
        const largestAssets = [...resources].sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 10).map(r => ({
          name: r.name.split('/').pop().split('?')[0],
          initiator: r.initiatorType,
          transferBytes: r.transferSize || 0,
          durationMs: Math.round(r.duration)
        }));

        const apiCalls = resources.filter(r => r.name.includes('/api/'));

        return {
          totalResourcesTracked: resources.length,
          slowestResources: slowest,
          largestAssets,
          apiCallsSummary: apiCalls.map(a => ({
            url: a.name,
            durationMs: Math.round(a.duration),
            transferBytes: a.transferSize || 0
          }))
        };
      })()`,
      returnByValue: true
    });
    report.apiPerformance = assetReport.result.value;

    fs.writeFileSync('scratch/production_realworld_audit_results.json', JSON.stringify(report, null, 2));
    console.log('\nSUCCESS: Saved scratch/production_realworld_audit_results.json');

    ws.close();
  } finally {
    child.kill();
  }
}

runProductionAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});

const { spawn } = require('child_process');

async function testInteractions() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9275;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:4173/#/home'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Performance.enable');

    console.log('--- PRECISE INTERACTION PROFILING ---');

    // 1. Home Scroll test with 60fps monitor
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise(r => setTimeout(r, 1500));

    const scrollResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        let frameDeltas = [];
        let last = performance.now();
        let running = true;

        const loop = (now) => {
          if (!running) return;
          frameDeltas.push(now - last);
          last = now;
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        const start = performance.now();
        // Standard user scroll simulation (300px step every 50ms)
        for (let i = 0; i < 15; i++) {
          window.scrollBy({ top: 200, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 40));
        }
        for (let i = 0; i < 15; i++) {
          window.scrollBy({ top: -200, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 40));
        }

        running = false;
        const totalTime = performance.now() - start;
        const droppedFrames = frameDeltas.filter(d => d > 24).length; // >24ms means <41fps hitch
        const heavyFrames = frameDeltas.filter(d => d > 50).length;   // >50ms long frame
        const avgDelta = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;

        return {
          totalTimeMs: Math.round(totalTime),
          totalFrames: frameDeltas.length,
          avgFps: Math.round(1000 / avgDelta),
          droppedFrames,
          heavyFrames,
          maxFrameDeltaMs: Math.round(Math.max(...frameDeltas))
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('1. Homepage Scroll:', scrollResult.result.value);

    // 2. Card3D Pointermove test on Initiatives
    await send('Page.navigate', { url: 'http://localhost:4173/#/initiatives' });
    await new Promise(r => setTimeout(r, 1800));

    const cardHoverResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const card = document.querySelector('div[style*="perspective"], .will-change-transform');
        if (!card) return { status: 'No card found', htmlSnippet: document.body.innerHTML.slice(0, 300) };

        let frameDeltas = [];
        let last = performance.now();
        let running = true;

        const loop = (now) => {
          if (!running) return;
          frameDeltas.push(now - last);
          last = now;
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        const start = performance.now();
        for (let i = 0; i < 40; i++) {
          card.dispatchEvent(new PointerEvent('pointermove', {
            clientX: 250 + (i * 4),
            clientY: 300 + (i * 2),
            pointerType: 'mouse',
            bubbles: true
          }));
          await new Promise(r => setTimeout(r, 16));
        }
        card.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));

        running = false;
        const dropped = frameDeltas.filter(d => d > 24).length;
        const avg = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;

        return {
          events: 40,
          totalTimeMs: Math.round(performance.now() - start),
          avgFps: Math.round(1000 / avg),
          droppedFrames: dropped,
          maxDeltaMs: Math.round(Math.max(...frameDeltas))
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('2. Card3D Pointermove:', cardHoverResult.result.value);

    // 3. Opening and Closing Modal on Initiatives
    const modalResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const infoBtn = buttons.find(b => b.innerText.includes('माहिती') || b.innerText.includes('तपशील') || b.getAttribute('aria-label')?.includes('माहिती'));
        if (!infoBtn) return { status: 'No info button found' };

        const t0 = performance.now();
        infoBtn.click();
        await new Promise(r => setTimeout(r, 250));
        const openMs = Math.round(performance.now() - t0);
        const isOpen = Boolean(document.querySelector('[role="dialog"]'));

        const closeBtn = document.querySelector('[role="dialog"] button');
        const t1 = performance.now();
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const closeMs = Math.round(performance.now() - t1);
        const isClosed = !document.querySelector('[role="dialog"]');

        return {
          opened: isOpen,
          openDelayMs: openMs,
          closed: isClosed,
          closeDelayMs: closeMs
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('3. Initiative Modal Open/Close:', modalResult.result.value);

    // 4. Scheme Filter & Search typing
    await send('Page.navigate', { url: 'http://localhost:4173/#/schemes' });
    await new Promise(r => setTimeout(r, 1800));

    const schemeFilterResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const input = document.querySelector('input[type="text"], input[placeholder*="शोधा"]');
        if (!input) return { status: 'No search input found' };

        const t0 = performance.now();
        input.value = 'कृषी';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const searchTime = Math.round(performance.now() - t0);

        // Category filter button click
        const catBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('शेतकरी') || b.innerText.includes('आरोग्य') || b.innerText.includes('महिला'));
        let catFilterTime = 0;
        if (catBtns.length > 0) {
          const t1 = performance.now();
          catBtns[0].click();
          await new Promise(r => setTimeout(r, 50));
          catFilterTime = Math.round(performance.now() - t1);
        }

        return {
          searchResponseMs: searchTime,
          categoryFilterClickMs: catFilterTime
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('4. Schemes Search & Filter:', schemeFilterResult.result.value);

    // 5. Language switcher toggle
    const langSwitchResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English') || b.innerText.includes('मराठी'));
        if (!btn) return { status: 'No lang button found' };

        const t0 = performance.now();
        btn.click();
        await new Promise(r => setTimeout(r, 100));
        const toggle1 = Math.round(performance.now() - t0);

        const btn2 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English') || b.innerText.includes('मराठी'));
        const t1 = performance.now();
        if (btn2) btn2.click();
        await new Promise(r => setTimeout(r, 100));
        const toggle2 = Math.round(performance.now() - t1);

        return {
          marathiToEnglishMs: toggle1,
          englishToMarathiMs: toggle2
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('5. Language Switcher:', langSwitchResult.result.value);

    ws.close();
  } finally {
    child.kill();
  }
}

testInteractions().catch(console.error);

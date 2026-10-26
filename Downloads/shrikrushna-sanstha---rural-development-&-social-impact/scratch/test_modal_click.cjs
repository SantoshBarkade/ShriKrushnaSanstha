const { spawn } = require('child_process');

async function testModalFullFlow() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9242',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9242/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/#/officials' });
  await new Promise((r) => setTimeout(r, 1500));

  // Step 1: Click first card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"]')).filter(
        el => el.getAttribute('aria-label') && el.getAttribute('aria-label').includes(' - ')
      );
      if (cards.length > 0) cards[0].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const openState = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        isOpen: !!document.querySelector('[role="dialog"]'),
        title: document.querySelector('#official-modal-title')?.textContent?.trim()
      };
    })()`,
    returnByValue: true
  });

  // Step 2: Press Escape
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`
  });
  await new Promise((r) => setTimeout(r, 300));

  const afterEsc = await send('Runtime.evaluate', {
    expression: `!document.querySelector('[role="dialog"]')`,
    returnByValue: true
  });

  // Step 3: Click second card (President) and test Close button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"]')).filter(
        el => el.getAttribute('aria-label') && el.getAttribute('aria-label').includes(' - ')
      );
      if (cards.length > 1) cards[1].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const secondOpenState = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        isOpen: !!document.querySelector('[role="dialog"]'),
        title: document.querySelector('#official-modal-title')?.textContent?.trim()
      };
    })()`,
    returnByValue: true
  });

  // Click Close button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('button[aria-label="Close modal"], button[aria-label="बंद करा"]');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const afterBtnClose = await send('Runtime.evaluate', {
    expression: `!document.querySelector('[role="dialog"]')`,
    returnByValue: true
  });

  console.log('Modal Comprehensive Test Results:');
  console.log('Step 1 (Open First):', openState.result.value);
  console.log('Step 2 (Escape Dismissed):', afterEsc.result.value);
  console.log('Step 3 (Open Second):', secondOpenState.result.value);
  console.log('Step 4 (Button Dismissed):', afterBtnClose.result.value);

  child.kill();
  process.exit(0);
}

testModalFullFlow().catch((e) => {
  console.error(e);
  process.exit(1);
});

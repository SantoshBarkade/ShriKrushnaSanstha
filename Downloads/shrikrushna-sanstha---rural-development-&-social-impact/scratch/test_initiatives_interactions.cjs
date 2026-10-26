const { spawn } = require('child_process');

async function testInteractions() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9245',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9245/json').then((r) => r.json());
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
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- TESTING ACCURATE INITIATIVES INTERACTIONS ---');

  // 1. Search with native setter
  const searchRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const input = document.querySelector('input[type="text"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      // Type "शिक्षण"
      nativeSetter.call(input, 'शिक्षण');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const countAfterSearch = document.querySelectorAll('article').length;
      const firstTitle = document.querySelector('article h3')?.textContent?.trim() || '';

      // Clear search
      nativeSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const countAfterClear = document.querySelectorAll('article').length;

      return {
        countAfterSearch,
        firstTitle,
        countAfterClear
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Search Interaction Result:', searchRes.result.value);

  // 2. Category Tab Switching
  const catRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const schemesBtn = allButtons.find(b => b.textContent && b.textContent.includes('शासकीय योजना'));
      if (schemesBtn) schemesBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const schemesCount = document.querySelectorAll('article').length;
      const schemesTitle = document.querySelector('article h3')?.textContent?.trim() || '';

      const allBtn = allButtons.find(b => b.textContent && b.textContent.includes('सर्व उपक्रम'));
      if (allBtn) allBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const allCount = document.querySelectorAll('article').length;

      return {
        schemesCount,
        schemesTitle,
        allCount
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Category Interaction Result:', catRes.result.value);

  // 3. Modal Opening & Dismissal
  const modalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const allButtons = Array.from(document.querySelectorAll('article button'));
      const readMoreBtns = allButtons.filter(b => {
        const txt = b.textContent?.trim() || '';
        return txt.includes('वाचा') || txt.includes('Read') || txt.includes('माहिती');
      });

      if (readMoreBtns.length === 0) {
        return { error: 'No read more button found', totalBtns: allButtons.length };
      }

      // Step 1: Click first Read More button
      readMoreBtns[0].click();
      await new Promise(r => setTimeout(r, 400));

      const modalOpen = Boolean(document.querySelector('[role="dialog"]'));
      const modalTitle = document.getElementById('initiative-modal-title')?.textContent?.trim() || '';

      // Step 2: Escape key dismissal
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const escapeDismissed = document.querySelector('[role="dialog"]') === null;

      // Step 3: Open second card
      if (readMoreBtns[1]) {
        readMoreBtns[1].click();
        await new Promise(r => setTimeout(r, 400));
      }
      const modal2Open = Boolean(document.querySelector('[role="dialog"]'));
      const modal2Title = document.getElementById('initiative-modal-title')?.textContent?.trim() || '';

      // Step 4: Close button dismissal
      const dialogBtns = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const closeBtn = dialogBtns.find(b => {
        const txt = b.textContent?.trim() || '';
        const aria = b.getAttribute('aria-label') || '';
        return txt.includes('बंद करा') || txt.includes('Close') || aria.includes('बंद करा') || aria.includes('Close');
      });
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const buttonDismissed = document.querySelector('[role="dialog"]') === null;

      return {
        step1_modalOpen: modalOpen,
        step1_modalTitle: modalTitle,
        step2_escapeDismissed: escapeDismissed,
        step3_modal2Open: modal2Open,
        step3_modal2Title: modal2Title,
        step4_buttonDismissed: buttonDismissed
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Modal Interaction Result:', modalRes.result.value);

  ws.close();
  child.kill();
}

testInteractions().catch(console.error);

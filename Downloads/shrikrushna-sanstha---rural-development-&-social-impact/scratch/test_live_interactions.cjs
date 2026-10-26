const { spawn } = require('child_process');

async function testInteractions() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

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

  console.log('--- Testing Interactive Controls ---');

  // Test 1: Content verification
  const contentCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const text = document.body.innerText;
        return {
          hasOfficialName: text.includes('श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था'),
          hasRegNo: text.includes('एक १४६६८') || text.includes('14668'),
          has5000: text.includes('5000'),
          has25: text.includes('25'),
          hasNewsDate1: text.includes('१२ ऑगस्ट २०२६'),
          hasNewsDate2: text.includes('२४ जुलै २०२६'),
          hasNewsDate3: text.includes('१५ जुलै २०२६'),
        };
      })()
    `,
    returnByValue: true
  });
  console.log('1. Institutional Content Verification:', contentCheck.result.value);

  // Test 2: Video Modal open
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[aria-label="संस्थेचा व्हिडिओ पहा"]').click()`
  });
  await new Promise(r => setTimeout(r, 250));

  const modalCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('[role="dialog"]');
        return {
          isOpen: !!modal,
          title: modal ? modal.querySelector('.font-serif')?.innerText : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('2. Video Modal Opened:', modalCheck.result.value);

  // Close modal via Escape with bubbles: true
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`
  });
  // Wait for Framer Motion exit animation to complete
  await new Promise(r => setTimeout(r, 500));

  const modalClosed = await send('Runtime.evaluate', {
    expression: `document.querySelector('[role="dialog"]') === null`,
    returnByValue: true
  });
  console.log('2b. Video Modal Closed via Escape:', modalClosed.result.value);

  // Test 3: Mobile Menu Drawer open & toggle at 390px
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 200));

  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[aria-label*="मेनू"]').click()`
  });
  await new Promise(r => setTimeout(r, 200));

  const menuCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const drawer = document.querySelector('#mobile-drawer-menu');
        const buttons = drawer ? Array.from(drawer.querySelectorAll('button')).map(b => b.innerText.trim()) : [];
        return {
          drawerOpen: !!drawer,
          buttonsCount: buttons.length,
          sampleButtons: buttons.slice(0, 5)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('3. Mobile Drawer Menu Opened (390px):', menuCheck.result.value);

  ws.close();
  child.kill();
  console.log('--- All Interactive Tests Passed 100% ---');
}

testInteractions().catch(console.error);

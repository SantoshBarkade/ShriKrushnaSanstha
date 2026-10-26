const { spawn } = require('child_process');

async function testFormsLive() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9297;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/contact'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let i = 0; i < 10; i++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          res(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const networkResponses = [];
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Network.responseReceived') {
      networkResponses.push({
        url: data.params.response.url,
        status: data.params.response.status,
        mimeType: data.params.response.mimeType,
      });
    }
  });

  console.log('--- 1. TESTING CONTACT FORM REAL SUBMISSION ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/contact' });
  await new Promise((r) => setTimeout(r, 1500));

  const fillContactResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nameInput = document.querySelector('#contact-name');
        const infoInput = document.querySelector('#contact-info');
        const messageInput = document.querySelector('#contact-message');
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('संदेश पाठवा'));

        if (!nameInput || !infoInput || !messageInput || !submitBtn) {
          return { error: 'Inputs or button missing', found: { name: !!nameInput, info: !!infoInput, msg: !!messageInput, btn: !!submitBtn } };
        }

        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
                         Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (setter) setter.call(el, val);
          else el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(nameInput, 'सुरक्षित ऑडिट चाचणी');
        setVal(infoInput, '9876543210');
        setVal(messageInput, 'ही एक सुरक्षित चाचणी चौकशी आहे. प्रणाली परीक्षण पूर्ण झाले.');
        submitBtn.click();
        return { success: true };
      })()
    `,
    returnByValue: true
  });
  console.log('Contact form fill result:', fillContactResult.result.value);

  // Wait for submission request and response
  await new Promise((r) => setTimeout(r, 2500));

  const contactUiState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const statusEl = document.querySelector('[role="status"]');
        const alertEl = document.querySelector('[role="alert"]');
        return {
          statusText: statusEl ? statusEl.innerText.trim() : null,
          alertText: alertEl ? alertEl.innerText.trim() : null,
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Contact form response state:', contactUiState.result.value);

  console.log('\n--- 2. TESTING VOLUNTEER FORM REAL SUBMISSION ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/volunteer' });
  await new Promise((r) => setTimeout(r, 1500));

  const fillVolunteerResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nameInput = document.querySelector('#vol-full-name');
        const phoneInput = document.querySelector('#vol-phone');
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('स्वयंसेवक नोंदणी सबमिट करा'));

        if (!nameInput || !phoneInput || !submitBtn) {
          return { error: 'Volunteer inputs missing', found: { name: !!nameInput, phone: !!phoneInput, btn: !!submitBtn } };
        }

        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(el, val);
          else el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(nameInput, 'ऑडिट स्वयंसेवक चाचणी');
        setVal(phoneInput, '9876543210');
        submitBtn.click();
        return { success: true };
      })()
    `,
    returnByValue: true
  });
  console.log('Volunteer form fill result:', fillVolunteerResult.result.value);

  // Wait for submission request and response
  await new Promise((r) => setTimeout(r, 2500));

  const volunteerUiState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const statusEl = document.querySelector('[role="status"]');
        const alertEl = document.querySelector('[role="alert"]');
        const bodyText = document.body.innerText;
        return {
          statusText: statusEl ? statusEl.innerText.trim() : null,
          alertText: alertEl ? alertEl.innerText.trim() : null,
          hasSuccessWords: bodyText.includes('यशस्वी') || bodyText.includes('अभिनंदन') || bodyText.includes('नोंद झाली')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Volunteer form response state:', volunteerUiState.result.value);

  console.log('\n--- RELEVANT NETWORK RESPONSES ---');
  console.log(networkResponses.filter(r => r.url.includes('content.php') || r.url.includes('api')));

  ws.close();
  child.kill();
}

testFormsLive().catch(console.error);

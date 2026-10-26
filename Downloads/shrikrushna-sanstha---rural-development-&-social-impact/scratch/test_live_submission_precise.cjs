const { spawn } = require('child_process');

async function testFormsPrecise() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9298;
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

  const responses = [];
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Network.responseReceived') {
      responses.push({
        url: data.params.response.url,
        status: data.params.response.status,
        statusText: data.params.response.statusText
      });
    }
  });

  console.log('--- 1. CONTACT FORM REAL SUBMISSION ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/contact' });
  await new Promise((r) => setTimeout(r, 1500));

  const contactFill = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const name = document.getElementById('contact-name');
        const info = document.getElementById('contact-info');
        const msg = document.getElementById('contact-message');
        const form = document.querySelector('form');
        const btn = form ? form.querySelector('button[type="submit"]') : null;

        if (!name || !info || !msg || !btn) {
          return { error: 'elements not found', found: { name: !!name, info: !!info, msg: !!msg, btn: !!btn } };
        }

        const setVal = (el, v) => {
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(name, 'ज्ञानेश्वर पाटील');
        setVal(info, '9822001122');
        setVal(msg, 'ही सुरक्षित थेट संपर्क चाचणी आहे. कृपया दुर्लक्ष करा.');
        btn.click();
        return { submitted: true };
      })()
    `,
    returnByValue: true
  });
  console.log('Contact fill result:', contactFill.result ? contactFill.result.value : contactFill);

  await new Promise((r) => setTimeout(r, 3000));

  const contactStatus = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const statusBox = document.querySelector('[role="status"]');
        const alertBox = document.querySelector('[role="alert"]');
        return {
          status: statusBox ? statusBox.innerText.replace(/\\n/g, ' ') : null,
          alert: alertBox ? alertBox.innerText.replace(/\\n/g, ' ') : null,
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Contact response:', contactStatus.result.value);

  console.log('\n--- 2. VOLUNTEER FORM REAL SUBMISSION ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/volunteer' });
  await new Promise((r) => setTimeout(r, 1500));

  const volunteerFill = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const name = document.getElementById('volunteer-fullName');
        const phone = document.getElementById('volunteer-phone');
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('सबमिट करा'));

        if (!name || !phone || !submitBtn) {
          return { error: 'elements not found', found: { name: !!name, phone: !!phone, btn: !!submitBtn } };
        }

        const setVal = (el, v) => {
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(name, 'सचिन दिलीप निकम');
        setVal(phone, '9822334455');
        submitBtn.click();
        return { submitted: true };
      })()
    `,
    returnByValue: true
  });
  console.log('Volunteer fill result:', volunteerFill.result ? volunteerFill.result.value : volunteerFill);

  await new Promise((r) => setTimeout(r, 3000));

  const volunteerStatus = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const statusBox = document.querySelector('[role="status"]');
        const alertBox = document.querySelector('[role="alert"]');
        return {
          status: statusBox ? statusBox.innerText.replace(/\\n/g, ' ') : null,
          alert: alertBox ? alertBox.innerText.replace(/\\n/g, ' ') : null,
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Volunteer response:', volunteerStatus.result.value);

  console.log('\n--- NETWORK CALLS TO CONTENT API ---');
  console.log(responses.filter(r => r.url.includes('content.php') || r.url.includes('api')));

  ws.close();
  child.kill();
}

testFormsPrecise().catch(console.error);

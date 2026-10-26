const { spawn } = require('child_process');

async function testReactInputs() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9299;
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
      });
    }
  });

  console.log('--- TESTING CONTACT FORM WITH REACT NATIVE SETTER ---');
  await send('Page.navigate', { url: 'http://localhost:5173/#/contact' });
  await new Promise((r) => setTimeout(r, 1500));

  const contactRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nameInput = document.getElementById('contact-name');
        const infoInput = document.getElementById('contact-info');
        const msgInput = document.getElementById('contact-message');
        const form = document.querySelector('form');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

        const setNative = (el, val) => {
          const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          descriptor.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setNative(nameInput, 'ज्ञानेश्वर पाटील');
        setNative(infoInput, '9822001122');
        setNative(msgInput, 'ही सुरक्षित थेट संपर्क चाचणी आहे. प्रणाली चाचणी सुरू आहे.');

        submitBtn.click();
        return {
          submitted: true,
          nameVal: nameInput.value,
          infoVal: infoInput.value,
          msgVal: msgInput.value
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Contact form evaluation:', contactRes.result.value);

  await new Promise((r) => setTimeout(r, 3000));

  const uiStatus = await send('Runtime.evaluate', {
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
  console.log('Contact UI status after submission:', uiStatus.result.value);

  console.log('Network responses captured:', responses.filter(r => r.url.includes('content.php')));

  ws.close();
  child.kill();
}

testReactInputs().catch(console.error);

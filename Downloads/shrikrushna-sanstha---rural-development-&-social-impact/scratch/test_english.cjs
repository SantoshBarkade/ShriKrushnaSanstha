const { spawn } = require('child_process');

async function testEnglish() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9227/json').then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 1500));

  // Switch language to English
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('shrikrushna_sanstha_lang_v3', 'en');
        window.location.reload();
      })()
    `
  });

  await new Promise((r) => setTimeout(r, 3000));

  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1')?.innerText || 'none';
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText);
        const badges = Array.from(document.querySelectorAll('.rounded-xl')).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 80);
        return { h1, headings: headings.slice(0, 10), badges: badges.slice(0, 6) };
      })()
    `,
    returnByValue: true
  });

  console.log('=== ENGLISH DOM AUDIT ===');
  console.log(JSON.stringify(result.result.value, null, 2));

  // Reset back to Marathi
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('shrikrushna_sanstha_lang_v3', 'mr');`
  });

  await send('Browser.close');
  child.kill();
}

testEnglish().catch(console.error);

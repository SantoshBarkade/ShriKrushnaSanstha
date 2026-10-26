const { spawn } = require('child_process');

async function verifyOfficialsLang() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9243',
    '--disable-gpu',
    'http://localhost:5173/#/officials'
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9243/json').then((r) => r.json());
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

  // Marathi Cards
  const mrCards = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"]')).filter(
        el => el.getAttribute('aria-label') && el.getAttribute('aria-label').includes(' - ')
      );
      return cards.map(c => ({
        name: c.querySelector('h2')?.textContent?.trim(),
        role: c.querySelector('.truncate')?.textContent?.trim(),
        bio: c.querySelector('p')?.textContent?.trim()
      }));
    })()`,
    returnByValue: true
  });

  // Switch to English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // English Cards
  const enCards = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"]')).filter(
        el => el.getAttribute('aria-label') && el.getAttribute('aria-label').includes(' - ')
      );
      return cards.map(c => ({
        name: c.querySelector('h2')?.textContent?.trim(),
        role: c.querySelector('.truncate')?.textContent?.trim(),
        bio: c.querySelector('p')?.textContent?.trim()
      }));
    })()`,
    returnByValue: true
  });

  console.log('Marathi Officials Cards:\n', JSON.stringify(mrCards.result.value, null, 2));
  console.log('English Officials Cards:\n', JSON.stringify(enCards.result.value, null, 2));

  child.kill();
  process.exit(0);
}

verifyOfficialsLang().catch((e) => {
  console.error(e);
  process.exit(1);
});

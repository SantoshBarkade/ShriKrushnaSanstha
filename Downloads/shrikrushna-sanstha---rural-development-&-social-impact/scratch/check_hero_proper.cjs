const { spawn } = require('child_process');

async function checkHeroProper() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9397',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1400));
  const list = await fetch('http://127.0.0.1:9397/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((res) => {
      const mid = id++;
      const h = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === mid) {
          ws.removeEventListener('message', h);
          res(d.result || d);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
  await new Promise((r) => setTimeout(r, 2500));

  const resMr = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1');
      const heroContainer = h1 ? h1.closest('div') : null;
      // Badge is the pill above h1
      const badgeEl = heroContainer ? heroContainer.querySelector('div.rounded-full') : null;
      // Tagline is the p below h1
      const taglineEl = heroContainer ? heroContainer.querySelector('p') : null;
      return {
        url: window.location.href,
        badgeText: badgeEl ? badgeEl.innerText.replace(/\\n/g, ' ') : null,
        taglineText: taglineEl ? taglineEl.innerText.replace(/\\n/g, ' ') : null,
        h1Text: h1 ? h1.innerText.replace(/\\n/g, ' ') : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Hero in Marathi:', JSON.stringify(resMr.result.value, null, 2));

  // Click English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const en = btns.find(b => b.innerText.trim() === 'EN');
      if (en) en.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const resEn = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1');
      const heroContainer = h1 ? h1.closest('div') : null;
      const badgeEl = heroContainer ? heroContainer.querySelector('div.rounded-full') : null;
      const taglineEl = heroContainer ? heroContainer.querySelector('p') : null;
      return {
        badgeText: badgeEl ? badgeEl.innerText.replace(/\\n/g, ' ') : null,
        taglineText: taglineEl ? taglineEl.innerText.replace(/\\n/g, ' ') : null,
        h1Text: h1 ? h1.innerText.replace(/\\n/g, ' ') : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Hero in English:', JSON.stringify(resEn.result.value, null, 2));
  child.kill();
}

checkHeroProper();

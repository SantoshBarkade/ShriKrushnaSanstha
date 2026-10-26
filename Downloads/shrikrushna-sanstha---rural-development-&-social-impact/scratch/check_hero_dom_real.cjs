const { spawn } = require('child_process');

async function testHeroDom() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9394',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1200));
  const list = await fetch('http://127.0.0.1:9394/json').then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
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
  await new Promise((r) => setTimeout(r, 2200));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector("section[aria-label='मुख्य परिचय']");
      if (!section) return { error: 'Hero section not found' };
      const badge = section.querySelector("div.rounded-full");
      const tagline = section.querySelector("p.text-white\\\\/90");
      return {
        badgeText: badge ? badge.innerText : null,
        taglineText: tagline ? tagline.innerText : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Hero DOM in MR:', JSON.stringify(res.result.value, null, 2));

  // Click English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const en = btns.find(b => b.innerText.trim() === 'EN');
      if (en) en.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1000));

  const resEn = await send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector("section[aria-label='मुख्य परिचय']");
      if (!section) return { error: 'Hero section not found' };
      const badge = section.querySelector("div.rounded-full");
      const tagline = section.querySelector("p.text-white\\\\/90");
      return {
        badgeText: badge ? badge.innerText : null,
        taglineText: tagline ? tagline.innerText : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Hero DOM in EN:', JSON.stringify(resEn.result.value, null, 2));

  child.kill();
}

testHeroDom();

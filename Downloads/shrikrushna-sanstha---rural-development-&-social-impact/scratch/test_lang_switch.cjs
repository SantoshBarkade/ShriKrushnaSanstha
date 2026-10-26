const { spawn } = require('child_process');

async function testLangSwitch() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9234/json').then(r => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === cur) { ws.removeEventListener('message', h); res(msg.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Marathi initial state
  const mrData = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const p = document.querySelector('main p, .space-y-5 p')?.textContent?.trim();
      const ctaBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('सर्व उपक्रम पाहा'))?.textContent?.trim();
      return { lang: 'mr', h1, p, ctaBtn };
    })()`,
    returnByValue: true
  });

  // 2. Click 'EN'
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // 3. English state
  const enData = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const p = document.querySelector('main p, .space-y-5 p')?.textContent?.trim();
      const ctaBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore All Initiatives'))?.textContent?.trim();
      return { lang: 'en', h1, p, ctaBtn };
    })()`,
    returnByValue: true
  });

  // 4. Click 'मराठी' back
  await send('Runtime.evaluate', {
    expression: `(() => {
      const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const mrBack = await send('Runtime.evaluate', {
    expression: `document.querySelector('h1')?.textContent?.trim()`,
    returnByValue: true
  });

  console.log('Language Switch Test Evidence:');
  console.log('Marathi raw:', JSON.stringify(mrData));
  console.log('English raw:', JSON.stringify(enData));
  console.log('Restored Marathi raw:', JSON.stringify(mrBack));

  child.kill();
  process.exit(0);
}

testLangSwitch().catch(e => { console.error(e); process.exit(1); });

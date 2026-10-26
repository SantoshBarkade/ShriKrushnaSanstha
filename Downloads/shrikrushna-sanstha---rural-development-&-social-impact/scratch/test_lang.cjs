const { spawn } = require('child_process');

async function testLang() {
  const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9232/json').then(r => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
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
  await send('Runtime.enable');
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1Mr = document.querySelector('h1')?.textContent;
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
      if (enBtn) enBtn.click();
      return { h1Mr, clicked: !!enBtn };
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 500));
  const res2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1En = document.querySelector('h1')?.textContent;
      const mrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
      return { h1En };
    })()`,
    returnByValue: true
  });
  console.log('Lang switch result:', JSON.stringify({ ...res.result.value, ...res2.result.value }));
  child.kill();
  process.exit(0);
}
testLang().catch(e => { console.error(e); process.exit(1); });

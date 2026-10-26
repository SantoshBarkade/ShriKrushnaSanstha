const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9288',
    'http://localhost:5173/#/privacy'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9288/json').then(r => r.json());
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === cur) { ws.removeEventListener('message', handler); res(msg.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1000));
  
  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Privacy sections navigation"] button'));
      const btnInfo = btns.map((b, i) => ({ idx: i, text: b.textContent.trim() }));
      const sections = Array.from(document.querySelectorAll('section[id]')).map(s => ({ id: s.id, top: s.getBoundingClientRect().top }));
      
      const targetEl = document.getElementById('sec-beneficiary_dignity');
      const targetTop = targetEl ? targetEl.getBoundingClientRect().top : -1;
      
      // Let's trigger click
      const dignityBtn = btns.find(b => b.textContent.includes('लाभार्थी सन्मान') || b.textContent.includes('Beneficiary'));
      if (dignityBtn) {
        dignityBtn.click();
      }
      
      return {
        btnInfo,
        sections,
        dignityBtnFound: !!dignityBtn,
        targetExists: !!targetEl,
        targetTop: targetTop,
        initialY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Target check:', check.result.value);
  
  await new Promise(r => setTimeout(r, 1500));
  
  const postScroll = await send('Runtime.evaluate', {
    expression: '({ scrollY: window.scrollY, pageYOffset: window.pageYOffset, docScrollTop: document.documentElement.scrollTop })',
    returnByValue: true
  });
  console.log('Post scroll:', postScroll.result.value);

  ws.close();
  chrome.kill();
}
test().catch(console.error);

const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9356;

async function checkFont() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const mid = id++;
    const h = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) {
        ws.removeEventListener('message', h);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('DOM.enable');
  await send('CSS.enable');

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll('span, p, div'));
      const logoSub = spans.find(s => s.innerText && s.innerText.includes('नादरपूर') && s.innerText.includes('महा'));
      if (!logoSub) return { found: false };
      const computed = window.getComputedStyle(logoSub);
      return {
        found: true,
        text: logoSub.innerText,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        letterSpacing: computed.letterSpacing,
        fontFeatureSettings: computed.fontFeatureSettings,
        fontVariantLigatures: computed.fontVariantLigatures
      };
    })()`,
    returnByValue: true
  });

  console.log('Logo Subtitle Computed Style:\n', JSON.stringify(evalRes.result.value, null, 2));

  // Also check footer address element
  const footerEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const pars = Array.from(document.querySelectorAll('footer p, footer span'));
      const addr = pars.find(p => p.innerText && p.innerText.includes('नादरपूर') && p.innerText.includes('महा'));
      if (!addr) return { found: false };
      const computed = window.getComputedStyle(addr);
      return {
        found: true,
        text: addr.innerText,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        letterSpacing: computed.letterSpacing
      };
    })()`,
    returnByValue: true
  });

  console.log('Footer Address Computed Style:\n', JSON.stringify(footerEval.result.value, null, 2));

  child.kill();
}

checkFont().catch(console.error);

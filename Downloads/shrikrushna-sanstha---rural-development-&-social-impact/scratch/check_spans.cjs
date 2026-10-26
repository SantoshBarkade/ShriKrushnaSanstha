const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9346;

async function check() {
  const child = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', 'http://localhost:5173/']);
  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const mid = id++;
    const h = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise(r => setTimeout(r, 3000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const allSpans = Array.from(document.querySelectorAll('span')).map(s => s.innerText.trim());
        const badges = allSpans.filter(t => /^[१-६]\\.\\s/.test(t));

        const allP = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim());
        const genesisP = allP.find(t => t.includes('स्वातंत्र्यपूर्व काळात')) || '';
        const objectiveP = allP.find(t => t.includes('नैसर्गिक व मानवनिर्मित')) || '';

        const schemeHeadings = Array.from(document.querySelectorAll('div')).filter(d => d.className && d.className.includes('bg-white/10'));
        const schemePills = schemeHeadings.map(d => d.innerText.replace(/\\s+/g, ' ').trim());

        return {
          sixPillarBadges: badges,
          introSnippet: genesisP.substring(0, 100),
          introHasAtSign: genesisP.includes('@'),
          objectiveSnippet: objectiveP.substring(0, 100),
          objectiveHasHashSign: objectiveP.includes('#'),
          schemePills: schemePills
        };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('Detailed About Inspection:', JSON.stringify(res.result.value, null, 2));
  ws.close();
  child.kill();
}
check();

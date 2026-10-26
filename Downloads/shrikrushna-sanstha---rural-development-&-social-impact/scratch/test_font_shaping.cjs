const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9331;

const testHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;600;700&family=Karma:wght@500;600;700&family=Martel:wght@600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Serif+Devanagari:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  body { font-size: 28px; padding: 20px; background: white; color: #111; }
  .row { margin-bottom: 24px; padding: 12px; border: 1px solid #ccc; }
  .font-martel { font-family: 'Martel', serif; }
  .font-karma { font-family: 'Karma', serif; }
  .font-noto-serif { font-family: 'Noto Serif Devanagari', serif; }
  .font-noto-sans { font-family: 'Noto Sans Devanagari', sans-serif; }
  .font-hind { font-family: 'Hind', sans-serif; }
  .tight { letter-spacing: -0.025em; }
  .normal-spacing { letter-spacing: normal; }
</style>
</head>
<body>
  <h1>Devanagari Shaping Test</h1>
  <div class="row font-martel">
    <div><b>Martel (normal):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
    <div class="tight"><b>Martel (tight):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
  </div>
  <div class="row font-karma">
    <div><b>Karma (normal):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
    <div class="tight"><b>Karma (tight):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
  </div>
  <div class="row font-noto-serif">
    <div><b>Noto Serif Devanagari (normal):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
    <div class="tight"><b>Noto Serif Devanagari (tight):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
  </div>
  <div class="row font-hind">
    <div><b>Hind (normal):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
    <div class="tight"><b>Hind (tight):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
  </div>
  <div class="row font-noto-sans">
    <div><b>Noto Sans Devanagari (normal):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
    <div class="tight"><b>Noto Sans Devanagari (tight):</b> समर्पित मार्गदर्शन परिवर्तनाच्या सर्व संवर्धन कल्याणकारी समृद्धी पद्म</div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_fonts.html', testHtml, 'utf8');

async function test() {
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  let list = [];
  for (let i = 0; i < 10; i++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Page.navigate', { url: 'file:///' + require('path').resolve('scratch/test_fonts.html').replace(/\\/g, '/') });
  await new Promise(r => setTimeout(r, 3000)); // wait for web fonts to load

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/test_fonts_rendered.png', Buffer.from(ss.data, 'base64'));
  console.log('Screenshot saved to scratch/test_fonts_rendered.png');

  ws.close();
  child.kill();
}

test();

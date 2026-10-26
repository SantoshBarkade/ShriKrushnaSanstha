const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9334;

async function checkWordRendering() {
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

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;600;700&family=Martel:wght@600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Noto+Serif+Devanagari:wght@500;600;700;800&family=Yantramanav:wght@500;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-size: 36px; padding: 30px; background: #071D43; color: white; }
      .box { margin-bottom: 25px; padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.08); }
      .label { font-size: 16px; color: #94A3B8; margin-bottom: 6px; font-family: sans-serif; }
      .martel { font-family: 'Martel', serif; font-weight: 800; }
      .noto-serif { font-family: 'Noto Serif Devanagari', serif; font-weight: 700; }
      .noto-sans { font-family: 'Noto Sans Devanagari', sans-serif; font-weight: 700; }
      .hind { font-family: 'Hind', sans-serif; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="label">Martel 800 (current heading font):</div>
      <div class="martel">समर्पित मार्गदर्शन परिवर्तनाच्या सर्वांच्या संवर्धन कल्याणकारी समृद्धी</div>
    </div>
    <div class="box">
      <div class="label">Noto Serif Devanagari 700:</div>
      <div class="noto-serif">समर्पित मार्गदर्शन परिवर्तनाच्या सर्वांच्या संवर्धन कल्याणकारी समृद्धी</div>
    </div>
    <div class="box">
      <div class="label">Noto Sans Devanagari 700:</div>
      <div class="noto-sans">समर्पित मार्गदर्शन परिवर्तनाच्या सर्वांच्या संवर्धन कल्याणकारी समृद्धी</div>
    </div>
    <div class="box">
      <div class="label">Hind 700:</div>
      <div class="hind">समर्पित मार्गदर्शन परिवर्तनाच्या सर्वांच्या संवर्धन कल्याणकारी समृद्धी</div>
    </div>
  </body>
  </html>
  `;

  await send('Page.setDocumentContent', { frameId: (await send('Page.getFrameTree')).frameTree.frame.id, html });
  await new Promise(r => setTimeout(r, 3000));

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 800,
    deviceScaleFactor: 2,
    mobile: false
  });

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/font_comparison.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved scratch/font_comparison.png');

  ws.close();
  child.kill();
}

checkWordRendering();

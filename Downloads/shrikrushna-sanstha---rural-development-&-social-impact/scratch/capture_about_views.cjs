const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const dir = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function run() {
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--hide-scrollbars',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const list = await fetch('http://127.0.0.1:9223/json').then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');

  // Navigate explicitly to #/about to be 100% sure
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Desktop 1440
  console.log('Capturing Desktop 1440...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // Trigger intersection observers
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight);' });
  await new Promise((r) => setTimeout(r, 600));
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
  await new Promise((r) => setTimeout(r, 800));

  // Hero screen (viewport)
  const shot1440Hero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(dir, 'about_1440_hero.png'), Buffer.from(shot1440Hero.data, 'base64'));

  // Full page
  const shot1440Full = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'about_1440_full.png'), Buffer.from(shot1440Full.data, 'base64'));

  // 2. Desktop 1280
  console.log('Capturing Desktop 1280...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shot1280 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'about_1280.png'), Buffer.from(shot1280.data, 'base64'));

  // 3. Tablet 768
  console.log('Capturing Tablet 768...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shot768 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'about_768.png'), Buffer.from(shot768.data, 'base64'));

  // 4. Mobile 390
  console.log('Capturing Mobile 390...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Mobile Hero
  const shot390Hero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(dir, 'about_390_hero.png'), Buffer.from(shot390Hero.data, 'base64'));

  // Mobile Full
  const shot390Full = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'about_390_full.png'), Buffer.from(shot390Full.data, 'base64'));

  // 5. Mobile 360
  console.log('Capturing Mobile 360...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shot360 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'about_360.png'), Buffer.from(shot360.data, 'base64'));

  // 6. Test interaction: click breadcrumb Home and return
  console.log('Testing Breadcrumb Navigation...');
  const navTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const homeBtn = document.querySelector('nav[aria-label="Breadcrumb"] button');
        if (!homeBtn) return { error: 'No home button found' };
        homeBtn.click();
        return { success: true, newHash: window.location.hash };
      })()
    `,
    returnByValue: true,
  });
  console.log('Nav Test Result:', navTest.result.value);

  // Return to about
  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 1200));

  // 7. Capture scrolling frames for GIF demonstration
  console.log('Capturing scroll frames for animation demonstration...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const framesDir = path.join(dir, 'scratch', 'about_frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // Scroll smoothly from top to bottom
  const scrollSteps = [0, 400, 800, 1300, 1800, 2400, 3000, 3600, 4200, 4800, 5200];
  for (let i = 0; i < scrollSteps.length; i++) {
    const y = scrollSteps[i];
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 200));
    const frame = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(framesDir, `frame_${String(i).padStart(2, '0')}.png`), Buffer.from(frame.data, 'base64'));
  }

  ws.close();
  child.kill();
  console.log('All about view captures completed successfully.');
}

run().catch(console.error);

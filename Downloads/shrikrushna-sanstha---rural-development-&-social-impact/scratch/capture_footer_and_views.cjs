const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const dir = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function capture() {
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--hide-scrollbars',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = list.find(t => t.type === 'page');
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

  // 1. Desktop 1440 full & focused Footer + CTA
  console.log('Capturing Desktop 1440...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 2900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1500));

  const shot1440 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'desktop_1440.png'), Buffer.from(shot1440.data, 'base64'));

  // Measure CTA + Footer rect on desktop
  const footerBoundsDesktop = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const cta = document.querySelector('section:has(button[aria-label*="संपर्क"]), section:has(button)');
        const ctaSections = Array.from(document.querySelectorAll('section'));
        const lastSection = ctaSections[ctaSections.length - 1]; // CTA section
        const footer = document.querySelector('footer');
        const ctaRect = lastSection ? lastSection.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const top = ctaRect ? window.scrollY + ctaRect.top - 20 : footerRect.top;
        const bottom = window.scrollY + footerRect.bottom;
        return {
          x: 0,
          y: Math.max(0, top),
          width: 1440,
          height: bottom - top + 40
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Capturing Desktop CTA + Footer Focus:', footerBoundsDesktop.result.value);
  const shotFooterDesktop = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: Math.floor(footerBoundsDesktop.result.value.y),
      width: 1440,
      height: Math.ceil(footerBoundsDesktop.result.value.height),
      scale: 1
    }
  });
  fs.writeFileSync(path.join(dir, 'desktop_footer_and_cta.png'), Buffer.from(shotFooterDesktop.data, 'base64'));

  // 2. Tablet 768 full
  console.log('Capturing Tablet 768...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 3300,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot768 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'tablet_768.png'), Buffer.from(shot768.data, 'base64'));

  // 3. Mobile 390 full & focused Mobile Footer
  console.log('Capturing Mobile 390...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 4200,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot390 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'mobile_390.png'), Buffer.from(shot390.data, 'base64'));

  const footerBoundsMobile = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const footer = document.querySelector('footer');
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const top = window.scrollY + footerRect.top;
        const bottom = window.scrollY + footerRect.bottom;
        return {
          x: 0,
          y: Math.max(0, top - 20),
          width: 390,
          height: bottom - top + 40
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Capturing Mobile Footer Focus:', footerBoundsMobile.result.value);
  const shotFooterMobile = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: Math.floor(footerBoundsMobile.result.value.y),
      width: 390,
      height: Math.ceil(footerBoundsMobile.result.value.height),
      scale: 1
    }
  });
  fs.writeFileSync(path.join(dir, 'mobile_footer.png'), Buffer.from(shotFooterMobile.data, 'base64'));

  // 4. Mobile 360 full
  console.log('Capturing Mobile 360...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 4400,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot360 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(dir, 'mobile_360.png'), Buffer.from(shot360.data, 'base64'));

  ws.close();
  child.kill();
  console.log('All screenshots captured successfully.');
}

capture().catch(console.error);

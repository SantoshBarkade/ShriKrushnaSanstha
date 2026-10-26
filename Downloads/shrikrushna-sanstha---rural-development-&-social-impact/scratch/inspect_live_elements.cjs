const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
          resolve(page.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => ws.on('open', resolve));

  // Navigate to #/home
  await sendCommand(ws, 'Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise((r) => setTimeout(r, 2000));

  // Inspect DOM elements
  const evalResult = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Find header logo subtitle
      const headerSubtitle = document.querySelector('header span.truncate');
      // Find footer logo subtitle
      const footerSubtitle = document.querySelector('footer span.truncate');
      // Find footer address
      const footerAddress = document.querySelector('footer p.text-slate-300');

      return {
        header: headerSubtitle ? {
          text: headerSubtitle.textContent,
          html: headerSubtitle.innerHTML,
          font: window.getComputedStyle(headerSubtitle).fontFamily,
          fontSize: window.getComputedStyle(headerSubtitle).fontSize,
          lineHeight: window.getComputedStyle(headerSubtitle).lineHeight,
          overflow: window.getComputedStyle(headerSubtitle).overflow,
          rect: headerSubtitle.getBoundingClientRect()
        } : null,
        footerLogo: footerSubtitle ? {
          text: footerSubtitle.textContent,
          html: footerSubtitle.innerHTML,
          font: window.getComputedStyle(footerSubtitle).fontFamily,
          fontSize: window.getComputedStyle(footerSubtitle).fontSize,
          lineHeight: window.getComputedStyle(footerSubtitle).lineHeight,
          overflow: window.getComputedStyle(footerSubtitle).overflow,
          rect: footerSubtitle.getBoundingClientRect()
        } : null,
        footerAddress: footerAddress ? {
          text: footerAddress.textContent,
          html: footerAddress.innerHTML,
          font: window.getComputedStyle(footerAddress).fontFamily,
          fontSize: window.getComputedStyle(footerAddress).fontSize,
          lineHeight: window.getComputedStyle(footerAddress).lineHeight,
          rect: footerAddress.getBoundingClientRect()
        } : null
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM Evaluation:', JSON.stringify(evalResult.result.value, null, 2));

  // Capture header clip
  const headerClip = await sendCommand(ws, 'Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 600, height: 120, scale: 2 }
  });
  fs.writeFileSync('scratch/live_header_logo.png', Buffer.from(headerClip.data, 'base64'));

  // Scroll to footer and capture
  await sendCommand(ws, 'Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await new Promise((r) => setTimeout(r, 1000));

  const footerClip = await sendCommand(ws, 'Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 1440, height: 400, scale: 1 } // will capture current viewport
  });
  fs.writeFileSync('scratch/live_footer.png', Buffer.from(footerClip.data, 'base64'));

  ws.close();
}

run().catch(console.error);

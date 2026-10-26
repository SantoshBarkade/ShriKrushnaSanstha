const { spawn } = require('child_process');

async function testFooter() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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
  await send('Runtime.enable');

  console.log('--- Testing Footer Links & Interactions ---');

  // Check 1: Links existence & hrefs
  const linksCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const footer = document.querySelector('footer');
        const phone1 = footer.querySelector('a[href^="tel:+919923512482"]');
        const phone2 = footer.querySelector('a[href^="tel:+918888684966"]');
        const email = footer.querySelector('a[href^="mailto:shrikrushnasanstha.nadarpur@gmail.com"]');
        const fb = footer.querySelector('a[aria-label="Facebook"]');
        const yt = footer.querySelector('a[aria-label="YouTube"]');
        const insta = footer.querySelector('a[aria-label="Instagram"]');
        const contactBtn = footer.querySelector('button:has(svg.lucide-phone-call), button:has(svg)');
        
        return {
          hasPhone1: !!phone1,
          hasPhone2: !!phone2,
          hasEmail: !!email,
          hasFacebook: !!fb && fb.href.includes('facebook.com'),
          hasYouTube: !!yt && yt.href.includes('youtube.com'),
          hasInstagram: !!insta && insta.href.includes('instagram.com'),
          hasContactBtn: !!contactBtn
        };
      })()
    `,
    returnByValue: true
  });
  console.log('1. Footer Contact & Social Links Check:', linksCheck.result.value);

  // Check 2: Click "अहवाल" (Reports) link in footer and verify route
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('footer button'));
        const reportsBtn = buttons.find(b => b.innerText.includes('अहवाल') || b.innerText.includes('Reports'));
        if (reportsBtn) reportsBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 200));

  const routeCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h1OrH2 = document.querySelector('h1, h2')?.innerText;
        return {
          currentUrl: window.location.href,
          mainHeading: h1OrH2
        };
      })()
    `,
    returnByValue: true
  });
  console.log('2. Footer Route Navigation Test (Reports):', routeCheck.result.value);

  ws.close();
  child.kill();
  console.log('--- Footer Verification Completed Successfully ---');
}

testFooter().catch(console.error);

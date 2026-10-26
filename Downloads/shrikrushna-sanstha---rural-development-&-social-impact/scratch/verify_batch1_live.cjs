const { spawn } = require('child_process');
const fs = require('fs');

async function runLiveVerification() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9389;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  const artifactDir = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

  try {
    await new Promise((r) => setTimeout(r, 1600));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result || d);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    // 1. Desktop 1440x900 in Marathi
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:4173/#/home...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 3000));

    // Scroll down to trigger the stats section viewport observer
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 600)' });
    await new Promise((r) => setTimeout(r, 2000));

    // Evaluate live DOM content (Marathi)
    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const heroSection = document.querySelector('section[aria-label="मुख्य परिचय"]');
        if (!heroSection) return { error: 'Hero section not found' };

        const badge = heroSection.querySelector('.rounded-full.border');
        const badgeText = badge ? badge.innerText.replace(/\\n/g, ' ').trim() : null;

        const tagline = heroSection.querySelector('p.max-w-xl');
        const taglineText = tagline ? tagline.innerText.replace(/\\n/g, ' ').trim() : null;

        const counters = Array.from(document.querySelectorAll('.font-serif.font-black')).map(el => el.innerText.trim());

        return {
          badgeText,
          taglineText,
          counters,
        };
      })()`,
      returnByValue: true,
    });

    console.log('\n--- MARATHI DESKTOP DOM EVALUATION ---');
    console.log(JSON.stringify(evalResult.result.value, null, 2));

    // Scroll back to top for hero screenshot
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await new Promise((r) => setTimeout(r, 500));
    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(snap1.data, 'base64');
    fs.writeFileSync(`${artifactDir}\\batch1_desktop_1440_mr.png`, buf1);
    console.log(`Saved screenshot: batch1_desktop_1440_mr.png (${buf1.length} bytes)`);

    // 2. Click language toggle to English ('EN' button)
    console.log('\nClicking EN language toggle...');
    const switchLang = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const enBtn = btns.find(b => b.innerText && b.innerText.trim() === 'EN');
        if (enBtn) {
          enBtn.click();
          return { clicked: true, text: enBtn.innerText };
        }
        return { clicked: false, availableButtons: btns.map(b => b.innerText.trim()) };
      })()`,
      returnByValue: true,
    });
    console.log('Switch language result:', switchLang.result.value);
    await new Promise((r) => setTimeout(r, 1500));

    // Evaluate English DOM content
    const evalEnResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const heroSection = document.querySelector('section[aria-label="मुख्य परिचय"]');
        if (!heroSection) return { error: 'Hero section not found' };

        const badge = heroSection.querySelector('.rounded-full.border');
        const badgeText = badge ? badge.innerText.replace(/\\n/g, ' ').trim() : null;

        const tagline = heroSection.querySelector('p.max-w-xl');
        const taglineText = tagline ? tagline.innerText.replace(/\\n/g, ' ').trim() : null;

        const counters = Array.from(document.querySelectorAll('.font-serif.font-black')).map(el => el.innerText.trim());

        return {
          badgeText,
          taglineText,
          counters,
        };
      })()`,
      returnByValue: true,
    });

    console.log('\n--- ENGLISH DESKTOP DOM EVALUATION ---');
    console.log(JSON.stringify(evalEnResult.result.value, null, 2));

    const snapEn = await send('Page.captureScreenshot', { format: 'png' });
    const bufEn = Buffer.from(snapEn.data, 'base64');
    fs.writeFileSync(`${artifactDir}\\batch1_desktop_1440_en.png`, bufEn);
    console.log(`Saved screenshot: batch1_desktop_1440_en.png (${bufEn.length} bytes)`);

    // 3. Mobile Viewport 390x844 in Marathi
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    // Reset language to Marathi
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const mrBtn = btns.find(b => b.innerText && b.innerText.trim() === 'मराठी');
        if (mrBtn) mrBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
    const bufMobile = Buffer.from(snapMobile.data, 'base64');
    fs.writeFileSync(`${artifactDir}\\batch1_mobile_390_mr.png`, bufMobile);
    console.log(`Saved screenshot: batch1_mobile_390_mr.png (${bufMobile.length} bytes)`);

    ws.close();
    console.log('\nAll live browser verifications completed successfully!');
  } finally {
    child.kill();
  }
}

runLiveVerification().catch(console.error);

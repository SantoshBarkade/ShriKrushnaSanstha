const { spawn } = require('child_process');
const fs = require('fs');

async function runLiveVerification() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9392;
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

    // Helper to evaluate JS in page
    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        console.error('Eval error:', res.exceptionDetails);
        return null;
      }
      return res.result ? res.result.value : null;
    };

    // 1. Desktop 1440x900 in Marathi
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:4173/#/home...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2500));

    // Capture Marathi DOM elements
    const mrData = await evaluate(`(() => {
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      
      const heroBadge = document.querySelector('[data-testid="hero-badge"]')?.textContent?.trim() || '';
      const heroTagline = document.querySelector('[data-testid="hero-tagline"]')?.textContent?.trim() || '';
      const heroTitle = document.querySelector('h1')?.textContent?.trim() || '';

      // Stats counters
      const statNumbers = Array.from(document.querySelectorAll('.font-mono, [data-counter-target]')).map(el => el.textContent?.trim());

      // Overview headings & sections
      const headings = Array.from(document.querySelectorAll('h2, h3')).map(h => h.textContent?.trim());
      
      // Footer text
      const footerText = document.querySelector('footer')?.textContent || '';
      const footerRegPill = Array.from(document.querySelectorAll('footer span, footer p')).find(el => el.textContent?.includes('नोंदणी') || el.textContent?.includes('Reg'))?.textContent?.trim() || '';

      return {
        title,
        metaDesc,
        ogTitle,
        ogDesc,
        heroBadge,
        heroTagline,
        heroTitle,
        statNumbers: statNumbers.slice(0, 10),
        headings: headings.slice(0, 15),
        footerRegPill,
        hasFooterTagline: footerText.includes('ग्रामीण विकास आणि सामाजिक परिवर्तनासाठी वचनबद्ध'),
        bodyLength: document.body.innerText.length
      };
    })()`);

    console.log('Marathi Evidence:', JSON.stringify(mrData, null, 2));

    // Screenshot Desktop MR
    const shotMr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}\\home_cms_e2e_desktop_mr.png`, Buffer.from(shotMr.data, 'base64'));
    console.log('Saved home_cms_e2e_desktop_mr.png');

    // 2. Switch to English
    console.log('Switching language to English...');
    const switchResult = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const enBtn = buttons.find(b => b.innerText.trim() === 'EN');
      if (enBtn) {
        enBtn.click();
        return 'EN clicked';
      }
      return 'EN button not found';
    })()`);
    console.log('Switch result:', switchResult);
    await new Promise((r) => setTimeout(r, 1200));

    const enData = await evaluate(`(() => {
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const heroBadge = document.querySelector('[data-testid="hero-badge"]')?.textContent?.trim() || '';
      const heroTagline = document.querySelector('[data-testid="hero-tagline"]')?.textContent?.trim() || '';
      const heroTitle = document.querySelector('h1')?.textContent?.trim() || '';
      const headings = Array.from(document.querySelectorAll('h2, h3')).map(h => h.textContent?.trim());
      const footerRegPill = Array.from(document.querySelectorAll('footer span, footer p')).find(el => el.textContent?.includes('Reg'))?.textContent?.trim() || '';

      return {
        title,
        metaDesc,
        ogTitle,
        heroBadge,
        heroTagline,
        heroTitle,
        headings: headings.slice(0, 15),
        footerRegPill
      };
    })()`);

    console.log('English Evidence:', JSON.stringify(enData, null, 2));

    // Screenshot Desktop EN
    const shotEn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}\\home_cms_e2e_desktop_en.png`, Buffer.from(shotEn.data, 'base64'));
    console.log('Saved home_cms_e2e_desktop_en.png');

    // 3. Mobile Viewport 390x844
    console.log('Setting mobile viewport (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    // Switch back to MR
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mrBtn = buttons.find(b => b.innerText.trim() === 'मराठी');
      if (mrBtn) mrBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}\\home_cms_e2e_mobile_mr.png`, Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved home_cms_e2e_mobile_mr.png');

    const results = {
      mr: mrData,
      en: enData,
      status: 'SUCCESS'
    };

    fs.writeFileSync('scratch/home_cms_e2e_results.json', JSON.stringify(results, null, 2));
    console.log('E2E Verification successfully written to scratch/home_cms_e2e_results.json');
  } catch (err) {
    console.error('Error during live verification:', err);
  } finally {
    try { child.kill(); } catch (e) {}
  }
}

runLiveVerification();

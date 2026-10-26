const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9330;

const routes = [
  { id: 'home', title: 'मुखपृष्ठ (Home)', path: '#/home' },
  { id: 'about', title: 'संस्थेविषयी (About Us)', path: '#/about' },
  { id: 'officials', title: 'पदाधिकारी (Officials)', path: '#/officials' },
  { id: 'initiatives', title: 'उपक्रम (Initiatives)', path: '#/initiatives' },
  { id: 'schemes', title: 'शासकीय योजना (Govt Schemes)', path: '#/schemes' },
  { id: 'work', title: 'आमचे कार्य (Our Work)', path: '#/work' },
  { id: 'gallery', title: 'छायाचित्रे (Photo Gallery)', path: '#/gallery' },
  { id: 'videos', title: 'व्हिडिओ (Videos)', path: '#/videos' },
  { id: 'reports', title: 'अहवाल (Reports & Disclosures)', path: '#/reports' },
  { id: 'news', title: 'बातम्या (News & Events)', path: '#/news' },
  { id: 'volunteer', title: 'स्वयंसेवक (Volunteer Registration)', path: '#/volunteer' },
  { id: 'contact', title: 'संपर्क (Contact Us)', path: '#/contact' },
  { id: 'privacy', title: 'गोपनीयता धोरण (Privacy Policy)', path: '#/privacy' },
  { id: 'admin', title: 'प्रशासकीय कक्ष (Admin Portal)', path: '#/admin' }
];

async function runLivePreview() {
  console.log('Launching headless Chrome for Live Preview...');
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/home'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const target = list.find((t) => t.type === 'page');
  if (!target) throw new Error('Could not find chrome page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const consoleLogs = [];
  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
      if (type === 'error') {
        consoleLogs.push({ type, text });
      }
    }
  });

  const setViewport = async (w, h, isMobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
  };

  const captureSS = async (filename) => {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.resolve(`scratch/${filename}`);
    fs.writeFileSync(fullPath, Buffer.from(ss.data, 'base64'));
    return fullPath;
  };

  const pageAudits = [];

  for (const page of routes) {
    console.log(`\n========================================`);
    console.log(`LIVE PREVIEW & AUDIT: ${page.title} (${page.path})`);
    console.log(`========================================`);

    // 1. Desktop Viewport (1440x900)
    await setViewport(1440, 900, false);
    await send('Page.navigate', { url: `http://localhost:5173/${page.path}` });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll to bottom and back to top to trigger any animations / lazy images
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight / 2);` });
    await new Promise((r) => setTimeout(r, 300));
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight);` });
    await new Promise((r) => setTimeout(r, 400));
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 300));

    // Capture desktop screenshot
    const desktopSS = await captureSS(`preview_${page.id}_1440.png`);

    // 2. Mobile Viewport (390x844)
    await setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 500));
    const mobileSS = await captureSS(`preview_${page.id}_390.png`);

    // Reset to desktop for DOM audit
    await setViewport(1440, 900, false);
    await new Promise((r) => setTimeout(r, 300));

    // 3. Deep DOM Inspection
    const domData = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const h1 = document.querySelector('h1')?.innerText?.trim() || '';
          const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean);
          const buttons = Array.from(document.querySelectorAll('button, a')).map(b => b.innerText.trim()).filter(t => t.length > 0 && t.length < 40);
          
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            broken: img.naturalWidth === 0 && img.complete
          }));
          const brokenImages = images.filter(i => i.broken);

          // Horizontal overflow check
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;

          // Devanagari quality checks
          const typos = {
            hasPaha: bodyText.includes('पहा'),
            hasBaddal: bodyText.includes('बद्दल'),
            hasDhule: bodyText.includes('धुळे') || bodyText.includes('Dhule'),
            hasNadarpurTypo: bodyText.includes('नादपूर'),
            hasPauleTypo: bodyText.includes('पाऊले'),
            hasAsciiDanda: bodyText.includes('।। '),
            hasUndefined: bodyText.includes('undefined'),
            hasNull: bodyText.includes('null'),
            hasObjectObject: bodyText.includes('[object Object]')
          };

          return {
            h1,
            headingsCount: headings.length,
            headingsSample: headings.slice(0, 5),
            buttonsCount: buttons.length,
            imagesCount: images.length,
            brokenImagesCount: brokenImages.length,
            hasHorizontalOverflow,
            scrollWidth,
            clientWidth,
            typos,
            snippet: bodyText.slice(0, 200).replace(/\\s+/g, ' ')
          };
        })()
      `,
      returnByValue: true
    });

    const audit = domData.result.value;
    console.log(`- H1 / Title: "${audit.h1}"`);
    console.log(`- Headings: ${audit.headingsCount}, Buttons: ${audit.buttonsCount}, Images: ${audit.imagesCount}`);
    console.log(`- Broken images: ${audit.brokenImagesCount}`);
    console.log(`- Horizontal overflow: ${audit.hasHorizontalOverflow ? 'YES (DEFECT)' : 'NO (CLEAN)'}`);
    console.log(`- Typo check: ${Object.values(audit.typos).some(Boolean) ? 'FOUND TYPOS' : 'ALL CLEAN'}`);

    pageAudits.push({
      route: page.id,
      title: page.title,
      url: `http://localhost:5173/${page.path}`,
      audit,
      desktopScreenshot: `preview_${page.id}_1440.png`,
      mobileScreenshot: `preview_${page.id}_390.png`
    });
  }

  // 4. Interactive Flow Verification (Volunteer Form & Contact Form)
  console.log(`\n========================================`);
  console.log(`INTERACTION AUDIT: Volunteer & Contact Forms`);
  console.log(`========================================`);

  // Contact form validation check
  await send('Page.navigate', { url: 'http://localhost:5173/#/contact' });
  await new Promise((r) => setTimeout(r, 1200));

  const contactValidationResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const form = document.querySelector('form');
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('संदेश पाठवा') || b.innerText.includes('Send Message'));
        if (submitBtn) {
          submitBtn.click();
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));
  await captureSS('preview_contact_validation_errors.png');

  const contactErrorMessages = await send('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('.text-red-500, .text-rose-500, .text-red-600')).map(e => e.innerText.trim()).filter(Boolean)
    `,
    returnByValue: true
  });
  console.log('Contact form validation errors triggered:', contactErrorMessages.result.value);

  // Volunteer form validation check
  await send('Page.navigate', { url: 'http://localhost:5173/#/volunteer' });
  await new Promise((r) => setTimeout(r, 1200));

  const volunteerValidationResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('नोंदणी सादर करा') || b.innerText.includes('Submit Registration'));
        if (submitBtn) {
          submitBtn.click();
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));
  await captureSS('preview_volunteer_validation_errors.png');

  const volunteerErrorMessages = await send('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('.text-red-500, .text-rose-500, .text-red-600, .text-rose-600')).map(e => e.innerText.trim()).filter(Boolean)
    `,
    returnByValue: true
  });
  console.log('Volunteer form validation errors triggered:', volunteerErrorMessages.result.value);

  // 5. Final Report JSON Compilation
  const summary = {
    testedAt: new Date().toISOString(),
    routesAuditedCount: pageAudits.length,
    pages: pageAudits,
    consoleErrors: consoleLogs,
    formsTested: {
      contact: {
        submittedWithoutInput: contactValidationResult.result.value,
        validationFeedbackReceived: contactErrorMessages.result.value
      },
      volunteer: {
        submittedWithoutInput: volunteerValidationResult.result.value,
        validationFeedbackReceived: volunteerErrorMessages.result.value
      }
    }
  };

  fs.writeFileSync('scratch/live_preview_all_pages_report.json', JSON.stringify(summary, null, 2));
  console.log('\n========================================');
  console.log('LIVE PREVIEW OF ALL 14 PAGES COMPLETE!');
  console.log('Report saved to scratch/live_preview_all_pages_report.json');
  console.log('========================================');

  ws.close();
  child.kill();
}

runLivePreview().catch(console.error);

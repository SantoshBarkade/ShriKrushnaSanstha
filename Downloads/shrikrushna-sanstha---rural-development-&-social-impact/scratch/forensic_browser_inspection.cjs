const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9310;

async function runInspection() {
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
  if (!target) throw new Error('Could not find chrome target');

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

  const routes = [
    'home',
    'about',
    'officials',
    'initiatives',
    'work',
    'schemes',
    'gallery',
    'videos',
    'reports',
    'contact',
    'news',
    'events',
    'volunteer',
    'privacy'
  ];

  const results = {};

  for (const route of routes) {
    console.log(`Inspecting #${route}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `http://localhost:5173/#/${route}` });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll down to trigger any intersection observers / lazy components
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.body.scrollHeight / 2);`
    });
    await new Promise((r) => setTimeout(r, 400));
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.body.scrollHeight);`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot of current state
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.resolve(`scratch/current_${route}_1440.png`);
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));

    // Extract DOM inspection details
    const evalData = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
            tag: h.tagName,
            text: h.innerText.trim()
          }));
          const buttons = Array.from(document.querySelectorAll('button, a')).map(b => ({
            tag: b.tagName,
            text: b.innerText.trim(),
            href: b.getAttribute('href') || null,
            disabled: b.disabled || false,
            className: b.className
          })).filter(b => b.text.length > 0 && b.text.length < 50);

          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            broken: img.naturalWidth === 0 && img.complete
          }));

          const brokenImages = images.filter(i => i.broken);

          // Check for specific text patterns
          const issues = [];
          if (bodyText.includes('नादपूर')) issues.push("Found 'नादपूर' typo (missing 'र')");
          if (bodyText.includes('मूळपृष्ठ')) issues.push("Found 'मूळपृष्ठ' awkward translation");
          if (bodyText.includes('धुळे') || bodyText.includes('Dhule')) issues.push("Found 'धुळे / Dhule' hallucination");
          if (bodyText.includes('undefined') || bodyText.includes('null')) issues.push("Found visible 'undefined' or 'null'");
          if (bodyText.includes('[object Object]')) issues.push("Found '[object Object]'");

          // Check for Darpan IDs
          const hasDarpan1 = bodyText.includes('MH/2023/0365444');
          const hasDarpan2 = bodyText.includes('MH/2023/0364941');

          return {
            headingsCount: headings.length,
            headingsSample: headings.slice(0, 8),
            buttonsCount: buttons.length,
            imagesCount: images.length,
            brokenImagesCount: brokenImages.length,
            brokenImagesSample: brokenImages.slice(0, 3),
            issues,
            darpan: { hasDarpan1, hasDarpan2 },
            textSnippet: bodyText.slice(0, 300).replace(/\\n+/g, ' ')
          };
        })()
      `,
      returnByValue: true
    });

    results[route] = evalData.result.value;
  }

  fs.writeFileSync('scratch/forensic_inspection_results.json', JSON.stringify(results, null, 2));
  console.log('Inspection completed successfully. Results saved to scratch/forensic_inspection_results.json');

  ws.close();
  child.kill();
}

runInspection().catch(console.error);

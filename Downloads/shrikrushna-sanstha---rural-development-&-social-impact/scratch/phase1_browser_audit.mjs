import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity-ide\\brain\\de16229d-9b2d-4bac-b922-2802f7de1ff3\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900, mobile: false },
  { name: 'tablet_768x1024', width: 768, height: 1024, mobile: true },
  { name: 'mobile_390x844', width: 390, height: 844, mobile: true },
  { name: 'narrow_320x700', width: 320, height: 700, mobile: true },
];

const ROUTES = [
  { name: 'home', hash: '#home' },
  { name: 'about', hash: '#about' },
  { name: 'initiatives', hash: '#initiatives' },
  { name: 'work', hash: '#work' },
  { name: 'gallery', hash: '#gallery' },
  { name: 'videos', hash: '#videos' },
  { name: 'reports', hash: '#reports' },
  { name: 'news', hash: '#news' },
  { name: 'contact', hash: '#contact' },
  { name: 'privacy', hash: '#privacy' },
  { name: 'officials', hash: '#officials' },
  { name: 'admin_login', hash: '#admin' },
];

async function runBrowserAudit() {
  console.log('=== PHASE 1: REAL BROWSER MULTI-VIEWPORT AUDIT ===\n');

  const tempProfile = path.join(SCREENSHOT_DIR, 'chrome_audit_profile_' + Date.now());
  fs.mkdirSync(tempProfile, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempProfile}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  let tabs;
  for (let i = 0; i < 10; i++) {
    try {
      tabs = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', res => {
          let data = '';
          res.on('data', d => data += d);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (tabs && tabs.some(t => t.type === 'page' || t.url.includes('5173'))) break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('5173'));
  if (!pageTab) {
    chrome.kill();
    throw new Error('Could not find active target web page tab');
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  const cdp = await new Promise((resolve, reject) => {
    let msgId = 1;
    const pending = new Map();
    const eventListeners = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      } else if (msg.method && eventListeners.has(msg.method)) {
        for (const cb of eventListeners.get(msg.method)) {
          cb(msg.params);
        }
      }
    };

    ws.onerror = reject;

    ws.onopen = () => {
      const send = (method, params = {}) => {
        return new Promise((res, rej) => {
          const id = msgId++;
          pending.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      };
      const on = (method, callback) => {
        if (!eventListeners.has(method)) eventListeners.set(method, []);
        eventListeners.get(method).push(callback);
      };
      resolve({ send, on });
    };
  });

  console.log('Connected to Chrome DevTools Protocol successfully.');

  // Enable Page, Runtime, DOM, Network
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const consoleLogs = [];
  cdp.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args.map(a => a.value || JSON.stringify(a)).join(' ');
    consoleLogs.push({ type: params.type, text });
  });

  const auditResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--------------------------------------------------------------`);
    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, mobile: ${vp.mobile})`);
    console.log(`--------------------------------------------------------------`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });

    await cdp.send('Emulation.setVisibleSize', { width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      const url = `http://localhost:5173/${route.hash}`;
      await cdp.send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 1000));

      // Evaluate overflow and layout metrics
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const docClientWidth = document.documentElement.clientWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalOverflow = docWidth > winWidth + 1; // 1px threshold for subpixels
            
            // Find all elements contributing to overflow
            const overflowingElements = [];
            const all = document.querySelectorAll('*');
            for (let el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > winWidth + 2) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? (typeof el.className === 'string' ? el.className.slice(0, 50) : '') : '';
                const id = el.id ? '#' + el.id : '';
                const text = el.innerText ? el.innerText.trim().slice(0, 30) : '';
                overflowingElements.push({
                  selector: tag + id + (cls ? '.' + cls.split(' ').slice(0, 2).join('.') : ''),
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                  text
                });
                if (overflowingElements.length >= 5) break;
              }
            }

            return {
              docWidth,
              docClientWidth,
              winWidth,
              hasHorizontalOverflow,
              overflowAmount: Math.max(0, docWidth - winWidth),
              overflowingElements,
              title: document.title,
            };
          })()
        `,
        returnByValue: true
      });

      const metrics = evalRes.result?.value || {};
      const status = metrics.hasHorizontalOverflow ? 'FAIL (OVERFLOW)' : 'PASS';

      console.log(`  [${status}] ${route.name.padEnd(14)} scrollWidth: ${metrics.docWidth}px / innerWidth: ${metrics.winWidth}px (overflow: ${metrics.overflowAmount}px)`);
      if (metrics.hasHorizontalOverflow && metrics.overflowingElements?.length) {
        console.log(`         Offending element: ${metrics.overflowingElements[0].selector} (right: ${metrics.overflowingElements[0].right}px, text: "${metrics.overflowingElements[0].text}")`);
      }

      auditResults.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        route: route.name,
        metrics,
        status
      });

      // Capture screenshot for key viewports on home, officials, admin_login
      if (['home', 'officials', 'admin_login', 'initiatives'].includes(route.name)) {
        const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SCREENSHOT_DIR, `before_${vp.name}_${route.name}.png`);
        fs.writeFileSync(filePath, Buffer.from(screenshotRes.data, 'base64'));
      }
    }
  }

  // Close browser
  ws.close();
  chrome.kill();

  const totalTests = auditResults.length;
  const overflows = auditResults.filter(r => r.status.includes('FAIL'));

  console.log('\n==============================================================');
  console.log(`PHASE 1 BROWSER AUDIT SUMMARY:`);
  console.log(`Total checks: ${totalTests} across 4 viewports x 12 routes`);
  console.log(`Clean Passes: ${totalTests - overflows.length}`);
  console.log(`Horizontal Overflows Detected: ${overflows.length}`);
  if (overflows.length > 0) {
    console.log('\nOverflow breakdown:');
    for (const o of overflows) {
      console.log(` - ${o.viewport} on /${o.route}: overflowed by ${o.metrics.overflowAmount}px`);
      if (o.metrics.overflowingElements?.length) {
        console.log(`   Element: ${o.metrics.overflowingElements[0].selector}`);
      }
    }
  }
  console.log('==============================================================\n');
}

runBrowserAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

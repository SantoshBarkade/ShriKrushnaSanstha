import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity-ide\\brain\\de16229d-9b2d-4bac-b922-2802f7de1ff3\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PHP_EXE = 'C:\\Users\\Santosh\\AppData\\Roaming\\Local\\lightning-services\\php-8.2.29+0\\bin\\win64\\php.exe';
const EXT_DIR = 'C:\\Users\\Santosh\\AppData\\Roaming\\Local\\lightning-services\\php-8.2.29+0\\bin\\win64\\ext';

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900, mobile: false },
  { name: 'tablet_768x1024', width: 768, height: 1024, mobile: true },
  { name: 'mobile_390x844', width: 390, height: 844, mobile: true },
  { name: 'narrow_320x700', width: 320, height: 700, mobile: true },
];

const PUBLIC_ROUTES = [
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

const ADMIN_TABS = [
  { name: 'admin_officials', tabId: 'officials' },
  { name: 'admin_initiatives', tabId: 'initiatives' },
  { name: 'admin_announcements', tabId: 'news' },
  { name: 'admin_schemes', tabId: 'schemes' },
  { name: 'admin_videos', tabId: 'videos' },
  { name: 'admin_reports', tabId: 'reports' },
];

// Obtain fresh admin token
function getAdminAuth() {
  const cmd = `"${PHP_EXE}" -d extension_dir="${EXT_DIR}" -d extension=php_pdo_mysql.dll -d extension=php_mbstring.dll -d extension=php_openssl.dll scratch/get_admin_token.php`;
  const out = execSync(cmd, { encoding: 'utf8' }).trim();
  return JSON.parse(out);
}

async function runAudit() {
  console.log('=== PHASE 4: FINAL MULTI-VIEWPORT BROWSER & ADMIN AUDIT ===\n');

  const adminAuth = getAdminAuth();
  console.log(`[AUTH] Active Admin session generated: ${adminAuth.admin.username} (${adminAuth.admin.role})`);

  const tempProfile = path.join(SCREENSHOT_DIR, 'chrome_audit_profile_final_' + Date.now());
  fs.mkdirSync(tempProfile, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
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
        http.get('http://127.0.0.1:9223/json', res => {
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

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const allAuditResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n==============================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`==============================================================`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });

    await cdp.send('Emulation.setVisibleSize', { width: vp.width, height: vp.height });

    // Section 1: Public Routes (without auth)
    console.log(`\n--- Public Routes (${vp.name}) ---`);
    for (const route of PUBLIC_ROUTES) {
      const url = `http://localhost:5173/${route.hash}`;
      await cdp.send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 600));

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalOverflow = docWidth > winWidth + 1;
            return {
              docWidth,
              winWidth,
              hasHorizontalOverflow,
              overflowAmount: Math.max(0, docWidth - winWidth)
            };
          })()
        `,
        returnByValue: true
      });

      const metrics = evalRes.result?.value || {};
      const status = metrics.hasHorizontalOverflow ? 'FAIL (OVERFLOW)' : 'PASS';
      console.log(`  [${status}] ${route.name.padEnd(16)} scrollWidth: ${metrics.docWidth}px / innerWidth: ${metrics.winWidth}px (overflow: ${metrics.overflowAmount}px)`);

      allAuditResults.push({
        viewport: vp.name,
        section: 'public',
        name: route.name,
        status,
        metrics
      });

      // Save key screenshots
      if (['home', 'officials', 'work', 'contact'].includes(route.name)) {
        const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SCREENSHOT_DIR, `after_${vp.name}_${route.name}.png`);
        fs.writeFileSync(filePath, Buffer.from(screenshotRes.data, 'base64'));
      }
    }

    // Section 2: Authenticated Admin Portal Tabs
    console.log(`\n--- Authenticated Admin Tabs (${vp.name}) ---`);
    // Inject auth into localStorage
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('shrikrushna_admin_token_v2', '${adminAuth.token}');
        localStorage.setItem('shrikrushna_admin_profile_v2', JSON.stringify(${JSON.stringify(adminAuth.admin)}));
      `
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/#admin' });
    await new Promise(r => setTimeout(r, 1200));

    for (const tab of ADMIN_TABS) {
      // Click tab button
      await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            // Look for button that switches to tabId
            for (const b of buttons) {
              const text = b.innerText.toLowerCase();
              if (
                ('${tab.tabId}' === 'officials' && (text.includes('पदाधिकारी') || text.includes('officials'))) ||
                ('${tab.tabId}' === 'initiatives' && (text.includes('उपक्रम') || text.includes('initiatives'))) ||
                ('${tab.tabId}' === 'news' && (text.includes('सूचना') || text.includes('announcements'))) ||
                ('${tab.tabId}' === 'schemes' && (text.includes('योजना') || text.includes('schemes'))) ||
                ('${tab.tabId}' === 'videos' && (text.includes('व्हिडिओ') || text.includes('videos'))) ||
                ('${tab.tabId}' === 'reports' && (text.includes('अहवाल') || text.includes('reports')))
              ) {
                b.click();
                break;
              }
            }
          })()
        `
      });

      await new Promise(r => setTimeout(r, 700));

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalOverflow = docWidth > winWidth + 1;
            return {
              docWidth,
              winWidth,
              hasHorizontalOverflow,
              overflowAmount: Math.max(0, docWidth - winWidth)
            };
          })()
        `,
        returnByValue: true
      });

      const metrics = evalRes.result?.value || {};
      const status = metrics.hasHorizontalOverflow ? 'FAIL (OVERFLOW)' : 'PASS';
      console.log(`  [${status}] ${tab.name.padEnd(20)} scrollWidth: ${metrics.docWidth}px / innerWidth: ${metrics.winWidth}px (overflow: ${metrics.overflowAmount}px)`);

      allAuditResults.push({
        viewport: vp.name,
        section: 'admin',
        name: tab.name,
        status,
        metrics
      });

      if (['admin_officials', 'admin_schemes'].includes(tab.name)) {
        const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SCREENSHOT_DIR, `after_${vp.name}_${tab.name}.png`);
        fs.writeFileSync(filePath, Buffer.from(screenshotRes.data, 'base64'));
      }
    }

    // Clean up localStorage auth for next viewport
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.removeItem('shrikrushna_admin_token_v2');
        localStorage.removeItem('shrikrushna_admin_profile_v2');
      `
    });
  }

  // Close browser
  ws.close();
  chrome.kill();

  const total = allAuditResults.length;
  const fails = allAuditResults.filter(r => r.status.includes('FAIL'));

  console.log('\n==============================================================');
  console.log('FINAL AUDIT VERIFICATION SUMMARY:');
  console.log(`Total Scenarios Tested: ${total} across 4 viewports x (12 public + 6 admin)`);
  console.log(`Total Passes: ${total - fails.length}`);
  console.log(`Horizontal Overflows Detected: ${fails.length}`);
  console.log('==============================================================\n');

  if (fails.length > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});

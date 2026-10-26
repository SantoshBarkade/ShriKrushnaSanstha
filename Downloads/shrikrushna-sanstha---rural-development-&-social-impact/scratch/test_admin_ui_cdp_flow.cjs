const { spawn } = require('child_process');
const fs = require('fs');

async function testAdminUiFlow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9398;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1400));
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

    // 1. First register token in MySQL via small PHP helper
    console.log('1. Creating ephemeral admin token in MySQL...');
    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex'); // exactly 64 hex characters
    
    // We execute php to register token
    const { execSync } = require('child_process');
    const phpRegister = `& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php register ${rawToken}`;
    const phpOut = execSync(phpRegister, { shell: 'powershell' }).toString();
    console.log('PHP register output:', phpOut);

    // 2. Set viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 3. Navigate to http://localhost:4173/#/admin
    console.log('2. Navigating to http://localhost:4173/#/admin...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/admin' });
    await new Promise((r) => setTimeout(r, 1200));

    // 4. Inject token into sessionStorage and reload
    console.log('3. Injecting token into sessionStorage...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.setItem('shrikrushna_admin_token_v2', '${rawToken}');
        sessionStorage.setItem('shrikrushna_admin_profile', JSON.stringify({
          id: 1,
          username: 'super_admin',
          full_name: 'Santosh Barkade',
          role: 'super_admin'
        }));
      })()`,
    });

    // Reload page to let App mount AdminPortal with active session
    console.log('4. Reloading admin portal...');
    await send('Page.reload');
    await new Promise((r) => setTimeout(r, 2200));

    // 5. Check if Admin UI is logged in
    const authState = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasLogout = Array.from(document.querySelectorAll('button, a')).some(el => el.innerText.includes('लॉगआउट') || el.innerText.includes('Logout'));
        const tabs = Array.from(document.querySelectorAll('nav button, aside button, button')).map(b => b.innerText.trim()).filter(Boolean);
        return {
          hasLogout,
          tabs: tabs.slice(0, 20),
          title: document.title
        };
      })()`,
      returnByValue: true
    });
    console.log('Admin Auth State in UI:', JSON.stringify(authState.result.value, null, 2));

    // Clean up token from MySQL
    const phpClean = `& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php clean ${rawToken}`;
    execSync(phpClean, { shell: 'powershell' });
    console.log('Cleaned up test token from MySQL.');

  } catch (err) {
    console.error('Error in testAdminUiFlow:', err);
  } finally {
    child.kill();
  }
}

testAdminUiFlow();

const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

async function testReactInput() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9402;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  const rawToken = crypto.randomBytes(32).toString('hex');

  try {
    execSync(`& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php register ${rawToken}`, { shell: 'powershell' });
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

    await send('Page.navigate', { url: 'http://localhost:4173/#/admin' });
    await new Promise((r) => setTimeout(r, 1200));

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

    await send('Page.reload');
    await new Promise((r) => setTimeout(r, 2200));

    // Switch to Settings tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('aside button, nav button, button'));
        const settingsTab = buttons.find(b => b.innerText.includes('सेटिंग्ज') || b.innerText.includes('Settings'));
        if (settingsTab) settingsTab.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Use setReactInputValue helper
    const testRes = await send('Runtime.evaluate', {
      expression: `(() => {
        function setVal(el, val) {
          const isTextarea = el.tagName.toLowerCase() === 'textarea';
          const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const badgeInput = inputs.find(i => i.placeholder && i.placeholder.includes('ग्रामीण परिवर्तन'));
        if (!badgeInput) return { error: 'input not found' };

        const origVal = badgeInput.value;
        setVal(badgeInput, 'ग्रामीण परिवर्तन • चाचणी लाइव्ह बॅज');

        // Click save
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtn = buttons.find(b => b.innerText.includes('बॅज जतन करा') || b.innerText.includes('Save Badge'));
        if (saveBtn) saveBtn.click();

        return { origVal, newVal: badgeInput.value, saveFound: Boolean(saveBtn) };
      })()`,
      returnByValue: true,
    });
    console.log('Admin Input Test result:', testRes.result.value);
    await new Promise((r) => setTimeout(r, 1500));

    // Check public Home page
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));

    const publicBadge = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1');
        const container = h1 ? h1.closest('div') : null;
        const pill = container ? container.querySelector('div.rounded-full') : null;
        return pill ? pill.innerText.replace(/\\n/g, ' ') : '';
      })()`,
      returnByValue: true,
    });
    console.log('Public Badge after edit:', publicBadge.result.value);

    // Restore original
    console.log('Restoring original...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/admin' });
    await new Promise((r) => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('aside button, nav button, button'));
        const settingsTab = buttons.find(b => b.innerText.includes('सेटिंग्ज') || b.innerText.includes('Settings'));
        if (settingsTab) settingsTab.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await send('Runtime.evaluate', {
      expression: `(() => {
        function setVal(el, val) {
          const isTextarea = el.tagName.toLowerCase() === 'textarea';
          const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const badgeInput = inputs.find(i => i.placeholder && i.placeholder.includes('ग्रामीण परिवर्तन'));
        if (badgeInput) {
          setVal(badgeInput, '${testRes.result.value?.origVal || 'ग्रामीण परिवर्तन आणि लोककल्याण'}');
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(b => b.innerText.includes('बॅज जतन करा') || b.innerText.includes('Save Badge'));
          if (saveBtn) saveBtn.click();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Confirm restore
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2000));
    const publicRestored = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1');
        const container = h1 ? h1.closest('div') : null;
        const pill = container ? container.querySelector('div.rounded-full') : null;
        return pill ? pill.innerText.replace(/\\n/g, ' ') : '';
      })()`,
      returnByValue: true,
    });
    console.log('Public Badge after restore:', publicRestored.result.value);

  } finally {
    try {
      execSync(`& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php clean ${rawToken}`, { shell: 'powershell' });
      console.log('Cleaned up test admin token from MySQL.');
    } catch (e) {}
    child.kill();
  }
}

testReactInput();

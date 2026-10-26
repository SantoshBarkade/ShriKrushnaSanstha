const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

async function testDeleteSectionAdminUi() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9405;
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

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        console.error('Eval error:', res.exceptionDetails);
        return null;
      }
      return res.result ? res.result.value : null;
    };

    await send('Page.navigate', { url: 'http://localhost:4173/#/admin' });
    await new Promise((r) => setTimeout(r, 1200));

    await evaluate(`(() => {
      sessionStorage.setItem('shrikrushna_admin_token_v2', '${rawToken}');
      sessionStorage.setItem('shrikrushna_admin_profile', JSON.stringify({
        id: 1,
        username: 'super_admin',
        full_name: 'Santosh Barkade',
        role: 'super_admin'
      }));
    })()`);

    await send('Page.reload');
    await new Promise((r) => setTimeout(r, 2200));

    // 1. Click Pages & Sections CMS tab in sidebar
    console.log('1. Clicking Pages tab in sidebar...');
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button, button'));
      const pagesTab = buttons.find(b => b.innerText.includes('पृष्ठे व विभाग') || b.innerText.includes('Pages CMS'));
      if (pagesTab) pagesTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Select 'home' tab inside PagesSectionsModule
    console.log('2. Clicking Home Sections tab inside PagesSectionsModule...');
    const selectTabRes = await evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const homeTabBtn = allButtons.find(b => b.innerText.includes('मुख्यपृष्ठ विभाग') || b.innerText.includes('Home Page Sections'));
      if (homeTabBtn) {
        homeTabBtn.click();
        return { clicked: true, text: homeTabBtn.innerText };
      }
      return { error: 'Home tab button not found', all: allButtons.map(b => b.innerText).slice(0, 15) };
    })()`);
    console.log('Select Tab result:', selectTabRes);
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Find section card for ID 20 / 'विशेष शेतकरी कृषी कार्यशाळा'
    console.log('3. Finding and clicking delete on section card...');
    const delClickRes = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('div.border.rounded-2xl, div.bg-white.p-5, div.bg-white.p-6'));
      const targetCard = cards.find(c => c.innerText.includes('विशेष शेतकरी कृषी कार्यशाळा') || c.innerText.includes('Special Farmers Agriculture Workshop'));
      if (!targetCard) {
        return { error: 'Target card not found', cardTexts: cards.map(c => c.innerText.slice(0, 40)) };
      }
      const delBtn = targetCard.querySelector('button[title="हटवा"]');
      if (delBtn) {
        delBtn.click();
        return { clicked: true };
      }
      return { error: 'Delete button not found inside card' };
    })()`);
    console.log('Delete click result:', delClickRes);
    await new Promise((r) => setTimeout(r, 1000));

    // 4. Confirm deletion in modal
    console.log('4. Confirming deletion in modal...');
    const confirmRes = await evaluate(`(() => {
      const modals = Array.from(document.querySelectorAll('div.fixed'));
      const confirmModal = modals.find(m => m.innerText.includes('हटवा') || m.innerText.includes('Delete'));
      if (!confirmModal) return { error: 'Confirm modal not found' };

      const confirmBtn = confirmModal.querySelector('button.bg-red-600');
      if (confirmBtn) {
        confirmBtn.click();
        return { confirmed: true };
      }
      return { error: 'Confirm button not found' };
    })()`);
    console.log('Confirm result:', confirmRes);
    await new Promise((r) => setTimeout(r, 2000));

    // 5. Verify on Public Home Page
    console.log('5. Verifying removal on public home page...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2200));

    const publicAfterDel = await evaluate(`(() => {
      const body = document.body.innerText;
      return {
        removed: !body.includes('विशेष शेतकरी कृषी कार्यशाळा') && !body.includes('Special Farmers Agriculture Workshop')
      };
    })()`);
    console.log('Public After Deletion:', publicAfterDel);

  } finally {
    try {
      execSync(`& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php clean ${rawToken}`, { shell: 'powershell' });
      console.log('Cleaned up test admin token from MySQL.');
    } catch (e) {}
    child.kill();
  }
}

testDeleteSectionAdminUi();

const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

async function testCustomSectionLifecycle() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9404;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-extensions',
    'about:blank',
  ]);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const testSectionKey = 'e2e_agri_' + Date.now().toString(36);

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

    // Helper to set React input value injected in page
    const setValHelper = `
      function setReactVal(el, val) {
        if (!el) return;
        const isTextarea = el.tagName.toLowerCase() === 'textarea';
        const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `;

    // 1. Navigate to Pages tab
    console.log('1. Navigating to Pages tab...');
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button, button'));
      const pagesTab = buttons.find(b => b.innerText.includes('पृष्ठे व विभाग') || b.innerText.includes('Pages CMS'));
      if (pagesTab) pagesTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Select 'home' page tab
    console.log('2. Selecting Home page tab...');
    await evaluate(`(() => {
      const pageButtons = Array.from(document.querySelectorAll('button'));
      const homeBtn = pageButtons.find(b => b.innerText.includes('मुख्यपृष्ठ') || b.innerText.includes('Home'));
      if (homeBtn) homeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    // 3. Open Add New Section Modal
    console.log('3. Opening Add New Section modal...');
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.innerText.includes('नवीन विभाग जोडा') || b.innerText.includes('Add New Section'));
      if (addBtn) addBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));

    // 4. Fill modal fields
    console.log('4. Filling modal fields...');
    const fillRes = await evaluate(`(() => {
      ${setValHelper}
      const modal = document.querySelector('div.fixed');
      if (!modal) return { error: 'modal not found' };

      // Ensure page select is 'home'
      const select = modal.querySelector('select');
      if (select) {
        select.value = 'home';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Section Key
      const keyInput = modal.querySelector('input[placeholder*="about_intro"]');
      if (keyInput) setReactVal(keyInput, '${testSectionKey}');

      // Title MR & EN
      const titleMr = modal.querySelector('input[placeholder*="मराठीत शीर्षक"]');
      if (titleMr) setReactVal(titleMr, 'विशेष शेतकरी कृषी कार्यशाळा');

      const titleEn = modal.querySelector('input[placeholder*="Enter title in English"]');
      if (titleEn) setReactVal(titleEn, 'Special Farmers Agriculture Workshop');

      // Subtitle MR & EN
      const subtitleMr = modal.querySelector('input[placeholder*="प्रस्तावना व पार्श्वभूमी"]');
      if (subtitleMr) setReactVal(subtitleMr, 'शेतकरी सहाय्य उपक्रम');

      // Content MR & EN
      const textareas = Array.from(modal.querySelectorAll('textarea'));
      if (textareas[0]) setReactVal(textareas[0], 'नादरपूर व परिसरातील सर्व शेतकऱ्यांसाठी आधुनिक सेंद्रिय शेती व जलसंधारण मार्गदर्शन कार्यशाळा.');
      if (textareas[1]) setReactVal(textareas[1], 'Guidance workshop on modern organic farming and water conservation for local farmers.');

      // Click submit
      const submitBtn = modal.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();

      return {
        hasKeyInput: Boolean(keyInput),
        hasTitleMr: Boolean(titleMr),
        hasTitleEn: Boolean(titleEn),
        hasSubmit: Boolean(submitBtn)
      };
    })()`);
    console.log('Modal fill and submit result:', fillRes);
    await new Promise((r) => setTimeout(r, 2200));

    // 5. Verify on Public Home Page (Marathi)
    console.log('5. Verifying section on public home page (Marathi)...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2500));

    const publicRenderMr = await evaluate(`(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3')).map(h => h.innerText.trim());
      const body = document.body.innerText;
      return {
        hasTitle: headings.some(h => h.includes('विशेष शेतकरी कृषी कार्यशाळा')),
        hasContent: body.includes('सेंद्रिय शेती व जलसंधारण')
      };
    })()`);
    console.log('Public Render Marathi:', publicRenderMr);

    // 6. Verify on Public Home Page (English)
    console.log('6. Verifying section on public home page (English)...');
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const en = btns.find(b => b.innerText.trim() === 'EN');
      if (en) en.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));

    const publicRenderEn = await evaluate(`(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3')).map(h => h.innerText.trim());
      const body = document.body.innerText;
      return {
        hasTitleEn: headings.some(h => h.includes('Special Farmers Agriculture Workshop')),
        hasContentEn: body.includes('organic farming and water conservation')
      };
    })()`);
    console.log('Public Render English:', publicRenderEn);

    // 7. Delete the section through Admin UI
    console.log('7. Returning to Admin to delete the section...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/admin' });
    await new Promise((r) => setTimeout(r, 2000));

    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button, button'));
      const pagesTab = buttons.find(b => b.innerText.includes('पृष्ठे व विभाग') || b.innerText.includes('Pages CMS'));
      if (pagesTab) pagesTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    await evaluate(`(() => {
      const pageButtons = Array.from(document.querySelectorAll('button'));
      const homeBtn = pageButtons.find(b => b.innerText.includes('मुख्यपृष्ठ') || b.innerText.includes('Home'));
      if (homeBtn) homeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    // Find delete button on the card
    const delRes = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('div.border.rounded-2xl'));
      const targetCard = cards.find(c => c.innerText.includes('${testSectionKey}') || c.innerText.includes('विशेष शेतकरी कृषी कार्यशाळा'));
      if (!targetCard) return { error: 'Card not found', cardCount: cards.length };

      const delBtn = targetCard.querySelector('button[title="हटवा"]');
      if (delBtn) {
        delBtn.click();
        return { clicked: true };
      }
      return { error: 'Delete button not found' };
    })()`);
    console.log('Delete button click:', delRes);
    await new Promise((r) => setTimeout(r, 800));

    // Confirm deletion
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
    console.log('Confirm deletion result:', confirmRes);
    await new Promise((r) => setTimeout(r, 1800));

    // 8. Verify removal on Public Home Page
    console.log('8. Verifying removal on public home page...');
    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2200));

    const publicAfterDel = await evaluate(`(() => {
      const body = document.body.innerText;
      return {
        removed: !body.includes('विशेष शेतकरी कृषी कार्यशाळा') && !body.includes('Special Farmers Agriculture Workshop')
      };
    })()`);
    console.log('Public After Deletion:', publicAfterDel);

    const lifecycleSummary = {
      sectionKey: testSectionKey,
      modalFill: fillRes,
      publicRenderMr: publicRenderMr.hasTitle && publicRenderMr.hasContent,
      publicRenderEn: publicRenderEn.hasTitleEn && publicRenderEn.hasContentEn,
      deletedFromAdmin: confirmRes.confirmed,
      removedFromPublic: publicAfterDel.removed,
      status: (publicRenderMr.hasTitle && publicRenderEn.hasTitleEn && publicAfterDel.removed) ? 'PASS' : 'FAIL'
    };
    console.log('\n=== LIFECYCLE SUMMARY ===');
    console.log(JSON.stringify(lifecycleSummary, null, 2));

  } finally {
    try {
      execSync(`& "C:\\tools\\php8.4\\php.exe" scratch\\manage_test_token.php clean ${rawToken}`, { shell: 'powershell' });
      console.log('Cleaned up test admin token from MySQL.');
    } catch (e) {}
    child.kill();
  }
}

testCustomSectionLifecycle();

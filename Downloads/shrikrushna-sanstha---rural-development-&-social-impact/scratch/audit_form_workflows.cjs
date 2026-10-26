const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Santosh\\.gemini\\antigravity\\brain\\8985ba1f-7878-48da-8615-e7471f6974d1';

async function runFormWorkflowsAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9295;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/contact'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1200));

  const results = {
    contactFormValidation: {},
    volunteerFormValidation: {},
    reportsWorkflow: {},
    galleryLightboxWorkflow: {},
    schemesWorkflow: {}
  };

  // 1. Audit Contact Form Validations
  console.log('Testing Contact Form Validation...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/contact' });
  await new Promise((r) => setTimeout(r, 1200));

  // Click Submit on empty form
  const emptySubmit = await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('संदेश पाठवा') || b.textContent.includes('Send Message'));
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const contactErrors = await send('Runtime.evaluate', {
    expression: `(() => {
      const errorEls = Array.from(document.querySelectorAll('.text-rose-600, .text-red-500, [role="alert"]'));
      return {
        count: errorEls.length,
        messages: errorEls.map(el => el.textContent.trim())
      };
    })()`,
    returnByValue: true
  });

  const shotContactVal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'audit_contact_validation_errors.png'), Buffer.from(shotContactVal.data, 'base64'));

  results.contactFormValidation = {
    submitClicked: emptySubmit.result.value,
    errorsRendered: contactErrors.result.value
  };
  console.log('Contact form errors:', contactErrors.result.value);

  // 2. Audit Volunteer Form Validations
  console.log('\nTesting Volunteer Form Validation...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/volunteer' });
  await new Promise((r) => setTimeout(r, 1200));

  const emptyVolSubmit = await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('नोंदणी करा') || b.textContent.includes('Submit Registration'));
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const volErrors = await send('Runtime.evaluate', {
    expression: `(() => {
      const errorEls = Array.from(document.querySelectorAll('.text-rose-600, .text-red-500, [role="alert"]'));
      return {
        count: errorEls.length,
        messages: errorEls.map(el => el.textContent.trim())
      };
    })()`,
    returnByValue: true
  });

  const shotVolVal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'audit_volunteer_validation_errors.png'), Buffer.from(shotVolVal.data, 'base64'));

  results.volunteerFormValidation = {
    submitClicked: emptyVolSubmit.result.value,
    errorsRendered: volErrors.result.value
  };
  console.log('Volunteer form errors:', volErrors.result.value);

  // 3. Audit Reports Search & Notice Handling
  console.log('\nTesting Reports Workflow...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/reports' });
  await new Promise((r) => setTimeout(r, 1200));

  const reportsCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const searchInput = document.querySelector('input[type="text"], input[type="search"]');
      const categoryButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('अहवाल') || b.textContent.includes('सर्व'));
      const reportCards = document.querySelectorAll('article, .bg-white.rounded-2xl, .border-slate-200');
      return {
        hasSearchInput: !!searchInput,
        categoryFilterCount: categoryButtons.length,
        reportCardsCount: reportCards.length
      };
    })()`,
    returnByValue: true
  });
  results.reportsWorkflow = reportsCheck.result.value;
  console.log('Reports workflow:', reportsCheck.result.value);

  // 4. Audit Gallery Lightbox Workflow
  console.log('\nTesting Gallery Lightbox Workflow...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/gallery' });
  await new Promise((r) => setTimeout(r, 1200));

  const galleryOpen = await send('Runtime.evaluate', {
    expression: `(() => {
      const photoItem = document.querySelector('img[alt], .group.cursor-pointer');
      if (photoItem) {
        photoItem.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const isLightboxActive = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('[role="dialog"], .fixed.inset-0.z-50')`,
    returnByValue: true
  });

  // Press Escape to close
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 600));

  const isLightboxClosed = await send('Runtime.evaluate', {
    expression: `!document.querySelector('.fixed.inset-0.z-50')`,
    returnByValue: true
  });

  results.galleryLightboxWorkflow = {
    photoClicked: galleryOpen.result.value,
    lightboxOpened: isLightboxActive.result.value,
    closedOnEscape: isLightboxClosed.result.value
  };
  console.log('Gallery Lightbox workflow:', results.galleryLightboxWorkflow);

  // 5. Audit Schemes External Links
  console.log('\nTesting Schemes External Links & Security...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/schemes' });
  await new Promise((r) => setTimeout(r, 1200));

  const schemesLinks = await send('Runtime.evaluate', {
    expression: `(() => {
      const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]'));
      return {
        totalExternalLinks: externalLinks.length,
        sample: externalLinks.slice(0, 5).map(a => ({
          href: a.href,
          target: a.target,
          rel: a.rel,
          text: a.textContent.trim().slice(0, 35)
        })),
        allHaveNoopener: externalLinks.every(a => a.rel && a.rel.includes('noopener'))
      };
    })()`,
    returnByValue: true
  });
  results.schemesWorkflow = schemesLinks.result.value;
  console.log('Schemes workflow:', schemesLinks.result.value);

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'form_and_workflows_audit_results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nWrote form_and_workflows_audit_results.json successfully.');

  ws.close();
  child.kill();
}

runFormWorkflowsAudit().catch(console.error);

const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9324;

async function check() {
  const child = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', 'http://localhost:5173/#/gallery']);
  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      ws.addEventListener('message', function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', h);
          resolve(d.result);
        }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Click first album card
  console.log('1. Clicking first album card...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h3 = Array.from(document.querySelectorAll('main h3'))[0];
        if (h3) {
          h3.closest('[aria-label]').click();
          return true;
        }
        return false;
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1000));

  // List all images in main
  const images = await send('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('main img')).map(img => ({
        src: img.src,
        alt: img.alt,
        hasClickableParent: !!img.closest('[aria-label]')
      }))
    `,
    returnByValue: true
  });
  console.log('Images in album:', images.result.value);

  // Click the first image's clickable parent
  console.log('2. Clicking first image clickable parent...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const img = document.querySelector('main img');
        if (img) {
          const card = img.closest('[aria-label]');
          if (card) {
            card.click();
            return { clicked: true, label: card.getAttribute('aria-label') };
          }
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);
  await new Promise((r) => setTimeout(r, 1000));

  // Check if Lightbox modal is open
  const modalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('[role="dialog"]');
        return {
          isOpen: !!modal,
          ariaLabel: modal ? modal.getAttribute('aria-label') : null,
          title: modal ? modal.querySelector('h3')?.innerText : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Lightbox Modal Status:', modalRes.result.value);

  ws.close();
  child.kill();
}

check().catch(console.error);

const { spawn } = require('child_process');

async function testGalleryPhotos() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9273',
    '--disable-gpu',
    'http://localhost:5173/#/gallery'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9273/json').then((r) => r.json());
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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

  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      // Click 'सर्व छायाचित्रे' button
      const btns = Array.from(document.querySelectorAll('button'));
      const allPhotosBtn = btns.find(b => b.textContent.includes('सर्व छायाचित्रे') || b.textContent.includes('All Photos'));
      if (allPhotosBtn) allPhotosBtn.click();

      const images = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt }));
      const countBadge = allPhotosBtn ? allPhotosBtn.querySelector('span:last-child')?.textContent : null;
      return { countBadge, imagesCount: images.length, images };
    })()`,
    returnByValue: true
  });

  console.log('Result when clicking all photos:', JSON.stringify(evalResult.result.value, null, 2));
  ws.close();
  child.kill();
}

testGalleryPhotos().catch(console.error);

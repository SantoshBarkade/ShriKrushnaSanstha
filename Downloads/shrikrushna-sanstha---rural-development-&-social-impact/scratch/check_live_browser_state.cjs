const { spawn } = require('child_process');

async function checkLiveState() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9270;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/videos'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let list = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list.length) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let id = 1;
  const send = (m, p = {}) =>
    new Promise((res) => {
      const cur = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === cur) {
          ws.removeEventListener('message', handler);
          res(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 2200)); // wait for API fetch

  const stateInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const titles = Array.from(document.querySelectorAll('main h3')).map(h => h.textContent.trim());
      const cards = document.querySelectorAll('main div.grid > div').length;
      const localState = localStorage.getItem('shrikrushna_sanstha_state_v9_news_slider');
      let parsed = null;
      try { parsed = JSON.parse(localState); } catch(e){}
      return {
        renderedCardCount: cards,
        renderedTitles: titles,
        localStorageVideosCount: parsed?.videos?.length,
        localStorageAlbumsCount: parsed?.albums?.length,
        localStorageGalleryCount: parsed?.gallery?.length,
        localStorageVideoItems: parsed?.videos
      };
    })()`,
    returnByValue: true
  });

  console.log('Browser Live State on #/videos:');
  console.log(JSON.stringify(stateInfo.result.value, null, 2));

  // Now navigate to #/gallery
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/gallery'` });
  await new Promise((r) => setTimeout(r, 1200));

  const galleryInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const albums = Array.from(document.querySelectorAll('main div.grid > div h3')).map(h => h.textContent.trim());
      return {
        renderedAlbumCount: albums.length,
        renderedAlbumTitles: albums
      };
    })()`,
    returnByValue: true
  });

  console.log('Browser Live State on #/gallery:');
  console.log(JSON.stringify(galleryInfo.result.value, null, 2));

  ws.close();
  child.kill();
}

checkLiveState().catch(console.error);

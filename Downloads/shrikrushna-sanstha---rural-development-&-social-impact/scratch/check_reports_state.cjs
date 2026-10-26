const { spawn } = require('child_process');

async function checkReportsState() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9272;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    'http://localhost:5173/#/reports'
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
  await new Promise((r) => setTimeout(r, 2200));

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const local = localStorage.getItem('shrikrushna_sanstha_state_v9_news_slider');
      let parsed = null;
      try { parsed = JSON.parse(local); } catch(e){}
      const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
      const emptyMsg = document.querySelector('main')?.textContent || '';
      return {
        renderedReportTitles: h3s,
        renderedReportsCount: h3s.length,
        localStorageReportsCount: parsed?.reports?.length,
        emptyStateFound: emptyMsg.includes('सध्या कोणतेही वार्षिक अहवाल उपलब्ध नाहीत')
      };
    })()`,
    returnByValue: true
  });

  console.log('Live Reports State:');
  console.log(JSON.stringify(info.result.value, null, 2));

  ws.close();
  child.kill();
}

checkReportsState().catch(console.error);

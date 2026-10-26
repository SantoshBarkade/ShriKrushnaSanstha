const { spawn } = require('child_process');

async function testBackend() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    'http://localhost:5173/#/about'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const list = await fetch('http://127.0.0.1:9225/json').then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const responses = [];
  const consoleMessages = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.responseReceived') {
      responses.push({
        status: msg.params.response.status,
        url: msg.params.response.url,
        mimeType: msg.params.response.mimeType,
      });
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({
        type: msg.params.type,
        args: msg.params.args.map((a) => a.value || a.description),
      });
    }
  });

  await send('Network.enable');
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise((r) => setTimeout(r, 3500));

  console.log('=== NETWORK RESPONSES ===');
  for (const resp of responses) {
    if (resp.url.includes('api') || resp.url.includes('.php') || resp.url.includes('content') || resp.status >= 400) {
      console.log(`${resp.status} ${resp.mimeType} -> ${resp.url}`);
    }
  }

  console.log('=== CONSOLE LOGS ===');
  for (const log of consoleMessages) {
    console.log(`[${log.type}]`, ...log.args);
  }

  // Inspect client-side SansthaContext state via DOM / window / React
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const storageData = localStorage.getItem('shrikrushna_sanstha_state_v9_news_slider');
        const parsed = storageData ? JSON.parse(storageData) : null;
        return {
          hasStorageData: Boolean(parsed),
          officialsCount: parsed?.officials?.length || 0,
          initiativesCount: parsed?.initiatives?.length || 0,
          schemesCount: parsed?.governmentSchemes?.length || 0,
          sectionsCount: parsed?.pageSections?.length || 0,
          aboutSections: (parsed?.pageSections || []).filter(s => s.pageSlug === 'about').map(s => ({
            key: s.sectionKey,
            titleMr: s.titleMr?.slice(0, 30),
            isPublished: s.isPublished
          }))
        };
      })()
    `,
    returnByValue: true,
  });

  console.log('=== CONTEXT & PERSISTED CMS STATE ===');
  console.log(JSON.stringify(evalResult.result.value, null, 2));

  // Check interactive elements on page
  const interactionCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const links = Array.from(document.querySelectorAll('a, button')).map(el => ({
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 40),
          disabled: el.disabled
        }));
        return {
          totalInteractive: links.length,
          sample: links.slice(0, 15)
        };
      })()
    `,
    returnByValue: true,
  });

  console.log('=== INTERACTION AUDIT ===');
  console.log(JSON.stringify(interactionCheck.result.value, null, 2));

  ws.close();
  child.kill();
}

testBackend().catch(console.error);

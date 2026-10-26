const { spawn } = require('child_process');
const fs = require('fs');

async function auditNetwork() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    'about:blank'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9255/json').then((r) => r.json());
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

  const networkRequests = [];
  const networkResponses = [];
  const failedRequests = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.requestWillBeSent') {
      networkRequests.push({
        url: msg.params.request.url,
        method: msg.params.request.method,
        requestId: msg.params.requestId
      });
    }
    if (msg.method === 'Network.responseReceived') {
      networkResponses.push({
        url: msg.params.response.url,
        status: msg.params.response.status,
        statusText: msg.params.response.statusText,
        fromCache: msg.params.response.fromDiskCache || msg.params.response.fromServiceWorker
      });
      if (msg.params.response.status >= 400 && !msg.params.response.url.includes('favicon')) {
        failedRequests.push({
          url: msg.params.response.url,
          status: msg.params.response.status
        });
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('--- AUDITING NETWORK AND API DATA FLOW ---');

  // Navigate to initiatives
  await send('Page.navigate', { url: 'http://localhost:5173/#/initiatives' });
  await new Promise((r) => setTimeout(r, 2000));

  // Check state data in browser
  const stateAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      // Collect rendered initiative cards
      const cards = Array.from(document.querySelectorAll('article')).map(c => {
        return {
          title: c.querySelector('h3')?.textContent?.trim() || '',
          categoryBadge: c.querySelector('.text-amber-300')?.textContent?.trim() || '',
          date: c.querySelector('.lucide-calendar')?.parentElement?.textContent?.trim() || '',
          location: c.querySelector('.lucide-map-pin')?.parentElement?.textContent?.trim() || '',
          summary: c.querySelector('p')?.textContent?.trim() || '',
          hasImage: Boolean(c.querySelector('img')?.src)
        };
      });

      return {
        currentRoute: window.location.hash,
        renderedCount: cards.length,
        cards
      };
    })()`,
    returnByValue: true
  });

  console.log('Rendered Initiatives Count:', stateAudit.result.value.renderedCount);
  console.log('Rendered Initiatives:', JSON.stringify(stateAudit.result.value.cards, null, 2));

  // Filter API requests to backend
  const apiRequests = networkRequests.filter(r => r.url.includes('content.php') || r.url.includes('api'));
  console.log('API Requests detected:', apiRequests);
  console.log('Failed Requests (>400):', failedRequests);

  const report = {
    totalRequests: networkRequests.length,
    apiRequests,
    failedRequests,
    stateAudit: stateAudit.result.value
  };

  fs.writeFileSync('scratch/network_and_data_flow_audit.json', JSON.stringify(report, null, 2));

  ws.close();
  child.kill();
}

auditNetwork().catch(console.error);

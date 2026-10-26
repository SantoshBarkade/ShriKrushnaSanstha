const { spawn } = require('child_process');
const fs = require('fs');

async function profileCpu() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9307;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || list[0];
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
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Profiler.enable');
    await send('Page.enable');

    console.log('Starting Profiler...');
    await send('Profiler.start');

    await send('Page.navigate', { url: 'http://localhost:4173/#/home' });
    await new Promise((r) => setTimeout(r, 2500));

    const { profile } = await send('Profiler.stop');
    console.log('Profile captured! Total nodes:', profile.nodes.length);

    // Calculate time per function
    const nodeTimes = new Map();
    for (let i = 0; i < profile.samples.length; i++) {
      const nodeId = profile.samples[i];
      const delta = profile.timeDeltas ? profile.timeDeltas[i] : 1000;
      nodeTimes.set(nodeId, (nodeTimes.get(nodeId) || 0) + delta);
    }

    const report = [];
    for (const [nodeId, time] of nodeTimes.entries()) {
      const node = profile.nodes.find((n) => n.id === nodeId);
      if (node && node.callFrame) {
        report.push({
          functionName: node.callFrame.functionName || '(anonymous)',
          url: node.callFrame.url.split('/').pop(),
          lineNumber: node.callFrame.lineNumber,
          totalTimeMs: Math.round(time / 1000)
        });
      }
    }

    report.sort((a, b) => b.totalTimeMs - a.totalTimeMs);
    console.log('\nTOP 15 HEAVIEST CPU FUNCTIONS DURING HOMEPAGE LOAD:');
    console.table(report.slice(0, 15));

    fs.writeFileSync('scratch/cpu_profile_report.json', JSON.stringify(report, null, 2));

    ws.close();
  } finally {
    child.kill();
  }
}

profileCpu().catch(console.error);

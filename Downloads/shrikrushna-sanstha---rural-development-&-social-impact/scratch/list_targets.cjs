const { spawn } = require('child_process');

async function listTargets() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9340;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'http://localhost:4173/#/home',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    console.log('Targets:', JSON.stringify(list, null, 2));
  } finally {
    child.kill();
  }
}

listTargets().catch(console.error);

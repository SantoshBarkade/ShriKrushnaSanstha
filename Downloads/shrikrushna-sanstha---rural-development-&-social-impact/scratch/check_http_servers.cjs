const http = require('http');

function checkEndpoint(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ name, url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400, length: data.length });
      });
    });
    req.on('error', (err) => {
      resolve({ name, url, error: err.message, ok: false });
    });
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ name, url, error: 'TIMEOUT', ok: false });
    });
  });
}

async function run() {
  const phpBackend = await checkEndpoint('PHP Backend REST API', 'http://127.0.0.1:8088/backend-php-mysql/api/content.php');
  const vitePreview = await checkEndpoint('Vite Production Preview', 'http://localhost:4173/');

  console.log(JSON.stringify({ phpBackend, vitePreview }, null, 2));
  if (!phpBackend.ok || !vitePreview.ok) {
    process.exit(1);
  }
}

run();

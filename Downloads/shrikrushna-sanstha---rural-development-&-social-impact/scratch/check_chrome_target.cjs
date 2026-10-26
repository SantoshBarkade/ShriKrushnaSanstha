const http = require('http');

function getDevToolsTarget() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          resolve(list[0]);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  // Let's check if chrome remote debugging is available on 9222 or start a quick headless chrome
  try {
    const target = await getDevToolsTarget();
    console.log("Found Chrome debugging target:", target.title);
  } catch (e) {
    console.log("No existing chrome on 9222. We can spawn one if needed.");
  }
}
run();

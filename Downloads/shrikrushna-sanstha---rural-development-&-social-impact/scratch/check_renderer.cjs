const { spawn } = require('child_process');

async function checkRenderer() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9305',
    'about:blank'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch('http://127.0.0.1:9305/json').then((r) => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
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

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return { webgl: false };
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        return {
          webgl: true,
          vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        };
      })()`,
      returnByValue: true
    });

    console.log('Renderer Info:', JSON.stringify(res.result.value, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}

checkRenderer().catch(console.error);

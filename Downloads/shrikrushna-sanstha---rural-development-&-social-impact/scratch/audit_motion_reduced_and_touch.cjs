const { spawn } = require('child_process');
const fs = require('fs');

async function auditMotion() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9257',
    '--disable-gpu',
    'http://localhost:5173/#/initiatives'
  ]);
  await new Promise((r) => setTimeout(r, 2200));
  const list = await fetch('http://127.0.0.1:9257/json').then((r) => r.json());
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- AUDITING MOTION, TOUCH & REDUCED-MOTION ---');

  // Test 1: Touch pointer event does NOT apply tilt
  const touchRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.grid > div');
      const r = card.getBoundingClientRect();

      // Dispatch touch pointer event
      card.dispatchEvent(new PointerEvent('pointermove', {
        clientX: r.left + 20,
        clientY: r.top + 20,
        pointerType: 'touch',
        bubbles: true
      }));

      const transform = card.style.transform;
      return {
        touchTransform: transform,
        tiltPreventedOnTouch: !transform || transform.includes('rotateX(0deg)')
      };
    })()`,
    returnByValue: true
  });
  console.log('Touch Pointer Test:', touchRes.result.value);

  // Test 2: Emulate prefers-reduced-motion: reduce
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await new Promise((r) => setTimeout(r, 300));

  const reducedMotionRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.grid > div');
      const r = card.getBoundingClientRect();

      // Dispatch mouse pointer event under reduced motion
      card.dispatchEvent(new PointerEvent('pointermove', {
        clientX: r.left + 20,
        clientY: r.top + 20,
        pointerType: 'mouse',
        bubbles: true
      }));

      const transform = card.style.transform;
      return {
        matchesReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        reducedMotionTransform: transform,
        tiltPreventedUnderReducedMotion: !transform || transform.includes('rotateX(0deg)')
      };
    })()`,
    returnByValue: true
  });
  console.log('Reduced Motion Test:', reducedMotionRes.result.value);

  const motionReport = {
    touchTest: touchRes.result.value,
    reducedMotionTest: reducedMotionRes.result.value
  };

  fs.writeFileSync('scratch/motion_acceptance_audit.json', JSON.stringify(motionReport, null, 2));

  ws.close();
  child.kill();
}

auditMotion().catch(console.error);

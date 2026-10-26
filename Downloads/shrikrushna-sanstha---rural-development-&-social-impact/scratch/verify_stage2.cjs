const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1';

function cdpRequest(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9222${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function sendWs(wsUrl, method, params = {}) {
  const WebSocket = require('ws');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = Math.floor(Math.random() * 1000000);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id, method, params }));
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.close();
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    });
    ws.on('error', reject);
  });
}

async function run() {
  const targets = await cdpRequest('/json');
  const target = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
  if (!target) {
    console.error('No suitable page target found:', targets);
    return;
  }
  const wsUrl = target.webSocketDebuggerUrl;
  console.log('Connected to target:', target.title, target.url);

  // 1. Test navigation to #/terms
  await sendWs(wsUrl, 'Page.navigate', { url: 'http://localhost:5173/#/terms' });
  await new Promise(r => setTimeout(r, 1200));

  // Check DOM text on terms
  let termsInfo = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      title: document.querySelector('h1')?.innerText,
      hasAcceptance: document.body.innerText.includes('अटींची स्वीकृती'),
      hasJurisdiction: document.body.innerText.includes('कायदेशीर मर्यादा'),
      fontFamilyH1: window.getComputedStyle(document.querySelector('h1')).fontFamily
    })`,
    returnByValue: true
  });
  console.log('Terms Info:', termsInfo.result.value);

  // Capture screenshot of #/terms at 1440
  await sendWs(wsUrl, 'Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
  });
  let snap = await sendWs(wsUrl, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'batch2_terms_1440.png'), Buffer.from(snap.data, 'base64'));
  console.log('Saved batch2_terms_1440.png');

  // 2. Test navigation to #/sitemap
  await sendWs(wsUrl, 'Page.navigate', { url: 'http://localhost:5173/#/sitemap' });
  await new Promise(r => setTimeout(r, 1200));

  let sitemapInfo = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      title: document.querySelector('h1')?.innerText,
      routeCardsCount: document.querySelectorAll('div[role="button"]').length,
      hasAdminLink: document.body.innerText.includes('#/admin'),
      hasSchemesLink: document.body.innerText.includes('#/schemes')
    })`,
    returnByValue: true
  });
  console.log('Sitemap Info:', sitemapInfo.result.value);

  snap = await sendWs(wsUrl, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'batch2_sitemap_1440.png'), Buffer.from(snap.data, 'base64'));
  console.log('Saved batch2_sitemap_1440.png');

  // 3. Test navigation to #/admin login form
  await sendWs(wsUrl, 'Page.navigate', { url: 'http://localhost:5173/#/admin' });
  await new Promise(r => setTimeout(r, 1200));

  // Check inputs are empty
  let adminInfo = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      usernameVal: document.querySelector('input[type="text"]')?.value,
      passwordVal: document.querySelector('input[type="password"]')?.value,
      submitBtnText: document.querySelector('button[type="submit"]')?.innerText
    })`,
    returnByValue: true
  });
  console.log('Admin Info:', adminInfo.result.value);

  // Trigger login with bad password to verify localized error
  await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `(() => {
      const u = document.querySelector('input[type="text"]');
      const p = document.querySelector('input[type="password"]');
      const f = document.querySelector('form');
      if (u && p && f) {
        u.value = 'invalid_test_user';
        u.dispatchEvent(new Event('input', { bubbles: true }));
        p.value = 'wrong_password';
        p.dispatchEvent(new Event('input', { bubbles: true }));
        f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  let adminError = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      errorText: document.querySelector('div.bg-\\\\[\\\\#FBECE9\\\\] span')?.innerText || document.querySelector('form')?.previousElementSibling?.innerText
    })`,
    returnByValue: true
  });
  console.log('Admin Error Message:', adminError.result.value);

  snap = await sendWs(wsUrl, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'batch2_admin_login_error_1440.png'), Buffer.from(snap.data, 'base64'));
  console.log('Saved batch2_admin_login_error_1440.png');

  // 4. Test #/about for 'उपस्थितीवर' and clear badges
  await sendWs(wsUrl, 'Page.navigate', { url: 'http://localhost:5173/#/about' });
  await new Promise(r => setTimeout(r, 1200));

  let aboutCheck = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      hasUpasthiti: document.body.innerText.includes('विद्यार्थी उपस्थितीवर भर'),
      hasHejari: document.body.innerText.includes('विद्यार्थी हजेरी'),
      hasAurangabadSlash: document.body.innerText.includes('/ औरंगाबाद'),
      h1FontFamily: window.getComputedStyle(document.querySelector('h1')).fontFamily
    })`,
    returnByValue: true
  });
  console.log('About Check:', aboutCheck.result.value);

  // 5. Check Footer links
  let footerLinks = await sendWs(wsUrl, 'Runtime.evaluate', {
    expression: `(() => {
      const termsBtn = Array.from(document.querySelectorAll('footer button')).find(b => b.innerText.includes('अटी व शर्ती'));
      const sitemapBtn = Array.from(document.querySelectorAll('footer button')).find(b => b.innerText.includes('संकेतस्थळ नकाशा'));
      return JSON.stringify({
        termsFound: Boolean(termsBtn),
        sitemapFound: Boolean(sitemapBtn)
      });
    })()`,
    returnByValue: true
  });
  console.log('Footer Links Found:', footerLinks.result.value);
}

run().catch(console.error);

const fs = require('fs');
const path = require('path');

async function testBackend() {
  const baseUrl = 'http://127.0.0.1:8088/api';
  const viteProxyUrl = 'http://localhost:5173/api';

  console.log('Testing direct PHP API and Vite Proxy endpoints...\n');

  const resources = [
    'all',
    'initiatives',
    'officials',
    'gallery',
    'videos',
    'reports',
    'announcements',
    'schemes',
    'events',
    'contact',
    'settings',
    'page_sections',
    'site_pages'
  ];

  const results = {
    proxyAvailability: false,
    directApiAvailability: false,
    resources: {},
    forms: {},
    auth: {}
  };

  // 1. Check Vite proxy
  try {
    const res = await fetch(`${viteProxyUrl}/content.php?resource=all`);
    results.proxyAvailability = res.ok;
    console.log(`Vite Proxy /api/content.php?resource=all: HTTP ${res.status}`);
  } catch (err) {
    console.log(`Vite Proxy failed: ${err.message}`);
  }

  // 2. Query each resource via direct API and examine counts
  for (const r of resources) {
    try {
      const res = await fetch(`${baseUrl}/content.php?resource=${r}`);
      const json = await res.json();
      const count = Array.isArray(json.data)
        ? json.data.length
        : json.data && typeof json.data === 'object'
        ? Object.keys(json.data).length
        : 0;
      results.resources[r] = {
        status: res.status,
        success: json.success,
        count: count,
        dataType: Array.isArray(json.data) ? 'array' : typeof json.data
      };
      console.log(`Resource [${r}]: HTTP ${res.status}, success: ${json.success}, count: ${count}`);
    } catch (err) {
      results.resources[r] = { error: err.message };
      console.log(`Resource [${r}] error: ${err.message}`);
    }
  }

  // 3. Test Form Validation on public endpoints (Empty / invalid data - MUST safely reject)
  // Contact Form
  try {
    const res = await fetch(`${baseUrl}/content.php?resource=inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    results.forms.inquiryEmptyValidation = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Form inquiries empty POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.inquiryEmptyValidation = { error: err.message };
  }

  // Honeypot test on inquiries
  try {
    const res = await fetch(`${baseUrl}/content.php?resource=inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot Tester',
        phone: '9999999999',
        message: 'Spam test',
        website: 'http://spam.com'
      })
    });
    const json = await res.json();
    results.forms.inquiryHoneypot = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Form inquiries honeypot test: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.inquiryHoneypot = { error: err.message };
  }

  // Volunteer Form Empty POST
  try {
    const res = await fetch(`${baseUrl}/content.php?resource=volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    results.forms.volunteerEmptyValidation = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Form volunteers empty POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.volunteerEmptyValidation = { error: err.message };
  }

  // Honeypot test on volunteers
  try {
    const res = await fetch(`${baseUrl}/content.php?resource=volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot Volunteer',
        phone: '9999999999',
        qualification: 'Graduate',
        address: 'Test',
        website: 'http://bot.com'
      })
    });
    const json = await res.json();
    results.forms.volunteerHoneypot = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Form volunteers honeypot test: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.volunteerHoneypot = { error: err.message };
  }

  // 4. Test Auth Endpoint (Missing credentials & invalid credentials)
  try {
    const res = await fetch(`${baseUrl}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    results.auth.emptyLogin = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Auth empty login POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.auth.emptyLogin = { error: err.message };
  }

  try {
    const res = await fetch(`${baseUrl}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user_999', password: 'wrong_password_999' })
    });
    const json = await res.json();
    results.auth.invalidCredentials = {
      status: res.status,
      success: json.success,
      error: json.error || json.message
    };
    console.log(`Auth invalid credentials POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.auth.invalidCredentials = { error: err.message };
  }

  // Write results to scratch
  fs.writeFileSync(
    path.join(__dirname, 'backend_audit_results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nBackend integrity audit written to scratch/backend_audit_results.json');
}

testBackend().catch(console.error);

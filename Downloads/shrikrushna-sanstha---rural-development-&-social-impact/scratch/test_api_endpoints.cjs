const fs = require('fs');
const path = require('path');

async function testApi() {
  const proxyBase = 'http://localhost:5173/backend-php-mysql/api';

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
    proxyBase,
    resources: {},
    forms: {},
    auth: {}
  };

  for (const r of resources) {
    try {
      const res = await fetch(`${proxyBase}/content.php?resource=${r}`);
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
        dataType: Array.isArray(json.data) ? 'array' : typeof json.data,
        sample: Array.isArray(json.data) ? json.data.slice(0, 2) : json.data
      };
      console.log(`Resource [${r}]: HTTP ${res.status}, success: ${json.success}, count: ${count}`);
    } catch (err) {
      results.resources[r] = { error: err.message };
      console.log(`Resource [${r}] error: ${err.message}`);
    }
  }

  // Test Contact form validation rejection (empty payload)
  try {
    const res = await fetch(`${proxyBase}/content.php?resource=inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    results.forms.inquiriesEmpty = { status: res.status, success: json.success, error: json.error || json.message };
    console.log(`Form inquiries empty POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.inquiriesEmpty = { error: err.message };
  }

  // Test Volunteer form validation rejection (empty payload)
  try {
    const res = await fetch(`${proxyBase}/content.php?resource=volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    results.forms.volunteersEmpty = { status: res.status, success: json.success, error: json.error || json.message };
    console.log(`Form volunteers empty POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.forms.volunteersEmpty = { error: err.message };
  }

  // Test Auth invalid credentials
  try {
    const res = await fetch(`${proxyBase}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user', password: 'wrong_password' })
    });
    const json = await res.json();
    results.auth.invalidLogin = { status: res.status, success: json.success, error: json.error || json.message };
    console.log(`Auth invalid login POST: HTTP ${res.status}, success=${json.success}, error=${json.error || json.message}`);
  } catch (err) {
    results.auth.invalidLogin = { error: err.message };
  }

  fs.writeFileSync(
    path.join(__dirname, 'api_audit_results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nWrote scratch/api_audit_results.json successfully.');
}

testApi().catch(console.error);

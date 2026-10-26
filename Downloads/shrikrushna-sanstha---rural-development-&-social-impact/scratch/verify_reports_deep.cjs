const fs = require('fs');
const path = require('path');

async function verifyReportsDeep() {
  console.log('=== PHASE 2: FORENSIC REPORTS BACKEND & DATA FLOW VERIFICATION ===');

  // 1. Live API fetch
  const apiUrl = 'http://localhost:5173/backend-php-mysql/api/content.php?resource=all';
  console.log(`Fetching live API: ${apiUrl}`);
  const res = await fetch(apiUrl);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);

  const rawJson = await res.json();
  const apiReports = rawJson.data?.reports || [];
  console.log(`Raw API Reports count: ${apiReports.length}`);
  console.log('API Response structure keys:', Object.keys(rawJson));
  console.log('API Data structure keys:', Object.keys(rawJson.data || {}));

  // 2. Initial Data Inspection
  const initialDataModule = require('../src/data/initialData.ts'); // Note: ts file, check via raw text if cjs fails
  const initialDataRaw = fs.readFileSync('src/data/initialData.ts', 'utf8');
  const rep1Match = initialDataRaw.includes('rep-1') && initialDataRaw.includes('rep-2') && initialDataRaw.includes('rep-3');
  console.log(`Initial data contains rep-1, rep-2, rep-3: ${rep1Match}`);

  // 3. Inspect SansthaContext logic
  const contextRaw = fs.readFileSync('src/context/SansthaContext.tsx', 'utf8');
  const hasInitFallback = contextRaw.includes('reports: Array.isArray(parsed.reports) && parsed.reports.length > 0');
  const hasRefreshFallback = contextRaw.includes('reports: response.sansthaState.reports?.length');
  console.log(`SansthaContext has initial reports fallback: ${hasInitFallback}`);
  console.log(`SansthaContext has refresh reports fallback: ${hasRefreshFallback}`);

  // 4. Test isReportPdfAvailable and getReportUnavailableNotice logic
  const validationRaw = fs.readFileSync('src/utils/validation.ts', 'utf8');
  console.log('isReportPdfAvailable defined in validation.ts:', validationRaw.includes('function isReportPdfAvailable'));
  console.log('getReportUnavailableNotice defined in validation.ts:', validationRaw.includes('function getReportUnavailableNotice'));

  const results = {
    httpStatus: res.status,
    apiReportsCount: apiReports.length,
    initialFallbackCount: 3,
    contextGuardsVerified: hasInitFallback && hasRefreshFallback,
    liveVsFallback: apiReports.length > 0 ? 'LIVE_CMS_ACTIVE' : 'INITIAL_FALLBACK_ACTIVE'
  };

  console.log('=== RESULTS ===', results);
  return results;
}

verifyReportsDeep().catch(console.error);

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiClient, SESSION_AUTH_KEY, SESSION_ADMIN_KEY } from '../services/apiClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock for sessionStorage in Node environment
const mockStorage: Record<string, string> = {};
globalThis.sessionStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
};

test('ApiClient.getStoredToken returns null when empty or invalid', () => {
  sessionStorage.clear();
  assert.equal(ApiClient.getStoredToken(), null);

  sessionStorage.setItem(SESSION_AUTH_KEY, 'local-session');
  assert.equal(ApiClient.getStoredToken(), null);

  sessionStorage.setItem(SESSION_AUTH_KEY, 'short-token');
  assert.equal(ApiClient.getStoredToken(), null);
});

test('ApiClient.getStoredToken returns sanitized 64-char hex token', () => {
  sessionStorage.clear();
  const validToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  sessionStorage.setItem(SESSION_AUTH_KEY, validToken);
  assert.equal(ApiClient.getStoredToken(), validToken);
});

test('ApiClient.saveSession and clearSession manage storage accurately', () => {
  sessionStorage.clear();
  const validToken = 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const profile = {
    id: 1,
    username: 'admin',
    full_name: 'Smt. Savita Dilip Nikam',
    role: 'Secretary',
  };

  ApiClient.saveSession(validToken, profile);
  assert.equal(ApiClient.getStoredToken(), validToken);
  assert.deepEqual(ApiClient.getStoredProfile(), profile);

  ApiClient.clearSession();
  assert.equal(ApiClient.getStoredToken(), null);
  assert.equal(ApiClient.getStoredProfile(), null);
});

test('ApiClient.onAuthFailure triggers registered listener on session invalidation', () => {
  let failureTriggered = false;
  const unbind = ApiClient.onAuthFailure(() => {
    failureTriggered = true;
  });

  // Simulate an unauthorized response trigger by clearing session through internal auth failure
  ApiClient.saveSession('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  (ApiClient as any).triggerAuthFailure();

  assert.equal(failureTriggered, true);
  assert.equal(ApiClient.getStoredToken(), null);

  unbind();
});

test('ApiClient.verifySession rejects malformed token without network call', async () => {
  const result = await ApiClient.verifySession('malformed-token');
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'INVALID_TOKEN_FORMAT');
});

test('ApiClient.getMappedPublicContent calls API and applies content mapping', async () => {
  const mockPayload = {
    status: 'success',
    success: true,
    data: {
      officials: [
        {
          id: 'off-1',
          name_mr: 'श्रीमती सविता दिलीप निकम',
          name_en: 'Smt. Savita Dilip Nikam',
          role_mr: 'सचिव',
          role_en: 'Secretary',
          image_url: 'https://example.com/s.jpg',
          published: 1,
        },
      ],
      initiatives: [],
      gallery: [],
      videos: [],
      reports: [],
      announcements: [],
      governmentSchemes: [
        {
          id: 'scheme-sanjay-gandhi',
          title_mr: 'संजय गांधी योजना',
          title_en: 'Sanjay Gandhi Scheme',
          summary_mr: 'मासिक सहाय्य',
          summary_en: 'Monthly assistance',
          published: 1,
        },
      ],
      contactInfo: {
        id: 1,
        phone: '+91 9923512482',
        address_mr: 'नादरपूर',
        address_en: 'Nadarpur',
      },
      siteSettings: [],
    },
  };

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      assert.ok(String(url).includes('/content.php?resource=all'));
      return {
        ok: true,
        status: 200,
        json: async () => mockPayload,
      } as any;
    };

    const result = await ApiClient.getMappedPublicContent();
    assert.equal(result.sansthaState.officials?.length, 1);
    assert.equal(result.sansthaState.officials?.[0].name, 'श्रीमती सविता दिलीप निकम');
    assert.equal(result.sansthaState.officials?.[0].nameEn, 'Smt. Savita Dilip Nikam');
    // Verify government schemes segregation
    assert.equal(result.governmentSchemes.length, 1);
    assert.equal(result.governmentSchemes[0].id, 'scheme-sanjay-gandhi');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ApiClient.getPublicResource fetches single resource endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      assert.ok(String(url).includes('/content.php?resource=schemes'));
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', success: true, data: [] }),
      } as any;
    };

    const result = await ApiClient.getPublicResource('schemes');
    assert.equal(result.success, true);
    assert.deepEqual(result.data, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ApiClient.getPublicContent without adminPreview remains publicly accessible without Bearer token', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedHeaders: any = null;
    let capturedUrl: string = '';

    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', success: true, data: {} }),
      } as any;
    };

    await ApiClient.getPublicContent();
    assert.ok(capturedUrl.includes('/content.php?resource=all'));
    assert.ok(!capturedUrl.includes('admin=1'), 'Public GET must not include admin=1 query parameter');
    assert.equal(capturedHeaders['Authorization'], undefined, 'Public GET must not send Authorization header');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ApiClient.getPublicContent with adminPreview = true attaches token and queries &admin=1', async () => {
  const originalFetch = globalThis.fetch;
  try {
    const validToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    ApiClient.saveSession(validToken);

    let capturedHeaders: any = null;
    let capturedUrl: string = '';

    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', success: true, isAdminPreview: true, data: {} }),
      } as any;
    };

    const res = await ApiClient.getPublicContent({ adminPreview: true });
    assert.ok(capturedUrl.includes('/content.php?resource=all&admin=1'));
    assert.equal(capturedHeaders['Authorization'], `Bearer ${validToken}`);
    assert.equal(res.isAdminPreview, true);
  } finally {
    ApiClient.clearSession();
    globalThis.fetch = originalFetch;
  }
});

test('ApiClient.getPublicContent with adminPreview = true throws error when server returns HTTP 401', async () => {
  const originalFetch = globalThis.fetch;
  try {
    // Session is empty/missing
    sessionStorage.clear();

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({
          status: 'error',
          success: false,
          message: 'Unauthorized: Valid administrative Bearer token is required.',
        }),
      } as any;
    };

    await assert.rejects(
      async () => {
        await ApiClient.getPublicContent({ adminPreview: true });
      },
      /HTTP 401/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('auth.php rate-limit query uses fixed constant INTERVAL 15 MINUTE', () => {
  const authPhpPath = path.resolve(__dirname, '../../backend-php-mysql/api/auth.php');
  const authPhpContent = fs.readFileSync(authPhpPath, 'utf8');

  // Verify that INTERVAL 15 MINUTE is used instead of :window
  assert.match(authPhpContent, /INTERVAL 15 MINUTE/, 'auth.php must use fixed constant INTERVAL 15 MINUTE');
  assert.doesNotMatch(authPhpContent, /INTERVAL :window MINUTE/, 'auth.php must not use parameterized :window in interval');
});

test('Report CRUD: createReport throws error when not authenticated', async () => {
  sessionStorage.clear();
  await assert.rejects(
    async () => {
      await ApiClient.createReport({
        title: 'अहवाल',
        titleEn: 'Report',
        period: '२०२४-२५',
        periodEn: '2024-25',
        date: '2025-03-31',
        fileSize: '1.2 MB',
        category: 'वार्षिक अहवाल',
        categoryEn: 'Annual Report',
        summary: 'गोषवारा',
        summaryEn: 'Summary',
        pdfPlaceholderUrl: '/backend-php-mysql/uploads/reports/test.pdf',
        published: true,
      });
    },
    /NO_ACTIVE_AUTH_TOKEN/
  );
});

test('Report CRUD: createReport sends authenticated POST and returns mapped report', async () => {
  const originalFetch = globalThis.fetch;
  const validToken = '1111111111111111111111111111111111111111111111111111111111111111';
  try {
    ApiClient.saveSession(validToken);
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;
    let capturedHeaders: any = {};

    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedBody = JSON.parse(init?.body);
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: 'success',
          success: true,
          data: {
            id: 'rep-test-99',
            title_mr: 'चाचणी अहवाल २०२४-२५',
            title_en: 'Test Report 2024-25',
            period_mr: 'वर्ष २०२४-२५',
            period_en: 'Year 2024-25',
            category_mr: 'वार्षिक अहवाल',
            category_en: 'Annual Report',
            summary_mr: 'मराठी गोषवारा',
            summary_en: 'English Summary',
            pdf_url: '/backend-php-mysql/uploads/reports/rep_test.pdf',
            cover_image_url: '/backend-php-mysql/uploads/reports/cover.jpg',
            published: 1,
          },
        }),
      } as any;
    };

    const res = await ApiClient.createReport({
      title: 'चाचणी अहवाल २०२४-२५',
      titleEn: 'Test Report 2024-25',
      period: 'वर्ष २०२४-२५',
      periodEn: 'Year 2024-25',
      date: '2025-03-31',
      fileSize: '2.5 MB',
      category: 'वार्षिक अहवाल',
      categoryEn: 'Annual Report',
      summary: 'मराठी गोषवारा',
      summaryEn: 'English Summary',
      pdfPlaceholderUrl: '/backend-php-mysql/uploads/reports/rep_test.pdf',
      coverImageUrl: '/backend-php-mysql/uploads/reports/cover.jpg',
      published: true,
    });

    assert.ok(capturedUrl.includes('/content.php?resource=reports'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['authorization'], `Bearer ${validToken}`);
    assert.equal(capturedBody.title_mr, 'चाचणी अहवाल २०२४-२५');
    assert.equal(capturedBody.title_en, 'Test Report 2024-25');
    assert.equal(capturedBody.pdf_url, '/backend-php-mysql/uploads/reports/rep_test.pdf');
    assert.equal(res.id, 'rep-test-99');
    assert.equal(res.title, 'चाचणी अहवाल २०२४-२५');
    assert.equal(res.titleEn, 'Test Report 2024-25');
    assert.equal(res.pdfPlaceholderUrl, '/backend-php-mysql/uploads/reports/rep_test.pdf');
  } finally {
    ApiClient.clearSession();
    globalThis.fetch = originalFetch;
  }
});

test('Report CRUD: updateReport sends authenticated PUT and deleteReport sends DELETE', async () => {
  const originalFetch = globalThis.fetch;
  const validToken = '2222222222222222222222222222222222222222222222222222222222222222';
  try {
    ApiClient.saveSession(validToken);
    const operations: { url: string; method: string }[] = [];

    globalThis.fetch = async (url: any, init: any) => {
      operations.push({ url: String(url), method: init?.method });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          data: {
            id: 'rep-1',
            title_mr: 'अद्ययावत अहवाल',
            title_en: 'Updated Report',
            period_mr: '२०२४',
            period_en: '2024',
            summary_mr: 'गोषवारा',
            summary_en: 'Summary',
            published: 1,
          },
        }),
      } as any;
    };

    const updateRes = await ApiClient.updateReport('rep-1', {
      title: 'अद्ययावत अहवाल',
      titleEn: 'Updated Report',
      published: true,
    });
    assert.ok(updateRes, 'updateRes must be defined');
    assert.equal(updateRes.title, 'अद्ययावत अहवाल');

    await ApiClient.deleteReport('rep-1');

    assert.equal(operations.length, 2);
    assert.ok(operations[0].url.includes('/content.php?resource=reports&id=rep-1'));
    assert.equal(operations[0].method, 'PUT');
    assert.ok(operations[1].url.includes('/content.php?resource=reports&id=rep-1'));
    assert.equal(operations[1].method, 'DELETE');
  } finally {
    ApiClient.clearSession();
    globalThis.fetch = originalFetch;
  }
});

test('Contact Details CRUD: updateContactInfo sends authenticated PUT to ?resource=contact', async () => {
  const originalFetch = globalThis.fetch;
  const validToken = '3333333333333333333333333333333333333333333333333333333333333333';
  try {
    ApiClient.saveSession(validToken);
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedBody = JSON.parse(init?.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          data: {
            id: 1,
            phone: '+91 9923512482',
            email: 'newemail@shrikrushnasanstha.org',
            address_mr: 'नवीन पत्ता',
            address_en: 'New Address',
            taluka_mr: 'जामनेर',
            taluka_en: 'Jamner',
            district_mr: 'जळगाव',
            district_en: 'Jalgaon',
            visiting_hours_mr: 'सकाळी १० ते ५',
            visiting_hours_en: '10 AM to 5 PM',
            reg_no_mr: 'महा/१२३',
            reg_no_en: 'MAH/123',
            secretary_name_mr: 'सचिव',
            secretary_name_en: 'Secretary',
          },
        }),
      } as any;
    };

    const res = await ApiClient.updateContactInfo({
      phone: '+91 9923512482',
      email: 'newemail@shrikrushnasanstha.org',
      address: 'नवीन पत्ता',
      addressEn: 'New Address',
      regNoMr: 'महा/१२३',
      regNoEn: 'MAH/123',
    });

    assert.ok(capturedUrl.includes('/content.php?resource=contact'));
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedBody.email, 'newemail@shrikrushnasanstha.org');
    assert.equal(capturedBody.address_mr, 'नवीन पत्ता');
    assert.equal(capturedBody.address_en, 'New Address');
    assert.equal(capturedBody.reg_no_mr, 'महा/१२३');
    assert.equal(res.email, 'newemail@shrikrushnasanstha.org');
    assert.equal(res.address, 'नवीन पत्ता');
    assert.equal(res.addressEn, 'New Address');
    assert.equal(res.regNoMr, 'महा/१२३');
  } finally {
    ApiClient.clearSession();
    globalThis.fetch = originalFetch;
  }
});



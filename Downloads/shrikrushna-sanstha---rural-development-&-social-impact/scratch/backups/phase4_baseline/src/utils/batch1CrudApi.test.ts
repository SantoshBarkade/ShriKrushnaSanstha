import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, SESSION_AUTH_KEY } from '../services/apiClient.ts';
import type { AnnouncementItem, GovernmentSchemeItem } from '../types/index.ts';

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

const VALID_TEST_TOKEN = '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff';

// ============================================================
// ANNOUNCEMENTS / NEWS CRUD TESTS
// ============================================================

test('Announcement CRUD: createAnnouncement throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  sessionStorage.clear();

  const item: Omit<AnnouncementItem, 'id'> = {
    title: 'वार्षिक सर्वसाधारण सभा',
    titleEn: 'Annual General Meeting',
    date: '२०२५-०४-१५',
    dateEn: '2025-04-15',
    isUpcoming: true,
    category: 'सामाजिक कल्याण',
    summary: 'संस्थेची वार्षिक सभा पार पडणार आहे.',
    summaryEn: 'Annual general meeting will be conducted.',
    content: 'सविस्तर वृत्तांत लवकरच प्रकाशित होईल.',
    contentEn: 'Full details will be published shortly.',
    coverImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75',
    images: [],
    published: true,
  };

  await assert.rejects(
    async () => {
      await ApiClient.createAnnouncement(item);
    },
    (err: any) => {
      assert.equal(err.message, 'NO_ACTIVE_AUTH_TOKEN');
      return true;
    }
  );
});

test('Announcement CRUD: createAnnouncement sends authenticated POST with correct payload and returns mapped item', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
      capturedBody = JSON.parse(init?.body || '{}');

      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'सूचना यशस्वीरित्या जोडली.',
          data: {
            id: capturedBody.id || 'ann-mock-123',
            title_mr: capturedBody.title_mr,
            title_en: capturedBody.title_en,
            summary_mr: capturedBody.summary_mr,
            summary_en: capturedBody.summary_en,
            content_mr: capturedBody.content_mr,
            content_en: capturedBody.content_en,
            category: capturedBody.category,
            event_date: capturedBody.event_date,
            is_upcoming: capturedBody.is_upcoming,
            cover_image_url: capturedBody.cover_image_url,
            images_json: capturedBody.images_json,
            published: capturedBody.published,
          },
        }),
      } as any;
    };

    const item: Omit<AnnouncementItem, 'id'> = {
      title: 'नादरपूर आरोग्य शिबीर',
      titleEn: 'Nadarpur Health Camp',
      date: '२०२५-०५-१०',
      dateEn: '2025-05-10',
      isUpcoming: true,
      category: 'आरोग्यविषयक उपक्रम',
      summary: 'मोफत आरोग्य तपासणी शिबीर.',
      summaryEn: 'Free health checkup camp.',
      content: 'तज्ज्ञ डॉक्टरांकडून तपासणी करण्यात येईल.',
      contentEn: 'Checkups by specialist doctors.',
      coverImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75',
      images: ['https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75'],
      published: true,
    };

    const result = await ApiClient.createAnnouncement(item);

    assert.ok(capturedUrl.includes('/api/content.php?resource=announcements'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'नादरपूर आरोग्य शिबीर');
    assert.equal(capturedBody.title_en, 'Nadarpur Health Camp');
    assert.equal(capturedBody.is_upcoming, 1);
    assert.equal(capturedBody.published, 1);

    assert.equal(result.title, 'नादरपूर आरोग्य शिबीर');
    assert.equal(result.titleEn, 'Nadarpur Health Camp');
    assert.equal(result.isUpcoming, true);
    assert.equal(result.published, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Announcement CRUD: updateAnnouncement sends authenticated PUT with partial payload and merges successfully', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
      capturedBody = JSON.parse(init?.body || '{}');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'सूचना अद्ययावत केली.',
          data: {
            id: 'ann-123',
            title_mr: 'अद्ययावत शीर्षक',
            title_en: 'Existing English Title',
            summary_mr: 'अद्ययावत सारांश',
            summary_en: 'Existing English Summary',
            category: 'शिक्षण',
            event_date: '२०२५-०४-१५',
            is_upcoming: 0,
            published: 0,
          },
        }),
      } as any;
    };

    const result = await ApiClient.updateAnnouncement('ann-123', {
      title: 'अद्ययावत शीर्षक',
      summary: 'अद्ययावत सारांश',
      isUpcoming: false,
      published: false,
    });

    assert.ok(capturedUrl.includes('/api/content.php?resource=announcements&id=ann-123'));
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'अद्ययावत शीर्षक');
    assert.equal(capturedBody.is_upcoming, 0);
    assert.equal(capturedBody.published, 0);

    assert.equal(result.title, 'अद्ययावत शीर्षक');
    assert.equal(result.titleEn, 'Existing English Title');
    assert.equal(result.isUpcoming, false);
    assert.equal(result.published, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Announcement CRUD: deleteAnnouncement sends authenticated DELETE request with id', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};

      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'सूचना हटवली.',
          data: { id: 'ann-to-delete' },
        }),
      } as any;
    };

    const result = await ApiClient.deleteAnnouncement('ann-to-delete');

    assert.ok(capturedUrl.includes('/api/content.php?resource=announcements&id=ann-to-delete'));
    assert.equal(capturedMethod, 'DELETE');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(result, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================
// GOVERNMENT WELFARE SCHEMES CRUD TESTS
// ============================================================

test('Scheme CRUD: createScheme throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  sessionStorage.clear();

  const item: Omit<GovernmentSchemeItem, 'id'> = {
    title: 'संजय गांधी निराधार अनुदान योजना',
    titleEn: 'Sanjay Gandhi Niradhar Scheme',
    department: 'सामाजिक न्याय विभाग',
    departmentEn: 'Social Justice Dept',
    beneficiaryCategory: 'निराधार व्यक्ती',
    beneficiaryCategoryEn: 'Destitute Persons',
    summary: 'निराधार व्यक्तींना दरमहा आर्थिक सहाय्य.',
    summaryEn: 'Monthly financial assistance to destitute.',
    officialPortalUrl: 'https://sjsa.maharashtra.gov.in',
    published: true,
    featured: true,
  };

  await assert.rejects(
    async () => {
      await ApiClient.createScheme(item);
    },
    (err: any) => {
      assert.equal(err.message, 'NO_ACTIVE_AUTH_TOKEN');
      return true;
    }
  );
});

test('Scheme CRUD: createScheme sends authenticated POST with correct payload and returns mapped item', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
      capturedBody = JSON.parse(init?.body || '{}');

      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'शासकीय योजना यशस्वीरित्या जोडली.',
          data: {
            id: capturedBody.id || 'scheme-mock-1',
            title_mr: capturedBody.title_mr,
            title_en: capturedBody.title_en,
            department_mr: capturedBody.department_mr,
            department_en: capturedBody.department_en,
            beneficiary_category_mr: capturedBody.beneficiary_category_mr,
            beneficiary_category_en: capturedBody.beneficiary_category_en,
            summary_mr: capturedBody.summary_mr,
            summary_en: capturedBody.summary_en,
            official_portal_url: capturedBody.official_portal_url,
            cover_image_url: capturedBody.cover_image_url,
            published: capturedBody.published,
            featured: capturedBody.featured,
          },
        }),
      } as any;
    };

    const item: Omit<GovernmentSchemeItem, 'id'> = {
      title: 'ई-श्रम योजना',
      titleEn: 'e-Shram Yojana',
      department: 'कामगार विभाग',
      departmentEn: 'Labor Department',
      beneficiaryCategory: 'असंघटित कामगार',
      beneficiaryCategoryEn: 'Unorganized Workers',
      summary: 'असंघटित कामगारांची नोंदणी व लाभ.',
      summaryEn: 'Registration of unorganized workers.',
      officialPortalUrl: 'https://eshram.gov.in',
      coverImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75',
      published: true,
      featured: true,
    };

    const result = await ApiClient.createScheme(item);

    assert.ok(capturedUrl.includes('/api/content.php?resource=government_schemes'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'ई-श्रम योजना');
    assert.equal(capturedBody.title_en, 'e-Shram Yojana');
    assert.equal(capturedBody.official_portal_url, 'https://eshram.gov.in');
    assert.equal(capturedBody.published, 1);
    assert.equal(capturedBody.featured, 1);

    assert.equal(result.title, 'ई-श्रम योजना');
    assert.equal(result.titleEn, 'e-Shram Yojana');
    assert.equal(result.officialPortalUrl, 'https://eshram.gov.in');
    assert.equal(result.published, true);
    assert.equal(result.featured, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Scheme CRUD: updateScheme sends authenticated PUT with partial payload and merges successfully', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
      capturedBody = JSON.parse(init?.body || '{}');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'शासकीय योजना अद्ययावत केली.',
          data: {
            id: 'scheme-eshram',
            title_mr: 'अद्ययावत योजना शीर्षक',
            title_en: 'Existing English Scheme Title',
            summary_mr: 'अद्ययावत योजना सारांश',
            summary_en: 'Existing English Scheme Summary',
            published: 0,
            featured: 0,
          },
        }),
      } as any;
    };

    const result = await ApiClient.updateScheme('scheme-eshram', {
      title: 'अद्ययावत योजना शीर्षक',
      published: false,
      featured: false,
    });

    assert.ok(capturedUrl.includes('/api/content.php?resource=government_schemes&id=scheme-eshram'));
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'अद्ययावत योजना शीर्षक');
    assert.equal(capturedBody.published, 0);
    assert.equal(capturedBody.featured, 0);

    assert.equal(result.title, 'अद्ययावत योजना शीर्षक');
    assert.equal(result.titleEn, 'Existing English Scheme Title');
    assert.equal(result.published, false);
    assert.equal(result.featured, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Scheme CRUD: deleteScheme sends authenticated DELETE request with id', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedHeaders = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};

      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          success: true,
          message: 'शासकीय योजना हटवली.',
          data: { id: 'scheme-to-delete' },
        }),
      } as any;
    };

    const result = await ApiClient.deleteScheme('scheme-to-delete');

    assert.ok(capturedUrl.includes('/api/content.php?resource=government_schemes&id=scheme-to-delete'));
    assert.equal(capturedMethod, 'DELETE');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(result, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

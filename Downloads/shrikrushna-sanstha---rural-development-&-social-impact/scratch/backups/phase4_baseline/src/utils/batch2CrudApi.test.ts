import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, SESSION_AUTH_KEY } from '../services/apiClient.ts';
import type { InitiativeItem, CategoryKey } from '../types/index.ts';

// In-memory mock for sessionStorage in Node environment
const mockStorage: Record<string, string> = {};
globalThis.sessionStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
};

const VALID_TOKEN = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

test('Initiative CRUD: createInitiative throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  ApiClient.clearSession();
  await assert.rejects(
    async () => {
      await ApiClient.createInitiative({
        title: 'चाचणी उपक्रम',
        titleEn: 'Test Initiative',
        category: 'शिक्षण' as CategoryKey,
        date: '2025-05-10',
        summary: 'संक्षिप्त माहिती',
        summaryEn: 'Short summary',
        description: 'सविस्तर माहिती',
        descriptionEn: 'Full description',
        imageUrl: 'https://images.unsplash.com/photo-test?w=800',
        isGovernmentSchemeAwareness: false,
        published: true,
        featured: false,
        tags: ['शिक्षण'],
      });
    },
    (err: any) => {
      assert.match(err.message, /NO_ACTIVE_AUTH_TOKEN/);
      return true;
    }
  );
});

test('Initiative CRUD: createInitiative sends authenticated POST with correct payload and returns mapped item', async () => {
  ApiClient.saveSession(VALID_TOKEN, {
    id: 1,
    username: 'admin',
    role: 'superadmin',
    full_name: 'Sanstha Administrator',
  });

  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedHeaders: any = {};
  let interceptedBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedHeaders = init?.headers;
    interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;

    return new Response(
      JSON.stringify({
        status: 'success',
        success: true,
        message: 'Initiative created successfully',
        data: {
          id: interceptedBody.id,
          title_mr: interceptedBody.title_mr,
          title_en: interceptedBody.title_en,
          category: interceptedBody.category,
          activity_date: interceptedBody.activity_date,
          location_mr: interceptedBody.location_mr,
          location_en: interceptedBody.location_en,
          summary_mr: interceptedBody.summary_mr,
          summary_en: interceptedBody.summary_en,
          description_mr: interceptedBody.description_mr,
          description_en: interceptedBody.description_en,
          image_url: interceptedBody.image_url,
          is_govt_scheme: interceptedBody.is_govt_scheme,
          published: interceptedBody.published,
          featured: interceptedBody.featured,
          related_report_id: interceptedBody.related_report_id,
          tags: interceptedBody.tags,
          photos: interceptedBody.photos || [],
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const newItem = await ApiClient.createInitiative({
      title: 'आरोग्य शिबीर',
      titleEn: 'Health Camp',
      category: 'आरोग्यविषयक उपक्रम' as CategoryKey,
      date: '2025-06-15',
      location: 'नादरपूर',
      locationEn: 'Nadarpur',
      summary: 'मोफत आरोग्य तपासणी',
      summaryEn: 'Free health checkup camp',
      description: 'सर्व ग्रामस्थांसाठी मोफत तपासणी',
      descriptionEn: 'Free health checkup for all villagers',
      imageUrl: 'https://images.unsplash.com/photo-health?w=800',
      images: [
        'https://images.unsplash.com/photo-health-2?w=800',
        'https://images.unsplash.com/photo-health-3?w=800',
      ],
      isGovernmentSchemeAwareness: false,
      published: true,
      featured: true,
      relatedReportId: 'rep-2024-25',
      tags: ['आरोग्यविषयक उपक्रम'],
    });

    assert.ok(interceptedUrl.includes('/content.php?resource=initiatives'));
    assert.equal(interceptedMethod, 'POST');
    assert.equal(interceptedHeaders.get('Authorization'), `Bearer ${VALID_TOKEN}`);
    assert.equal(interceptedBody.title_mr, 'आरोग्य शिबीर');
    assert.equal(interceptedBody.title_en, 'Health Camp');
    assert.equal(interceptedBody.related_report_id, 'rep-2024-25');
    assert.equal(interceptedBody.photos.length, 2);

    assert.equal(newItem.title, 'आरोग्य शिबीर');
    assert.equal(newItem.titleEn, 'Health Camp');
    assert.equal(newItem.relatedReportId, 'rep-2024-25');
    assert.equal(newItem.images?.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    ApiClient.clearSession();
  }
});

test('Initiative CRUD: updateInitiative sends authenticated PUT with partial payload and merges successfully', async () => {
  ApiClient.saveSession(VALID_TOKEN, {
    id: 1,
    username: 'admin',
    role: 'superadmin',
    full_name: 'Sanstha Administrator',
  });

  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;

    return new Response(
      JSON.stringify({
        status: 'success',
        success: true,
        message: 'Initiative updated successfully',
        data: {
          id: 'init-1',
          title_mr: interceptedBody.title_mr || 'मूळ नाव',
          title_en: interceptedBody.title_en || 'Original Name',
          category: 'शिक्षण',
          activity_date: '2025-01-01',
          summary_mr: 'सारांश',
          summary_en: 'Summary',
          description_mr: 'वर्णन',
          description_en: 'Description',
          image_url: 'https://images.unsplash.com/cover',
          published: interceptedBody.published !== undefined ? interceptedBody.published : 1,
          featured: 0,
          photos: [],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const updated = await ApiClient.updateInitiative('init-1', {
      titleEn: 'Updated English Title Only',
      published: false,
    });

    assert.ok(interceptedUrl.includes('/content.php?resource=initiatives&id=init-1'));
    assert.equal(interceptedMethod, 'PUT');
    assert.equal(interceptedBody.title_en, 'Updated English Title Only');
    assert.equal(interceptedBody.published, 0);
    assert.equal(updated.titleEn, 'Updated English Title Only');
    assert.equal(updated.published, false);
  } finally {
    globalThis.fetch = originalFetch;
    ApiClient.clearSession();
  }
});

test('Initiative CRUD: deleteInitiative sends authenticated DELETE request with id', async () => {
  ApiClient.saveSession(VALID_TOKEN, {
    id: 1,
    username: 'admin',
    role: 'superadmin',
    full_name: 'Sanstha Administrator',
  });

  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';

    return new Response(
      JSON.stringify({
        status: 'success',
        success: true,
        message: 'Initiative deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const success = await ApiClient.deleteInitiative('init-to-delete');
    assert.ok(interceptedUrl.includes('/content.php?resource=initiatives&id=init-to-delete'));
    assert.equal(interceptedMethod, 'DELETE');
    assert.equal(success, true);
  } finally {
    globalThis.fetch = originalFetch;
    ApiClient.clearSession();
  }
});

test('Events CRUD: createEvent throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  ApiClient.clearSession();
  await assert.rejects(
    async () => {
      await ApiClient.createEvent({
        title_mr: 'वार्षिक स्नेहसंमेलन',
        title_en: 'Annual Gathering',
        category: 'सामाजिक कल्याण',
        start_date: '2025-11-20',
        venue_mr: 'नादरपूर',
        summary_mr: 'वार्षिक स्नेहसंमेलन कार्यक्रम',
        status: 'upcoming',
        published: 1,
      });
    },
    (err: any) => {
      assert.match(err.message, /NO_ACTIVE_AUTH_TOKEN/);
      return true;
    }
  );
});

test('Events CRUD: createEvent sends authenticated POST with correct payload and returns event', async () => {
  ApiClient.saveSession(VALID_TOKEN, {
    id: 1,
    username: 'admin',
    role: 'superadmin',
    full_name: 'Sanstha Administrator',
  });

  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedHeaders: any = {};
  let interceptedBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedHeaders = init?.headers;
    interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;

    return new Response(
      JSON.stringify({
        status: 'success',
        success: true,
        message: 'Event created successfully',
        data: {
          ...interceptedBody,
          photos: interceptedBody.photos || [],
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const created = await ApiClient.createEvent({
      title_mr: 'महिला मेळावा',
      title_en: 'Women Empowerment Meet',
      category: 'महिला व ज्येष्ठ नागरिक सहाय्य',
      start_date: '2025-12-05',
      end_date: '2025-12-05',
      venue_mr: 'ग्रामपंचायत प्रांगण, नादरपूर',
      venue_en: 'Gram Panchayat Ground, Nadarpur',
      summary_mr: 'महिला बचत गट व शासकीय योजना मार्गदर्शन',
      summary_en: 'Women SHG and government welfare guidance',
      status: 'upcoming',
      cover_image_url: 'https://images.unsplash.com/event-cover?w=800',
      photos: ['https://images.unsplash.com/event-p1?w=800'],
      published: 1,
      is_featured: 1,
    });

    assert.ok(interceptedUrl.includes('/content.php?resource=events'));
    assert.equal(interceptedMethod, 'POST');
    assert.equal(interceptedHeaders.get('Authorization'), `Bearer ${VALID_TOKEN}`);
    assert.equal(interceptedBody.title_mr, 'महिला मेळावा');
    assert.equal(interceptedBody.status, 'upcoming');
    assert.equal(created.title_en, 'Women Empowerment Meet');
    assert.equal(created.photos?.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    ApiClient.clearSession();
  }
});

test('Events CRUD: updateEvent sends authenticated PUT and deleteEvent sends authenticated DELETE', async () => {
  ApiClient.saveSession(VALID_TOKEN, {
    id: 1,
    username: 'admin',
    role: 'superadmin',
    full_name: 'Sanstha Administrator',
  });

  const originalFetch = globalThis.fetch;
  let putUrl = '';
  let putBody: any = null;
  let deleteUrl = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || 'GET';

    if (method === 'PUT') {
      putUrl = url;
      putBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'Event updated successfully',
          data: { id: 'evt-1', ...putBody },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      deleteUrl = url;
      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'Event deleted successfully',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('{}', { status: 200 });
  };

  try {
    const updated = await ApiClient.updateEvent('evt-1', {
      status: 'completed',
      published: 1,
    });
    assert.ok(putUrl.includes('/content.php?resource=events&id=evt-1'));
    assert.equal(putBody.status, 'completed');
    assert.equal(updated.status, 'completed');

    const deleted = await ApiClient.deleteEvent('evt-1');
    assert.ok(deleteUrl.includes('/content.php?resource=events&id=evt-1'));
    assert.equal(deleted, true);
  } finally {
    globalThis.fetch = originalFetch;
    ApiClient.clearSession();
  }
});

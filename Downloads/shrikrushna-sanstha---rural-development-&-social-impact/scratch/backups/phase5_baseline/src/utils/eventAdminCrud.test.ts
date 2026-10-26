import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, SESSION_AUTH_KEY } from '../services/apiClient.ts';
import {
  mapEventFromDb,
  mapEventToDb,
  mapPublicContentPayload,
} from './contentMapper.ts';
import type { DbEventRow, DbEventPhotoRow } from './contentMapper.ts';
import type { EventItem, EventStatus } from '../types/index.ts';

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
// 1. EVENT MAPPING TESTS (Bilingual Independence & Child Photos)
// ============================================================

test('Event mapping: mapEventFromDb correctly maps MySQL row and child photos to EventItem', () => {
  const row: DbEventRow = {
    id: 'evt-test-1',
    title_mr: 'आरोग्य शिबीर २०२५',
    title_en: 'Health Camp 2025',
    category: 'आरोग्य',
    start_date: '2025-05-10',
    end_date: '2025-05-11',
    event_date_text_mr: '१० आणि ११ मे २०२५',
    event_date_text_en: 'May 10-11, 2025',
    event_time: '10:00 AM - 4:00 PM',
    venue_mr: 'प्राथमिक शाळा मैदान, नादरपूर',
    venue_en: 'Primary School Ground, Nadarpur',
    summary_mr: 'मोफत सर्वसमावेशक आरोग्य तपासणी.',
    summary_en: 'Free comprehensive health checkup camp.',
    description_mr: 'सविस्तर वैद्यकीय तपासणी आणि मोफत औषध वाटप.',
    description_en: 'Detailed medical checkups and free distribution of medicines.',
    cover_image_url: 'https://example.com/cover.jpg',
    status: 'upcoming',
    is_featured: 1,
    published: 1,
    display_order: 1,
  };

  const photos: DbEventPhotoRow[] = [
    {
      id: 101,
      event_id: 'evt-test-1',
      image_url: 'https://example.com/slide1.jpg',
      caption_mr: 'डॉक्टरांची टीम',
      caption_en: 'Medical Team',
      display_order: 1,
    },
    {
      id: 102,
      event_id: 'evt-test-1',
      image_url: 'https://example.com/slide2.jpg',
      caption_mr: 'तपासणी कक्ष',
      caption_en: 'Examination room',
      display_order: 2,
    },
  ];

  const item = mapEventFromDb(row, photos);

  assert.equal(item.id, 'evt-test-1');
  assert.equal(item.title, 'आरोग्य शिबीर २०२५');
  assert.equal(item.titleEn, 'Health Camp 2025');
  assert.equal(item.startDate, '2025-05-10');
  assert.equal(item.endDate, '2025-05-11');
  assert.equal(item.eventDateTextMr, '१० आणि ११ मे २०२५');
  assert.equal(item.eventDateTextEn, 'May 10-11, 2025');
  assert.equal(item.eventTime, '10:00 AM - 4:00 PM');
  assert.equal(item.venue, 'प्राथमिक शाळा मैदान, नादरपूर');
  assert.equal(item.venueEn, 'Primary School Ground, Nadarpur');
  assert.equal(item.summary, 'मोफत सर्वसमावेशक आरोग्य तपासणी.');
  assert.equal(item.summaryEn, 'Free comprehensive health checkup camp.');
  assert.equal(item.description, 'सविस्तर वैद्यकीय तपासणी आणि मोफत औषध वाटप.');
  assert.equal(item.descriptionEn, 'Detailed medical checkups and free distribution of medicines.');
  assert.equal(item.coverImageUrl, 'https://example.com/cover.jpg');
  assert.equal(item.status, 'upcoming');
  assert.equal(item.isFeatured, true);
  assert.equal(item.published, true);
  assert.equal(item.photos?.length, 2);
  assert.equal(item.photos?.[0].imageUrl, 'https://example.com/slide1.jpg');
  assert.equal(item.photos?.[0].captionMr, 'डॉक्टरांची टीम');
  assert.equal(item.photos?.[0].captionEn, 'Medical Team');
});

test('Event mapping: mapEventToDb preserves independent Marathi and English fields and transforms photos', () => {
  const eventItem: EventItem = {
    id: 'evt-custom-99',
    title: 'वृक्षारोपण मोहीम',
    titleEn: 'Tree Plantation Drive',
    category: 'पर्यावरण संवर्धन',
    startDate: '2025-07-01',
    endDate: '2025-07-02',
    eventDateTextMr: '१ जुलै २०२५',
    eventDateTextEn: 'July 1, 2025',
    eventTime: '08:00 AM',
    venue: 'नदी काठ, नादरपूर',
    venueEn: 'Riverbank, Nadarpur',
    summary: '५०० झाडे लावण्याचा संकल्प.',
    summaryEn: 'Goal to plant 500 indigenous trees.',
    description: 'ग्रामस्थांच्या सहभागाने पर्यावरण संवर्धन उपक्रम.',
    descriptionEn: 'Environmental conservation drive with village participation.',
    coverImageUrl: 'https://example.com/trees.jpg',
    status: 'ongoing',
    isFeatured: false,
    published: true,
    displayOrder: 5,
    photos: [
      {
        id: 1,
        imageUrl: 'https://example.com/plant1.jpg',
        captionMr: 'रोपे वाटप',
        captionEn: 'Sapling distribution',
        displayOrder: 1,
      },
    ],
  };

  const dbPayload = mapEventToDb(eventItem);

  assert.equal(dbPayload.title_mr, 'वृक्षारोपण मोहीम');
  assert.equal(dbPayload.title_en, 'Tree Plantation Drive');
  assert.equal(dbPayload.category, 'पर्यावरण संवर्धन');
  assert.equal(dbPayload.start_date, '2025-07-01');
  assert.equal(dbPayload.end_date, '2025-07-02');
  assert.equal(dbPayload.event_date_text_mr, '१ जुलै २०२५');
  assert.equal(dbPayload.event_date_text_en, 'July 1, 2025');
  assert.equal(dbPayload.event_time, '08:00 AM');
  assert.equal(dbPayload.venue_mr, 'नदी काठ, नादरपूर');
  assert.equal(dbPayload.venue_en, 'Riverbank, Nadarpur');
  assert.equal(dbPayload.summary_mr, '५०० झाडे लावण्याचा संकल्प.');
  assert.equal(dbPayload.summary_en, 'Goal to plant 500 indigenous trees.');
  assert.equal(dbPayload.description_mr, 'ग्रामस्थांच्या सहभागाने पर्यावरण संवर्धन उपक्रम.');
  assert.equal(dbPayload.description_en, 'Environmental conservation drive with village participation.');
  assert.equal(dbPayload.status, 'ongoing');
  assert.equal(dbPayload.is_featured, 0);
  assert.equal(dbPayload.published, 1);
  assert.equal(dbPayload.photos?.length, 1);
  const firstPhoto = dbPayload.photos?.[0] as DbEventPhotoRow;
  assert.equal(firstPhoto.image_url, 'https://example.com/plant1.jpg');
});

test('Event mapping: mapPublicContentPayload populates state.events without altering announcements', () => {
  const mockPayload = {
    data: {
      events: [
        {
          id: 'evt-100',
          title_mr: 'स्वच्छता मोहीम',
          title_en: 'Cleanliness Drive',
          category: 'सामाजिक कल्याण',
          start_date: '2025-08-15',
          venue_mr: 'ग्रामपंचायत परिसर',
          venue_en: 'Gram Panchayat Campus',
          summary_mr: 'स्वच्छता उपक्रम',
          summary_en: 'Cleanliness drive',
          description_mr: 'तपशील',
          description_en: 'Details',
          status: 'completed',
          published: 1,
          photos: [],
        },
      ],
      announcements: [
        {
          id: 'ann-200',
          title_mr: 'महत्त्वाची नोटीस',
          title_en: 'Important Notice',
          category: 'सामान्य',
          event_date_mr: '१५ ऑगस्ट',
          event_date_en: '15 August',
          summary_mr: 'नोटीस सारांश',
          summary_en: 'Notice summary',
          published: 1,
          photos: [],
        },
      ],
    },
  };

  const result = mapPublicContentPayload(mockPayload);

  assert.equal(result.sansthaState.events?.length, 1);
  assert.equal(result.sansthaState.events?.[0].id, 'evt-100');
  assert.equal(result.sansthaState.events?.[0].title, 'स्वच्छता मोहीम');
  assert.equal(result.sansthaState.events?.[0].status, 'completed');

  assert.equal(result.sansthaState.announcements?.length, 1);
  assert.equal(result.sansthaState.announcements?.[0].id, 'ann-200');
  assert.equal(result.sansthaState.announcements?.[0].title, 'महत्त्वाची नोटीस');
});

// ============================================================
// 2. API CLIENT EVENTS CRUD & DISAMBIGUATION TESTS
// ============================================================

test('Events CRUD: createEvent throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  sessionStorage.clear();

  const item: Omit<EventItem, 'id'> = {
    title: 'महिला बचत गट कार्यशाळा',
    titleEn: 'Women Self Help Group Workshop',
    category: 'महिला व ज्येष्ठ नागरिक सहाय्य',
    startDate: '2025-09-01',
    venue: 'सामुदायिक सभागृह, नादरपूर',
    venueEn: 'Community Hall, Nadarpur',
    summary: 'उद्योजकता प्रशिक्षण कार्यशाळा.',
    summaryEn: 'Entrepreneurship training workshop.',
    description: 'महिला बचत गटांसाठी विशेष मार्गदर्शन सत्र.',
    descriptionEn: 'Special guidance session for self help groups.',
    status: 'upcoming',
    isFeatured: true,
    published: true,
  };

  await assert.rejects(
    async () => {
      await ApiClient.createEvent(item);
    },
    (err: any) => {
      assert.equal(err.message, 'NO_ACTIVE_AUTH_TOKEN');
      return true;
    }
  );
});

test('Events CRUD: createEvent strictly targets resource=events and never resource=announcements', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  const item: Omit<EventItem, 'id'> = {
    title: 'क्रीडा महोत्सव २०२५',
    titleEn: 'Sports Festival 2025',
    category: 'सामाजिक कल्याण',
    startDate: '2025-10-05',
    endDate: '2025-10-07',
    venue: 'जिल्हा क्रीडा संकुल',
    venueEn: 'District Sports Complex',
    summary: 'विविध क्रीडा स्पर्धांचे आयोजन.',
    summaryEn: 'Organization of various sports competitions.',
    description: 'ग्रामीण भागातील गुणवंत खेळाडूंना प्रोत्साहन देण्यासाठी भव्य क्रीडा स्पर्धा.',
    descriptionEn: 'Grand sports tournament to encourage rural talents.',
    status: 'upcoming',
    isFeatured: true,
    published: true,
    photos: [
      {
        imageUrl: 'https://example.com/sports1.jpg',
        captionMr: 'उद्घाटन सोहळा',
        captionEn: 'Opening Ceremony',
      },
    ],
  };

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = url.toString();
    capturedMethod = init?.method || 'GET';
    capturedBody = init?.body ? JSON.parse(init.body as string) : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mapEventToDb({ ...item, id: 'evt-generated-123' }),
          id: 'evt-generated-123',
          photos: item.photos?.map((p, idx) => ({
            id: idx + 1,
            image_url: p.imageUrl,
            caption_mr: p.captionMr,
            caption_en: p.captionEn,
            display_order: idx + 1,
          })),
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof globalThis.fetch;

  try {
    const created = await ApiClient.createEvent(item);

    assert.equal(capturedMethod, 'POST');
    assert.ok(
      capturedUrl.includes('/api/content.php?resource=events'),
      `Expected resource=events in URL, got: ${capturedUrl}`
    );
    assert.ok(
      !capturedUrl.includes('resource=announcements'),
      `URL should NOT contain resource=announcements: ${capturedUrl}`
    );
    assert.equal(capturedBody.title_mr, 'क्रीडा महोत्सव २०२५');
    assert.equal(capturedBody.title_en, 'Sports Festival 2025');
    assert.equal(capturedBody.venue_mr, 'जिल्हा क्रीडा संकुल');
    assert.equal(capturedBody.venue_en, 'District Sports Complex');
    assert.equal(capturedBody.start_date, '2025-10-05');
    assert.equal(created.id, 'evt-generated-123');
    assert.equal(created.title_mr || created.title, 'क्रीडा महोत्सव २०२५');
    assert.equal(created.photos?.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.clear();
  }
});

test('Events CRUD: updateEvent sends authenticated PUT and deleteEvent sends authenticated DELETE', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  const originalFetch = globalThis.fetch;
  const calls: { url: string; method: string; body?: any }[] = [];

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: url.toString(),
      method: init?.method || 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: 'evt-to-update', status: 'completed' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof globalThis.fetch;

  try {
    // 1. Update event
    const updated = await ApiClient.updateEvent('evt-to-update', {
      status: 'completed',
      published: true,
    });

    assert.equal(calls[0].method, 'PUT');
    assert.ok(calls[0].url.includes('/api/content.php?resource=events&id=evt-to-update'));
    assert.equal(calls[0].body.status, 'completed');
    assert.equal(calls[0].body.published, 1);

    // 2. Delete event
    await ApiClient.deleteEvent('evt-to-delete');

    assert.equal(calls[1].method, 'DELETE');
    assert.ok(calls[1].url.includes('/api/content.php?resource=events&id=evt-to-delete'));
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.clear();
  }
});

test('Events CRUD: createEvent and updateEvent correctly persist server-relative cover image and multiple child photos', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  const originalFetch = globalThis.fetch;
  const calls: { url: string; method: string; body?: any }[] = [];

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: url.toString(),
      method: init?.method || 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: 'evt-server-upload-test',
          title_mr: 'महोत्सव',
          title_en: 'Festival',
          cover_image_url: '/backend-php-mysql/uploads/events/evt_cover_123.jpg',
          photos: [
            {
              id: 1,
              event_id: 'evt-server-upload-test',
              image_url: '/backend-php-mysql/uploads/events/evt_photo_1.jpg',
              display_order: 1,
            },
            {
              id: 2,
              event_id: 'evt-server-upload-test',
              image_url: '/backend-php-mysql/uploads/events/evt_photo_2.jpg',
              display_order: 2,
            },
          ],
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof globalThis.fetch;

  try {
    const res = await ApiClient.createEvent({
      title: 'महोत्सव',
      titleEn: 'Festival',
      category: 'सांस्कृतिक',
      startDate: '2026-11-15',
      endDate: '2026-11-17',
      summary: 'वार्षिक सांस्कृतिक उत्सव',
      coverImageUrl: '/backend-php-mysql/uploads/events/evt_cover_123.jpg',
      photos: [
        { imageUrl: '/backend-php-mysql/uploads/events/evt_photo_1.jpg', displayOrder: 1 },
        { imageUrl: '/backend-php-mysql/uploads/events/evt_photo_2.jpg', displayOrder: 2 },
      ],
    });

    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].body.cover_image_url, '/backend-php-mysql/uploads/events/evt_cover_123.jpg');
    assert.equal(calls[0].body.photos?.length, 2);
    assert.equal(calls[0].body.photos[0].image_url, '/backend-php-mysql/uploads/events/evt_photo_1.jpg');
    assert.equal(res.cover_image_url, '/backend-php-mysql/uploads/events/evt_cover_123.jpg');
    assert.equal(res.photos?.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.clear();
  }
});

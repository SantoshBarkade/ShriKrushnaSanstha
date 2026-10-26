import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, SESSION_AUTH_KEY } from '../services/apiClient.ts';
import type { VideoItem } from '../types/index.ts';

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

test('Video CRUD: createVideo throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  sessionStorage.clear();

  const newVideo: Omit<VideoItem, 'id'> = {
    title: 'नवीन चाचणी व्हिडिओ',
    titleEn: 'New Test Video',
    description: 'चाचणी माहिती',
    descriptionEn: 'Test description',
    category: 'शिक्षण',
    durationSeconds: 180,
    durationFormatted: '०३:००',
    durationFormattedEn: '03:00',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75',
    date: '2025-01-20',
    published: true,
    featured: false,
  };

  await assert.rejects(
    async () => {
      await ApiClient.createVideo(newVideo);
    },
    (err: any) => {
      assert.equal(err.message, 'NO_ACTIVE_AUTH_TOKEN');
      return true;
    }
  );
});

test('Video CRUD: createVideo sends authenticated POST with correct payload and returns mapped item', async () => {
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
          message: 'व्हिडिओ यशस्वीरित्या जतन केला.',
          data: {
            id: capturedBody.id || 'vid-mock-123',
            title_mr: capturedBody.title_mr,
            title_en: capturedBody.title_en,
            description_mr: capturedBody.description_mr,
            description_en: capturedBody.description_en,
            category: capturedBody.category,
            duration_seconds: capturedBody.duration_seconds,
            duration_formatted: capturedBody.duration_formatted,
            duration_formatted_en: capturedBody.duration_formatted_en,
            thumbnail_url: capturedBody.thumbnail_url,
            video_url: capturedBody.video_url,
            publish_date: capturedBody.publish_date,
            published: capturedBody.published,
            featured: capturedBody.featured,
          },
        }),
      } as any;
    };

    const newVideo: Omit<VideoItem, 'id'> = {
      title: 'नादरपूर उपक्रम',
      titleEn: 'Nadarpur Initiative Video',
      description: 'सविस्तर माहिती',
      descriptionEn: 'Detailed description',
      category: 'शिक्षण',
      durationSeconds: 200,
      durationFormatted: '०३:२०',
      durationFormattedEn: '03:20',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75',
      date: '2025-02-01',
      published: true,
      featured: true,
    };

    const created = await ApiClient.createVideo(newVideo);

    assert.ok(capturedUrl.includes('/content.php?resource=videos'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'नादरपूर उपक्रम');
    assert.equal(capturedBody.title_en, 'Nadarpur Initiative Video');
    assert.equal(capturedBody.published, 1);
    assert.equal(capturedBody.featured, 1);

    assert.equal(created.title, 'नादरपूर उपक्रम');
    assert.equal(created.titleEn, 'Nadarpur Initiative Video');
    assert.equal(created.published, true);
    assert.equal(created.featured, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Video CRUD: updateVideo sends authenticated PUT with partial payload and merges successfully', async () => {
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
          message: 'व्हिडिओ माहिती अद्ययावत केली.',
          data: {
            id: 'vid-1',
            title_mr: capturedBody.title_mr || 'मूळ शीर्षक',
            title_en: 'Original English Title',
            description_mr: 'मूळ वर्णन',
            description_en: 'Original English Description',
            category: 'शिक्षण',
            duration_seconds: 180,
            duration_formatted: '०३:००',
            duration_formatted_en: '03:00',
            thumbnail_url: 'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=640&q=75',
            video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            publish_date: '2025-01-20',
            published: capturedBody.published !== undefined ? capturedBody.published : 1,
            featured: 1,
          },
        }),
      } as any;
    };

    const updated = await ApiClient.updateVideo('vid-1', {
      title: 'सुधारित मराठी शीर्षक',
      published: false,
    });

    assert.ok(capturedUrl.includes('/content.php?resource=videos&id=vid-1'));
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(capturedBody.title_mr, 'सुधारित मराठी शीर्षक');
    assert.equal(capturedBody.published, 0);

    assert.equal(updated.title, 'सुधारित मराठी शीर्षक');
    assert.equal(updated.titleEn, 'Original English Title');
    assert.equal(updated.published, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Video CRUD: deleteVideo sends authenticated DELETE request with id', async () => {
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
          message: 'व्हिडिओ यशस्वीरित्या हटवला.',
        }),
      } as any;
    };

    const result = await ApiClient.deleteVideo('vid-999');

    assert.ok(capturedUrl.includes('/content.php?resource=videos&id=vid-999'));
    assert.equal(capturedMethod, 'DELETE');
    assert.equal(capturedHeaders['authorization'], `Bearer ${VALID_TEST_TOKEN}`);
    assert.equal(result, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Video CRUD: handles server validation error and does not report false success', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          status: 'error',
          success: false,
          message: 'व्हिडिओ शीर्षक (मराठी) आवश्यक आहे.',
        }),
      } as any;
    };

    await assert.rejects(
      async () => {
        await ApiClient.createVideo({
          title: '',
          titleEn: '',
          description: '',
          descriptionEn: '',
          category: 'शिक्षण',
          durationSeconds: 180,
          durationFormatted: '०३:००',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          date: '2025-01-01',
          published: true,
          featured: false,
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('व्हिडिओ शीर्षक (मराठी) आवश्यक आहे.'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Video CRUD: 401 response invalidates local session and throws error', async () => {
  sessionStorage.clear();
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TEST_TOKEN);

  let authFailureTriggered = false;
  const unbind = ApiClient.onAuthFailure(() => {
    authFailureTriggered = true;
  });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({
          status: 'error',
          success: false,
          message: 'Unauthorized: Session expired. Please log in again.',
        }),
      } as any;
    };

    await assert.rejects(async () => {
      await ApiClient.deleteVideo('vid-1');
    });

    assert.equal(authFailureTriggered, true);
    assert.equal(ApiClient.getStoredToken(), null);
  } finally {
    unbind();
    globalThis.fetch = originalFetch;
  }
});

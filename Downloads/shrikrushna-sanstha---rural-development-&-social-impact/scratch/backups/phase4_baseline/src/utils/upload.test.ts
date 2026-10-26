import { test } from 'node:test';
import assert from 'node:assert';
import { ApiClient, SESSION_AUTH_KEY } from '../services/apiClient.ts';

// Mock localStorage and sessionStorage for node test environment
if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
}

const VALID_TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0';

// Mock XMLHttpRequest helper to test the XHR upload progress path
class MockXHR {
  public upload = { onprogress: null as ((e: any) => void) | null };
  public status = 200;
  public responseText = '';
  public headers: Record<string, string> = {};
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;

  open(_method: string, _url: string) {}
  setRequestHeader(name: string, val: string) {
    this.headers[name] = val;
  }
  send(_body?: any) {
    if (this.upload.onprogress) {
      this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
      this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
    }
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 2);
  }
}

test('uploadImage: throws error when not authenticated', async () => {
  sessionStorage.removeItem(SESSION_AUTH_KEY);
  const dummyFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

  await assert.rejects(
    async () => {
      await ApiClient.uploadImage(dummyFile);
    },
    {
      message: /प्रशासक लॉगिन आवश्यक आहे/,
    }
  );
});

test('uploadImage: regression test HTTP 200 success response with file path', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.png', { type: 'image/png' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const authHeader = (init?.headers as Record<string, string>)?.Authorization;
      assert.strictEqual(authHeader, `Bearer ${VALID_TOKEN}`);
      assert.strictEqual(init?.method, 'POST');

      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'Photo uploaded successfully.',
          url: '/backend-php-mysql/uploads/officials/off_200_ok.png',
          filename: 'off_200_ok.png',
          size: 1024,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const result = await ApiClient.uploadImage(dummyFile);
    assert.strictEqual(result.url, '/backend-php-mysql/uploads/officials/off_200_ok.png');
    assert.strictEqual(result.filename, 'off_200_ok.png');
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test HTTP 201 success response (fetch path)', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.png', { type: 'image/png' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) => {
      const authHeader = (init?.headers as Record<string, string>)?.Authorization;
      assert.strictEqual(authHeader, `Bearer ${VALID_TOKEN}`);

      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'फोटो यशस्वीरित्या अपलोड झाला.',
          url: '/backend-php-mysql/uploads/officials/off_201_created.png',
          filename: 'off_201_created.png',
          size: 2048,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const result = await ApiClient.uploadImage(dummyFile);
    assert.strictEqual(result.url, '/backend-php-mysql/uploads/officials/off_201_created.png');
    assert.strictEqual(result.filename, 'off_201_created.png');
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test HTTP 201 success response with XHR and progress tracking', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.jpg', { type: 'image/jpeg' });

  const originalXHR = (globalThis as any).XMLHttpRequest;
  try {
    (globalThis as any).XMLHttpRequest = class extends MockXHR {
      constructor() {
        super();
        this.status = 201;
        this.responseText = JSON.stringify({
          status: 'success',
          success: true,
          message: 'Photo uploaded successfully.',
          url: '/backend-php-mysql/uploads/officials/off_xhr_201.jpg',
          filename: 'off_xhr_201.jpg',
          size: 4096,
        });
      }
    };

    const progressValues: number[] = [];
    const result = await ApiClient.uploadImage(dummyFile, (pct) => {
      progressValues.push(pct);
    });

    assert.strictEqual(result.url, '/backend-php-mysql/uploads/officials/off_xhr_201.jpg');
    assert.ok(progressValues.includes(100), 'Should track progress up to 100%');
  } finally {
    (globalThis as any).XMLHttpRequest = originalXHR;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test HTTP 400 validation rejection', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'oversized.jpg', { type: 'image/jpeg' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          success: false,
          message: 'फाइल आकार सर्व्हर मर्यादेपेक्षा जास्त आहे (कमाल ५MB).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await ApiClient.uploadImage(dummyFile);
      },
      {
        message: /फाइल आकार सर्व्हर मर्यादेपेक्षा जास्त आहे/,
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test HTTP 401 unauthenticated response triggers onAuthFailure', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.jpg', { type: 'image/jpeg' });

  let authFailed = false;
  const unsubscribe = ApiClient.onAuthFailure(() => {
    authFailed = true;
  });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          success: false,
          message: 'Unauthorized: Session expired.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await ApiClient.uploadImage(dummyFile);
      },
      {
        message: /Unauthorized/,
      }
    );

    assert.strictEqual(authFailed, true, 'onAuthFailure listener must be triggered on HTTP 401');
  } finally {
    unsubscribe();
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test HTTP 500 server internal error', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.jpg', { type: 'image/jpeg' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          success: false,
          message: 'इमेज फाइल साठवण्यात त्रुटी. (Failed to save uploaded image file.)',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await ApiClient.uploadImage(dummyFile);
      },
      {
        message: /इमेज फाइल साठवण्यात त्रुटी/,
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test malformed JSON safely throws Server response error (HTTP 201)', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.jpg', { type: 'image/jpeg' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      // Returns HTML error page or broken text instead of JSON
      return new Response('<!DOCTYPE html><html><body>Fatal Server Error</body></html>', {
        status: 201,
        headers: { 'Content-Type': 'text/html' },
      });
    };

    await assert.rejects(
      async () => {
        await ApiClient.uploadImage(dummyFile);
      },
      {
        message: /Server response error \(HTTP 201\)/,
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test successful response missing the file path throws error', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.jpg', { type: 'image/jpeg' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      // 200 OK or 201 Created but url / filePath is missing
      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'Photo uploaded but URL missing.',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await ApiClient.uploadImage(dummyFile);
      },
      {
        message: /सर्व्हरकडून फोटोची फाइल लिंक प्राप्त झाली नाही/,
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

test('uploadImage: regression test handles JSON wrapped with PHP notices/warnings gracefully', async () => {
  sessionStorage.setItem(SESSION_AUTH_KEY, VALID_TOKEN);
  const dummyFile = new File(['fake-image-bytes'], 'profile.png', { type: 'image/png' });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      const outputWithNotice =
        '<br /><b>Deprecated</b>: notice text on line 123<br />' +
        JSON.stringify({
          status: 'success',
          success: true,
          url: '/backend-php-mysql/uploads/officials/off_extracted.png',
          filename: 'off_extracted.png',
        });

      return new Response(outputWithNotice, {
        status: 201,
        headers: { 'Content-Type': 'text/html' },
      });
    };

    const result = await ApiClient.uploadImage(dummyFile);
    assert.strictEqual(result.url, '/backend-php-mysql/uploads/officials/off_extracted.png');
    assert.strictEqual(result.filename, 'off_extracted.png');
  } finally {
    globalThis.fetch = originalFetch;
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
});

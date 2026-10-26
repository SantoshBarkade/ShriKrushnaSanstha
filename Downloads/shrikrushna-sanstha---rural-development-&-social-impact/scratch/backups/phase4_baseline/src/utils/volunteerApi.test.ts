import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../services/apiClient.ts';
import type { VolunteerRegistration } from '../types/index.ts';
import { mapVolunteerFromDb } from './contentMapper.ts';
import { validateVolunteerForm } from './validation.ts';

// Mock storage for tests
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const mockToken = 'c'.repeat(64);

beforeEach(() => {
  (globalThis as any).sessionStorage = new MockStorage();
  (globalThis as any).localStorage = new MockStorage();
});

test('mapVolunteerFromDb maps database row correctly to VolunteerRegistration', () => {
  const dbRow = {
    id: 101,
    full_name: 'अमोल दिलीप निकम',
    email: 'amol.nikam@example.com',
    phone: '9922334455',
    village: 'नादरपूर',
    taluka: 'कन्नड',
    district: 'छत्रपती संभाजीनगर',
    age_bracket: '26-35',
    gender: 'male',
    areas_of_interest: 'ग्रामीण विकास, शिक्षण, पर्यावरण',
    availability: 'weekends',
    message: 'संस्थेच्या ग्रामीण शिक्षण कार्यात मदत करायची आहे.',
    status: 'new',
    admin_notes: 'पहिला संपर्क अपेक्षित',
    created_at: '2026-10-22 11:00:00',
    updated_at: '2026-10-22 11:00:00',
  };

  const mapped = mapVolunteerFromDb(dbRow);
  assert.equal(mapped.id, 101);
  assert.equal(mapped.fullName, 'अमोल दिलीप निकम');
  assert.equal(mapped.email, 'amol.nikam@example.com');
  assert.equal(mapped.phone, '9922334455');
  assert.equal(mapped.village, 'नादरपूर');
  assert.equal(mapped.taluka, 'कन्नड');
  assert.equal(mapped.district, 'छत्रपती संभाजीनगर');
  assert.equal(mapped.ageBracket, '26-35');
  assert.equal(mapped.gender, 'male');
  assert.deepEqual(mapped.areasOfInterest, ['ग्रामीण विकास', 'शिक्षण', 'पर्यावरण']);
  assert.equal(mapped.availability, 'weekends');
  assert.equal(mapped.status, 'new');
  assert.equal(mapped.adminNotes, 'पहिला संपर्क अपेक्षित');
});

test('validateVolunteerForm validates required fields and accepts optional email', () => {
  // Valid volunteer form
  const valid = validateVolunteerForm({
    fullName: 'राहुल शिंदे',
    phone: '9876543210',
    email: 'rahul@example.com',
    village: 'कन्नड',
    areasOfInterest: ['शिक्षण', 'पर्यावरण'],
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.sanitized.fullName, 'राहुल शिंदे');
  assert.equal(valid.sanitized.phone, '9876543210');
  assert.equal(valid.sanitized.email, 'rahul@example.com');

  // Valid without email (optional)
  const validNoEmail = validateVolunteerForm({
    fullName: 'कविता जाधव',
    phone: '8888666555',
    village: 'नादरपूर',
    areasOfInterest: ['महिला सक्षमीकरण'],
  });
  assert.equal(validNoEmail.isValid, true);
  assert.equal(validNoEmail.sanitized.email, '');

  // Invalid: missing name
  const invalidName = validateVolunteerForm({
    fullName: '',
    phone: '9876543210',
    village: 'नादरपूर',
    areasOfInterest: ['शिक्षण'],
  });
  assert.equal(invalidName.isValid, false);
  assert.ok(invalidName.errors.fullName);

  // Invalid: bad phone
  const invalidPhone = validateVolunteerForm({
    fullName: 'दिनेश पवार',
    phone: '12345',
    village: 'नादरपूर',
    areasOfInterest: ['शिक्षण'],
  });
  assert.equal(invalidPhone.isValid, false);
  assert.ok(invalidPhone.errors.phone);

  // Invalid: empty areas of interest
  const invalidAreas = validateVolunteerForm({
    fullName: 'दिनेश पवार',
    phone: '9876543210',
    village: 'नादरपूर',
    areasOfInterest: [],
  });
  assert.equal(invalidAreas.isValid, false);
  assert.ok(invalidAreas.errors.areasOfInterest);
});

test('Volunteer CRUD: getVolunteers throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  (globalThis as any).sessionStorage.clear();
  (globalThis as any).localStorage.clear();
  ApiClient.clearSession();

  await assert.rejects(
    async () => {
      await ApiClient.getVolunteers();
    },
    { message: 'NO_ACTIVE_AUTH_TOKEN' }
  );
});

test('Volunteer CRUD: getVolunteers sends authenticated GET and returns mapped items and counts', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedHeaders: any = null;

  globalThis.fetch = async (url: any, init?: any) => {
    capturedUrl = url.toString();
    capturedHeaders = init?.headers;
    return new Response(
      JSON.stringify({
        success: true,
        data: [
          {
            id: 1,
            full_name: 'सचिन निकम',
            phone: '9923512482',
            village: 'नादरपूर',
            taluka: 'कन्नड',
            district: 'छत्रपती संभाजीनगर',
            areas_of_interest: 'ग्रामीण विकास, शिक्षण',
            status: 'new',
            created_at: '2026-10-22 10:00:00',
          },
        ],
        counts: {
          total: 1,
          new: 1,
          reviewing: 0,
          approved: 0,
          contacted: 0,
          declined: 0,
          archived: 0,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const res = await ApiClient.getVolunteers({ status: 'new', q: 'नादरपूर' });
    assert.ok(capturedUrl.includes('resource=volunteers'));
    assert.ok(capturedUrl.includes('status=new'));
    assert.ok(capturedUrl.includes('q=%E0%A4%A8%E0%A4%BE%E0%A4%A6%E0%A4%B0%E0%A4%AA%E0%A5%82%E0%A4%B0'));
    const authHeader = typeof capturedHeaders?.get === 'function'
      ? capturedHeaders.get('Authorization')
      : capturedHeaders?.['Authorization'];
    assert.equal(authHeader, `Bearer ${mockToken}`);
    assert.equal(res.volunteers.length, 1);
    assert.equal(res.volunteers[0].fullName, 'सचिन निकम');
    assert.equal(res.counts?.new, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Volunteer CRUD: updateVolunteerStatus sends authenticated PUT and returns updated volunteer', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody = '';

  globalThis.fetch = async (url: any, init?: any) => {
    capturedUrl = url.toString();
    capturedMethod = init?.method;
    capturedBody = init?.body;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: 5,
          full_name: 'प्रवीण गायकवाड',
          phone: '9890123456',
          village: 'कन्नड',
          taluka: 'कन्नड',
          district: 'छत्रपती संभाजीनगर',
          areas_of_interest: 'सांस्कृतिक उपक्रम',
          status: 'approved',
          admin_notes: 'मुलाखत यशस्वी',
          created_at: '2026-10-22 12:00:00',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const updated = await ApiClient.updateVolunteerStatus(5, 'approved', 'मुलाखत यशस्वी');
    assert.ok(capturedUrl.includes('resource=volunteers&id=5'));
    assert.equal(capturedMethod, 'PUT');
    const parsed = JSON.parse(capturedBody);
    assert.equal(parsed.status, 'approved');
    assert.equal(parsed.admin_notes, 'मुलाखत यशस्वी');
    assert.equal(updated.status, 'approved');
    assert.equal(updated.adminNotes, 'मुलाखत यशस्वी');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Volunteer CRUD: deleteVolunteer sends authenticated DELETE request with id', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedMethod = '';

  globalThis.fetch = async (url: any, init?: any) => {
    capturedUrl = url.toString();
    capturedMethod = init?.method;
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Volunteer registration deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const res = await ApiClient.deleteVolunteer(5);
    assert.ok(capturedUrl.includes('resource=volunteers&id=5'));
    assert.equal(capturedMethod, 'DELETE');
    assert.equal(res.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Public Volunteer Registration: submitVolunteer sends public POST without Bearer token', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: Record<string, string> = {};
  let capturedBody = '';

  globalThis.fetch = async (url: any, init?: any) => {
    capturedUrl = url.toString();
    capturedMethod = init?.method;
    capturedHeaders = (init?.headers as Record<string, string>) || {};
    capturedBody = init?.body;
    return {
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'Registration successful',
        volunteerId: 99,
      }),
    } as any;
  };

  try {
    const res = await ApiClient.submitVolunteer({
      fullName: 'रोहित निकम',
      phone: '9922334455',
      village: 'नादरपूर',
      areasOfInterest: ['ग्रामीण विकास', 'शिक्षण'],
      website: '', // honeypot empty
    });

    assert.ok(capturedUrl.includes('resource=volunteers'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['Authorization'], undefined, 'Must not send Authorization header');
    const parsed = JSON.parse(capturedBody);
    assert.equal(parsed.fullName, 'रोहित निकम');
    assert.equal(parsed.phone, '9922334455');
    assert.equal(res.volunteerId, 99);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

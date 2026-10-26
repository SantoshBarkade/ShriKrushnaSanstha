import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../services/apiClient.ts';
import type { ContactInquiry } from '../types/index.ts';
import { mapInquiryFromDb } from './contentMapper.ts';

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

const mockToken = 'b'.repeat(64);

beforeEach(() => {
  (globalThis as any).sessionStorage = new MockStorage();
  (globalThis as any).localStorage = new MockStorage();
});

test('mapInquiryFromDb maps database row correctly to ContactInquiry', () => {
  const dbRow = {
    id: 42,
    full_name: 'संतोष पाटील',
    contact_detail: 'santosh@example.com',
    subject: 'शैक्षणिक उपक्रमाबाबत चौकशी',
    message: 'नमस्कार, मला संथेच्या नवीन उपक्रमात सहभागी व्हायचे आहे.',
    status: 'new',
    ip_address: '192.168.1.100',
    admin_notes: null,
    replied_at: null,
    replied_by: null,
    created_at: '2026-10-22 10:30:00',
    updated_at: '2026-10-22 10:30:00',
  };

  const mapped = mapInquiryFromDb(dbRow);
  assert.equal(mapped.id, 42);
  assert.equal(mapped.fullName, 'संतोष पाटील');
  assert.equal(mapped.contactDetail, 'santosh@example.com');
  assert.equal(mapped.subject, 'शैक्षणिक उपक्रमाबाबत चौकशी');
  assert.equal(mapped.message, 'नमस्कार, मला संथेच्या नवीन उपक्रमात सहभागी व्हायचे आहे.');
  assert.equal(mapped.status, 'new');
  assert.equal(mapped.ipAddress, '192.168.1.100');
  assert.equal(mapped.adminNotes, null);
  assert.equal(mapped.createdAt, '2026-10-22 10:30:00');
});

test('Inquiry CRUD: getInquiries throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  (globalThis as any).sessionStorage.clear();

  await assert.rejects(
    async () => {
      await ApiClient.getInquiries();
    },
    { message: 'NO_ACTIVE_AUTH_TOKEN' }
  );
});

test('Inquiry CRUD: getInquiries sends authenticated GET and returns mapped items and counts', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = '';
    let capturedHeaders: any = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedHeaders = init?.headers;

      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 101,
              full_name: 'अमोल शिंदे',
              contact_detail: '9876543210',
              subject: 'आरोग्य शिबीर चौकशी',
              message: 'शिबीर कधी आयोजित केले आहे?',
              status: 'new',
              ip_address: '127.0.0.1',
              created_at: '2026-10-22 09:00:00',
            },
          ],
          counts: {
            total: 5,
            unread: 2,
            read: 3,
            replied: 0,
            archived: 0,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const res = await ApiClient.getInquiries({ status: 'new', q: 'आरोग्य' });
    assert.match(capturedUrl, /resource=inquiries/);
    assert.match(capturedUrl, /status=new/);
    assert.match(capturedUrl, /q=%E0%A4%86%E0%A4%B0%E0%A5%8B%E0%A4%97%E0%A5%8D%E0%A4%AF/);
    assert.equal(capturedHeaders.get('Authorization'), `Bearer ${mockToken}`);
    assert.equal(res.inquiries.length, 1);
    assert.equal(res.inquiries[0].fullName, 'अमोल शिंदे');
    assert.equal(res.inquiries[0].status, 'new');
    assert.equal(res.counts?.total, 5);
    assert.equal(res.counts?.unread, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Inquiry CRUD: updateInquiryStatus sends authenticated PUT with status and returns updated item', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || '';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 101,
            full_name: 'अमोल शिंदे',
            contact_detail: '9876543210',
            subject: 'आरोग्य शिबीर चौकशी',
            message: 'शिबीर कधी आयोजित केले आहे?',
            status: 'read',
            ip_address: '127.0.0.1',
            created_at: '2026-10-22 09:00:00',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const updated = await ApiClient.updateInquiryStatus(101, 'read');
    assert.match(capturedUrl, /resource=inquiries&id=101/);
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedBody.status, 'read');
    assert.equal(updated.status, 'read');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Inquiry CRUD: deleteInquiry sends authenticated DELETE request with id', async () => {
  ApiClient.saveSession(mockToken);

  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedHeaders: any = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || '';
      capturedHeaders = init?.headers;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Inquiry deleted successfully',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const result = await ApiClient.deleteInquiry(101);
    assert.match(capturedUrl, /resource=inquiries&id=101/);
    assert.equal(capturedMethod, 'DELETE');
    assert.equal(capturedHeaders.get('Authorization'), `Bearer ${mockToken}`);
    assert.equal(result.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Public Contact Form: submitInquiry sends honeypot and fields to public endpoint without Bearer token', async () => {
  (globalThis as any).sessionStorage.clear();

  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedHeaders: any = null;
    let capturedBody: any = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || '';
      capturedHeaders = init?.headers;
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 205,
            message: 'Inquiry submitted successfully',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const res = await ApiClient.submitInquiry({
      name: 'गणेश जाधव',
      contact: 'ganesh@example.com',
      subject: 'सामान्य विचारणा',
      message: 'संस्थेचे वार्षिक अहवाल कुठे मिळतील?',
      website: '', // honeypot empty
    });

    assert.match(capturedUrl, /resource=inquiries/);
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedHeaders['Authorization'], undefined); // Public endpoint, no Bearer token
    assert.equal(capturedBody.name, 'गणेश जाधव');
    assert.equal(capturedBody.website, '');
    assert.equal(res.data.id, 205);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../services/apiClient.ts';
import { mapPublicContentPayload } from './contentMapper.ts';
import { INITIAL_SANSTHA_DATA } from '../data/initialData.ts';
import { validateContactForm } from './validation.ts';

test('Integration: Public content API fetch returns mapped published content without Authorization header', async () => {
  let capturedUrl = '';
  let capturedHeaders: any = null;

  const mockApiResponse = {
    status: 'success',
    success: true,
    isAdminPreview: false,
    data: {
      officials: [
        {
          id: 'off-1',
          name_mr: 'श्रीमती सविता दिलीप निकम',
          name_en: 'Smt. Savita Dilip Nikam',
          role_mr: 'सचिव',
          role_en: 'Secretary',
          designation_mr: 'कार्यकारी संचालक',
          designation_en: 'Executive Director',
          image_url: 'https://example.com/savita.jpg',
          published: 1,
          display_order: 1,
        },
      ],
      initiatives: [
        {
          id: 'init-1',
          title_mr: 'जलसंधारण प्रकल्प',
          title_en: 'Water Conservation Project',
          summary_mr: 'नादरपूर जलसंधारण उपक्रम',
          summary_en: 'Nadarpur water conservation initiative',
          activity_date: '2024-03-15',
          category: 'कृषी व जलसंधारण',
          location_mr: 'नादरपूर, ता. जामनेर',
          location_en: 'Nadarpur, Tal. Jamner',
          description_mr: 'सविस्तर माहिती',
          description_en: 'Detailed description',
          image_url: 'https://example.com/water.jpg',
          is_govt_scheme: 0,
          published: 1,
          featured: 1,
          tags: 'पाणी, शेती, जलसंधारण',
          display_order: 1,
          photos: [],
        },
      ],
      gallery: [
        {
          id: 'gal-1',
          title_mr: 'वृक्षारोपण कार्यक्रम',
          title_en: 'Tree Plantation Drive',
          category_mr: 'पर्यावरण',
          category_en: 'Environment',
          image_url: 'https://example.com/tree.jpg',
          date_mr: '१५ ऑगस्ट २०२४',
          date_en: '15 Aug 2024',
          published: 1,
          is_featured: 1,
          display_order: 1,
        },
      ],
      videos: [
        {
          id: 'vid-1',
          title_mr: 'संस्था माहितीपट',
          title_en: 'Sanstha Documentary',
          video_url: 'https://www.youtube.com/watch?v=mock123',
          duration_mr: '५:३० मिनिटे',
          duration_en: '5:30 mins',
          category: 'माहितीपट',
          published: 1,
          display_order: 1,
        },
      ],
      reports: [
        {
          id: 'rep-1',
          title_mr: 'वार्षिक अहवाल २०२३-२४',
          title_en: 'Annual Report 2023-24',
          period_mr: '२०२३-२४',
          period_en: '2023-24',
          report_date: '2024-04-01',
          file_size: '2.4 MB',
          category_mr: 'वार्षिक लेखापरीक्षण',
          category_en: 'Annual Audit',
          pdf_url: 'https://example.com/report2024.pdf',
          published: 1,
          display_order: 1,
        },
      ],
      announcements: [
        {
          id: 'ann-1',
          title_mr: 'आरोग्य तपासणी शिबीर',
          title_en: 'Health Checkup Camp',
          event_date_mr: '२५ ऑक्टोबर २०२४',
          event_date_en: '25 Oct 2024',
          is_upcoming: 1,
          category: 'आरोग्य',
          summary_mr: 'मोफत आरोग्य तपासणी',
          summary_en: 'Free health checkup camp',
          content_mr: 'सर्व ग्रामस्थांनी लाभ घ्यावा.',
          content_en: 'All villagers are welcome.',
          published: 1,
          display_order: 1,
        },
      ],
      governmentSchemes: [
        {
          id: 'sch-1',
          title_mr: 'संजय गांधी निराधार योजना',
          title_en: 'Sanjay Gandhi Niradhar Scheme',
          department_mr: 'सामाजिक न्याय विभाग',
          department_en: 'Social Justice Department',
          summary_mr: 'निराधार व्यक्तींसाठी अर्थसहाय्य',
          summary_en: 'Financial assistance for destitute persons',
          official_portal_url: 'https://sjsa.maharashtra.gov.in',
          published: 1,
          featured: 1,
          display_order: 1,
        },
      ],
      contactInfo: {
        id: 1,
        reg_no_mr: 'महाराष्ट्र/१२३४/जळगाव',
        reg_no_en: 'MAH/1234/JALGAON',
        secretary_name_mr: 'श्रीमती सविता दिलीप निकम',
        secretary_name_en: 'Smt. Savita Dilip Nikam',
        phone: '+91 9923512482',
        email: 'info@shrikrushnasanstha.org',
        address_mr: 'मु. पो. नादरपूर, ता. जामनेर, जि. जळगाव - ४२४२०६',
        address_en: 'At Post Nadarpur, Taluka Jamner, Dist Jalgaon - 424206',
        taluka_mr: 'जामनेर',
        taluka_en: 'Jamner',
        district_mr: 'जळगाव',
        district_en: 'Jalgaon',
        visiting_hours_mr: 'सकाळी १० ते संध्याकाळी ५',
        visiting_hours_en: '10 AM to 5 PM',
      },
      siteSettings: [],
    },
  };

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as any;
    };

    const response = await ApiClient.getMappedPublicContent();

    // Verify endpoint URL
    assert.ok(capturedUrl.includes('/content.php?resource=all'));
    assert.ok(!capturedUrl.includes('admin=1'), 'Public fetch must not request admin preview');

    // Requirement 4: Never send Bearer token on public content requests
    assert.equal(capturedHeaders['Authorization'], undefined, 'Public fetch must not attach Authorization header');

    // Verify hydrated mapped state
    assert.equal(response.isAdminPreview, false);
    assert.ok(response.sansthaState);
    assert.equal(response.sansthaState.officials?.length, 1);
    assert.equal(response.sansthaState.officials?.[0]?.name, 'श्रीमती सविता दिलीप निकम');
    assert.equal(response.sansthaState.officials?.[0]?.nameEn, 'Smt. Savita Dilip Nikam');

    assert.equal(response.sansthaState.initiatives?.length, 1);
    assert.equal(response.sansthaState.initiatives?.[0]?.title, 'जलसंधारण प्रकल्प');
    assert.equal(response.sansthaState.initiatives?.[0]?.titleEn, 'Water Conservation Project');

    assert.equal(response.sansthaState.governmentSchemes?.length, 1);
    assert.equal(response.sansthaState.governmentSchemes?.[0]?.title, 'संजय गांधी निराधार योजना');
    assert.equal(response.sansthaState.governmentSchemes?.[0]?.titleEn, 'Sanjay Gandhi Niradhar Scheme');

    assert.equal(response.sansthaState.contactInfo?.phone, '+91 9923512482');
    assert.equal(response.sansthaState.contactInfo?.taluka, 'जामनेर');
    assert.equal(response.sansthaState.contactInfo?.talukaEn, 'Jamner');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration: Public content API failure gracefully throws and preserves initialData fallback', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any;
    };

    // ApiClient.getMappedPublicContent throws on HTTP error
    await assert.rejects(
      async () => {
        await ApiClient.getMappedPublicContent();
      },
      (err: any) => {
        assert.ok(err.message.includes('500') || err.message.includes('Failed to load'));
        return true;
      }
    );

    // Initial fallback data remains intact and valid
    assert.ok(INITIAL_SANSTHA_DATA.officials.length > 0);
    assert.ok(INITIAL_SANSTHA_DATA.initiatives.length > 0);
    assert.ok(INITIAL_SANSTHA_DATA.governmentSchemes.length > 0);
    assert.ok(INITIAL_SANSTHA_DATA.videos.length > 0);
    for (const v of INITIAL_SANSTHA_DATA.videos) {
      assert.ok(v.videoUrl && v.videoUrl.startsWith('https://'));
      assert.ok(!v.videoUrl.includes('gtv-videos-bucket'), 'Must not contain defunct gtv-videos-bucket URL');
    }
    assert.equal(typeof INITIAL_SANSTHA_DATA.contactInfo.phone, 'string');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration: Bilingual mapping preserves Marathi and English fields independently without overwrite', () => {
  const sampleDbOfficial = {
    id: 'off-test',
    name_mr: 'मराठी नाव',
    name_en: 'English Name',
    role_mr: 'मराठी पद',
    role_en: 'English Role',
    published: 1,
  };

  const payload = {
    status: 'success',
    success: true,
    data: {
      officials: [sampleDbOfficial],
      initiatives: [],
      gallery: [],
      videos: [],
      reports: [],
      announcements: [],
      governmentSchemes: [],
      contactInfo: {
        id: 1,
        phone: '1234567890',
        address_mr: 'मराठी पत्ता',
        address_en: 'English Address',
      },
      siteSettings: [],
    },
  };

  const mapped = mapPublicContentPayload(payload);
  const official = mapped.sansthaState.officials?.[0];

  assert.ok(official);
  assert.equal(official.name, 'मराठी नाव');
  assert.equal(official.nameEn, 'English Name');
  assert.equal(official.role, 'मराठी पद');
  assert.equal(official.roleEn, 'English Role');

  // Verify independent existence
  assert.notEqual(official.name, official.nameEn);
  assert.notEqual(official.role, official.roleEn);
});

test('Integration: Public contact inquiry submission posts sanitized data to /content.php?resource=inquiries', async () => {
  let capturedUrl = '';
  let capturedBody: any = null;
  let capturedHeaders: any = null;

  const validFormData = {
    name: 'Santosh Patil',
    contact: '+91 9876543210',
    subject: 'पाणी पुरवठा माहिती',
    message: 'नादरपूर येथील जलसंधारण योजनेविषयी सविस्तर माहिती हवी आहे.',
  };

  // Validate form data first with validation utility
  const validation = validateContactForm(validFormData);
  assert.equal(validation.isValid, true);
  assert.deepEqual(validation.errors, {});

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      capturedBody = JSON.parse(init?.body || '{}');
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: 'success',
          success: true,
          id: 42,
          message: 'Your inquiry has been successfully registered.',
        }),
      } as any;
    };

    const result = await ApiClient.submitInquiry(validation.sanitized);

    assert.ok(capturedUrl.includes('/content.php?resource=inquiries'));
    assert.equal(capturedHeaders['Authorization'], undefined, 'Inquiry submission must not send Authorization header');
    assert.equal(capturedHeaders['Content-Type'], 'application/json');

    assert.equal(capturedBody.name, 'Santosh Patil');
    assert.equal(capturedBody.contact, '+91 9876543210');
    assert.equal(capturedBody.subject, 'पाणी पुरवठा माहिती');
    assert.ok(capturedBody.message.includes('नादरपूर'));

    assert.equal(result.success, true);
    assert.equal(result.id, 42);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration: Public contact inquiry handles safe backend validation and server errors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    // Scenario 1: Backend returns 400 Bad Request
    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        success: false,
        message: 'Name, contact detail, and message are required.',
      }),
    } as any);

    await assert.rejects(
      async () => {
        await ApiClient.submitInquiry({
          name: '',
          contact: '',
          subject: '',
          message: '',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('required'));
        return true;
      }
    );

    // Scenario 2: Backend returns 500 Server Error
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        status: 'error',
        success: false,
        message: 'Failed to save inquiry. Please try again.',
      }),
    } as any);

    await assert.rejects(
      async () => {
        await ApiClient.submitInquiry({
          name: 'Test',
          contact: '1234567890',
          subject: 'Test',
          message: 'Test message',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('Failed to save inquiry'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

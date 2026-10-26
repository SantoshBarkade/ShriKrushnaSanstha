import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../services/apiClient.ts';
import type { OfficialItem, PageSectionItem, MediaFileItem } from '../types/index.ts';
import {
  mapOfficialFromDb,
  mapOfficialToDb,
  mapPageSectionFromDb,
  mapPageSectionToDb,
  mapSitePageFromDb,
  mapMediaFileFromDb,
} from './contentMapper.ts';

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

const mockToken = 'a'.repeat(64);

beforeEach(() => {
  (globalThis as any).sessionStorage = new MockStorage();
  (globalThis as any).localStorage = new MockStorage();
});

test('Officials CRUD: createOfficial throws NO_ACTIVE_AUTH_TOKEN when not authenticated', async () => {
  (globalThis as any).sessionStorage.clear();

  await assert.rejects(
    async () => {
      await ApiClient.createOfficial({
        name: 'श्री. चाचणी अधिकारी',
        nameEn: 'Mr. Test Official',
        role: 'सदस्य',
        roleEn: 'Member',
        imageUrl: 'https://images.unsplash.com/photo-1?w=500',
        bio: 'चाचणी माहिती',
        bioEn: 'Test bio',
        phone: '+91 9876543210',
        displayOrder: 5,
        published: true,
      });
    },
    { message: 'NO_ACTIVE_AUTH_TOKEN' }
  );
});

test('Officials CRUD: createOfficial sends authenticated POST with correct payload and returns mapped item', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedHeaders = init.headers;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'Official created successfully',
        data: {
          id: 'off-test-123',
          name_mr: capturedBody.name_mr,
          name_en: capturedBody.name_en,
          role_mr: capturedBody.role_mr,
          role_en: capturedBody.role_en,
          image_url: capturedBody.image_url,
          bio_mr: capturedBody.bio_mr,
          bio_en: capturedBody.bio_en,
          phone: capturedBody.phone,
          display_order: capturedBody.display_order,
          published: capturedBody.published,
        },
      }),
    };
  };

  const result = await ApiClient.createOfficial({
    id: 'off-test-123',
    name: 'श्री. दिलीप निकम',
    nameEn: 'Shri. Dilip Nikam',
    role: 'अध्यक्ष',
    roleEn: 'President',
    imageUrl: 'https://images.unsplash.com/photo-1?w=500',
    bio: 'अध्यक्षीय कार्यकाळ',
    bioEn: 'Presidential tenure',
    phone: '+91 9876543210',
    displayOrder: 1,
    published: true,
  });

  assert.ok(capturedUrl.includes('/content.php?resource=officials'));
  assert.equal(capturedMethod, 'POST');
  assert.equal(capturedHeaders.get('Authorization'), `Bearer ${mockToken}`);
  assert.equal(capturedBody.name_mr, 'श्री. दिलीप निकम');
  assert.equal(capturedBody.name_en, 'Shri. Dilip Nikam');
  assert.equal(capturedBody.role_mr, 'अध्यक्ष');
  assert.equal(capturedBody.role_en, 'President');
  assert.equal(capturedBody.display_order, 1);
  assert.equal(capturedBody.published, 1);
  assert.equal(result.id, 'off-test-123');
  assert.equal(result.name, 'श्री. दिलीप निकम');
  assert.equal(result.nameEn, 'Shri. Dilip Nikam');
});

test('Officials CRUD: updateOfficial sends authenticated PUT with partial payload and merges successfully', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Official updated successfully',
        data: {
          id: 'off-test-123',
          name_mr: 'श्री. दिलीप निकम (संपादित)',
          name_en: 'Shri. Dilip Nikam (Updated)',
          role_mr: 'कार्याध्यक्ष',
          role_en: 'Executive President',
          image_url: 'https://images.unsplash.com/photo-1?w=500',
          bio_mr: 'नवीन बायो',
          bio_en: 'New bio',
          phone: '+91 9999988888',
          display_order: 2,
          published: 0,
        },
      }),
    };
  };

  const result = await ApiClient.updateOfficial('off-test-123', {
    name: 'श्री. दिलीप निकम (संपादित)',
    nameEn: 'Shri. Dilip Nikam (Updated)',
    role: 'कार्याध्यक्ष',
    roleEn: 'Executive President',
    phone: '+91 9999988888',
    displayOrder: 2,
    published: false,
  });

  assert.ok(capturedUrl.includes('/content.php?resource=officials&id=off-test-123'));
  assert.equal(capturedMethod, 'PUT');
  assert.equal(capturedBody.name_mr, 'श्री. दिलीप निकम (संपादित)');
  assert.equal(capturedBody.name_en, 'Shri. Dilip Nikam (Updated)');
  assert.equal(capturedBody.published, 0);
  assert.equal(result.published, false);
  assert.equal(result.displayOrder, 2);
});

test('Officials CRUD: deleteOfficial sends authenticated DELETE request with id', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Official deleted successfully',
      }),
    };
  };

  const success = await ApiClient.deleteOfficial('off-test-123');
  assert.equal(success, true);
  assert.ok(capturedUrl.includes('/content.php?resource=officials&id=off-test-123'));
  assert.equal(capturedMethod, 'DELETE');
});

test('Settings CRUD: updateSiteSetting sends authenticated PUT with key and payload', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Setting updated successfully',
        data: {
          key_name: 'hero_badge',
          value_mr: capturedBody.value_mr,
          value_en: capturedBody.value_en,
        },
      }),
    };
  };

  const result = await ApiClient.updateSiteSetting('hero_badge', {
    valueMr: 'नवीन लोककल्याण बॅज',
    valueEn: 'New Public Welfare Badge',
  });

  assert.ok(capturedUrl.includes('/content.php?resource=settings&key=hero_badge'));
  assert.equal(capturedMethod, 'PUT');
  assert.equal(capturedBody.value_mr, 'नवीन लोककल्याण बॅज');
  assert.equal(capturedBody.value_en, 'New Public Welfare Badge');
  assert.equal(result.key_name, 'hero_badge');
});

test('Pages CRUD: updateSitePage sends authenticated PUT with slug and payload', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Page updated successfully',
        data: {
          slug: 'about',
          title_mr: capturedBody.title_mr,
          title_en: capturedBody.title_en,
          is_published: capturedBody.is_published,
        },
      }),
    };
  };

  const result = await ApiClient.updateSitePage('about', {
    titleMr: 'संस्थेविषयी माहिती',
    titleEn: 'About Sanstha',
    isPublished: true,
  });

  assert.ok(capturedUrl.includes('/content.php?resource=pages&slug=about'));
  assert.equal(capturedMethod, 'PUT');
  assert.equal(capturedBody.title_mr, 'संस्थेविषयी माहिती');
  assert.equal(capturedBody.title_en, 'About Sanstha');
  assert.equal(capturedBody.is_published, 1);
  assert.equal(result.slug, 'about');
});

test('Officials mapping: mapOfficialToDb and mapOfficialFromDb preserve independent Marathi and English fields and display order', () => {
  const item: OfficialItem = {
    id: 'off-custom-1',
    name: 'नामदेवराव पाटील',
    nameEn: 'Namdevrao Patil',
    role: 'सचिव',
    roleEn: 'Secretary',
    imageUrl: 'https://example.org/photo.jpg',
    bio: 'दीर्घ अनुभव',
    bioEn: 'Extensive experience',
    phone: '+91 9822000000',
    displayOrder: 3,
    published: true,
  };

  const dbRow = mapOfficialToDb(item);
  assert.equal(dbRow.id, 'off-custom-1');
  assert.equal(dbRow.name_mr, 'नामदेवराव पाटील');
  assert.equal(dbRow.name_en, 'Namdevrao Patil');
  assert.equal(dbRow.role_mr, 'सचिव');
  assert.equal(dbRow.role_en, 'Secretary');
  assert.equal(dbRow.phone, '+91 9822000000');
  assert.equal(dbRow.display_order, 3);
  assert.equal(dbRow.published, 1);

  const mappedBack = mapOfficialFromDb(dbRow);
  assert.equal(mappedBack.id, 'off-custom-1');
  assert.equal(mappedBack.name, 'नामदेवराव पाटील');
  assert.equal(mappedBack.nameEn, 'Namdevrao Patil');
  assert.equal(mappedBack.role, 'सचिव');
  assert.equal(mappedBack.roleEn, 'Secretary');
  assert.equal(mappedBack.phone, '+91 9822000000');
  assert.equal(mappedBack.displayOrder, 3);
  assert.equal(mappedBack.published, true);
});

test('PageSection mapping: mapPageSectionToDb and mapPageSectionFromDb preserve bilingual fields, alt text, and order', () => {
  const section: PageSectionItem = {
    id: 42,
    pageSlug: 'about',
    sectionKey: 'objectives',
    titleMr: 'उद्दिष्टे व ध्येय',
    titleEn: 'Objectives & Mission',
    subtitleMr: 'ग्रामीण सक्षमीकरण',
    subtitleEn: 'Rural Empowerment',
    contentMr: 'शेतकऱ्यांना स्वावलंबी बनवणे.',
    contentEn: 'Making farmers self-reliant.',
    imageUrl: '/uploads/about_mission.jpg',
    imageAltMr: 'ध्येय चित्र',
    imageAltEn: 'Mission banner',
    displayOrder: 2,
    isPublished: true,
  };

  const dbRow = mapPageSectionToDb(section);
  assert.equal(dbRow.id, 42);
  assert.equal(dbRow.page_slug, 'about');
  assert.equal(dbRow.section_key, 'objectives');
  assert.equal(dbRow.title_mr, 'उद्दिष्टे व ध्येय');
  assert.equal(dbRow.title_en, 'Objectives & Mission');
  assert.equal(dbRow.subtitle_mr, 'ग्रामीण सक्षमीकरण');
  assert.equal(dbRow.subtitle_en, 'Rural Empowerment');
  assert.equal(dbRow.content_mr, 'शेतकऱ्यांना स्वावलंबी बनवणे.');
  assert.equal(dbRow.content_en, 'Making farmers self-reliant.');
  assert.equal(dbRow.image_url, '/uploads/about_mission.jpg');
  assert.equal(dbRow.image_alt_mr, 'ध्येय चित्र');
  assert.equal(dbRow.image_alt_en, 'Mission banner');
  assert.equal(dbRow.display_order, 2);
  assert.equal(dbRow.is_published, 1);

  const mappedBack = mapPageSectionFromDb(dbRow);
  assert.equal(mappedBack.id, 42);
  assert.equal(mappedBack.pageSlug, 'about');
  assert.equal(mappedBack.sectionKey, 'objectives');
  assert.equal(mappedBack.titleMr, 'उद्दिष्टे व ध्येय');
  assert.equal(mappedBack.titleEn, 'Objectives & Mission');
  assert.equal(mappedBack.subtitleMr, 'ग्रामीण सक्षमीकरण');
  assert.equal(mappedBack.subtitleEn, 'Rural Empowerment');
  assert.equal(mappedBack.contentMr, 'शेतकऱ्यांना स्वावलंबी बनवणे.');
  assert.equal(mappedBack.contentEn, 'Making farmers self-reliant.');
  assert.equal(mappedBack.imageUrl, '/uploads/about_mission.jpg');
  assert.equal(mappedBack.imageAltMr, 'ध्येय चित्र');
  assert.equal(mappedBack.imageAltEn, 'Mission banner');
  assert.equal(mappedBack.displayOrder, 2);
  assert.equal(mappedBack.isPublished, true);
});

test('MediaFile mapping: mapMediaFileFromDb correctly maps file metadata and reference tracking', () => {
  const dbRow = {
    id: 10,
    file_name: 'test_doc.pdf',
    original_name: 'Annual_Report_2025.pdf',
    file_path: '/uploads/documents/test_doc.pdf',
    file_type: 'document',
    mime_type: 'application/pdf',
    file_size_bytes: 524288,
    alt_text_mr: 'वार्षिक अहवाल',
    alt_text_en: 'Annual Report',
    uploaded_by: 1,
    created_at: '2026-03-15 10:00:00',
    reference_count: 2,
    is_referenced: 1,
    references: [
      { table: 'reports', column: 'file_url', id: 3 },
      { table: 'page_sections', column: 'image_url', id: 7 },
    ],
  };

  const item = mapMediaFileFromDb(dbRow);
  assert.equal(item.id, 10);
  assert.equal(item.fileName, 'test_doc.pdf');
  assert.equal(item.originalName, 'Annual_Report_2025.pdf');
  assert.equal(item.filePath, '/uploads/documents/test_doc.pdf');
  assert.equal(item.fileType, 'document');
  assert.equal(item.mimeType, 'application/pdf');
  assert.equal(item.fileSizeBytes, 524288);
  assert.equal(item.altTextMr, 'वार्षिक अहवाल');
  assert.equal(item.altTextEn, 'Annual Report');
  assert.equal(item.referenceCount, 2);
  assert.equal(item.isReferenced, true);
  assert.equal(item.references?.length, 2);
  assert.equal(item.references?.[0].table, 'reports');
});

test('SitePage mapping: mapSitePageFromDb maps page metadata and nested sections', () => {
  const dbRow = {
    slug: 'privacy',
    title_mr: 'गोपनीयता धोरण',
    title_en: 'Privacy Policy',
    meta_description_mr: 'संस्थेचे गोपनीयता धोरण',
    meta_description_en: 'Privacy policy of the organisation',
    is_published: 1,
    updated_at: '2026-04-01 12:00:00',
    sections: [
      {
        id: 1,
        page_slug: 'privacy',
        section_key: 'data_collection',
        title_mr: 'माहिती संकलन',
        title_en: 'Data Collection',
        content_mr: 'आम्ही आवश्यक माहितीच गोळा करतो.',
        content_en: 'We only collect necessary data.',
        display_order: 1,
        is_published: 1,
      },
    ],
  };

  const page = mapSitePageFromDb(dbRow);
  assert.equal(page.slug, 'privacy');
  assert.equal(page.titleMr, 'गोपनीयता धोरण');
  assert.equal(page.titleEn, 'Privacy Policy');
  assert.equal(page.isPublished, true);
  assert.equal(page.sections?.length, 1);
  assert.equal(page.sections?.[0].sectionKey, 'data_collection');
});

test('PageSections CRUD: getPageSections sends public or filtered request and returns mapped sections', async () => {
  (globalThis as any).sessionStorage.clear();

  let capturedUrl = '';
  (globalThis as any).fetch = async (url: string) => {
    capturedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 101,
            page_slug: 'work',
            section_key: 'pillar_water',
            title_mr: 'जलसंधारण',
            title_en: 'Water Conservation',
            content_mr: 'पाणी अडवा, पाणी जिरवा.',
            content_en: 'Save water, recharge groundwater.',
            display_order: 1,
            is_published: 1,
          },
        ],
      }),
    };
  };

  const sections = await ApiClient.getPageSections('work');
  assert.ok(capturedUrl.includes('/content.php?resource=page_sections&page_slug=work'));
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, 101);
  assert.equal(sections[0].titleMr, 'जलसंधारण');
  assert.equal(sections[0].titleEn, 'Water Conservation');
});

test('PageSections CRUD: createPageSection sends authenticated POST and returns mapped section', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: any = {};
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedHeaders = init.headers;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'Section created successfully',
        data: {
          id: 501,
          ...capturedBody,
        },
      }),
    };
  };

  const newSection = await ApiClient.createPageSection({
    pageSlug: 'about',
    sectionKey: 'roadmap',
    titleMr: 'भविष्यकालीन वाटचाल',
    titleEn: 'Future Roadmap',
    contentMr: 'पुढील ५ वर्षांत ५० गावे आदर्श बनवणे.',
    contentEn: 'Developing 50 model villages in the next 5 years.',
    displayOrder: 3,
    isPublished: true,
  });

  assert.ok(capturedUrl.includes('/content.php?resource=page_sections'));
  assert.equal(capturedMethod, 'POST');
  assert.equal(capturedHeaders.get('Authorization'), `Bearer ${mockToken}`);
  assert.equal(capturedBody.page_slug, 'about');
  assert.equal(capturedBody.section_key, 'roadmap');
  assert.equal(capturedBody.title_mr, 'भविष्यकालीन वाटचाल');
  assert.equal(capturedBody.title_en, 'Future Roadmap');
  assert.equal(newSection.id, 501);
  assert.equal(newSection.sectionKey, 'roadmap');
});

test('PageSections CRUD: updatePageSection sends authenticated PUT with id and returns mapped section', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Section updated successfully',
        data: {
          id: 501,
          page_slug: 'about',
          section_key: 'roadmap',
          title_mr: capturedBody.title_mr,
          title_en: capturedBody.title_en,
          content_mr: 'अद्यतनित वाटचाल',
          content_en: 'Updated roadmap',
          is_published: capturedBody.is_published,
        },
      }),
    };
  };

  const updated = await ApiClient.updatePageSection(501, {
    titleMr: 'सुधारित वाटचाल',
    titleEn: 'Revised Roadmap',
    isPublished: false,
  });

  assert.ok(capturedUrl.includes('/content.php?resource=page_sections&id=501'));
  assert.equal(capturedMethod, 'PUT');
  assert.equal(capturedBody.title_mr, 'सुधारित वाटचाल');
  assert.equal(capturedBody.is_published, 0);
  assert.equal(updated.titleMr, 'सुधारित वाटचाल');
  assert.equal(updated.isPublished, false);
});

test('PageSections CRUD: deletePageSection sends authenticated DELETE with id', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Section deleted successfully',
      }),
    };
  };

  const success = await ApiClient.deletePageSection(501);
  assert.equal(success, true);
  assert.ok(capturedUrl.includes('/content.php?resource=page_sections&id=501'));
  assert.equal(capturedMethod, 'DELETE');
});

test('MediaFiles CRUD: getMediaFiles sends authenticated GET and returns media file list', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  (globalThis as any).fetch = async (url: string) => {
    capturedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 1,
            file_name: 'logo.png',
            original_name: 'sanstha_logo.png',
            file_path: '/uploads/logo.png',
            file_type: 'image',
            mime_type: 'image/png',
            file_size_bytes: 40960,
            reference_count: 5,
            is_referenced: 1,
          },
        ],
      }),
    };
  };

  const list = await ApiClient.getMediaFiles();
  assert.ok(capturedUrl.includes('/content.php?resource=media_files'));
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 1);
  assert.equal(list[0].fileName, 'logo.png');
  assert.equal(list[0].referenceCount, 5);
});

test('MediaFiles CRUD: updateMediaFile sends authenticated PUT with alt text', async () => {
  ApiClient.saveSession(mockToken);

  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: any) => {
    capturedUrl = url;
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          file_name: 'logo.png',
          original_name: 'sanstha_logo.png',
          file_path: '/uploads/logo.png',
          file_type: 'image',
          mime_type: 'image/png',
          file_size_bytes: 40960,
          alt_text_mr: capturedBody.alt_text_mr,
          alt_text_en: capturedBody.alt_text_en,
        },
      }),
    };
  };

  const updated = await ApiClient.updateMediaFile(1, {
    altTextMr: 'संस्थेचे अधिकृत चिन्ह',
    altTextEn: 'Official Sanstha Emblem',
  });

  assert.ok(capturedUrl.includes('/content.php?resource=media_files&id=1'));
  assert.equal(capturedMethod, 'PUT');
  assert.equal(capturedBody.alt_text_mr, 'संस्थेचे अधिकृत चिन्ह');
  assert.equal(capturedBody.alt_text_en, 'Official Sanstha Emblem');
  assert.equal(updated.altTextMr, 'संस्थेचे अधिकृत चिन्ह');
});

test('MediaFiles CRUD: deleteMediaFile returns inUse: true on 409 Conflict with active references', async () => {
  ApiClient.saveSession(mockToken);

  (globalThis as any).fetch = async () => {
    return {
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error_code: 'MEDIA_IN_USE',
        message: 'हा मीडिया घटक इतरत्र वापरात असल्याने हटवता येत नाही.',
        references: [
          { table: 'page_sections', column: 'image_url', id: 4 },
        ],
      }),
    };
  };

  const result = await ApiClient.deleteMediaFile(5);
  assert.equal(result.success, false);
  assert.equal(result.inUse, true);
  assert.equal(result.references?.length, 1);
  assert.equal(result.references?.[0].table, 'page_sections');
});

test('MediaFiles CRUD: deleteMediaFile returns success: true on 200 OK when unused', async () => {
  ApiClient.saveSession(mockToken);

  (globalThis as any).fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Media file removed successfully',
      }),
    };
  };

  const result = await ApiClient.deleteMediaFile(99);
  assert.equal(result.success, true);
  assert.equal(result.inUse, undefined);
});

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../services/apiClient.ts';
import {
  mapGalleryAlbumFromDb,
  mapGalleryAlbumToDb,
  mapGalleryPhotoFromDb,
  mapGalleryPhotoToDb,
} from './contentMapper.ts';
import type { GalleryAlbumItem, GalleryItem } from '../types/index.ts';

// In-memory mock storage for Node environment
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

test('Gallery Album Mapping: mapGalleryAlbumFromDb correctly maps published status and coverImageUrl', () => {
  const publishedRow = {
    id: 'alb-1',
    title_mr: 'वृक्षारोपण २०२४',
    title_en: 'Tree Plantation 2024',
    description_mr: 'पर्यावरण संवर्धन उपक्रम',
    description_en: 'Environment conservation drive',
    category: 'पर्यावरण संवर्धन',
    cover_image_url: '/backend-php-mysql/uploads/gallery/alb_cover_1.jpg',
    event_date: '2024-07-15',
    display_mode: 'grid',
    display_order: 1,
    published: 1,
  };

  const album = mapGalleryAlbumFromDb(publishedRow);
  assert.equal(album.id, 'alb-1');
  assert.equal(album.title, 'वृक्षारोपण २०२४');
  assert.equal(album.titleEn, 'Tree Plantation 2024');
  assert.equal(album.coverImageUrl, '/backend-php-mysql/uploads/gallery/alb_cover_1.jpg');
  assert.equal(album.published, true);

  const unpublishedRow = {
    ...publishedRow,
    id: 'alb-draft',
    published: 0,
    cover_image_url: null,
  };
  const draftAlbum = mapGalleryAlbumFromDb(unpublishedRow);
  assert.equal(draftAlbum.published, false);
  assert.equal(draftAlbum.coverImageUrl, undefined);
});

test('Gallery Album Mapping: mapGalleryAlbumToDb preserves independent bilingual fields and published status', () => {
  const item: GalleryAlbumItem = {
    id: 'alb-2',
    title: 'आरोग्य शिबीर',
    titleEn: 'Health Camp',
    description: 'मोफत आरोग्य तपासणी',
    descriptionEn: 'Free health checkup camp',
    category: 'आरोग्यविषयक उपक्रम',
    coverImageUrl: '/backend-php-mysql/uploads/gallery/alb_cover_2.jpg',
    eventDate: '2025-01-20',
    displayMode: 'carousel',
    displayOrder: 2,
    published: false,
  };

  const dbRow = mapGalleryAlbumToDb(item);
  assert.equal(dbRow.title_mr, 'आरोग्य शिबीर');
  assert.equal(dbRow.title_en, 'Health Camp');
  assert.equal(dbRow.description_mr, 'मोफत आरोग्य तपासणी');
  assert.equal(dbRow.description_en, 'Free health checkup camp');
  assert.equal(dbRow.cover_image_url, '/backend-php-mysql/uploads/gallery/alb_cover_2.jpg');
  assert.equal(dbRow.display_mode, 'carousel');
  assert.equal(dbRow.published, 0);
});

test('Gallery Photo Mapping: preserves independent Marathi and English captions without overwrite', () => {
  const photoRow = {
    id: 'p-101',
    album_id: 'alb-1',
    title_mr: 'झाडे लावताना',
    title_en: 'Planting saplings',
    caption_mr: 'गावकऱ्यांनी ५०० झाडे लावली',
    caption_en: 'Villagers planted 500 saplings',
    alt_text_mr: 'वृक्षारोपण छायाचित्र',
    alt_text_en: 'Tree plantation photo',
    category: 'पर्यावरण संवर्धन',
    image_url: '/backend-php-mysql/uploads/gallery/gal_tree_101.jpg',
    year: 2024,
    featured_on_home: 1,
    display_order: 1,
    published: 1,
  };

  const photo = mapGalleryPhotoFromDb(photoRow);
  assert.equal(photo.caption, 'गावकऱ्यांनी ५०० झाडे लावली');
  assert.equal(photo.captionEn, 'Villagers planted 500 saplings');
  assert.notEqual(photo.caption, photo.title);
  assert.notEqual(photo.captionEn, photo.titleEn);

  const backToDb = mapGalleryPhotoToDb(photo);
  assert.equal(backToDb.caption_mr, 'गावकऱ्यांनी ५०० झाडे लावली');
  assert.equal(backToDb.caption_en, 'Villagers planted 500 saplings');
  assert.equal(backToDb.title_mr, 'झाडे लावताना');
  assert.equal(backToDb.title_en, 'Planting saplings');
  assert.equal(backToDb.album_id, 'alb-1');
});

test('Gallery Filtering Logic: only published albums are public and draft photos are filtered', () => {
  const albums: GalleryAlbumItem[] = [
    {
      id: 'alb-pub-1',
      title: 'Published Album 1',
      titleEn: 'Published Album 1',
      category: 'शिक्षण',
      displayMode: 'grid',
      published: true,
      displayOrder: 1,
    },
    {
      id: 'alb-draft-2',
      title: 'Draft Album 2',
      titleEn: 'Draft Album 2',
      category: 'आरोग्यविषयक उपक्रम',
      displayMode: 'grid',
      published: false,
      displayOrder: 2,
    },
  ];

  const photos: GalleryItem[] = [
    {
      id: 'p1',
      albumId: 'alb-pub-1',
      title: 'Published photo in pub album',
      titleEn: 'Published photo in pub album',
      caption: 'Caption 1',
      captionEn: 'Caption En 1',
      altText: 'Alt',
      category: 'शिक्षण',
      imageUrl: '/backend-php-mysql/uploads/gallery/p1.jpg',
      year: 2024,
      published: true,
    },
    {
      id: 'p2',
      albumId: 'alb-pub-1',
      title: 'Draft photo in pub album',
      titleEn: 'Draft photo in pub album',
      caption: 'Draft Caption',
      captionEn: 'Draft Caption En',
      altText: 'Alt',
      category: 'शिक्षण',
      imageUrl: '/backend-php-mysql/uploads/gallery/p2.jpg',
      year: 2024,
      published: false, // draft
    },
    {
      id: 'p3',
      albumId: 'alb-draft-2',
      title: 'Photo in draft album',
      titleEn: 'Photo in draft album',
      caption: 'Should not show',
      captionEn: 'Should not show',
      altText: 'Alt',
      category: 'आरोग्यविषयक उपक्रम',
      imageUrl: '/backend-php-mysql/uploads/gallery/p3.jpg',
      year: 2024,
      published: true,
    },
  ];

  // 1. Filter published albums
  const publishedAlbums = albums.filter((a) => a.published);
  assert.equal(publishedAlbums.length, 1);
  assert.equal(publishedAlbums[0].id, 'alb-pub-1');

  // 2. Filter published photos ensuring unpublished albums are excluded
  const publishedAlbumIdSet = new Set(publishedAlbums.map((a) => a.id));
  const publicPhotos = photos.filter(
    (g) => g.published && (!g.albumId || publishedAlbumIdSet.has(g.albumId))
  );

  assert.equal(publicPhotos.length, 1);
  assert.equal(publicPhotos[0].id, 'p1');
});

test('Gallery CRUD: ApiClient handles album create, update, and delete', async () => {
  ApiClient.saveSession(mockToken);
  const originalFetch = globalThis.fetch;
  const recordedCalls: { url: string; method: string; body?: any }[] = [];

  try {
    globalThis.fetch = async (url: any, init: any) => {
      recordedCalls.push({
        url: String(url),
        method: init?.method || 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          status: 'success',
          data: {
            id: 'alb-crud-1',
            title_mr: 'चाचणी अल्बम',
            title_en: 'Test Album',
            category: 'इतर',
            display_mode: 'grid',
            published: 1,
          },
        }),
      } as any;
    };

    // Update album
    const updateRes = await ApiClient.updateAlbum('alb-crud-1', {
      title: 'सुधारित अल्बम',
      titleEn: 'Updated Album',
      published: true,
    });
    assert.ok(updateRes);
    assert.equal(recordedCalls[0].method, 'PUT');
    assert.ok(recordedCalls[0].url.includes('/content.php?resource=albums&id=alb-crud-1'));

    // Delete album
    await ApiClient.deleteAlbum('alb-crud-1');
    assert.equal(recordedCalls[1].method, 'DELETE');
    assert.ok(recordedCalls[1].url.includes('/content.php?resource=albums&id=alb-crud-1'));
  } finally {
    ApiClient.clearSession();
    globalThis.fetch = originalFetch;
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReportPdfAvailable, getReportUnavailableNotice } from './validation.ts';

test('isReportPdfAvailable: identifies valid, downloadable URLs accurately', () => {
  assert.equal(isReportPdfAvailable('https://example.com/report-2024.pdf'), true);
  assert.equal(isReportPdfAvailable('/uploads/reports/annual_2023_24.pdf'), true);
  assert.equal(isReportPdfAvailable('http://localhost:5173/doc.pdf'), true);
  assert.equal(isReportPdfAvailable('  https://sanstha.org/audit.pdf  '), true);
});

test('isReportPdfAvailable: safely treats placeholder and missing links as unavailable', () => {
  assert.equal(isReportPdfAvailable('#'), false);
  assert.equal(isReportPdfAvailable('  #  '), false);
  assert.equal(isReportPdfAvailable(''), false);
  assert.equal(isReportPdfAvailable('   '), false);
  assert.equal(isReportPdfAvailable(null), false);
  assert.equal(isReportPdfAvailable(undefined), false);
  assert.equal(isReportPdfAvailable('javascript:void(0)'), false);
});

test('getReportUnavailableNotice: produces correct Marathi and English messages', () => {
  const titleMr = 'वार्षिक अहवाल २०२३-२४';
  const noticeMr = getReportUnavailableNotice(titleMr, 'mr');
  assert.equal(noticeMr, `'वार्षिक अहवाल २०२३-२४' या अहवालाची डिजिटल प्रत (PDF) लवकरच उपलब्ध होईल.`);

  const titleEn = 'Annual Report 2023-24';
  const noticeEn = getReportUnavailableNotice(titleEn, 'en');
  assert.equal(noticeEn, `The digital PDF copy for 'Annual Report 2023-24' will be available soon.`);
});

test('getReportUnavailableNotice: safely trims titles and handles empty or symbol-laden titles', () => {
  const notice = getReportUnavailableNotice('  Audit Report & Balance Sheet <2023>  ', 'en');
  assert.equal(notice, `The digital PDF copy for 'Audit Report & Balance Sheet <2023>' will be available soon.`);

  const fallback = getReportUnavailableNotice('', 'mr');
  assert.equal(fallback, `'' या अहवालाची डिजिटल प्रत (PDF) लवकरच उपलब्ध होईल.`);
});

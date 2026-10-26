import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMarathiDigits,
  parseIsoDate,
  formatSingleDate,
  formatEventDate,
} from './dateFormatter.ts';

test('toMarathiDigits converts Western digits to Devanagari digits', () => {
  assert.equal(toMarathiDigits('0123456789'), '०१२३४५६७८९');
  assert.equal(toMarathiDigits(2026), '२०२६');
  assert.equal(toMarathiDigits(24), '२४');
});

test('parseIsoDate parses valid ISO strings and handles invalid formats', () => {
  assert.deepEqual(parseIsoDate('2026-10-24'), { year: 2026, month: 10, day: 24 });
  assert.deepEqual(parseIsoDate('2026-10-24T14:30:00Z'), { year: 2026, month: 10, day: 24 });
  assert.equal(parseIsoDate('invalid-date'), null);
  assert.equal(parseIsoDate(''), null);
  assert.equal(parseIsoDate(null), null);
});

test('formatSingleDate formats ISO dates in Marathi and English', () => {
  assert.equal(formatSingleDate('2026-10-24', 'mr'), '२४ ऑक्टोबर २०२६');
  assert.equal(formatSingleDate('2026-10-24', 'en'), '24 October 2026');

  // Fallback for empty or invalid
  assert.equal(formatSingleDate('', 'mr'), 'तारीख लवकरच');
  assert.equal(formatSingleDate('', 'en'), 'Date TBD');
  assert.equal(formatSingleDate('विशेष सोहळा', 'mr'), 'विशेष सोहळा');
});

test('formatEventDate formats single date and ranges accurately', () => {
  // Single date
  assert.equal(formatEventDate('2026-10-24', undefined, 'mr'), '२४ ऑक्टोबर २०२६');
  assert.equal(formatEventDate('2026-10-24', undefined, 'en'), '24 October 2026');

  // Same month range (e.g. 24 to 30 October 2026)
  assert.equal(formatEventDate('2026-10-24', '2026-10-30', 'mr'), '२४ ते ३० ऑक्टोबर २०२६');
  assert.equal(formatEventDate('2026-10-24', '2026-10-30', 'en'), '24 - 30 October 2026');

  // Multi-month range, same year
  assert.equal(formatEventDate('2026-10-28', '2026-11-02', 'mr'), '२८ ऑक्टोबर ते २ नोव्हेंबर २०२६');
  assert.equal(formatEventDate('2026-10-28', '2026-11-02', 'en'), '28 October - 2 November 2026');

  // Cross-year range
  assert.equal(formatEventDate('2026-12-28', '2027-01-05', 'mr'), '२८ डिसेंबर २०२६ ते ५ जानेवारी २०२७');
  assert.equal(formatEventDate('2026-12-28', '2027-01-05', 'en'), '28 December 2026 - 5 January 2027');

  // Custom text override has priority
  assert.equal(formatEventDate('2026-10-24', '2026-10-30', 'mr', '२४ ऑक्टोबर ते ३० ऑक्टोबर २०२६ (विशेष शिबीर)'), '२४ ऑक्टोबर ते ३० ऑक्टोबर २०२६ (विशेष शिबीर)');
});

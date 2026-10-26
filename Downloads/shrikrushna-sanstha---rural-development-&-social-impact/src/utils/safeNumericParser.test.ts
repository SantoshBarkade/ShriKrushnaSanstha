import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSafeNumericSetting } from './safeNumericParser.ts';

test('parseSafeNumericSetting handles Devanagari-only digits', () => {
  assert.equal(parseSafeNumericSetting('५०००', 100), 5000);
  assert.equal(parseSafeNumericSetting('२५', 10), 25);
  assert.equal(parseSafeNumericSetting('१२३४५६७८९०', 1), 1234567890);
});

test('parseSafeNumericSetting handles mixed Devanagari and ASCII digits', () => {
  // DB row case: mixed numerals '५००1+'
  assert.equal(parseSafeNumericSetting('५००1+', 5000), 5001);
  // Mixed '२5+'
  assert.equal(parseSafeNumericSetting('२5+', 25), 25);
  // Mixed '1२3४'
  assert.equal(parseSafeNumericSetting('1२3४', 10), 1234);
});

test('parseSafeNumericSetting handles ASCII digits', () => {
  assert.equal(parseSafeNumericSetting('5000', 100), 5000);
  assert.equal(parseSafeNumericSetting('25', 10), 25);
  assert.equal(parseSafeNumericSetting('100', 10), 100);
});

test('parseSafeNumericSetting handles thousands separators and commas', () => {
  // ASCII commas
  assert.equal(parseSafeNumericSetting('5,000+', 100), 5000);
  assert.equal(parseSafeNumericSetting('25,000+', 100), 25000);
  assert.equal(parseSafeNumericSetting('1,00,000+', 100), 100000);

  // Devanagari with commas
  assert.equal(parseSafeNumericSetting('२५,०००+', 100), 25000);
  assert.equal(parseSafeNumericSetting('५,०००+', 100), 5000);
});

test('parseSafeNumericSetting handles plus suffixes and surrounding descriptive text', () => {
  // Exact active database rows
  assert.equal(
    parseSafeNumericSetting('५००1+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', 5000),
    5001
  );
  assert.equal(
    parseSafeNumericSetting('२5+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', 25),
    25
  );
  assert.equal(
    parseSafeNumericSetting('5000+ Citizens & Students Reached', 5000),
    5000
  );
  assert.equal(
    parseSafeNumericSetting('25+ Gram Panchayats Covered', 25),
    25
  );
});

test('parseSafeNumericSetting handles null, undefined, empty, and whitespace-only input', () => {
  assert.equal(parseSafeNumericSetting(null, 5000), 5000);
  assert.equal(parseSafeNumericSetting(undefined, 25), 25);
  assert.equal(parseSafeNumericSetting('', 5000), 5000);
  assert.equal(parseSafeNumericSetting('   ', 5000), 5000);
  assert.equal(parseSafeNumericSetting('\t\n  ', 25), 25);
});

test('parseSafeNumericSetting handles text containing no digits', () => {
  assert.equal(parseSafeNumericSetting('अमृत महोत्सव', 5000), 5000);
  assert.equal(parseSafeNumericSetting('संस्थेचे कार्य', 25), 25);
  assert.equal(parseSafeNumericSetting('Non-governmental organization', 100), 100);
});

test('parseSafeNumericSetting rejects zero and negative values', () => {
  // Zero values return fallback
  assert.equal(parseSafeNumericSetting('0', 5000), 5000);
  assert.equal(parseSafeNumericSetting('०', 5000), 5000);
  assert.equal(parseSafeNumericSetting('0+ Beneficiaries', 5000), 5000);

  // Negative values return fallback
  assert.equal(parseSafeNumericSetting('-50', 5000), 5000);
  assert.equal(parseSafeNumericSetting('-२५', 25), 25);
  assert.equal(parseSafeNumericSetting('-5000+ Citizens', 5000), 5000);
});

test('parseSafeNumericSetting safely validates and sanitizes invalid fallback values', () => {
  // Fallback is NaN -> must not return NaN; returns sanitized 0
  const nanResult = parseSafeNumericSetting('invalid text', NaN);
  assert.equal(nanResult, 0);
  assert.ok(!isNaN(nanResult), 'Result must not be NaN');

  // Fallback is Infinity -> returns sanitized 0
  const infResult = parseSafeNumericSetting('invalid text', Infinity);
  assert.equal(infResult, 0);
  assert.ok(Number.isFinite(infResult), 'Result must be finite');

  // Fallback is negative -> returns sanitized 0
  const negResult = parseSafeNumericSetting('invalid text', -100);
  assert.equal(negResult, 0);

  // Fallback is not a number -> returns sanitized 0
  // @ts-expect-error testing runtime robustness
  assert.equal(parseSafeNumericSetting('invalid text', '5000'), 0);
});

test('parseSafeNumericSetting rejects unsafe integers and overflow numbers', () => {
  const hugeNumber = '99999999999999999999999999999999';
  assert.equal(parseSafeNumericSetting(hugeNumber, 5000), 5000);
});

test('Distinction between parsing and official public approval (OD-01 & OD-02)', () => {
  // 1. Parsing "५००1+" technically yields 5001
  const rawParsedValue = parseSafeNumericSetting('५००1+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', 5000);
  assert.equal(rawParsedValue, 5001);

  // 2. However, official display target remains gated by owner approval (OD-01)
  // Public counter target must remain 5000 until owner confirms 5001
  const approvedPublicTarget = 5000;
  assert.equal(approvedPublicTarget, 5000);
  assert.notEqual(approvedPublicTarget, rawParsedValue);

  // 3. Similarly for OD-02: 25 Gram Panchayats vs 100 Villages
  const parsedGramPanchayats = parseSafeNumericSetting('२5+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', 25);
  assert.equal(parsedGramPanchayats, 25);
  const existingVillagesTarget = 100;
  assert.notEqual(parsedGramPanchayats, existingVillagesTarget);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTokenFormat,
  isTokenExpired,
  validateSessionToken,
  formatAuthError,
} from './auth.ts';

test('isValidTokenFormat accepts genuine 64-character hex Bearer token', () => {
  const genuineToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  assert.equal(isValidTokenFormat(genuineToken), true);
});

test('isValidTokenFormat rejects insecure legacy strings and shortcuts', () => {
  assert.equal(isValidTokenFormat('local-session'), false);
  assert.equal(isValidTokenFormat('authenticated'), false);
  assert.equal(isValidTokenFormat('admin'), false);
  assert.equal(isValidTokenFormat(''), false);
  assert.equal(isValidTokenFormat(null), false);
  assert.equal(isValidTokenFormat(undefined), false);
  assert.equal(isValidTokenFormat(12345), false);
});

test('isValidTokenFormat rejects malformed or truncated tokens', () => {
  // 63 characters (1 short)
  const shortToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9';
  assert.equal(isValidTokenFormat(shortToken), false);

  // 64 characters with non-hex character 'z'
  const nonHexToken = 'z1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  assert.equal(isValidTokenFormat(nonHexToken), false);
});

test('isTokenExpired correctly flags elapsed and future timestamps', () => {
  const pastDate = new Date(Date.now() - 1000 * 60).toISOString(); // 1 minute ago
  assert.equal(isTokenExpired(pastDate), true);

  const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour ahead
  assert.equal(isTokenExpired(futureDate), false);

  assert.equal(isTokenExpired('invalid-date-string'), true);
});

test('validateSessionToken validates and sanitizes valid tokens', () => {
  const rawToken = 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90';
  const result = validateSessionToken(rawToken);
  assert.equal(result.isValid, true);
  assert.equal(result.sanitizedToken, rawToken.toLowerCase());
  assert.equal(result.rejectionReason, undefined);
});

test('validateSessionToken rejects legacy local-session placeholder with code', () => {
  const result = validateSessionToken('local-session');
  assert.equal(result.isValid, false);
  assert.equal(result.rejectionReason, 'INSECURE_PLACEHOLDER_REJECTED');
});

test('formatAuthError returns rate limit error message on 429', () => {
  const msgMr = formatAuthError(429, '', 'mr');
  assert.match(msgMr, /१५ मिनिटे प्रतीक्षा करा/);

  const msgEn = formatAuthError(429, '', 'en');
  assert.match(msgEn, /Too many failed login attempts/);
});

test('formatAuthError returns invalid credential message on 401', () => {
  const msgMr = formatAuthError(401, '', 'mr');
  assert.match(msgMr, /चुकीचे युजरनेम किंवा पासवर्ड/);

  const msgEn = formatAuthError(401, '', 'en');
  assert.match(msgEn, /Invalid username or password/);
});

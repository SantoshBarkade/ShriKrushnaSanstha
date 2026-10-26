/**
 * Safe Numeric Parser for CMS Settings
 *
 * Designed to parse integer target counts from CMS strings (e.g., site_settings)
 * that may contain Devanagari numerals, mixed scripts, surrounding descriptive words,
 * plus signs, or grouping commas.
 *
 * Rules:
 * 1. Fallback Validation: The provided fallback number is validated first. If it is not a finite,
 *    safe, non-negative integer, a default of 0 is substituted to guarantee that NaN or Infinity
 *    are never returned under any circumstance.
 * 2. Script Normalization: Devanagari digits (०, १, २, ३, ४, ५, ६, ७, ८, ९) are converted to ASCII (0-9).
 * 3. Commas & Signs: Locates the first sequence of digits with optional leading sign.
 *    Negative signs immediately preceding the digits cause rejection and return the fallback.
 *    Grouping commas (e.g. "२५,०००" -> "25000") are removed before parsing.
 * 4. Safety Bounds: Parsed values must be finite, safe integers (<= Number.MAX_SAFE_INTEGER),
 *    and strictly positive (> 0). Non-positive, zero, or overflow values return the fallback.
 * 5. Separation of Parsing and Approval: Extracting a numeric value from an ambiguous database
 *    string (e.g., extracting 5001 from "५००1+") does NOT constitute authorization to publish
 *    an unverified figure. Public display targets must remain gated by official approval.
 */

const DEVANAGARI_DIGIT_MAP: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

/**
 * Safely parses a positive integer target from a setting string.
 *
 * @param input Raw text from CMS setting (can be null, undefined, Devanagari, mixed, or ASCII)
 * @param fallback Number to return if parsing fails, input is missing, or number is non-positive
 * @returns A safe, positive integer, or the validated fallback
 */
export function parseSafeNumericSetting(
  input: string | null | undefined,
  fallback: number
): number {
  // Ensure fallback is safe, finite, and non-negative; guarantee never returning NaN or Infinity
  const safeFallback =
    typeof fallback === 'number' && Number.isFinite(fallback) && fallback >= 0 && Number.isSafeInteger(fallback)
      ? fallback
      : 0;

  if (!input || typeof input !== 'string') {
    return safeFallback;
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return safeFallback;
  }

  // Convert Devanagari numerals to ASCII numerals
  const normalized = trimmed.replace(/[०-९]/g, (char) => DEVANAGARI_DIGIT_MAP[char] || char);

  // Match the first number sequence (with optional leading sign and grouping commas)
  const match = normalized.match(/[-+]?\d[\d,]*/);
  if (!match) {
    return safeFallback;
  }

  const matchedStr = match[0].replace(/,/g, '');

  // Explicitly reject negative numbers
  if (matchedStr.startsWith('-')) {
    return safeFallback;
  }

  const parsed = parseInt(matchedStr, 10);

  // Reject NaN, non-finite, unsafe integers, or non-positive results (<= 0)
  if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed) || parsed <= 0) {
    return safeFallback;
  }

  return parsed;
}

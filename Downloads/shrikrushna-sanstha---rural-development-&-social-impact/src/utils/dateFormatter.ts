/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Bilingual Event & Announcement Date Formatter
 *
 * Provides accurate, culturally respectful Marathi (देवनागरी) numeral and month
 * rendering as well as polished English date formatting.
 */

const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const MARATHI_MONTHS = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts Western Arabic digits to Marathi Devanagari numerals.
 * Example: "2026-10-24" or 24 -> "२४"
 */
export function toMarathiDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => MARATHI_DIGITS[parseInt(d, 10)]);
}

export interface ParsedDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * Parses an ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...)
 * into year, month (1-12), and day components safely without timezone shift.
 */
export function parseIsoDate(dateStr?: string | null): ParsedDate | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Formats a single parsed date into Marathi or English readable format.
 * Example:
 *   formatSingleDate('2026-10-24', 'mr') => "२४ ऑक्टोबर २०२६"
 *   formatSingleDate('2026-10-24', 'en') => "24 October 2026"
 */
export function formatSingleDate(dateStr?: string | null, lang: 'mr' | 'en' = 'mr'): string {
  const parsed = parseIsoDate(dateStr);
  if (!parsed) {
    if (dateStr && dateStr.trim()) return dateStr.trim();
    return lang === 'mr' ? 'तारीख लवकरच' : 'Date TBD';
  }

  const { year, month, day } = parsed;
  if (lang === 'mr') {
    const dayStr = toMarathiDigits(day);
    const monthStr = MARATHI_MONTHS[month - 1];
    const yearStr = toMarathiDigits(year);
    return `${dayStr} ${monthStr} ${yearStr}`;
  } else {
    const monthStr = ENGLISH_MONTHS[month - 1];
    return `${day} ${monthStr} ${year}`;
  }
}

/**
 * Formats event dates, supporting single dates, date ranges, and custom text overrides.
 *
 * Examples:
 * - Single date:
 *   formatEventDate('2026-10-24', undefined, 'mr') => "२४ ऑक्टोबर २०२६"
 *   formatEventDate('2026-10-24', undefined, 'en') => "24 October 2026"
 *
 * - Same month range:
 *   formatEventDate('2026-10-24', '2026-10-30', 'mr') => "२४ ते ३० ऑक्टोबर २०२६"
 *   formatEventDate('2026-10-24', '2026-10-30', 'en') => "24 - 30 October 2026"
 *
 * - Multi-month range (same year):
 *   formatEventDate('2026-10-28', '2026-11-02', 'mr') => "२८ ऑक्टोबर ते २ नोव्हेंबर २०२६"
 *   formatEventDate('2026-10-28', '2026-11-02', 'en') => "28 October - 2 November 2026"
 *
 * - Multi-year range:
 *   formatEventDate('2026-12-28', '2027-01-05', 'mr') => "२८ डिसेंबर २०२६ ते ५ जानेवारी २०२७"
 *   formatEventDate('2026-12-28', '2027-01-05', 'en') => "28 December 2026 - 5 January 2027"
 *
 * - Custom override text:
 *   formatEventDate('2026-10-24', undefined, 'mr', 'दिवाळी विशेष महोत्सव') => "दिवाळी विशेष महोत्सव"
 */
export function formatEventDate(
  startDate?: string | null,
  endDate?: string | null,
  lang: 'mr' | 'en' = 'mr',
  customText?: string | null
): string {
  // If custom text is provided, use it directly
  if (customText && customText.trim()) {
    return customText.trim();
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  // If no start date could be parsed
  if (!start) {
    if (startDate && startDate.trim()) return startDate.trim();
    return lang === 'mr' ? 'तारीख लवकरच' : 'Date TBD';
  }

  // If no end date or end date is identical to start date
  if (!end || (start.year === end.year && start.month === end.month && start.day === end.day)) {
    return formatSingleDate(startDate, lang);
  }

  // Handle Date Ranges
  if (lang === 'mr') {
    if (start.year === end.year && start.month === end.month) {
      // e.g. २४ ते ३० ऑक्टोबर २०२६
      return `${toMarathiDigits(start.day)} ते ${toMarathiDigits(end.day)} ${MARATHI_MONTHS[start.month - 1]} ${toMarathiDigits(start.year)}`;
    }
    if (start.year === end.year) {
      // e.g. २८ ऑक्टोबर ते २ नोव्हेंबर २०२६
      return `${toMarathiDigits(start.day)} ${MARATHI_MONTHS[start.month - 1]} ते ${toMarathiDigits(end.day)} ${MARATHI_MONTHS[end.month - 1]} ${toMarathiDigits(start.year)}`;
    }
    // Cross year: e.g. २८ डिसेंबर २०२६ ते ५ जानेवारी २०२७
    return `${toMarathiDigits(start.day)} ${MARATHI_MONTHS[start.month - 1]} ${toMarathiDigits(start.year)} ते ${toMarathiDigits(end.day)} ${MARATHI_MONTHS[end.month - 1]} ${toMarathiDigits(end.year)}`;
  } else {
    if (start.year === end.year && start.month === end.month) {
      // e.g. 24 - 30 October 2026
      return `${start.day} - ${end.day} ${ENGLISH_MONTHS[start.month - 1]} ${start.year}`;
    }
    if (start.year === end.year) {
      // e.g. 28 October - 2 November 2026
      return `${start.day} ${ENGLISH_MONTHS[start.month - 1]} - ${end.day} ${ENGLISH_MONTHS[end.month - 1]} ${start.year}`;
    }
    // Cross year: e.g. 28 December 2026 - 5 January 2027
    return `${start.day} ${ENGLISH_MONTHS[start.month - 1]} ${start.year} - ${end.day} ${ENGLISH_MONTHS[end.month - 1]} ${end.year}`;
  }
}

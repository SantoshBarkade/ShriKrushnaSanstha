const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

function parseSafeInteger(input, fallback) {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input > 0 ? Math.floor(input) : fallback;
  }
  if (!input || typeof input !== 'string') {
    return fallback;
  }

  // 1. Convert all Devanagari numerals to ASCII digits
  let normalized = input.replace(/[०-९]/g, (char) => DEVANAGARI_DIGITS[char] || char);

  // 2. Extract the first continuous sequence of ASCII digits
  const match = normalized.match(/\d+/);
  if (!match) {
    return fallback;
  }

  const parsed = parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const testCases = [
  { in: '५००1+', fb: 5000, expected: 5001 },
  { in: '२5+', fb: 25, expected: 25 },
  { in: '5000+', fb: 5000, expected: 5000 },
  { in: '25+', fb: 25, expected: 25 },
  { in: '५०००+', fb: 5000, expected: 5000 },
  { in: '५००1+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', fb: 5000, expected: 5001 },
  { in: '२5+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', fb: 25, expected: 25 },
  { in: '25,000+', fb: 5000, expected: 25 }, // Notice comma! If we have commas like 25,000, should we strip commas first?
  { in: '', fb: 5000, expected: 5000 },
  { in: null, fb: 5000, expected: 5000 },
  { in: undefined, fb: 5000, expected: 5000 },
  { in: 'abc', fb: 5000, expected: 5000 },
  { in: '-50', fb: 5000, expected: 5000 },
  { in: '0', fb: 5000, expected: 5000 }
];

console.log("Initial test run:");
testCases.forEach(tc => {
  const res = parseSafeInteger(tc.in, tc.fb);
  console.log(`Input: ${JSON.stringify(tc.in)} -> Parsed: ${res} (Expected: ${tc.expected})`);
});

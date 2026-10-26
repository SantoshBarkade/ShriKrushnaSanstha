export interface GuideEntry {
  id: string;
  keywords: string[];
  questionMr: string;
  questionEn: string;
  answerMr: string;
  answerEn: string;
}

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    id: 'mission',
    keywords: ['mission', 'ध्येय', 'काम', 'काय', 'what', 'about', 'संस्था', 'purpose'],
    questionMr: 'संस्थेचे ध्येय काय आहे?',
    questionEn: 'What is the organisation’s mission?',
    answerMr:
      'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था नादरपूर व परिसरातील ग्रामीण भागात शिक्षण, सांस्कृतिक संवर्धन, आरोग्य, पर्यावरण आणि सामाजिक विकासासाठी कार्य करते. संस्थेची दिशा: संस्कृतीचे जतन, शिक्षणाचा प्रसार आणि समृद्ध ग्रामीण विकास.',
    answerEn:
      'Shrikrushna Sanskrutik va Gramin Vikas Sanstha works in education, cultural preservation, healthcare, environment, and community welfare around Nadarpur. Its stated direction is preserving culture, advancing education, and fostering rural progress.',
  },
  {
    id: 'education',
    keywords: ['शिक्षण', 'school', 'education', 'csc', 'rte', 'विद्यालय'],
    questionMr: 'शिक्षण क्षेत्रात संस्था काय करते?',
    questionEn: 'What education work does the Sanstha do?',
    answerMr:
      'संस्था CSC बाल विद्यालय, मॉडेल लर्निंग लॅब, शालेय व्यवस्थापन समिती (SMC) बैठका आणि RTE २५% प्रवेश मार्गदर्शन यांसारखे शैक्षणिक उपक्रम राबवते.',
    answerEn:
      'The Sanstha runs CSC Bal Vidyalaya, a model learning lab, School Management Committee meetings, and RTE 25% admission guidance.',
  },
  {
    id: 'health',
    keywords: ['आरोग्य', 'health', 'camp', 'शिबीर', 'medical', 'yoga'],
    questionMr: 'आरोग्य उपक्रम कोणते आहेत?',
    questionEn: 'What healthcare programmes exist?',
    answerMr:
      '‘आरोग्य हीच खरी संपत्ती’ या ब्रीदानुसार नेत्रतपासणी, रक्तदाब, मधुमेह, व्यसनमुक्ती आणि योग-प्राणायाम शिबिरे आयोजित केली जातात. कोविड-१९ काळात अन्नधान्य व मास्क-सॅनिटायझर वाटप करण्यात आले.',
    answerEn:
      'Guided by “Health is Wealth”, the Sanstha organises eye, blood-pressure and diabetes camps, de-addiction and yoga-pranayama sessions. During COVID-19 it distributed food kits, masks and sanitiser.',
  },
  {
    id: 'culture',
    keywords: ['संस्कृती', 'culture', 'संगीत', 'music', 'कला'],
    questionMr: 'सांस्कृतिक उपक्रम कोणते?',
    questionEn: 'What cultural work is offered?',
    answerMr:
      'नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्राद्वारे गायन, वादन, नाट्य आणि लोककला कार्यक्रम आयोजित केले जातात.',
    answerEn:
      'The Shrikrishna Music Training Center in Nadarpur supports vocal music, instruments, drama and folk arts.',
  },
  {
    id: 'contact',
    keywords: ['संपर्क', 'contact', 'phone', 'email', 'पत्ता', 'address', 'वेळ'],
    questionMr: 'संपर्क कसा साधावा?',
    questionEn: 'How can I contact the Sanstha?',
    answerMr:
      'पत्ता: मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर, महाराष्ट्र. दूरध्वनी: +91 9923512482, +91 8888684966. ईमेल: shrikrushnasanstha.nadarpur@gmail.com. कार्यालयीन वेळ: सोमवार ते शनिवार, सकाळी १०:०० ते सायंकाळी ०६:००.',
    answerEn:
      'Address: At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar, Maharashtra. Phone: +91 9923512482, +91 8888684966. Email: shrikrushnasanstha.nadarpur@gmail.com. Hours: Monday–Saturday, 10:00 AM to 6:00 PM.',
  },
  {
    id: 'volunteer',
    keywords: ['स्वयंसेवक', 'volunteer', 'join', 'सहभाग', 'participate'],
    questionMr: 'सहभागी कसे व्हावे?',
    questionEn: 'How can I participate?',
    answerMr:
      'संकेतस्थळावरील स्वयंसेवक नोंदणी किंवा संपर्क पृष्ठाद्वारे सहभाग नोंदवता येतो. शिक्षण, आरोग्य, संस्कृती आणि ग्रामीण विकासाच्या उपक्रमांमध्ये हातमिळवणी करता येते.',
    answerEn:
      'Use the volunteer registration page or the contact form. Visitors can support education, healthcare, culture and rural development programmes.',
  },
  {
    id: 'schemes',
    keywords: ['योजना', 'scheme', 'निराधार', 'श्रम', 'pension', 'श्रावणबाळ'],
    questionMr: 'शासकीय योजना मार्गदर्शन मिळते का?',
    questionEn: 'Does the Sanstha help with government schemes?',
    answerMr:
      'होय. संजय गांधी निराधार, श्रावणबाळ सेवा, इंदिरा गांधी निवृत्तीवेतन, ई-श्रम कामगार कार्ड, हस्तकला कारागीर कार्ड आणि शेतकरी समृद्धी यांसारख्या योजनांसाठी कागदपत्र व पात्रता मार्गदर्शन दिले जाते.',
    answerEn:
      'Yes. The Sanstha helps people understand eligibility and paperwork for schemes such as Sanjay Gandhi Niradhar, Shravanbal Seva, national pensions, e-Shram, artisan cards and farmer welfare programmes.',
  },
  {
    id: 'registration',
    keywords: ['नोंदणी', 'registration', '14668', 'registered'],
    questionMr: 'संस्था नोंदणीकृत आहे का?',
    questionEn: 'Is the organisation registered?',
    answerMr: 'होय. नोंदणी क्रमांक: एक १४६६८ (औ).',
    answerEn: 'Yes. Registration number: Ek 14668 (A).',
  },
];

export function matchGuideEntries(query: string, limit = 3): GuideEntry[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,?.!।]+/)
    .filter((token) => token.length > 1);

  if (!tokens.length) return GUIDE_ENTRIES.slice(0, limit);

  const scored = GUIDE_ENTRIES.map((entry) => {
    const haystack = [
      ...entry.keywords,
      entry.questionMr,
      entry.questionEn,
      entry.answerMr,
      entry.answerEn,
    ]
      .join(' ')
      .toLowerCase();
    const score = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
    return { entry, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return (scored.length ? scored.map((item) => item.entry) : GUIDE_ENTRIES).slice(0, limit);
}

export function buildGroundingText(): string {
  return GUIDE_ENTRIES.map((entry) => `${entry.questionMr}\n${entry.answerMr}\n${entry.answerEn}`).join(
    '\n\n'
  );
}

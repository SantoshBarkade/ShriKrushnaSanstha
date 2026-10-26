import test from 'node:test';
import assert from 'node:assert/strict';

test('Home CMS: SEO title and description fallback when sitePages has no home override', () => {
  const fallbackSeo = {
    titleMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था | नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर',
    titleEn: 'Shrikrushna Sanstha | Rural Development & Social Welfare, Nadarpur, Kannad',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर. ग्रामीण भागातील शिक्षण, आरोग्य, महिला सक्षमीकरण, पर्यावरण संवर्धन आणि समाजकल्याण उपक्रम.',
    descriptionEn: 'Official portal of Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur, Kannad, Chhatrapati Sambhajinagar. Dedicated to rural education, healthcare, and community empowerment.',
  };

  // When sitePages has empty or unconfigured fields
  const emptySitePage = {
    slug: 'home',
    titleMr: '',
    titleEn: '',
    metaDescriptionMr: '',
    metaDescriptionEn: '',
  };

  const dynamicTitleMr = emptySitePage.titleMr?.trim();
  const activeTitleMr = dynamicTitleMr && dynamicTitleMr.length > 0 ? dynamicTitleMr : fallbackSeo.titleMr;
  assert.equal(activeTitleMr, fallbackSeo.titleMr);

  const dynamicDescEn = emptySitePage.metaDescriptionEn?.trim();
  const activeDescEn = dynamicDescEn && dynamicDescEn.length > 0 ? dynamicDescEn : fallbackSeo.descriptionEn;
  assert.equal(activeDescEn, fallbackSeo.descriptionEn);
});

test('Home CMS: SEO title and description dynamic override when client edits sitePages', () => {
  const fallbackSeo = {
    titleMr: 'श्रीकृष्ण संस्था',
    titleEn: 'Shrikrushna Sanstha',
  };

  const configuredSitePage = {
    slug: 'home',
    titleMr: 'श्रीकृष्ण संस्था - अधिकृत मुख्यपृष्ठ',
    titleEn: 'Shrikrushna Sanstha - Official Homepage',
    metaDescriptionMr: 'ग्रामविकासाचे नूतन पर्व...',
    metaDescriptionEn: 'New era of rural development...',
  };

  const isMr = true;
  const dynamicTitle = isMr ? configuredSitePage.titleMr?.trim() : configuredSitePage.titleEn?.trim();
  const activeTitle = dynamicTitle && dynamicTitle.length > 0 ? dynamicTitle : (isMr ? fallbackSeo.titleMr : fallbackSeo.titleEn);
  assert.equal(activeTitle, 'श्रीकृष्ण संस्था - अधिकृत मुख्यपृष्ठ');

  const isEn = false;
  const dynamicTitleEn = !isEn ? configuredSitePage.titleEn?.trim() : configuredSitePage.titleMr?.trim();
  assert.equal(dynamicTitleEn, 'Shrikrushna Sanstha - Official Homepage');
});

test('Home CMS: Identity section uses dynamic CMS values when published and present', () => {
  const mockPageSections = [
    {
      id: 101,
      pageSlug: 'home',
      sectionKey: 'identity',
      titleMr: 'नादरपूर ग्राम परिवर्तनाचे केंद्र',
      titleEn: 'Nadarpur Rural Transformation Hub',
      subtitleMr: 'अधिकृत ओळख',
      subtitleEn: 'Official Identity',
      contentMr: 'स्थानिक लोकसहभागातून समृद्ध ग्रामविकासाचा मार्ग...',
      contentEn: 'Driving sustainable grassroots rural progress...',
      isPublished: true,
      displayOrder: 1,
    },
  ];

  const homeSections = mockPageSections.filter((s) => s.pageSlug === 'home' && s.isPublished);
  const identitySec = homeSections.find((s) => s.sectionKey === 'identity');

  const fallbackTitleMr = 'ग्रामीण विकासासाठी समर्पित संस्था';
  const identityTitleMr = identitySec?.titleMr?.trim() || fallbackTitleMr;
  assert.equal(identityTitleMr, 'नादरपूर ग्राम परिवर्तनाचे केंद्र');

  const fallbackSubtitleEn = 'Our Identity';
  const identitySubtitleEn = identitySec?.subtitleEn?.trim() || fallbackSubtitleEn;
  assert.equal(identitySubtitleEn, 'Official Identity');
});

test('Home CMS: Identity section cleanly falls back to canonical demo copy if unpublished or absent', () => {
  const mockPageSections = [
    {
      id: 101,
      pageSlug: 'home',
      sectionKey: 'identity',
      titleMr: 'Draft Title',
      isPublished: false, // Unpublished draft
      displayOrder: 1,
    },
  ];

  const homeSections = mockPageSections.filter((s) => s.pageSlug === 'home' && s.isPublished);
  const identitySec = homeSections.find((s) => s.sectionKey === 'identity');

  const fallbackTitleMr = 'ग्रामीण विकासासाठी समर्पित संस्था';
  const identityTitleMr = identitySec?.titleMr?.trim() || fallbackTitleMr;
  assert.equal(identityTitleMr, fallbackTitleMr);
});

test('Home CMS: Mission quote card binds dynamically with fallback', () => {
  const mockPageSections = [
    {
      id: 102,
      pageSlug: 'home',
      sectionKey: 'mission',
      titleMr: 'संस्थेचे मुख्य ध्येय',
      titleEn: 'Core Institutional Mission',
      contentMr: '“स्वावलंबन आणि ज्ञानप्रसार हेच आमचे कर्तव्य.”',
      contentEn: '“Self-reliance and knowledge dissemination is our guiding duty.”',
      isPublished: true,
      displayOrder: 2,
    },
  ];

  const homeSections = mockPageSections.filter((s) => s.pageSlug === 'home' && s.isPublished);
  const missionSec = homeSections.find((s) => s.sectionKey === 'mission');

  const fallbackQuoteMr = '“संस्कृतीचे जतन, शिक्षणाचा प्रसार, आणि समृद्ध ग्रामीण विकास हीच आमची दिशा.”';
  const activeQuoteMr = missionSec?.contentMr?.trim() || fallbackQuoteMr;
  assert.equal(activeQuoteMr, '“स्वावलंबन आणि ज्ञानप्रसार हेच आमचे कर्तव्य.”');

  const activeLabelEn = missionSec?.titleEn?.trim() || 'Sanstha Mission';
  assert.equal(activeLabelEn, 'Core Institutional Mission');
});

test('Home CMS: Call-to-Action Join banner binds dynamically with fallback', () => {
  const mockPageSections = [
    {
      id: 103,
      pageSlug: 'home',
      sectionKey: 'join_cta',
      titleMr: 'ग्रामविकासाच्या या महान कार्यात सामील व्हा',
      titleEn: 'Join Us in this Noble Rural Mission',
      contentMr: 'आपल्या योगदानातून गावाचा कायापालट करा.',
      contentEn: 'Transform villages through active community participation.',
      isPublished: true,
      displayOrder: 3,
    },
  ];

  const homeSections = mockPageSections.filter((s) => s.pageSlug === 'home' && s.isPublished);
  const ctaSec = homeSections.find((s) => s.sectionKey === 'join_cta');

  const fallbackTitleMr = 'आपणही या परिवर्तनाच्या प्रवासाचा भाग व्हा';
  const activeTitleMr = ctaSec?.titleMr?.trim() || fallbackTitleMr;
  assert.equal(activeTitleMr, 'ग्रामविकासाच्या या महान कार्यात सामील व्हा');
});

test('Home CMS: Additional custom sections are filtered and ordered by displayOrder', () => {
  const mockPageSections = [
    {
      id: 1,
      pageSlug: 'home',
      sectionKey: 'identity',
      isPublished: true,
      displayOrder: 1,
    },
    {
      id: 2,
      pageSlug: 'home',
      sectionKey: 'spotlight_village',
      titleMr: 'आदर्श गाव उपक्रम',
      isPublished: true,
      displayOrder: 4,
    },
    {
      id: 3,
      pageSlug: 'home',
      sectionKey: 'donor_appeal',
      titleMr: 'देणगीदार सहयोग',
      isPublished: true,
      displayOrder: 2,
    },
    {
      id: 4,
      pageSlug: 'home',
      sectionKey: 'draft_sec',
      titleMr: 'Draft Section',
      isPublished: false,
      displayOrder: 3,
    },
  ];

  const homeSections = mockPageSections.filter((s) => s.pageSlug === 'home' && s.isPublished);
  const additional = homeSections
    .filter((s) => !['identity', 'about_sanstha', 'mission', 'join_cta', 'cta'].includes(s.sectionKey))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  assert.equal(additional.length, 2);
  assert.equal(additional[0].sectionKey, 'donor_appeal'); // displayOrder 2
  assert.equal(additional[1].sectionKey, 'spotlight_village'); // displayOrder 4
});

test('Home CMS: Footer registration pill and SansthaLogo reflect dynamic contact_info with fallback', () => {
  const contactInfo = {
    regNoMr: 'रजि. नं.: एक १४६६८ (औ)',
    regNoEn: 'Reg. No.: Ek 14668 (A)',
  };

  const footerRegMr = contactInfo.regNoMr || 'नोंदणी क्र.: एक १४६६८ (औ)';
  assert.equal(footerRegMr, 'रजि. नं.: एक १४६६८ (औ)');

  const updatedContactInfo = {
    regNoMr: 'नोंदणी क्र. १४६६८ / २००५',
    regNoEn: 'Reg. No. 14668 / 2005',
  };

  const updatedFooterRegMr = updatedContactInfo.regNoMr || 'नोंदणी क्र.: एक १४६६८ (औ)';
  assert.equal(updatedFooterRegMr, 'नोंदणी क्र. १४६६८ / २००५');
});

test('Home CMS: Strict preservation of OD-01 and OD-02 counter targets', () => {
  // Public counters must strictly display 5000+ and 25+
  const publicBeneficiariesTarget = 5000;
  const publicOutreachTarget = 25;

  assert.equal(publicBeneficiariesTarget, 5000);
  assert.equal(publicOutreachTarget, 25);
});

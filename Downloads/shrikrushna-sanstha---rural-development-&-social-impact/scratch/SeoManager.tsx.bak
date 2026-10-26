import React, { useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { PageRoute } from '../types';

interface RouteSeoMetadata {
  titleMr: string;
  titleEn: string;
  descriptionMr: string;
  descriptionEn: string;
  breadcrumbMr: string;
  breadcrumbEn: string;
}

const SEO_DIRECTORY: Record<PageRoute, RouteSeoMetadata> = {
  home: {
    titleMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था | नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर',
    titleEn: 'Shrikrushna Sanstha | Rural Development & Social Welfare, Nadarpur, Kannad',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर. ग्रामीण भागातील शिक्षण, आरोग्य, महिला सक्षमीकरण, पर्यावरण संवर्धन आणि समाजकल्याण उपक्रम.',
    descriptionEn: 'Official portal of Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur, Kannad, Chhatrapati Sambhajinagar. Dedicated to rural education, healthcare, and community empowerment.',
    breadcrumbMr: 'मुख्यपृष्ठ',
    breadcrumbEn: 'Home',
  },
  about: {
    titleMr: 'संस्थेविषयी परिचय व उद्दिष्टे | श्रीकृष्ण संस्था, नादरपूर',
    titleEn: 'About the Institution & Vision | Shrikrushna Sanstha, Nadarpur',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेची पार्श्वभूमी, कार्यक्षेत्र, ध्येये आणि ग्रामीण सक्षमीकरणाची उद्दिष्टे.',
    descriptionEn: 'History, objectives, jurisdiction, and rural development mission of Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur, Kannad.',
    breadcrumbMr: 'संस्थेविषयी',
    breadcrumbEn: 'About Us',
  },
  officials: {
    titleMr: 'विश्वस्त मंडळ व पदाधिकारी | श्रीकृष्ण संस्था, नादरपूर',
    titleEn: 'Governing Board & Leadership | Shrikrushna Sanstha, Nadarpur',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेची कार्यकारिणी, अध्यक्ष, सचिव व अधिकृत पदाधिकाऱ्यांचा परिचय.',
    descriptionEn: 'Meet the governing council, executive officials, and trustees of Shrikrushna Sanskrutik va Gramin Vikas Sanstha.',
    breadcrumbMr: 'पदाधिकारी',
    breadcrumbEn: 'Leadership',
  },
  initiatives: {
    titleMr: 'उपक्रम व समाजकल्याण कार्य | श्रीकृष्ण संस्था',
    titleEn: 'Community Initiatives & Programs | Shrikrushna Sanstha',
    descriptionMr: 'ग्रामीण भागातील शिक्षण सहाय्य, आरोग्य शिबिरे, पर्यावरण संवर्धन, महिला बचत गट व शासकीय योजना जनजागृती उपक्रम.',
    descriptionEn: 'Educational programs, healthcare camps, environmental conservation, and social initiatives run by Shrikrushna Sanstha.',
    breadcrumbMr: 'उपक्रम',
    breadcrumbEn: 'Initiatives',
  },
  work: {
    titleMr: 'कार्यप्रगती व उपक्रम कालरेषा | श्रीकृष्ण संस्था',
    titleEn: 'Work Progress & Program Timeline | Shrikrushna Sanstha',
    descriptionMr: 'संस्थेच्या स्थापनेपासून राबवलेल्या सामाजिक, सांस्कृतिक व शैक्षणिक उपक्रमांची सविस्तर कालरेषा.',
    descriptionEn: 'Milestones, social initiatives, and rural progress timeline of Shrikrushna Sanskrutik va Gramin Vikas Sanstha.',
    breadcrumbMr: 'कार्यप्रगती',
    breadcrumbEn: 'Our Work',
  },
  gallery: {
    titleMr: 'छायाचित्र गॅलरी व अल्बम | श्रीकृष्ण संस्था',
    titleEn: 'Photo Gallery & Field Albums | Shrikrushna Sanstha',
    descriptionMr: 'ग्रामीण उपक्रम, आरोग्य शिबिरे, वृक्षारोपण आणि सामाजिक कार्यक्रमांची अधिकृत छायाचित्रे.',
    descriptionEn: 'Field photo albums showcasing rural welfare programs, health camps, and social activities.',
    breadcrumbMr: 'छायाचित्र गॅलरी',
    breadcrumbEn: 'Gallery',
  },
  videos: {
    titleMr: 'व्हिडिओ संग्रह व उपक्रम वार्ता | श्रीकृष्ण संस्था',
    titleEn: 'Video Library & Field Stories | Shrikrushna Sanstha',
    descriptionMr: 'संस्थेच्या उपक्रमांचे अधिकृत व्हिडिओ, मार्गदर्शन सत्रे आणि ग्रामीण समाजकार्याचे चित्रीकरण.',
    descriptionEn: 'Official video documentations, community impact stories, and program recordings.',
    breadcrumbMr: 'व्हिडिओ संग्रह',
    breadcrumbEn: 'Videos',
  },
  reports: {
    titleMr: 'वार्षिक अहवाल व माहितीपत्रके | श्रीकृष्ण संस्था',
    titleEn: 'Annual Reports & Transparency Disclosures | Shrikrushna Sanstha',
    descriptionMr: 'संस्थेचे वार्षिक कार्य अहवाल, उपक्रम आढावा आणि कायदेशीर पारदर्शकता अहवाल.',
    descriptionEn: 'Annual activity reports, program evaluations, and institutional disclosures of Shrikrushna Sanstha.',
    breadcrumbMr: 'अहवाल',
    breadcrumbEn: 'Reports',
  },
  news: {
    titleMr: 'बातम्या व कार्यक्रम घोषणा | श्रीकृष्ण संस्था',
    titleEn: 'Announcements & Upcoming Events | Shrikrushna Sanstha',
    descriptionMr: 'संस्थेच्या आगामी उपक्रमांची माहिती, वृक्षारोपण कार्यक्रम आणि महत्त्वाच्या सार्वजनिक सूचना.',
    descriptionEn: 'Latest announcements, upcoming social events, and notices from Shrikrushna Sanstha.',
    breadcrumbMr: 'बातम्या व घोषणा',
    breadcrumbEn: 'Announcements',
  },
  events: {
    titleMr: 'आगामी व संपन्न कार्यक्रम | श्रीकृष्ण संस्था',
    titleEn: 'Community Events & Programs | Shrikrushna Sanstha',
    descriptionMr: 'संस्थेचे आगामी शिबिरे, शालेय मार्गदर्शन व संपन्न सामाजिक कार्यक्रम.',
    descriptionEn: 'Upcoming community camps, educational workshops, and completed programs by Shrikrushna Sanstha.',
    breadcrumbMr: 'कार्यक्रम',
    breadcrumbEn: 'Events',
  },
  contact: {
    titleMr: 'संपर्क कार्यालय व विचारणा | श्रीकृष्ण संस्था, नादरपूर',
    titleEn: 'Contact Office & Inquiries | Shrikrushna Sanstha, Nadarpur',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर. संपर्क क्रमांक, पत्ता आणि अधिकृत विचारणा अर्ज.',
    descriptionEn: 'Official address, contact details, and inquiry form for Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur, Kannad, Chhatrapati Sambhajinagar.',
    breadcrumbMr: 'संपर्क',
    breadcrumbEn: 'Contact Us',
  },
  volunteer: {
    titleMr: 'स्वयंसेवक नोंदणी अर्ज | श्रीकृष्ण संस्था',
    titleEn: 'Volunteer Registration Form | Shrikrushna Sanstha',
    descriptionMr: 'ग्रामीण विकास, शिक्षण आणि सामाजिक कार्यात सहभागी होण्यासाठी स्वयंसेवक नोंदणी अर्ज.',
    descriptionEn: 'Join rural community development and social impact programs. Register as an authorized volunteer.',
    breadcrumbMr: 'स्वयंसेवक व्हा',
    breadcrumbEn: 'Volunteer',
  },
  privacy: {
    titleMr: 'गोपनीयता धोरण व डेटा सुरक्षा | श्रीकृष्ण संस्था',
    titleEn: 'Privacy Policy & Data Protection | Shrikrushna Sanstha',
    descriptionMr: 'नागरिकांची माहिती सुरक्षा, संपर्क तपशील संवर्धन आणि गोपनीयता धोरण.',
    descriptionEn: 'Privacy policy, data collection terms, and user confidentiality standards of Shrikrushna Sanstha.',
    breadcrumbMr: 'गोपनीयता धोरण',
    breadcrumbEn: 'Privacy Policy',
  },
  schemes: {
    titleMr: 'शासकीय कल्याणकारी योजना व लोककल्याण कक्ष | श्रीकृष्ण संस्था',
    titleEn: 'Government Welfare Schemes & Citizen Assistance | Shrikrushna Sanstha',
    descriptionMr: 'ग्रामीण भागातील वृद्ध, निराधार, दिव्यांग, कामगार व शेतकर्‍यांसाठी विविध शासकीय योजना, पेन्शन व अनुदानाचे विनामूल्य मार्गदर्शन.',
    descriptionEn: 'Free guidance and grassroots facilitation connecting rural citizens with government welfare schemes, pensions, and social security programs.',
    breadcrumbMr: 'शासकीय योजना',
    breadcrumbEn: 'Government Schemes',
  },
  admin: {
    titleMr: 'प्रशासकीय सीएमएस पोर्टल | श्रीकृष्ण संस्था',
    titleEn: 'Admin CMS Portal | Shrikrushna Sanstha',
    descriptionMr: 'अधिकृत प्रशासकीय लॉगिन व वेबसाइट सामग्री व्यवस्थापन प्रणाली.',
    descriptionEn: 'Authorized administrative login and content management system for Shrikrushna Sanstha.',
    breadcrumbMr: 'ॲडमिन',
    breadcrumbEn: 'Admin',
  },
  terms: {
    titleMr: 'अटी व शर्ती (सेवा नियम) | श्रीकृष्ण संस्था',
    titleEn: 'Terms & Conditions of Service | Shrikrushna Sanstha',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था संकेतस्थळ वापराबाबतचे अधिकृत नियम, बौद्धिक संपदा व कायदेशीर अधिकार क्षेत्र.',
    descriptionEn: 'Official terms of acceptable use, intellectual property protection, and legal jurisdiction for Shrikrushna Sanstha.',
    breadcrumbMr: 'अटी व शर्ती',
    breadcrumbEn: 'Terms & Conditions',
  },
  sitemap: {
    titleMr: 'संकेतस्थळ नकाशा (Sitemap) | श्रीकृष्ण संस्था',
    titleEn: 'Institutional Website Sitemap | Shrikrushna Sanstha',
    descriptionMr: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेच्या संकेतस्थळावरील सर्व अधिकृत विभाग, उपक्रम, अहवाल आणि सेवांची संपूर्ण यादी.',
    descriptionEn: 'Comprehensive institutional sitemap and directory of all public routes and services by Shrikrushna Sanstha.',
    breadcrumbMr: 'संकेतस्थळ नकाशा',
    breadcrumbEn: 'Sitemap',
  },
};

/**
 * Helper to update or create an HTML meta tag
 */
function setMetaTag(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to update or create a link tag (canonical)
 */
function setCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const SeoManager: React.FC = () => {
  const { currentRoute, lang } = useSanstha();

  useEffect(() => {
    const meta = SEO_DIRECTORY[currentRoute] || SEO_DIRECTORY.home;
    const isMr = lang === 'mr';
    const activeTitle = isMr ? meta.titleMr : meta.titleEn;
    const activeDesc = isMr ? meta.descriptionMr : meta.descriptionEn;

    // 1. Update Document Title
    document.title = activeTitle;

    // 2. Update HTML Lang Attribute
    document.documentElement.lang = isMr ? 'mr' : 'en';

    // 3. Update Standard Meta Description
    setMetaTag('meta[name="description"]', 'name', 'description', activeDesc);

    // 4. Update Robots Directives (noindex for admin portal)
    const robotsContent = currentRoute === 'admin' ? 'noindex, nofollow' : 'index, follow';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 5. Canonical URL (configurable via VITE_SITE_URL environment variable for production)
    const envSiteUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SITE_URL;
    const baseUrl = envSiteUrl ? String(envSiteUrl).replace(/\/$/, '') : 'https://shrikrushnasanstha.org';
    const canonicalUrl = currentRoute === 'home' ? `${baseUrl}/` : `${baseUrl}/#/${currentRoute}`;
    setCanonicalLink(canonicalUrl);

    // 6. Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', activeTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', activeDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', isMr ? 'mr_IN' : 'en_IN');

    // 7. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', activeTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', activeDesc);

    // 8. Structured Data (JSON-LD)
    const existingScript = document.getElementById('shrikrushna-schema-ld');
    if (existingScript) {
      existingScript.remove();
    }

    const orgSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'NGO',
          '@id': `${baseUrl}/#organization`,
          name: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था',
          alternateName: 'Shrikrushna Sanskrutik va Gramin Vikas Sanstha',
          identifier: 'एक १४६६८ (औ) [Ek 14668 (A)]',
          foundingDate: '2005',
          description:
            'ग्रामीण भागातील शिक्षण, आरोग्य, महिला सक्षमीकरण आणि सामाजिक कल्याण यासाठी कार्यरत अधिकृत संस्था.',
          url: baseUrl,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'मु. पो. नादरपूर (At Post Nadarpur)',
            addressLocality: 'कन्नड, छत्रपती संभाजीनगर (Kannad, Chhatrapati Sambhajinagar)',
            addressRegion: 'महाराष्ट्र (Maharashtra)',
            postalCode: '431103',
            addressCountry: 'IN',
          },
          areaServed: {
            '@type': 'State',
            name: 'Maharashtra',
          },
          knowsLanguage: ['mr', 'en'],
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          url: baseUrl,
          name: 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था',
          inLanguage: ['mr', 'en'],
          publisher: {
            '@id': `${baseUrl}/#organization`,
          },
        },
        ...(currentRoute !== 'home'
          ? [
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: isMr ? 'मुख्यपृष्ठ' : 'Home',
                    item: `${baseUrl}/`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: isMr ? meta.breadcrumbMr : meta.breadcrumbEn,
                    item: canonicalUrl,
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const scriptElement = document.createElement('script');
    scriptElement.id = 'shrikrushna-schema-ld';
    scriptElement.type = 'application/ld+json';
    scriptElement.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(scriptElement);

    return () => {
      const el = document.getElementById('shrikrushna-schema-ld');
      if (el) {
        el.remove();
      }
    };
  }, [currentRoute, lang]);

  return null;
};

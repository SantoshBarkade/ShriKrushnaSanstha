const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const width of [1536, 1440, 1280, 1024, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto('http://localhost:5173/#/home', { waitUntil: 'networkidle' });
    const headerInfo = await page.evaluate(() => {
      const nav = document.querySelector('header nav[aria-label="Primary Navigation"]');
      const mobileNav = document.querySelector('header nav[aria-label="Quick Navigation"]');
      const headerRow = document.querySelector('header .flex.items-center.justify-between');
      return {
        desktopNavVisible: nav ? window.getComputedStyle(nav).display !== 'none' : false,
        desktopNavWidth: nav ? nav.getBoundingClientRect().width : 0,
        mobileNavVisible: mobileNav ? window.getComputedStyle(mobileNav).display !== 'none' : false,
        headerRowWidth: headerRow ? headerRow.getBoundingClientRect().width : 0,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log(`Viewport ${width}px:`, JSON.stringify(headerInfo));
    await page.close();
  }
  await browser.close();
})();

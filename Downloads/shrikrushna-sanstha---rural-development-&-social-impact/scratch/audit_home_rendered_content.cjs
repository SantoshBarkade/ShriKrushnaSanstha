const { spawn } = require('child_process');
const fs = require('fs');

async function auditRenderedHome() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9340;
  const child = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
    const target = list.find((t) => t.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((res) => {
        const mid = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === mid) {
            ws.removeEventListener('message', h);
            res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log("Navigating to http://127.0.0.1:4173/#/home in Marathi...");
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/#/home' });
    await new Promise((r) => setTimeout(r, 3000));

    // Extract DOM inspection in MR
    const mrInspection = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = [];
        
        // Header
        const header = document.querySelector('header');
        const headerItems = header ? Array.from(header.querySelectorAll('span, button, a')).map(el => ({
          tag: el.tagName,
          text: el.innerText.trim(),
          aria: el.getAttribute('aria-label') || el.getAttribute('title') || '',
          href: el.getAttribute('href') || ''
        })).filter(x => x.text || x.aria) : [];

        // Main sections
        const main = document.querySelector('main');
        const mainSections = main ? Array.from(main.querySelectorAll('section')).map((sec, idx) => {
          const headings = Array.from(sec.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText.trim());
          const paragraphs = Array.from(sec.querySelectorAll('p, blockquote')).map(p => p.innerText.trim());
          const buttons = Array.from(sec.querySelectorAll('button, a')).map(b => b.innerText.trim());
          const images = Array.from(sec.querySelectorAll('img')).map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt')
          }));
          return {
            index: idx + 1,
            className: sec.className,
            ariaLabel: sec.getAttribute('aria-label'),
            headings,
            paragraphs,
            buttons,
            images
          };
        }) : [];

        // Footer
        const footer = document.querySelector('footer');
        const footerHeadings = footer ? Array.from(footer.querySelectorAll('h3, h4')).map(h => h.innerText.trim()) : [];
        const footerLinks = footer ? Array.from(footer.querySelectorAll('li, button, a')).map(el => el.innerText.trim()).filter(Boolean) : [];
        const footerParagraphs = footer ? Array.from(footer.querySelectorAll('p')).map(p => p.innerText.trim()) : [];

        return {
          lang: document.documentElement.lang,
          title: document.title,
          headerItems,
          mainSections,
          footerHeadings,
          footerLinks,
          footerParagraphs
        };
      })()`,
      returnByValue: true
    });

    console.log("Switching to English...");
    await send('Runtime.evaluate', {
      expression: `(() => {
        const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'EN');
        if (enBtn) enBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Extract DOM inspection in EN
    const enInspection = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = [];
        const header = document.querySelector('header');
        const headerItems = header ? Array.from(header.querySelectorAll('span, button, a')).map(el => ({
          tag: el.tagName,
          text: el.innerText.trim(),
          aria: el.getAttribute('aria-label') || el.getAttribute('title') || '',
          href: el.getAttribute('href') || ''
        })).filter(x => x.text || x.aria) : [];

        const main = document.querySelector('main');
        const mainSections = main ? Array.from(main.querySelectorAll('section')).map((sec, idx) => {
          const headings = Array.from(sec.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText.trim());
          const paragraphs = Array.from(sec.querySelectorAll('p, blockquote')).map(p => p.innerText.trim());
          const buttons = Array.from(sec.querySelectorAll('button, a')).map(b => b.innerText.trim());
          const images = Array.from(sec.querySelectorAll('img')).map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt')
          }));
          return {
            index: idx + 1,
            className: sec.className,
            ariaLabel: sec.getAttribute('aria-label'),
            headings,
            paragraphs,
            buttons,
            images
          };
        }) : [];

        const footer = document.querySelector('footer');
        const footerHeadings = footer ? Array.from(footer.querySelectorAll('h3, h4')).map(h => h.innerText.trim()) : [];
        const footerLinks = footer ? Array.from(footer.querySelectorAll('li, button, a')).map(el => el.innerText.trim()).filter(Boolean) : [];
        const footerParagraphs = footer ? Array.from(footer.querySelectorAll('p')).map(p => p.innerText.trim()) : [];

        return {
          lang: document.documentElement.lang,
          title: document.title,
          headerItems,
          mainSections,
          footerHeadings,
          footerLinks,
          footerParagraphs
        };
      })()`,
      returnByValue: true
    });

    const result = {
      mr: mrInspection.result.value,
      en: enInspection.result.value
    };

    fs.writeFileSync('scratch/home_rendered_dom.json', JSON.stringify(result, null, 2));
    console.log("Successfully extracted rendered Home DOM to scratch/home_rendered_dom.json");

    ws.close();
  } finally {
    child.kill();
  }
}

auditRenderedHome().catch(console.error);

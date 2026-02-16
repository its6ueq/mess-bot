// Scan sidebar de build name -> userId registry
require('dotenv').config();
const { launchBrowser } = require('./src/browser');

async function inspect() {
  const { browser, page } = await launchBrowser();

  await page.goto('https://www.messenger.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  const url = page.url();
  if (url.includes('login')) {
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 120000 });
  }

  await new Promise(r => setTimeout(r, 5000));

  console.log('\n===== SIDEBAR SCAN =====\n');

  const data = await page.evaluate(() => {
    const result = [];

    // Lay tat ca link trong sidebar
    const links = document.querySelectorAll('a[href*="/t/"]');

    for (const link of links) {
      const href = link.getAttribute('href') || '';
      // Lay thread ID tu href
      const match = href.match(/\/t\/(\d+)/);
      if (!match) continue;

      const threadId = match[1];

      // Lay ten tu span
      const spans = link.querySelectorAll('span');
      let name = '';
      for (const span of spans) {
        const text = span.textContent.trim();
        if (text.length > 0 && text.length < 60 && !text.match(/^\d+[:\.]/) && !text.includes('Active')) {
          name = text;
          break;
        }
      }

      // Lay avatar img
      const img = link.querySelector('img');
      const avatarSrc = img ? (img.src || '').substring(0, 120) : '';
      const avatarAlt = img ? (img.getAttribute('alt') || '') : '';

      // Check aria-label cua link
      const ariaLabel = link.getAttribute('aria-label') || '';

      result.push({
        threadId,
        href,
        name,
        avatarAlt,
        avatarSrc,
        ariaLabel: ariaLabel.substring(0, 100),
      });
    }

    return result;
  });

  // De-duplicate by threadId
  const seen = new Set();
  const unique = data.filter(d => {
    if (seen.has(d.threadId)) return false;
    seen.add(d.threadId);
    return true;
  });

  console.log(`Found ${unique.length} unique threads:\n`);

  for (const item of unique) {
    console.log(`Thread: ${item.threadId}`);
    console.log(`  Name: ${item.name}`);
    console.log(`  Href: ${item.href}`);
    console.log(`  Avatar alt: ${item.avatarAlt}`);
    console.log(`  Aria: ${item.ariaLabel}`);
    console.log('');
  }

  console.log('[Done] Ctrl+C de thoat.');
  await new Promise(() => {});
}

inspect().catch(err => { console.error(err); process.exit(1); });

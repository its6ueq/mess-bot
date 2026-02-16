// Inspect de tim cach lay user ID tu DOM Messenger
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
    console.log('Chua dang nhap!');
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 120000 });
  }

  await new Promise(r => setTimeout(r, 5000));

  console.log('\n===== INSPECTING USER IDs =====\n');

  const dump = await page.evaluate(() => {
    const result = { currentUrl: window.location.href, rows: [], sidebar: [] };

    // 1. Check sidebar links - co chua user ID trong href khong?
    const sidebarLinks = document.querySelectorAll('a[href*="/t/"]');
    for (const link of Array.from(sidebarLinks).slice(0, 5)) {
      const href = link.getAttribute('href') || '';
      const spans = link.querySelectorAll('span');
      let name = '';
      for (const s of spans) {
        if (s.textContent.trim().length > 0 && s.textContent.trim().length < 50) {
          name = s.textContent.trim();
          break;
        }
      }
      result.sidebar.push({ href, name });
    }

    // 2. Check message rows - tim user ID
    const rows = document.querySelectorAll('[role="row"]');
    const start = Math.max(0, rows.length - 8);

    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      const info = { index: i, text: '', sender: '', userId: null, links: [], imgSrcs: [], dataAttrs: [] };

      // Text
      const div = row.querySelector('div[dir="auto"]');
      if (div) info.text = div.textContent.trim().substring(0, 80);

      // Avatar images - full src URL
      row.querySelectorAll('img').forEach(img => {
        if (img.width >= 24 && img.height >= 24) {
          info.sender = img.getAttribute('alt') || '';
          info.imgSrcs.push(img.src || '');
        }
      });

      // Links wrapping avatar or near it
      row.querySelectorAll('a[href]').forEach(a => {
        info.links.push(a.getAttribute('href'));
      });

      // Any element with user-related data attributes
      row.querySelectorAll('[data-hovercard], [data-actor-id], [data-uid], [data-id], [id]').forEach(el => {
        const attrs = {};
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-') || attr.name === 'id') {
            attrs[attr.name] = attr.value.substring(0, 100);
          }
        }
        if (Object.keys(attrs).length > 0) info.dataAttrs.push(attrs);
      });

      // Tooltip/hovercard targets
      row.querySelectorAll('[data-tooltip-content], [aria-describedby]').forEach(el => {
        info.dataAttrs.push({
          tag: el.tagName,
          tooltip: el.getAttribute('data-tooltip-content') || '',
          describedby: el.getAttribute('aria-describedby') || '',
        });
      });

      result.rows.push(info);
    }

    return result;
  });

  console.log('Current URL:', dump.currentUrl);
  console.log('\n--- SIDEBAR (first 5) ---');
  for (const s of dump.sidebar) {
    console.log(`  ${s.name} -> ${s.href}`);
  }

  console.log('\n--- MESSAGE ROWS ---');
  for (const row of dump.rows) {
    console.log(`\nRow ${row.index}: "${row.text}"`);
    console.log(`  Sender (img alt): ${row.sender}`);
    if (row.links.length) console.log(`  Links:`, row.links);
    if (row.imgSrcs.length) {
      for (const src of row.imgSrcs) {
        console.log(`  IMG src: ${src.substring(0, 150)}`);
      }
    }
    if (row.dataAttrs.length) console.log(`  Data attrs:`, JSON.stringify(row.dataAttrs));
  }

  // 3. Check DM thread: the thread ID in URL IS the user ID for DMs
  const threadMatch = dump.currentUrl.match(/\/t\/(\d+)/);
  if (threadMatch) {
    console.log(`\n--- THREAD ID (from URL) = ${threadMatch[1]} ---`);
    console.log('(Trong DM, thread ID = user ID cua nguoi kia)');
  }

  console.log('\n[Done] Ctrl+C de thoat.');
  await new Promise(() => {});
}

inspect().catch(err => { console.error(err); process.exit(1); });

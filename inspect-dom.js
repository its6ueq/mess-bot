// Script de dump DOM cua Messenger - xem cau truc tin nhan thuc te
require('dotenv').config();
const { launchBrowser } = require('./src/browser');

async function inspect() {
  const { browser, page } = await launchBrowser();

  console.log('[Inspect] Dang vao Messenger...');
  await page.goto('https://www.messenger.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Doi login
  const url = page.url();
  if (url.includes('login')) {
    console.log('[Inspect] Chua dang nhap! Dang nhap di...');
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 120000 });
  }

  console.log('[Inspect] Da vao Messenger. Doi 5s cho page load...');
  await new Promise(r => setTimeout(r, 5000));

  // Dump cac role="row" cuoi cung
  console.log('\n========== DOM DUMP ==========\n');

  const dump = await page.evaluate(() => {
    const result = [];
    const rows = document.querySelectorAll('[role="row"]');
    const start = Math.max(0, rows.length - 8);

    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      const info = {
        index: i,
        totalRows: rows.length,
        // Noi dung text
        texts: [],
        // Images
        imgs: [],
        // Tat ca aria-label
        ariaLabels: [],
        // Tat ca data attributes
        dataAttrs: [],
        // Position info
        position: null,
        // HTML (rut gon)
        outerHTML: row.outerHTML.substring(0, 1000),
      };

      // Texts
      row.querySelectorAll('div[dir="auto"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        info.texts.push({
          content: el.textContent.trim().substring(0, 200),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          windowWidth: window.innerWidth,
        });
      });

      // Images
      row.querySelectorAll('img').forEach(img => {
        info.imgs.push({
          alt: img.getAttribute('alt') || '',
          ariaLabel: img.getAttribute('aria-label') || '',
          width: img.width,
          height: img.height,
          src: (img.src || '').substring(0, 100),
        });
      });

      // Aria labels
      row.querySelectorAll('[aria-label]').forEach(el => {
        const label = el.getAttribute('aria-label');
        const tag = el.tagName.toLowerCase();
        info.ariaLabels.push({ tag, label: label.substring(0, 100) });
      });

      // Data attributes
      const allEls = row.querySelectorAll('*');
      for (const el of allEls) {
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            info.dataAttrs.push({
              tag: el.tagName.toLowerCase(),
              attr: attr.name,
              value: attr.value.substring(0, 100),
            });
          }
        }
      }

      result.push(info);
    }

    // Cung lay thread info
    const mainArea = document.querySelector('[role="main"]');
    const threadInfo = {};
    if (mainArea) {
      const h2 = mainArea.querySelector('h2');
      threadInfo.h2 = h2 ? h2.textContent.trim() : null;
      const h3 = mainArea.querySelector('h3');
      threadInfo.h3 = h3 ? h3.textContent.trim() : null;
    }

    return { rows: result, threadInfo, url: window.location.href };
  });

  console.log('URL:', dump.url);
  console.log('Thread Info:', JSON.stringify(dump.threadInfo, null, 2));
  console.log(`Total [role="row"]: ${dump.rows[0]?.totalRows || 0}`);
  console.log('');

  for (const row of dump.rows) {
    console.log(`--- ROW ${row.index} ---`);

    for (const t of row.texts) {
      const side = t.left > (t.windowWidth / 2) ? 'RIGHT (me?)' : 'LEFT (other?)';
      console.log(`  TEXT: "${t.content}" [${side}, left=${t.left} right=${t.right} w=${t.windowWidth}]`);
    }

    for (const img of row.imgs) {
      console.log(`  IMG: aria="${img.ariaLabel}" alt="${img.alt}" ${img.width}x${img.height}`);
    }

    for (const al of row.ariaLabels) {
      console.log(`  ARIA: <${al.tag}> "${al.label}"`);
    }

    for (const da of row.dataAttrs) {
      console.log(`  DATA: <${da.tag}> ${da.attr}="${da.value}"`);
    }

    console.log('');
  }

  console.log('\n========== HTML SAMPLES ==========\n');
  // In 2 row HTML mau
  for (const row of dump.rows.slice(-3)) {
    console.log(`--- ROW ${row.index} HTML ---`);
    console.log(row.outerHTML.substring(0, 500));
    console.log('...\n');
  }

  console.log('[Inspect] Xong! Nhan Ctrl+C de thoat.');
  // Giu browser mo de user co the xem
  await new Promise(() => {});
}

inspect().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

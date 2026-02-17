// Inspect TOAN BO cau truc DOM Messenger - @mentions, media, file upload, etc.
// Chay: node inspect-mention.js
require('dotenv').config();
const { launchBrowser } = require('./src/browser');

const DEMO_GROUP = 'https://www.messenger.com/t/1191021623016238';

async function inspect() {
  const { browser, page } = await launchBrowser();

  console.log('[Inspect] Dang vao Messenger...');
  await page.goto('https://www.messenger.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Doi login
  if (page.url().includes('login')) {
    console.log('[Inspect] Chua dang nhap! Dang nhap di...');
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 120000 });
  }

  await new Promise(r => setTimeout(r, 3000));

  // Navigate den demo group
  console.log(`[Inspect] Mo demo group: ${DEMO_GROUP}`);
  await page.goto(DEMO_GROUP, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n' + '='.repeat(80));
  console.log('  FULL DOM INSPECTION - MESSENGER');
  console.log('='.repeat(80));

  // ==========================================
  // SECTION 1: MESSAGE ROWS - @mentions + sender IDs
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SECTION 1: MESSAGE ROWS - @mentions + Sender IDs');
  console.log('='.repeat(60));

  const messageData = await page.evaluate(() => {
    const result = [];
    const rows = document.querySelectorAll('[role="row"]');
    const start = Math.max(0, rows.length - 15);

    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      const info = {
        index: i,
        // Text content
        texts: [],
        // Sender info (avatar)
        senderInfo: null,
        // @mention elements
        mentions: [],
        // All links (a tags)
        links: [],
        // All data attributes
        dataAttrs: [],
        // Span elements with special styling (mentions often have distinct style)
        styledSpans: [],
      };

      // === TEXT CONTENT ===
      row.querySelectorAll('div[dir="auto"]').forEach(el => {
        if (el.closest('[role="textbox"]')) return;
        const rect = el.getBoundingClientRect();
        const isMe = rect.left > (window.innerWidth / 2);
        info.texts.push({
          content: el.textContent.trim().substring(0, 300),
          isMe,
          // Check for child elements that might be @mentions
          childElements: Array.from(el.children).map(child => ({
            tag: child.tagName.toLowerCase(),
            text: child.textContent.trim().substring(0, 100),
            className: (child.className || '').substring(0, 100),
            href: child.getAttribute('href') || '',
            dataAttrs: Object.fromEntries(
              Array.from(child.attributes)
                .filter(a => a.name.startsWith('data-'))
                .map(a => [a.name, a.value.substring(0, 100)])
            ),
            style: child.getAttribute('style') || '',
            role: child.getAttribute('role') || '',
            // Nested links inside text (mentions might be links)
            innerLinks: Array.from(child.querySelectorAll('a')).map(a => ({
              href: a.getAttribute('href') || '',
              text: a.textContent.trim(),
              dataAttrs: Object.fromEntries(
                Array.from(a.attributes)
                  .filter(at => at.name.startsWith('data-'))
                  .map(at => [at.name, at.value.substring(0, 100)])
              ),
            })),
          })),
          // Also check direct anchor children
          directLinks: Array.from(el.querySelectorAll('a')).map(a => ({
            href: a.getAttribute('href') || '',
            text: a.textContent.trim().substring(0, 100),
            ariaLabel: a.getAttribute('aria-label') || '',
          })),
          // innerHTML sample
          innerHTML: el.innerHTML.substring(0, 500),
        });
      });

      // === SENDER INFO (avatar image + wrapping link) ===
      const imgs = row.querySelectorAll('img');
      for (const img of imgs) {
        const w = img.width, h = img.height;
        if (w >= 24 && w <= 40 && h >= 24 && h <= 40) {
          const alt = img.getAttribute('alt') || '';
          const src = img.src || '';
          if (alt && alt.length > 1 && alt.length < 50
              && !alt.includes('Seen') && !alt.includes('Icon')
              && !src.includes('emoji.php')) {
            // Check if avatar is wrapped in a link
            const parentLink = img.closest('a');
            info.senderInfo = {
              name: alt,
              imgSrc: src.substring(0, 150),
              // IMPORTANT: This link might contain user ID!
              parentLinkHref: parentLink ? (parentLink.getAttribute('href') || '') : null,
              parentLinkAriaLabel: parentLink ? (parentLink.getAttribute('aria-label') || '') : null,
              parentLinkDataAttrs: parentLink ? Object.fromEntries(
                Array.from(parentLink.attributes)
                  .filter(a => a.name.startsWith('data-'))
                  .map(a => [a.name, a.value.substring(0, 100)])
              ) : null,
              // Grandparent might also have data
              grandparentTag: parentLink?.parentElement?.tagName?.toLowerCase() || img.parentElement?.tagName?.toLowerCase(),
              grandparentDataAttrs: (() => {
                const gp = parentLink?.parentElement || img.parentElement;
                if (!gp) return null;
                return Object.fromEntries(
                  Array.from(gp.attributes)
                    .filter(a => a.name.startsWith('data-'))
                    .map(a => [a.name, a.value.substring(0, 100)])
                );
              })(),
            };
            break;
          }
        }
      }

      // === ALL LINKS IN ROW ===
      row.querySelectorAll('a[href]').forEach(a => {
        info.links.push({
          href: a.getAttribute('href') || '',
          text: a.textContent.trim().substring(0, 80),
          ariaLabel: a.getAttribute('aria-label') || '',
          role: a.getAttribute('role') || '',
          dataAttrs: Object.fromEntries(
            Array.from(a.attributes)
              .filter(at => at.name.startsWith('data-'))
              .map(at => [at.name, at.value.substring(0, 100)])
          ),
        });
      });

      // === DATA ATTRIBUTES (user IDs might be here) ===
      row.querySelectorAll('[data-hovercard], [data-actor-id], [data-uid], [data-id], [data-scope]').forEach(el => {
        const attrs = {};
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-') || attr.name === 'id') {
            attrs[attr.name] = attr.value.substring(0, 150);
          }
        }
        if (Object.keys(attrs).length > 0) {
          info.dataAttrs.push({
            tag: el.tagName.toLowerCase(),
            ...attrs,
          });
        }
      });

      // === STYLED SPANS (mentions often have distinct styling) ===
      row.querySelectorAll('span[class], span[style], span[data-offset-key]').forEach(span => {
        const text = span.textContent.trim();
        if (text.length > 0 && text.length < 100) {
          const style = window.getComputedStyle(span);
          info.styledSpans.push({
            text: text.substring(0, 100),
            className: (span.className || '').substring(0, 100),
            color: style.color,
            fontWeight: style.fontWeight,
            cursor: style.cursor,
            href: span.closest('a')?.getAttribute('href') || '',
            dataAttrs: Object.fromEntries(
              Array.from(span.attributes)
                .filter(a => a.name.startsWith('data-'))
                .map(a => [a.name, a.value.substring(0, 100)])
            ),
          });
        }
      });

      result.push(info);
    }
    return result;
  });

  for (const row of messageData) {
    console.log(`\n--- ROW ${row.index} ---`);

    if (row.senderInfo) {
      console.log(`  SENDER: "${row.senderInfo.name}"`);
      console.log(`    Avatar link href: ${row.senderInfo.parentLinkHref || 'NONE'}`);
      console.log(`    Avatar link aria: ${row.senderInfo.parentLinkAriaLabel || 'NONE'}`);
      if (row.senderInfo.parentLinkDataAttrs && Object.keys(row.senderInfo.parentLinkDataAttrs).length) {
        console.log(`    Avatar link data:`, JSON.stringify(row.senderInfo.parentLinkDataAttrs));
      }
      if (row.senderInfo.grandparentDataAttrs && Object.keys(row.senderInfo.grandparentDataAttrs).length) {
        console.log(`    Grandparent data:`, JSON.stringify(row.senderInfo.grandparentDataAttrs));
      }
    }

    for (const t of row.texts) {
      const side = t.isMe ? 'RIGHT (me)' : 'LEFT (other)';
      console.log(`  TEXT [${side}]: "${t.content}"`);

      if (t.directLinks.length > 0) {
        console.log(`    LINKS in text:`);
        for (const l of t.directLinks) {
          console.log(`      href="${l.href}" text="${l.text}" aria="${l.ariaLabel}"`);
        }
      }

      if (t.childElements.length > 0) {
        console.log(`    CHILD ELEMENTS:`);
        for (const c of t.childElements) {
          console.log(`      <${c.tag}> text="${c.text}" class="${c.className}" href="${c.href}"`);
          if (Object.keys(c.dataAttrs).length) console.log(`        data:`, JSON.stringify(c.dataAttrs));
          if (c.innerLinks.length) {
            for (const il of c.innerLinks) {
              console.log(`        INNER LINK: href="${il.href}" text="${il.text}"`);
              if (Object.keys(il.dataAttrs).length) console.log(`          data:`, JSON.stringify(il.dataAttrs));
            }
          }
        }
      }

      // Show innerHTML sample for rows with @mentions
      if (t.content.includes('@') || t.directLinks.length > 0) {
        console.log(`    RAW HTML: ${t.innerHTML}`);
      }
    }

    if (row.links.length > 0) {
      console.log(`  ALL LINKS:`);
      for (const l of row.links) {
        console.log(`    href="${l.href}" text="${l.text}" aria="${l.ariaLabel}"`);
        if (Object.keys(l.dataAttrs).length) console.log(`      data:`, JSON.stringify(l.dataAttrs));
      }
    }

    if (row.dataAttrs.length > 0) {
      console.log(`  USER DATA ATTRIBUTES:`);
      for (const d of row.dataAttrs) {
        console.log(`    `, JSON.stringify(d));
      }
    }

    // Only show styled spans for rows likely having mentions
    const hasAtSign = row.texts.some(t => t.content.includes('@'));
    if (hasAtSign && row.styledSpans.length > 0) {
      console.log(`  STYLED SPANS (possible mentions):`);
      for (const s of row.styledSpans) {
        if (s.cursor === 'pointer' || s.fontWeight >= 600 || s.href) {
          console.log(`    "${s.text}" color=${s.color} weight=${s.fontWeight} cursor=${s.cursor} href=${s.href}`);
          if (Object.keys(s.dataAttrs).length) console.log(`      data:`, JSON.stringify(s.dataAttrs));
        }
      }
    }
  }

  // ==========================================
  // SECTION 2: MEDIA ELEMENTS (images, videos, files)
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SECTION 2: MEDIA ELEMENTS (images, videos, files)');
  console.log('='.repeat(60));

  const mediaData = await page.evaluate(() => {
    const result = { images: [], videos: [], audios: [], iframes: [], fileLinks: [] };
    const main = document.querySelector('[role="main"]');
    if (!main) return result;

    // Large images (not avatars, not emojis)
    main.querySelectorAll('img').forEach(img => {
      if (img.width > 100 || img.height > 100) {
        const closestRow = img.closest('[role="row"]');
        result.images.push({
          src: (img.src || '').substring(0, 200),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height,
          parentTag: img.parentElement?.tagName?.toLowerCase(),
          parentHref: img.parentElement?.getAttribute?.('href') || '',
          parentRole: img.parentElement?.getAttribute?.('role') || '',
          inRow: !!closestRow,
        });
      }
    });

    // Videos
    main.querySelectorAll('video').forEach(v => {
      result.videos.push({
        src: (v.src || '').substring(0, 200),
        poster: (v.poster || '').substring(0, 200),
        width: v.width,
        height: v.height,
        parentHTML: v.parentElement?.outerHTML?.substring(0, 300) || '',
      });
    });

    // Audio elements
    main.querySelectorAll('audio').forEach(a => {
      result.audios.push({
        src: (a.src || '').substring(0, 200),
        parentHTML: a.parentElement?.outerHTML?.substring(0, 300) || '',
      });
    });

    // Iframes (embedded content)
    main.querySelectorAll('iframe').forEach(f => {
      result.iframes.push({
        src: (f.src || '').substring(0, 200),
        width: f.width,
        height: f.height,
      });
    });

    // File download links
    main.querySelectorAll('a[href*="cdn"], a[download], a[href*="attachment"]').forEach(a => {
      result.fileLinks.push({
        href: (a.getAttribute('href') || '').substring(0, 200),
        text: a.textContent.trim().substring(0, 100),
        download: a.getAttribute('download') || '',
      });
    });

    return result;
  });

  console.log(`\nIMAGES (large, ${mediaData.images.length}):`);
  for (const img of mediaData.images) {
    console.log(`  ${img.width}x${img.height} alt="${img.alt}" parent=<${img.parentTag}> href="${img.parentHref}"`);
    console.log(`    src: ${img.src}`);
  }

  console.log(`\nVIDEOS (${mediaData.videos.length}):`);
  for (const v of mediaData.videos) {
    console.log(`  ${v.width}x${v.height} src="${v.src}"`);
    console.log(`  parent: ${v.parentHTML}`);
  }

  console.log(`\nAUDIOS (${mediaData.audios.length}):`);
  for (const a of mediaData.audios) {
    console.log(`  src="${a.src}" parent: ${a.parentHTML}`);
  }

  console.log(`\nIFRAMES (${mediaData.iframes.length}):`);
  for (const f of mediaData.iframes) {
    console.log(`  ${f.width}x${f.height} src="${f.src}"`);
  }

  console.log(`\nFILE LINKS (${mediaData.fileLinks.length}):`);
  for (const f of mediaData.fileLinks) {
    console.log(`  "${f.text}" href="${f.href}" download="${f.download}"`);
  }

  // ==========================================
  // SECTION 3: FILE UPLOAD ELEMENTS
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SECTION 3: FILE UPLOAD ELEMENTS');
  console.log('='.repeat(60));

  const uploadData = await page.evaluate(() => {
    const result = { fileInputs: [], attachButtons: [], toolbarButtons: [] };

    // Find all file inputs (hidden or visible)
    document.querySelectorAll('input[type="file"]').forEach(input => {
      result.fileInputs.push({
        name: input.name || '',
        accept: input.accept || '',
        multiple: input.multiple,
        id: input.id || '',
        className: (input.className || '').substring(0, 100),
        parentTag: input.parentElement?.tagName?.toLowerCase(),
        parentAriaLabel: input.parentElement?.getAttribute('aria-label') || '',
        visible: input.offsetParent !== null,
        // Look for label that triggers this input
        labelText: input.id ? (document.querySelector(`label[for="${input.id}"]`)?.textContent || '') : '',
      });
    });

    // Find attach/clip/paperclip buttons
    const attachLabels = ['attach', 'file', 'Attach', 'File', 'Dinh kem', 'Tep', 'Tệp',
                          'Add files', 'Photo', 'Anh', 'Ảnh', 'video', 'Video'];
    document.querySelectorAll('[aria-label]').forEach(el => {
      const label = el.getAttribute('aria-label') || '';
      for (const keyword of attachLabels) {
        if (label.toLowerCase().includes(keyword.toLowerCase())) {
          result.attachButtons.push({
            tag: el.tagName.toLowerCase(),
            ariaLabel: label,
            role: el.getAttribute('role') || '',
            className: (el.className || '').substring(0, 100),
            // Check for nearby file input
            nearbyFileInput: !!el.querySelector('input[type="file"]'),
            parentNearbyFileInput: !!el.parentElement?.querySelector('input[type="file"]'),
            html: el.outerHTML.substring(0, 400),
          });
          break;
        }
      }
    });

    // Find toolbar buttons near the message input
    const textbox = document.querySelector('[role="textbox"]');
    if (textbox) {
      const toolbar = textbox.closest('[role="main"]');
      if (toolbar) {
        // Get all buttons/clickable elements near the input area
        const inputArea = textbox.parentElement?.parentElement?.parentElement;
        if (inputArea) {
          inputArea.querySelectorAll('[role="button"], button, [aria-label]').forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            if (label) {
              result.toolbarButtons.push({
                tag: btn.tagName.toLowerCase(),
                ariaLabel: label,
                role: btn.getAttribute('role') || '',
                hasFileInput: !!btn.querySelector('input[type="file"]'),
              });
            }
          });
        }
      }
    }

    return result;
  });

  console.log(`\nFILE INPUTS (${uploadData.fileInputs.length}):`);
  for (const f of uploadData.fileInputs) {
    console.log(`  name="${f.name}" accept="${f.accept}" multiple=${f.multiple} visible=${f.visible}`);
    console.log(`    id="${f.id}" class="${f.className}"`);
    console.log(`    parent=<${f.parentTag}> parentAria="${f.parentAriaLabel}"`);
  }

  console.log(`\nATTACH BUTTONS (${uploadData.attachButtons.length}):`);
  for (const b of uploadData.attachButtons) {
    console.log(`  <${b.tag}> aria="${b.ariaLabel}" role="${b.role}"`);
    console.log(`    nearbyFileInput=${b.nearbyFileInput} parentNearbyInput=${b.parentNearbyFileInput}`);
    console.log(`    HTML: ${b.html}`);
  }

  console.log(`\nTOOLBAR BUTTONS near input (${uploadData.toolbarButtons.length}):`);
  for (const b of uploadData.toolbarButtons) {
    console.log(`  <${b.tag}> aria="${b.ariaLabel}" role="${b.role}" hasFileInput=${b.hasFileInput}`);
  }

  // ==========================================
  // SECTION 4: REACTION BUTTONS + REPLY STRUCTURE
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SECTION 4: REACTIONS + REPLY STRUCTURE');
  console.log('='.repeat(60));

  const reactionData = await page.evaluate(async () => {
    const result = { hoveredButtons: [], replyQuotes: [] };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Hover over last 3 rows to reveal action buttons
    const rows = document.querySelectorAll('[role="row"]');
    const lastRows = Array.from(rows).slice(-3);

    for (let i = 0; i < lastRows.length; i++) {
      const row = lastRows[i];
      const text = (row.querySelector('div[dir="auto"]')?.textContent || '').trim().substring(0, 50);

      // Hover
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
      await sleep(500);

      const buttons = [];
      row.querySelectorAll('[role="button"], [aria-label]').forEach(btn => {
        const label = btn.getAttribute('aria-label') || '';
        if (label && !label.includes('Seen')) {
          buttons.push({
            tag: btn.tagName.toLowerCase(),
            ariaLabel: label,
            role: btn.getAttribute('role') || '',
          });
        }
      });

      result.hoveredButtons.push({ text, buttons });

      // Un-hover
      row.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      await sleep(200);
    }

    // Find reply/quote structures (messages that are replies to other messages)
    document.querySelectorAll('[role="row"]').forEach(row => {
      // Replies often have a smaller quoted text above the main message
      const dirAutos = row.querySelectorAll('div[dir="auto"]');
      if (dirAutos.length >= 2) {
        const texts = Array.from(dirAutos).map(d => d.textContent.trim().substring(0, 80));
        result.replyQuotes.push({
          rowText: texts,
          hasMultipleBubbles: true,
        });
      }
    });

    return result;
  });

  console.log('\nHOVER BUTTONS (last 3 rows):');
  for (const h of reactionData.hoveredButtons) {
    console.log(`\n  Row: "${h.text}..."`);
    for (const b of h.buttons) {
      const mark = /reply|trả lời/i.test(b.ariaLabel) ? ' ** REPLY **' :
                   /react|cảm xúc|thích/i.test(b.ariaLabel) ? ' ** REACT **' : '';
      console.log(`    <${b.tag}> aria="${b.ariaLabel}" role="${b.role}"${mark}`);
    }
  }

  console.log('\nREPLY QUOTES (multi-bubble rows):');
  for (const r of reactionData.replyQuotes) {
    console.log(`  Texts: ${JSON.stringify(r.rowText)}`);
  }

  // ==========================================
  // SECTION 5: THREAD INFO (group members)
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SECTION 5: THREAD/GROUP INFO');
  console.log('='.repeat(60));

  const threadInfo = await page.evaluate(() => {
    const result = { url: window.location.href, headers: [], memberElements: [] };
    const main = document.querySelector('[role="main"]');
    if (!main) return result;

    // Headers
    main.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      result.headers.push({
        tag: h.tagName.toLowerCase(),
        text: h.textContent.trim().substring(0, 200),
      });
    });

    // Thread title area
    const titleArea = main.querySelector('[data-scope="thread_title"]');
    if (titleArea) {
      result.titleArea = titleArea.textContent.trim().substring(0, 200);
    }

    // Member count / info
    const allText = main.textContent || '';
    const memberMatch = allText.match(/(\d+)\s*(members|th[àa]nh vi[eê]n|ng[ưu][ờo]i)/i);
    if (memberMatch) {
      result.memberCount = memberMatch[0];
    }

    return result;
  });

  console.log(`URL: ${threadInfo.url}`);
  console.log(`Member count: ${threadInfo.memberCount || 'N/A'}`);
  if (threadInfo.titleArea) console.log(`Title area: ${threadInfo.titleArea}`);
  for (const h of threadInfo.headers) {
    console.log(`  <${h.tag}>: "${h.text}"`);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total message rows inspected: ${messageData.length}`);
  console.log(`Rows with sender info: ${messageData.filter(r => r.senderInfo).length}`);
  console.log(`Rows with avatar links: ${messageData.filter(r => r.senderInfo?.parentLinkHref).length}`);
  console.log(`Rows with @mentions in text: ${messageData.filter(r => r.texts.some(t => t.content.includes('@'))).length}`);
  console.log(`Rows with links in text: ${messageData.filter(r => r.texts.some(t => t.directLinks.length > 0)).length}`);
  console.log(`File inputs found: ${uploadData.fileInputs.length}`);
  console.log(`Attach buttons found: ${uploadData.attachButtons.length}`);

  console.log('\n[Inspect] Xong! Nhan Ctrl+C de thoat.');
  await new Promise(() => {});
}

inspect().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

// =============================================================
// INSPECT DEBUG - Phân tích React Fiber, ID, Reply, Unread
// Chạy: node inspect-debug.js
// =============================================================
require('dotenv').config();
const { launchBrowser } = require('./src/browser');

const TARGET_GROUP = 'https://www.messenger.com/t/1191021623016238'; // anh em sieu nhan

async function inspect() {
  const { browser, page } = await launchBrowser();

  console.log('[Inspect] Đang vào Messenger...');
  await page.goto('https://www.messenger.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  if (page.url().includes('login')) {
    console.log('[Inspect] Chưa đăng nhập! Đăng nhập đi...');
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 120000 });
  }

  await new Promise(r => setTimeout(r, 3000));

  console.log(`[Inspect] Mở group: ${TARGET_GROUP}`);
  await page.goto(TARGET_GROUP, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));

  // ===========================================================
  // SECTION 1: REACT FIBER - Tìm messageData, senderId, etc.
  // ===========================================================
  console.log('\n' + '='.repeat(80));
  console.log('  SECTION 1: REACT FIBER MESSAGE DATA (30 tin gần nhất)');
  console.log('='.repeat(80));

  const fiberData = await page.evaluate(() => {
    const results = [];
    const rows = Array.from(document.querySelectorAll('[role="row"]'));
    const targetRows = rows.slice(-30);

    for (const row of targetRows) {
      const textDiv = row.querySelector('div[dir="auto"]');
      if (!textDiv) continue;

      const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
      if (!key) continue;

      let fiber = textDiv[key];
      const fiberInfo = {
        text: textDiv.textContent?.trim()?.substring(0, 100) || '',
        fiberKey: key,
        propsFound: [],
        messageData: null,
        allPropsWithMessage: [],
      };

      // Leo 25 cấp tìm TẤT CẢ props có chứa thông tin message
      let current = fiber;
      for (let i = 0; i < 25; i++) {
        if (!current) break;
        const props = current.memoizedProps;
        if (!props) { current = current.return; continue; }

        // Ghi lại MỌI prop key ở mỗi level
        const propKeys = Object.keys(props);
        const interesting = {};

        for (const pk of propKeys) {
          const val = props[pk];
          if (val === null || val === undefined) continue;

          // Tìm bất kỳ prop nào có thể chứa ID/sender info
          if (typeof val === 'string' && val.length > 0 && val.length < 200) {
            if (/^\d{10,}$/.test(val) || pk.toLowerCase().includes('id') ||
                pk.toLowerCase().includes('sender') || pk.toLowerCase().includes('author') ||
                pk.toLowerCase().includes('user') || pk.toLowerCase().includes('participant') ||
                pk.toLowerCase().includes('actor') || pk.toLowerCase().includes('name')) {
              interesting[pk] = val;
            }
          }

          // Object props
          if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
            // Check for message-like objects
            if (val.messageId || val.senderId || val.senderName ||
                val.body || val.text || val.message ||
                val.authorId || val.userId || val.actorId ||
                val.timestampMs || val.timestamp) {
              // Dump ALL keys of this object
              const objDump = {};
              for (const [ok, ov] of Object.entries(val)) {
                if (ov === null || ov === undefined) continue;
                if (typeof ov === 'string' || typeof ov === 'number' || typeof ov === 'boolean') {
                  objDump[ok] = String(ov).substring(0, 200);
                } else if (typeof ov === 'object' && ov !== null) {
                  // One level deeper
                  const subDump = {};
                  try {
                    for (const [sk, sv] of Object.entries(ov)) {
                      if (typeof sv === 'string' || typeof sv === 'number' || typeof sv === 'boolean') {
                        subDump[sk] = String(sv).substring(0, 200);
                      }
                    }
                  } catch(e) {}
                  if (Object.keys(subDump).length > 0) {
                    objDump[ok] = subDump;
                  } else {
                    objDump[ok] = `[${typeof ov}]`;
                  }
                }
              }
              fiberInfo.allPropsWithMessage.push({
                level: i,
                propKey: pk,
                data: objDump,
              });
            }
          }
        }

        if (Object.keys(interesting).length > 0) {
          fiberInfo.propsFound.push({ level: i, props: interesting });
        }

        // Cụ thể tìm props.message (logic cũ)
        if (props.message && !fiberInfo.messageData) {
          const msg = props.message;
          const dump = {};
          for (const [mk, mv] of Object.entries(msg)) {
            if (mv === null || mv === undefined) continue;
            if (typeof mv === 'string' || typeof mv === 'number' || typeof mv === 'boolean') {
              dump[mk] = String(mv).substring(0, 300);
            } else if (typeof mv === 'object') {
              try {
                dump[mk] = JSON.stringify(mv).substring(0, 300);
              } catch(e) {
                dump[mk] = `[${typeof mv}]`;
              }
            }
          }
          fiberInfo.messageData = { level: i, fields: dump };
        }

        current = current.return;
      }

      results.push(fiberInfo);
    }
    return results;
  });

  for (let i = 0; i < fiberData.length; i++) {
    const f = fiberData[i];
    console.log(`\n--- TIN ${i + 1}: "${f.text.substring(0, 60)}..." ---`);

    if (f.messageData) {
      console.log(`  [messageData] (level ${f.messageData.level}):`);
      for (const [k, v] of Object.entries(f.messageData.fields)) {
        console.log(`    ${k}: ${v}`);
      }
    } else {
      console.log(`  [messageData] KHÔNG TÌM THẤY!`);
    }

    if (f.propsFound.length > 0) {
      console.log(`  [Interesting props]:`);
      for (const p of f.propsFound) {
        console.log(`    Level ${p.level}:`, JSON.stringify(p.props));
      }
    }

    if (f.allPropsWithMessage.length > 0) {
      console.log(`  [Message-like objects]:`);
      for (const m of f.allPropsWithMessage) {
        console.log(`    Level ${m.level}, key="${m.propKey}":`);
        console.log(`    ${JSON.stringify(m.data, null, 2).substring(0, 500)}`);
      }
    }
  }

  // ===========================================================
  // SECTION 2: SIDEBAR - Unread detection
  // ===========================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('  SECTION 2: SIDEBAR THREADS & UNREAD DETECTION');
  console.log('='.repeat(80));

  // Navigate back to main
  await page.goto('https://www.messenger.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const sidebarData = await page.evaluate(() => {
    const threads = [];
    const links = document.querySelectorAll('a[href*="/t/"]');
    const seen = new Set();

    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/t\/(\d+)/);
      if (!match) continue;
      const threadId = match[1];
      if (seen.has(threadId)) continue;
      seen.add(threadId);

      // Lấy tất cả thông tin
      const spans = link.querySelectorAll('span');
      const spanInfo = [];
      let hasUnread = false;

      for (const span of spans) {
        const text = span.textContent.trim();
        const style = window.getComputedStyle(span);
        const isBold = parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold';
        if (isBold) hasUnread = true;

        if (text.length > 0 && text.length < 100) {
          spanInfo.push({
            text: text.substring(0, 60),
            bold: isBold,
            fontSize: style.fontSize,
            color: style.color,
          });
        }
      }

      const ariaLabel = link.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase().includes('unread')) hasUnread = true;

      // Data attributes
      const dataAttrs = {};
      for (const attr of link.attributes) {
        if (attr.name.startsWith('data-')) {
          dataAttrs[attr.name] = attr.value.substring(0, 100);
        }
      }

      // React Fiber trên link
      let fiberThreadId = null;
      const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber'));
      if (fiberKey) {
        let fib = link[fiberKey];
        for (let i = 0; i < 15; i++) {
          if (!fib) break;
          const p = fib.memoizedProps;
          if (p) {
            if (p.threadKey) fiberThreadId = p.threadKey;
            if (p.id && typeof p.id === 'string' && /^\d+$/.test(p.id)) fiberThreadId = fiberThreadId || p.id;
          }
          fib = fib.return;
        }
      }

      threads.push({
        threadId,
        ariaLabel: ariaLabel.substring(0, 80),
        hasUnread,
        spanInfo: spanInfo.slice(0, 5),
        dataAttrs,
        fiberThreadId,
      });

      if (threads.length >= 15) break;
    }
    return threads;
  });

  for (const t of sidebarData) {
    const mark = t.hasUnread ? '🔴 UNREAD' : '⚪';
    console.log(`\n${mark} Thread ${t.threadId}${t.fiberThreadId ? ` (fiber: ${t.fiberThreadId})` : ''}`);
    console.log(`  aria: "${t.ariaLabel}"`);
    if (Object.keys(t.dataAttrs).length > 0) {
      console.log(`  data:`, JSON.stringify(t.dataAttrs));
    }
    for (const s of t.spanInfo) {
      console.log(`  span: "${s.text}" bold=${s.bold} size=${s.fontSize}`);
    }
  }

  // ===========================================================
  // SECTION 3: REPLY BUTTON STRUCTURE
  // ===========================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('  SECTION 3: REPLY BUTTON STRUCTURE');
  console.log('='.repeat(80));

  // Go back to group
  await page.goto(TARGET_GROUP, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));

  const replyData = await page.evaluate(async () => {
    const results = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const rows = Array.from(document.querySelectorAll('[role="row"]'));
    const lastRows = rows.slice(-5);

    for (const row of lastRows) {
      const text = (row.querySelector('div[dir="auto"]')?.textContent || '').trim().substring(0, 50);

      // Hover to reveal buttons
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
      await sleep(600);

      const buttons = [];
      // Check row and nearby elements
      const searchArea = row.parentElement || row;
      searchArea.querySelectorAll('[role="button"], [aria-label], button').forEach(btn => {
        const label = btn.getAttribute('aria-label') || '';
        const title = btn.getAttribute('title') || '';
        if (label || title) {
          buttons.push({
            tag: btn.tagName.toLowerCase(),
            ariaLabel: label,
            title,
            role: btn.getAttribute('role') || '',
            className: (btn.className || '').substring(0, 80),
            html: btn.outerHTML.substring(0, 200),
          });
        }
      });

      // Also check document-level popups/tooltips
      const popups = document.querySelectorAll('[role="toolbar"], [role="menu"], [role="tooltip"]');
      const popupButtons = [];
      popups.forEach(popup => {
        popup.querySelectorAll('[role="button"], [aria-label]').forEach(btn => {
          popupButtons.push({
            ariaLabel: btn.getAttribute('aria-label') || '',
            role: btn.getAttribute('role') || '',
          });
        });
      });

      row.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      await sleep(200);

      results.push({ text, buttons, popupButtons });
    }
    return results;
  });

  for (const r of replyData) {
    console.log(`\n  Row: "${r.text}"`);
    if (r.buttons.length > 0) {
      console.log(`  Buttons (${r.buttons.length}):`);
      for (const b of r.buttons) {
        const isReply = /reply|trả lời/i.test(b.ariaLabel + b.title);
        console.log(`    ${isReply ? '📌 ' : ''}${b.ariaLabel || b.title} [${b.tag}] role=${b.role}`);
      }
    }
    if (r.popupButtons.length > 0) {
      console.log(`  Popup buttons: ${r.popupButtons.map(b => b.ariaLabel).join(', ')}`);
    }
  }

  // ===========================================================
  // SECTION 4: CẤU TRÚC THƯ MỤC DỰ ÁN
  // ===========================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('  SECTION 4: THÔNG TIN BỔ SUNG');
  console.log('='.repeat(80));

  // Test nhanh: thử đọc myId từ config
  const configInfo = await page.evaluate(() => {
    return { url: window.location.href };
  });
  console.log(`Current URL: ${configInfo.url}`);

  // Tìm xem có element nào chứa user ID không
  const idElements = await page.evaluate(() => {
    const results = [];
    // Tìm meta tags
    document.querySelectorAll('meta').forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property') || '';
      const content = m.getAttribute('content') || '';
      if (name.includes('id') || name.includes('user') || /^\d{10,}$/.test(content)) {
        results.push({ type: 'meta', name, content: content.substring(0, 100) });
      }
    });

    // Tìm trong scripts
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const text = s.textContent || '';
      // Tìm patterns như "userID":"12345" hoặc FBID
      const matches = text.match(/"(?:userID|USER_ID|fbid|uid|actor_id)"\s*:\s*"?(\d{10,})"?/g);
      if (matches) {
        results.push({ type: 'script', matches: matches.slice(0, 5).map(m => m.substring(0, 100)) });
      }
    }

    // Tìm trong cookie
    const cookies = document.cookie || '';
    const cMatch = cookies.match(/c_user=(\d+)/);
    if (cMatch) {
      results.push({ type: 'cookie', key: 'c_user', value: cMatch[1] });
    }

    return results;
  });

  console.log('\nID-related elements:');
  for (const el of idElements) {
    console.log(`  [${el.type}]`, JSON.stringify(el));
  }

  // ===========================================================
  // SUMMARY
  // ===========================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('  SUMMARY');
  console.log('='.repeat(80));
  console.log(`Tin nhắn phân tích: ${fiberData.length}`);
  console.log(`Có messageData: ${fiberData.filter(f => f.messageData).length}`);
  console.log(`Có senderId trong messageData: ${fiberData.filter(f => f.messageData?.fields?.senderId).length}`);
  console.log(`SenderId = "e2ee": ${fiberData.filter(f => f.messageData?.fields?.senderId === 'e2ee').length}`);
  console.log(`Sidebar threads: ${sidebarData.length}`);
  console.log(`Unread threads: ${sidebarData.filter(t => t.hasUnread).length}`);

  // In ra tất cả senderId unique
  const uniqueIds = new Set();
  for (const f of fiberData) {
    if (f.messageData?.fields?.senderId) uniqueIds.add(f.messageData.fields.senderId);
  }
  console.log(`\nUnique senderIds found: ${JSON.stringify([...uniqueIds])}`);

  console.log('\n[Inspect] Xong! Nhấn Ctrl+C để thoát.');
  await new Promise(() => {});
}

inspect().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

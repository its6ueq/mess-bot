// ============================================================
// DOM-READER v2 — Rewritten for Messenger 2026 E2EE DOM
//
// KEY CHANGES from v1:
// - [role="row"] was SIDEBAR → now uses [role="article"] for messages
// - props.message.body/senderName/isOutgoing REMOVED by FB
// - props.message.text is ENCRYPTED (E2EE) → read from DOM innerText
// - Sender parsed from "Message sent ... by SENDER:" pattern
// - Fiber found at level 4 (article) or 13 (div[dir="auto"])
// ============================================================

const config = require('../config');

/**
 * Read messages from a Messenger tab.
 * Uses [role="article"] elements + React Fiber for messageId/timestamp.
 * Text and sender are read from DOM (E2EE encrypted in fiber).
 */
async function readMessages(page, count = 20, threadId = null, isGroup = false) {
  try {
    // Wait for message articles to render
    await page.waitForSelector('[role="main"] [role="article"]', { timeout: 3000 }).catch(() => {});
    const myId = config.myId;
    const myName = config.myName || '';

    return await page.evaluate((cnt, _myId, _myName) => {

      // Decode Facebook i64 format: [high, low] or {"0": high, "1": low} or "high_low"
      function decodeI64(raw) {
        if (raw === null || raw === undefined) return null;
        if (typeof raw === 'number') return String(raw);
        if (typeof raw === 'string') {
          // "high_low" split form (from a stringified i64)
          const m = raw.match(/^(-?\d+)_(-?\d+)$/);
          if (m) {
            try {
              let lo = BigInt(m[2]);
              if (lo < 0n) lo += 4294967296n; // treat low as unsigned 32-bit
              return ((BigInt(m[1]) << 32n) + lo).toString();
            } catch (e) {}
          }
          return raw; // already a full id like "100054767970643"
        }
        if (Array.isArray(raw) && raw.length === 2) {
          try { return ((BigInt(raw[0]) << 32n) + BigInt(raw[1] >>> 0)).toString(); } catch (e) { return null; }
        }
        if (typeof raw === 'object' && raw["1"] !== undefined) {
          try { return ((BigInt(raw["0"]) << 32n) + BigInt(raw["1"] >>> 0)).toString(); } catch (e) { return null; }
        }
        return null;
      }

      function parseFbData(data) {
        if (data === null || data === undefined) return null;
        if (typeof data === 'string' || typeof data === 'number') return String(data);
        if (Array.isArray(data)) return data.join('_');
        if (typeof data === 'object') {
          if (data["1"] !== undefined) return data["0"] + "_" + data["1"];
          return JSON.stringify(data);
        }
        return String(data);
      }

      // Split a fiber mention field into an array of primitive strings.
      // FB stores single mention as scalar "id" and multiple as array or "id1,id2".
      function toList(v) {
        if (v === null || v === undefined) return [];
        if (Array.isArray(v)) return v.map(x => (typeof x === 'object' ? decodeI64(x) : String(x)));
        return String(v).split(',').map(s => s.trim()).filter(Boolean);
      }

      // === LANGUAGE-AGNOSTIC ACCESSIBILITY PARSING ===
      // Messenger renders an aria-label that contains the DECRYPTED text even for
      // E2EE threads, in the UI language. We support the common EN + VI variants:
      //   EN: "Message sent 4:31 PM by Hải: <text>"  /  "At 4:31 PM, Hải: <text>"
      //   VI: "Tin nhắn ... <người> ...: <text>"
      // The "You"/"Bạn" sender means it's our own message.
      function parseAria(article) {
        const els = article.querySelectorAll('[aria-label]');
        let mediaOnly = null;
        for (const el of els) {
          const al = el.getAttribute('aria-label') || '';
          // Pattern A: "...Message sent <time> by <sender>: <text>"  (has text)
          let m = al.match(/Message sent [^,]*? by ([^:]+?): ([\s\S]+)$/);
          if (m) return { sender: m[1].trim(), text: m[2].trim() };
          // Pattern B: "At <time>, <sender>: <text>"
          m = al.match(/^At [^,]*?, ([^:]+?): ([\s\S]+)$/);
          if (m) return { sender: m[1].trim(), text: m[2].trim() };
          // Media message (no text): "...Message sent <time> by <sender>"
          m = al.match(/Message sent [^,]*? by ([^:]+?)\s*$/);
          if (m && !mediaOnly) mediaOnly = { sender: m[1].trim(), text: '' };
        }
        return mediaOnly;
      }

      const results = [];
      const articles = Array.from(
        document.querySelectorAll('[role="main"] [role="article"]')
      ).slice(-cnt);

      articles.forEach(article => {
        const textDivs = article.querySelectorAll('div[dir="auto"]');

        // === 1. SENDER + TEXT (aria-label first, DOM fallback) ===
        const aria = parseAria(article);
        let senderName = aria && aria.sender ? aria.sender : 'User';
        let messageText = aria ? aria.text : '';

        // Fallback text: last non-empty div[dir="auto"]
        if (!messageText) {
          for (let i = textDivs.length - 1; i >= 0; i--) {
            const t = textDivs[i].innerText && textDivs[i].innerText.trim();
            if (t) { messageText = t; break; }
          }
        }
        if (!messageText) return; // Skip media/sticker-only messages

        // Self-detection from sender label (EN "You", VI "Bạn")
        let isMe = false;
        if (/^(You|Bạn)$/i.test(senderName)) { isMe = true; senderName = 'Me'; }

        // === 2. FIBER: messageId, senderId, timestamp, mentions ===
        let messageId = null;
        let senderId = 'Unknown';
        let timestamp = Date.now();
        let mentions = [];
        let _dbg = {};

        function findMessageInFiber(element, maxLevels) {
          const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber'));
          if (!fiberKey) return null;
          let fiber = element[fiberKey];
          for (let i = 0; i < maxLevels; i++) {
            if (!fiber) break;
            const props = fiber.memoizedProps;
            if (props && props.message && (props.message.messageId || props.message.timestampMs)) {
              return { msg: props.message, level: i };
            }
            fiber = fiber.return;
          }
          return null;
        }

        let fiberResult = findMessageInFiber(article, 12);
        if (!fiberResult) {
          for (const td of textDivs) { fiberResult = findMessageInFiber(td, 20); if (fiberResult) break; }
        }
        if (!fiberResult) {
          const children = article.querySelectorAll('div, span');
          for (const child of children) { fiberResult = findMessageInFiber(child, 20); if (fiberResult) break; }
        }

        if (fiberResult) {
          const msg = fiberResult.msg;
          messageId = typeof msg.messageId === 'string' ? msg.messageId : parseFbData(msg.messageId);

          const decoded = Number(decodeI64(msg.timestampMs || msg.timestamp));
          if (decoded && decoded > 1500000000000) timestamp = decoded;

          const rawSenderId = decodeI64(msg.senderId);
          if (rawSenderId) senderId = rawSenderId;
          if (_myId && senderId === _myId) { isMe = true; senderName = 'Me'; }

          // Extract mentions: ids are plaintext even in E2EE; offsets/lengths index into decrypted text.
          const ids = toList(msg.mentionIds);
          const offs = toList(msg.mentionOffsets);
          const lens = toList(msg.mentionLengths);
          for (let k = 0; k < ids.length; k++) {
            let name = '';
            const off = parseInt(offs[k]);
            const len = parseInt(lens[k]);
            if (messageText && !isNaN(off) && !isNaN(len)) {
              name = messageText.substr(off, len).replace(/^@/, '').trim();
            }
            if (ids[k]) mentions.push({ id: String(ids[k]), name });
          }

          _dbg = { senderId, senderName, fiberLevel: fiberResult.level, mentions: mentions.length };
        }

        // LƯU Ý: KHÔNG dùng tên để nhận diện "tin của mình" — sẽ nhầm nếu user
        // trùng tên bot. Chỉ dựa vào senderId===myId (cookie c_user, auto theo acc)
        // và nhãn "You/Bạn" trong aria-label → account-agnostic, đổi acc vẫn đúng.

        // === 3. STABLE ID (no random fallback → prevents re-reply loops) ===
        if (!messageId) {
          let h = 0;
          const basis = senderName + '|' + messageText;
          for (let i = 0; i < basis.length; i++) { h = ((h << 5) - h + basis.charCodeAt(i)) | 0; }
          messageId = 'c_' + Math.abs(h);
        }

        results.push({
          messageId,
          text: messageText,
          timestamp,
          senderId,
          sender: senderName,
          isMe,
          mentions,
          _dbg,
        });
      });

      return results;
    }, count, myId, myName);

  } catch (err) {
    console.log('[Bot] Loi doc messages:', err.message);
    return [];
  }
}

// Messenger 2026: Reply button lives in floating toolbar after hover
const REPLY_BTN_SELECTORS = [
  '[role="toolbar"][aria-label="Message actions"] [role="button"][aria-label="Reply to this message"]',
  '[aria-label="Reply to this message"]',
  '[aria-label="Trả lời tin nhắn này"]',
  '[aria-label="Trả lời"]',
  '[aria-label="Reply"]',
];

const MORE_BTN_SELECTORS = [
  '[role="toolbar"][aria-label="Message actions"] [role="button"][aria-label="More actions"]',
  '[aria-label="More actions"]',
  '[aria-label="Xem thêm"]',
  '[aria-label="More"]',
  '[aria-label="Khác"]',
];

/** Find visible Reply button in the floating toolbar (must hover first). */
async function findAndClickReplyButton(page, sleep) {
  const clicked = await page.evaluate(async (replySelectors, moreSelectors) => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function findReplyButton() {
      for (const sel of replySelectors) {
        const btns = document.querySelectorAll(sel);
        for (let i = btns.length - 1; i >= 0; i--) {
          if (isVisible(btns[i])) return btns[i];
        }
      }
      return null;
    }

    let replyBtn = findReplyButton();

    if (!replyBtn) {
      let moreBtn = null;
      for (const sel of moreSelectors) {
        const btns = document.querySelectorAll(sel);
        for (let i = btns.length - 1; i >= 0; i--) {
          if (isVisible(btns[i])) { moreBtn = btns[i]; break; }
        }
        if (moreBtn) break;
      }

      if (moreBtn) {
        moreBtn.click();
        await wait(500);

        const menuItems = document.querySelectorAll('[role="menuitem"]');
        for (const item of menuItems) {
          const txt = item.textContent || '';
          const label = item.getAttribute('aria-label') || '';
          if (txt.includes('Trả lời') || txt.includes('Reply') ||
              txt.includes('Phản hồi') ||
              label.includes('Reply to this message') ||
              label.includes('Trả lời')) {
            replyBtn = item;
            break;
          }
        }
      }
    }

    if (replyBtn) {
      replyBtn.click();
      return true;
    }
    return false;
  }, REPLY_BTN_SELECTORS, MORE_BTN_SELECTORS);

  if (clicked) await sleep(800);
  return clicked;
}

/** Hover article center with Puppeteer mouse (reliable vs JS dispatchEvent). */
async function hoverArticleCenter(page, center, sleep) {
  await page.mouse.move(center.x, center.y);
  await sleep(600);
}

/**
 * Reply to a message by its messageId — hover article, click Reply.
 * Messenger renders Reply in [role="toolbar"][aria-label="Message actions"].
 */
async function replyByMessageId(page, targetMid, sleep) {
  if (!targetMid) return false;
  try {
    const center = await page.evaluate((mid) => {
      function parseFbData(data) {
        if (!data) return null;
        if (typeof data === 'string' || typeof data === 'number') return String(data);
        if (Array.isArray(data)) return data.join('_');
        if (typeof data === 'object') {
          if (data['1'] !== undefined) return data['0'] + '_' + data['1'];
          return JSON.stringify(data);
        }
        return String(data);
      }

      const articles = Array.from(document.querySelectorAll('[role="main"] [role="article"]'));

      for (let i = articles.length - 1; i >= 0; i--) {
        const article = articles[i];
        let found = false;

        const elements = [article, ...article.querySelectorAll('div[dir="auto"], div, span')];
        for (const el of elements) {
          const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
          if (!key) continue;
          let fiber = el[key];

          for (let j = 0; j < 20; j++) {
            if (!fiber) break;
            const props = fiber.memoizedProps;
            if (props && props.message && props.message.messageId) {
              const currentMid = typeof props.message.messageId === 'string'
                ? props.message.messageId
                : parseFbData(props.message.messageId);
              if (currentMid === mid) { found = true; break; }
            }
            fiber = fiber.return;
          }
          if (found) break;
        }

        if (found) {
          article.scrollIntoView({ block: 'center', behavior: 'instant' });
          const rect = article.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    }, targetMid);

    if (!center) {
      console.log(`[Bot] Khong tim thay article cho ID: ${String(targetMid).substring(0, 25)}...`);
      return false;
    }

    await sleep(300);
    await hoverArticleCenter(page, center, sleep);

    const clicked = await findAndClickReplyButton(page, sleep);
    if (!clicked) {
      console.log(`[Bot] Khong click duoc Reply cho ID: ${String(targetMid).substring(0, 25)}...`);
      return false;
    }

    return true;
  } catch (err) {
    console.log(`[Bot] Loi reply mid:`, err.message);
    return false;
  }
}

/**
 * Reply to a message by searching for its text content.
 * Uses Puppeteer hover + Message actions toolbar.
 */
async function replyToMessage(page, targetText, sleep) {
  try {
    const center = await page.evaluate((textToFind) => {
      const articles = Array.from(document.querySelectorAll('[role="main"] [role="article"]'));

      for (let i = articles.length - 1; i >= 0; i--) {
        const article = articles[i];
        const content = article.textContent || '';

        if (content.includes(textToFind) && !article.querySelector('[role="textbox"]')) {
          article.scrollIntoView({ block: 'center', behavior: 'instant' });
          const rect = article.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    }, targetText);

    if (!center) {
      console.log(`[Bot] Khong tim thay Reply cho: "${targetText.substring(0, 15)}..."`);
      return false;
    }

    await hoverArticleCenter(page, center, sleep);

    const clicked = await findAndClickReplyButton(page, sleep);
    if (!clicked) {
      console.log(`[Bot] Khong click duoc Reply cho: "${targetText.substring(0, 15)}..."`);
      return false;
    }

    return true;
  } catch (err) {
    console.log('[Bot] Loi Reply:', err.message);
    return false;
  }
}

/**
 * Detect if page is a group chat.
 */
async function detectGroup(page) {
  try {
    return await page.evaluate(() => {
      // Check for group-specific UI elements
      const groupIndicators = [
        '[aria-label="Thành viên trong đoạn chat"]',
        '[aria-label="Chat members"]',
        '[aria-label="Cài đặt nhóm"]',
        '[aria-label="Group settings"]',
      ];
      for (const sel of groupIndicators) {
        if (document.querySelector(sel)) return true;
      }

      // Check page title/header for multiple names (comma-separated)
      const mainArea = document.querySelector('[role="main"]');
      if (mainArea) {
        const header = mainArea.querySelector('h2, h1');
        if (header && header.innerText.includes(',')) return true;
      }

      // Check body text for group indicators
      const text = document.body.innerText;
      if (text.includes('Thành viên trong đoạn chat') ||
          text.includes('Cài đặt đoạn chat') ||
          text.includes('Chat members')) {
        return true;
      }

      return false;
    });
  } catch { return false; }
}

/**
 * Scan sidebar for unread threads.
 * This still works with the sidebar DOM (uses links, not [role="row"]).
 */
async function scanUnreads(mainPage) {
  try {
    return await mainPage.evaluate(() => {
      const threads = [];
      const links = document.querySelectorAll(
        'div[role="navigation"] a[href*="/t/"], a[href*="/t/"]'
      );
      const seen = new Set();

      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/(?:\/e2ee)?\/t\/(\d+)/);
        if (!match) continue;

        const threadId = match[1];
        if (seen.has(threadId)) continue;
        seen.add(threadId);

        let hasUnread = false;
        let name = threadId;

        // Check for "Unread message" / "Tin nhắn chưa đọc" text
        const fullText = link.innerText || '';
        if (fullText.toLowerCase().includes('tin nhắn chưa đọc') ||
            fullText.toLowerCase().includes('unread message')) {
          hasUnread = true;
        }

        // Check font-weight for bold text (unread indicator)
        const spans = Array.from(link.querySelectorAll('span'));
        for (const span of spans) {
          const text = span.innerText.trim();
          if (!text) continue;

          const style = window.getComputedStyle(span);
          const fw = parseInt(style.fontWeight);

          if (fw >= 600 || style.fontWeight === 'bold') {
            hasUnread = true;
            if (fw === 600 && text.length < 40 &&
                !text.includes('Tin nhắn') && !text.includes('Unread')) {
              name = text;
            }
          }

          if ((!name || name === threadId) &&
              fw === 500 && text.length > 0 && text.length < 40) {
            name = text;
          }
        }

        if (hasUnread) {
          threads.push({ id: threadId, name, url: href });
        }
      }
      return threads;
    });
  } catch (err) {
    console.log('[Bot] Loi scan sidebar:', err.message);
    return [];
  }
}

module.exports = { readMessages, replyByMessageId, replyToMessage, detectGroup, scanUnreads };

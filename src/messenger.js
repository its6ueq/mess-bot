const config = require('../config');

class Messenger {
  constructor(page) {
    this.page = page;
    this.lastProcessed = new Map();
    this.currentThread = null;
    this.threadNames = new Map(); // cache: threadId -> ten nguoi/nhom
  }

  async waitForLogin() {
    console.log('[Messenger] Dang vao messenger.com...');
    await this.page.goto('https://www.messenger.com', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const url = this.page.url();
    if (url.includes('login') || url.includes('facebook.com/login')) {
      console.log('[Messenger] Chua dang nhap! Hay dang nhap Facebook tren Brave truoc.');
      console.log('[Messenger] Doi dang nhap... (120s timeout)');
      await this.page.waitForFunction(
        () => !window.location.href.includes('login'),
        { timeout: 120000 }
      );
    }

    await this.page.waitForSelector(config.selectors.messageInput, { timeout: 30000 }).catch(() => {
      console.log('[Messenger] Khong tim thay message input, thu doi them...');
    });

    await this.sleep(2000);
    console.log('[Messenger] Da san sang!');
  }

  async getUnreadThreads() {
    try {
      return await this.page.evaluate(() => {
        const threads = [];
        const links = document.querySelectorAll('a[href*="/t/"]');

        for (const link of links) {
          const href = link.getAttribute('href');
          const match = href.match(/\/t\/(\S+)/);
          if (!match) continue;

          const threadId = match[1].replace(/\/$/, '');
          const spans = link.querySelectorAll('span');
          let hasUnread = false;
          let name = '';

          for (const span of spans) {
            const style = window.getComputedStyle(span);
            if (parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold') {
              hasUnread = true;
              if (!name && span.textContent.trim().length > 0 && span.textContent.trim().length < 50) {
                name = span.textContent.trim();
              }
            }
          }

          const ariaLabel = link.getAttribute('aria-label') || '';
          if (ariaLabel.toLowerCase().includes('unread')) {
            hasUnread = true;
          }

          if (hasUnread && threadId) {
            threads.push({ id: threadId, name: name || threadId });
          }
        }
        return threads;
      });
    } catch (err) {
      console.log('[Messenger] Loi khi quet unread:', err.message);
      return [];
    }
  }

  async openThread(threadId) {
    if (this.currentThread === threadId) return;
    console.log(`[Messenger] Chuyen sang: ${threadId}`);

    try {
      const clickResult = await this.page.evaluate((tid) => {
        const allLinks = document.querySelectorAll('a[href]');
        for (const link of allLinks) {
          const href = link.getAttribute('href') || '';
          if (href.includes(`/t/${tid}`)) {
            link.click();
            return { clicked: true };
          }
        }
        return { clicked: false };
      }, threadId);

      if (clickResult.clicked) {
        try {
          await this.page.waitForFunction(
            (tid) => window.location.href.includes(tid),
            { timeout: 5000 },
            threadId
          );
        } catch {
          console.log('[Messenger] URL chua doi kip, tiep tuc...');
        }
        this.currentThread = threadId;
        await this.sleep(1500);
      } else {
        await this.page.goto(`https://www.messenger.com/t/${threadId}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
        this.currentThread = threadId;
        await this.sleep(2000);
      }

      // Cache ten thread
      const name = await this.getThreadName();
      if (name && name !== 'Unknown') {
        this.threadNames.set(threadId, name);
        console.log(`[Messenger] Thread name: ${name}`);
      }
    } catch (err) {
      console.log(`[Messenger] Loi khi mo thread ${threadId}:`, err.message);
    }
  }

  // Doc tin nhan - tra ve [{ text, sender, isMe }]
  async getLatestMessages(count = 20) {
    try {
      // Lay ten thread de dung lam fallback sender
      const threadId = this.currentThread;
      let fallbackName = this.threadNames.get(threadId) || null;
      if (!fallbackName) {
        fallbackName = await this.getThreadName();
        if (fallbackName && fallbackName !== 'Unknown' && threadId) {
          this.threadNames.set(threadId, fallbackName);
        }
      }

      return await this.page.evaluate((cnt, myName, threadName) => {
        const messages = [];
        const rowElements = document.querySelectorAll('[role="row"]');

        const start = Math.max(0, rowElements.length - cnt);
        const recentRows = Array.from(rowElements).slice(start);

        let lastSender = ''; // Luu ten sender truoc do (FB khong hien avatar cho tin lien tiep)

        for (const row of recentRows) {
          const divDirAuto = row.querySelector('div[dir="auto"]');
          if (!divDirAuto || divDirAuto.closest('[role="textbox"]')) continue;

          const text = divDirAuto.textContent.trim();
          if (!text) continue;

          // isMe: tin nhan ben phai man hinh
          const rect = divDirAuto.getBoundingClientRect();
          const isMe = rect.left > (window.innerWidth / 2);

          let sender = isMe ? (myName || 'Me') : '';

          if (!isMe) {
            // Tim avatar img trong row - ten nam trong attr "alt"
            // Avatar: 28x28, reaction emoji: 16x16 -> loc theo size
            const imgs = row.querySelectorAll('img');
            for (const img of imgs) {
              // Avatar la hinh tron 28x28, bo qua emoji sticker va reaction
              const w = img.width, h = img.height;
              if (w >= 24 && w <= 40 && h >= 24 && h <= 40) {
                const alt = img.getAttribute('alt') || '';
                const src = img.src || '';
                // Avatar co src tu fbcdn profiles, ko phai emoji.php
                if (alt && alt.length > 1 && alt.length < 50
                    && !alt.includes('Seen')
                    && !alt.includes('Icon')
                    && !src.includes('emoji.php')) {
                  sender = alt;
                  break;
                }
              }
            }
            // FB khong hien avatar cho tin lien tiep -> dung ten truoc do
            if (!sender && lastSender) {
              sender = lastSender;
            }
            // Fallback cuoi: ten thread (DM = ten nguoi kia)
            if (!sender) {
              sender = threadName || 'User';
            }
          }

          // Cap nhat lastSender
          if (!isMe && sender) {
            lastSender = sender;
          } else if (isMe) {
            lastSender = ''; // Reset khi gap tin cua minh
          }

          messages.push({ text, sender, isMe });
        }
        return messages;
      }, count, config.myName, fallbackName);
    } catch (err) {
      console.log('[Messenger] Loi doc tin:', err.message);
      return [];
    }
  }

  // Dump DOM structure cua messages (de debug)
  async dumpMessageDOM(count = 5) {
    try {
      return await this.page.evaluate((cnt) => {
        const rows = document.querySelectorAll('[role="row"]');
        const result = [];
        const start = Math.max(0, rows.length - cnt);

        for (let i = start; i < rows.length; i++) {
          const row = rows[i];
          const info = {
            index: i,
            html: row.innerHTML.substring(0, 500),
            text: '',
            imgs: [],
            ariaLabels: [],
            roles: [],
          };

          // Text
          const dir = row.querySelector('div[dir="auto"]');
          if (dir) {
            info.text = dir.textContent.trim().substring(0, 100);
            const rect = dir.getBoundingClientRect();
            info.rect = { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(window.innerWidth) };
          }

          // Images
          row.querySelectorAll('img').forEach(img => {
            info.imgs.push({
              alt: img.getAttribute('alt') || '',
              ariaLabel: img.getAttribute('aria-label') || '',
              src: (img.src || '').substring(0, 80),
            });
          });

          // Aria labels
          row.querySelectorAll('[aria-label]').forEach(el => {
            info.ariaLabels.push(el.getAttribute('aria-label'));
          });

          result.push(info);
        }
        return result;
      }, count);
    } catch (err) {
      return [{ error: err.message }];
    }
  }

  async sendMessage(text) {
    try {
      const input = await this.page.$(config.selectors.messageInput);
      if (!input) return false;

      await input.click();
      await this.sleep(100);

      // Split theo dong, dung Shift+Enter de xuong dong
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          // Shift+Enter = xuong dong trong Messenger
          await this.page.keyboard.down('Shift');
          await this.page.keyboard.press('Enter');
          await this.page.keyboard.up('Shift');
          await this.sleep(30);
        }
        // insertText nhanh hon type() va ho tro unicode/emoji
        if (lines[i]) {
          await this.page.evaluate((line) => {
            document.execCommand('insertText', false, line);
          }, lines[i]);
        }
      }

      await this.sleep(100);
      await this.page.keyboard.press('Enter'); // Gui tin nhan
      await this.sleep(300);
      return true;
    } catch (err) {
      console.log('[Messenger] Loi khi gui tin:', err.message);
      return false;
    }
  }

  async isGroupChat() {
    try {
      const url = this.page.url();
      if (url.includes('/g/')) return true;

      return await this.page.evaluate(() => {
        const mainArea = document.querySelector('[role="main"]');
        if (!mainArea) return false;
        const allText = mainArea.textContent || '';
        if (/\d+\s*(members|thành viên|người)/i.test(allText)) return true;

        const headers = mainArea.querySelectorAll('h2, h3');
        for (const h of headers) {
          if (h.textContent.includes(',') && h.textContent.split(',').length >= 2) return true;
        }
        return false;
      });
    } catch { return false; }
  }

  async getThreadName() {
    try {
      return await this.page.evaluate(() => {
        const mainArea = document.querySelector('[role="main"]');
        if (!mainArea) return 'Unknown';
        const header = mainArea.querySelector('h2, h3, [data-scope="thread_title"]');
        return header ? header.textContent.trim() : 'Unknown';
      });
    } catch { return 'Unknown'; }
  }

  // Hash de track da xu ly
  messageHash(messages) {
    if (!messages.length) return '';
    const last = messages[messages.length - 1];
    return `${last.sender}:${last.text}`;
  }

  markProcessed(threadId, messages) {
    this.lastProcessed.set(threadId, this.messageHash(messages));
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms + Math.random() * 500));
  }
}

module.exports = { Messenger };

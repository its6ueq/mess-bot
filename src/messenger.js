const config = require('../config');

class Messenger {
  constructor(page) {
    this.page = page;
    this.currentThread = null;
    this.threadNames = new Map();
    
    // THÊM: Map lưu danh sách các tin nhắn đã xử lý cho từng thread
    // Key: threadId, Value: Set(hashTinNhan)
    this.processedHashes = new Map(); 
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
  async getNewMessages(threadId) {
    // 1. Lấy 20 tin nhắn mới nhất từ DOM (Hàm này giữ nguyên logic lấy tin của bạn)
    const currentMessages = await this.getLatestMessages(20);
    
    // 2. Nếu đây là lần đầu tiên bot vào thread này (chưa có checkpoint)
    if (!this.processedHashes.has(threadId)) {
      console.log(`[Checkpoint] Khoi tao trang thai cho thread ${threadId}`);
      this.processedHashes.set(threadId, new Set());
      
      // QUAN TRỌNG: Đánh dấu TẤT CẢ tin hiện tại là "Đã xử lý"
      // Để tránh bot reply lại tin nhắn cũ từ hôm qua
      const processed = this.processedHashes.get(threadId);
      currentMessages.forEach(msg => {
        processed.add(this.generateMsgHash(msg));
      });
      
      return []; // Lần đầu không trả về tin nhắn nào
    }

    // 3. Lọc tin nhắn mới
    const processed = this.processedHashes.get(threadId);
    const newMessages = [];

    // Duyệt danh sách tin lấy về
    for (const msg of currentMessages) {
      // Bỏ qua tin của chính mình (Bot)
      if (msg.isMe) continue;

      // Tạo hash (vân tay) cho tin nhắn
      const hash = this.generateMsgHash(msg);

      // Nếu hash này CHƯA có trong Set -> Đây là tin mới
      if (!processed.has(hash)) {
        newMessages.push(msg);
        
        // Lưu ý: Ta chưa add vào Set ngay ở đây. 
        // Việc add vào Set (markAsProcessed) sẽ do bot.js gọi sau khi xử lý xong
        // để đảm bảo nếu bot crash lúc xử lý thì lần sau vẫn nhận lại tin này.
      }
    }

    return newMessages;
  }

  updateThreadState(threadId, messages) {
    // Chỉ lưu tối đa 20 tin để tiết kiệm bộ nhớ
    const snapshot = messages.slice(-20);
    this.threadState.set(threadId, snapshot);
  }

  // Doc tin nhan - tra ve [{ text, sender, senderId, isMe }]
  async getLatestMessages(count = 20) {
    try {
      const threadId = this.currentThread;
      let fallbackName = this.threadNames.get(threadId) || null;
      if (!fallbackName) {
        fallbackName = await this.getThreadName();
        if (fallbackName && fallbackName !== 'Unknown' && threadId) {
          this.threadNames.set(threadId, fallbackName);
        }
      }

      const myId = config.myId;
      return await this.page.evaluate((cnt, myName, threadName, _myId, _threadId) => {
        const messages = [];
        const rowElements = document.querySelectorAll('[role="row"]');

        const start = Math.max(0, rowElements.length - cnt);
        const recentRows = Array.from(rowElements).slice(start);

        let lastSender = '';
        let lastSenderId = '';

        for (const row of recentRows) {
          const divDirAuto = row.querySelector('div[dir="auto"]');
          if (!divDirAuto || divDirAuto.closest('[role="textbox"]')) continue;

          const text = divDirAuto.textContent.trim();
          if (!text) continue;

          const rect = divDirAuto.getBoundingClientRect();
          const isMe = rect.left > (window.innerWidth / 2);

          let sender = isMe ? (myName || 'Me') : '';
          let senderId = isMe ? (_myId || '') : '';

          if (!isMe) {
            const imgs = row.querySelectorAll('img');
            for (const img of imgs) {
              const w = img.width, h = img.height;
              if (w >= 24 && w <= 40 && h >= 24 && h <= 40) {
                const alt = img.getAttribute('alt') || '';
                const src = img.src || '';
                if (alt && alt.length > 1 && alt.length < 50
                    && !alt.includes('Seen')
                    && !alt.includes('Icon')
                    && !src.includes('emoji.php')) {
                  sender = alt;
                  // Extract user ID from avatar parent link
                  const parentLink = img.closest('a');
                  if (parentLink) {
                    const href = parentLink.getAttribute('href') || '';
                    const idMatch = href.match(/\/(?:user|t)\/(\d+)/) ||
                                    href.match(/profile\.php\?id=(\d+)/) ||
                                    href.match(/\/(\d{6,})/);
                    if (idMatch) senderId = idMatch[1];
                  }
                  break;
                }
              }
            }
            if (!sender && lastSender) {
              sender = lastSender;
              senderId = lastSenderId;
            }
            if (!sender) sender = threadName || 'User';
            // DM fallback: senderId = threadId
            if (!senderId && _threadId) senderId = _threadId;
          }

          if (!isMe && sender) {
            lastSender = sender;
            lastSenderId = senderId;
          } else if (isMe) {
            lastSender = '';
            lastSenderId = '';
          }

          messages.push({ text, sender, senderId, isMe });
        }
        return messages;
      }, count, config.myName, fallbackName, myId, threadId);
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
    return new Promise(r => setTimeout(r, ms + Math.random() * 50));
  }
  generateMsgHash(msg) {
    // Kết hợp ID người gửi + Nội dung để tránh trùng lặp
    // Nếu có senderId (từ React Fiber) thì dùng, không thì dùng tên
    const id = msg.senderId || msg.sender; 
    return `${id}_${msg.text}`.trim();
  }

  // Đánh dấu 1 tin nhắn là "Đã xử lý" (Gọi hàm này sau khi bot reply xong)
  markAsProcessed(threadId, msg) {
    if (!this.processedHashes.has(threadId)) {
      this.processedHashes.set(threadId, new Set());
    }
    
    const processed = this.processedHashes.get(threadId);
    const hash = this.generateMsgHash(msg);
    processed.add(hash);

    // Dọn dẹp bộ nhớ: Chỉ giữ lại 50 tin gần nhất để tránh tràn RAM
    if (processed.size > 50) {
      // Xóa phần tử cũ nhất (Set trong JS giữ thứ tự chèn)
      const firstValue = processed.values().next().value;
      processed.delete(firstValue);
    }
  }

}

module.exports = { Messenger };

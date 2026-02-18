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
      const myId = config.myId; // Khai báo ID của bot trong config nhé
      
      return await this.page.evaluate((cnt, _myId) => {
        function decodeBigInt(arr) {
          if (!arr) return null;
          if (typeof arr === 'string' || typeof arr === 'number') return String(arr);
          if (Array.isArray(arr) && arr.length === 2) {
            try { return ((BigInt(arr[0]) << 32n) + BigInt(arr[1])).toString(); } catch (e) { return null; }
          }
          return null;
        }

        const results = [];
        const rows = Array.from(document.querySelectorAll('[role="row"]')).slice(-cnt);

        rows.forEach(row => {
          const textDiv = row.querySelector('div[dir="auto"]');
          if (!textDiv) return;

          const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
          if (!key) return;
          let fiber = textDiv[key];

          let messageData = null;
          let cleanText = "";
          let currentFiber = fiber;

          for (let i = 0; i < 25; i++) {
            if (!currentFiber) break;
            const props = currentFiber.memoizedProps;
            if (props && props.message) { messageData = props.message; break; }
            if (props && props.text && typeof props.text === 'string' && !props.message) {
              if (props.text.length < 500 && !props.text.includes('##')) cleanText = props.text;
            }
            currentFiber = currentFiber.return;
          }

          if (messageData) {
                let rawTime = messageData.timestampMs || messageData.timestamp;
                let timestamp = Number(decodeBigInt(rawTime));
                if (!timestamp || isNaN(timestamp)) timestamp = Date.now();

                const senderId = decodeBigInt(messageData.senderId) || 'Unknown';
                let senderName = messageData.senderName || 'User';

                let isMe = messageData.isOutgoing === true || messageData.outgoing === true;
                if (_myId && senderId === _myId) isMe = true;
                if (isMe) senderName = 'Me';

                // FIX: Ép kiểu messageId ra string ngay ở đây để chống lỗi Array === Array
                let midRaw = messageData.messageId;
                let finalMid = midRaw;
                if (Array.isArray(midRaw)) finalMid = midRaw.join('_');
                else if (midRaw) finalMid = String(midRaw);

                results.push({
                    messageId: finalMid, // Đã convert thành dạng "12345_6789"
                    text: messageData.body || cleanText || "Media/Sticker",
                    timestamp: timestamp,
                    senderId: senderId,
                    sender: senderName,
                    isMe: isMe
                });
            }
        });
        return results;
      }, count, myId);
    } catch (err) {
      console.log('[Messenger] Loi doc tin Fiber:', err.message);
      return [];
    }
  }

  // Sửa lại Hash: Dùng MessageID của server, đảm bảo Spam 10 lần chữ /work vẫn nhận diện được
  generateMsgHash(msg) {
    return msg.messageId || `${msg.senderId}_${msg.timestamp}`;
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

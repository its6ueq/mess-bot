const config = require('../config');
const { handleCommand, checkAutoReply, games } = require('./commands');
const { AIChat } = require('./ai');
const db = require('./db');
const path = require('path');

// --- 1. CLASS RATE LIMITER (NAM O NGOAI CLASS BOT) ---
class RateLimiter {
  constructor(maxPerMinute = 15) {
    this.max = maxPerMinute;
    this.hits = new Map(); 
  }

  check(senderId) {
    const now = Date.now();
    const times = (this.hits.get(senderId) || []).filter(t => now - t < 60000);
    if (times.length >= this.max) return false;
    times.push(now);
    this.hits.set(senderId, times);
    return true;
  }
}

// --- 2. CLASS BOT ---
class Bot {
  constructor(browser, mainPage) {
    this.browser = browser;
    this.mainPage = mainPage;
    this.ai = new AIChat();
    this.running = false;
    this.tabs = new Map();
    this.checkpoints = db.load('checkpoints', {}); 
    
    // KHOI TAO RATE LIMITER (Chuan)
    this.rateLimiter = new RateLimiter(20); 
    
    // MOC THOI GIAN: Tru 5s de khong sot tin vua gui
    this.startTime = Date.now() - 5000; 
    
    // Set luu ID tin nhan da xu ly
    this.processedMsgIds = new Set();
    
    // RAM chong hut tin (Logic cu van giu de tuong thich)
    this.processedCheckpoints = new Map();

    // Queue tin nhan cho async replier
    this.messageQueue = [];
  }

  // Luu checkpoint: tin nhan cuoi cung da xu ly trong thread
  saveCheckpoint(threadId, msg) {
    this.checkpoints[threadId] = {
      text: msg.text,
      sender: msg.sender,
      senderId: msg.senderId || null,
      time: Date.now(),
    };
    db.save('checkpoints');
  }

  getCheckpoint(threadId) {
    return this.checkpoints[threadId] || null;
  }

  // Update user registry: map senderId -> displayName
  updateUserRegistry(senderId, displayName) {
    if (!senderId || !displayName || senderId === 'Me' || senderId === 'User') return;
    games.economy.updateUser(senderId, displayName);
  }

  // Mo tab moi cho 1 thread
  async openTab(threadId, threadName) {
    if (this.tabs.has(threadId)) return this.tabs.get(threadId);

    console.log(`[Bot] Mo tab moi: ${threadName} (${threadId})`);
    const page = await this.browser.newPage();

    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Navigate den thread
    const url = `https://www.messenger.com/t/${threadId}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.sleep(2000);

    // Doi textbox xuat hien (thread da load xong)
    await page.waitForSelector('[role="textbox"]', { timeout: 10000 }).catch(() => {});

    const tabInfo = {
      page,
      threadId,
      name: threadName,
      isGroup: null, // detect sau
    };

    this.tabs.set(threadId, tabInfo);

    // Detect group/DM
    tabInfo.isGroup = await this.detectGroup(page);

    // Init: danh dau tat ca tin nhan hien tai la "da xu ly"
    const initMsgs = await this.readMessages(tabInfo.page, 30, threadId, tabInfo.isGroup);
    for (const msg of initMsgs) {
      const hash = this.generateMsgHash(msg);
      this.processedMsgIds.add(hash);
    }
    if (!this.getCheckpoint(threadId) && initMsgs.length > 0) {
      this.saveCheckpoint(threadId, initMsgs[initMsgs.length - 1]);
    }
    console.log(`[Bot] Tab ${threadName}: init ${initMsgs.length} tin da xu ly`);

    return tabInfo;
  }

  // Dong tab
  async closeTab(threadId) {
    const tab = this.tabs.get(threadId);
    if (tab) {
      await tab.page.close().catch(() => {});
      this.tabs.delete(threadId);
    }
  }

// Doc tin nhan tu 1 tab (page) - SU DUNG REACT FIBER DE LAY ID
  async readMessages(page, count = 20) {
    try {
      return await page.evaluate((cnt) => {
        const messages = [];
        const rows = Array.from(document.querySelectorAll('[role="row"]'));
        // Lấy những tin nhắn cuối cùng để check
        const targetRows = rows.slice(-cnt);

        for (const row of targetRows) {
            const textDiv = row.querySelector('div[dir="auto"]');
            if (!textDiv) continue;

            // --- LOGIC CỦA BẠN: TIM REACT FIBER KEY ---
            const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
            if (!key) continue;
            let fiber = textDiv[key];

            // --- LOGIC CỦA BẠN: LEO 15 CẤP TÌM MESSAGE DATA ---
            let messageData = null;
            let cleanText = "";
            let currentFiber = fiber;

            for (let i = 0; i < 20; i++) {
                if (!currentFiber) break;
                const props = currentFiber.memoizedProps;
                
                // Tìm thấy object message chứa ID, Timestamp, SenderID
                if (props && props.message) {
                    messageData = props.message;
                }
                
                // Lấy text sạch (tránh icon, null)
                if (props && props.text && typeof props.text === 'string' && !props.message) {
                    if (props.text.length < 500 && !props.text.includes('##')) {
                        cleanText = props.text;
                    }
                }
                currentFiber = currentFiber.return;
            }

            // Nếu tìm thấy data, format lại để Bot xử lý
            if (messageData) {
                // Xác định người gửi
                // isOutgoing = true => Là tin mình gửi (Me)
                const isMe = messageData.isOutgoing === true; 
                const senderId = messageData.senderId; 
                const senderName = isMe ? 'Me' : (messageData.senderName || 'User');

                // Lấy timestamp (quan trọng cho logic 1 phút)
                // FB thường lưu là timestampMs (milisecond)
                const timestamp = Number(messageData.timestampMs || messageData.timestamp || Date.now());

                // Lấy messageId (quan trọng để reply chính xác)
                const messageId = messageData.messageId;

                // Lấy nội dung
                const text = messageData.body || cleanText || "Attachment/Sticker";

                messages.push({ 
                    text, 
                    sender: senderName, 
                    senderId, 
                    isMe, 
                    timestamp, 
                    messageId // ID chuẩn từ React Fiber
                });
            }
        }
        return messages;
      }, count);
    } catch (err) {
      console.log('[Bot] Lỗi đọc tin React Fiber:', err.message);
      return [];
    }
  }


  // Gui tin nhan vao 1 tab
  async sendMessage(page, text) {
    try {
      const input = await page.$('[role="textbox"][contenteditable="true"]');
      if (!input) return false;

      await input.click();
      await this.sleep(80);

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          await page.keyboard.down('Shift');
          await page.keyboard.press('Enter');
          await page.keyboard.up('Shift');
          await this.sleep(30);
        }
        if (lines[i]) {
          await page.evaluate((line) => {
            document.execCommand('insertText', false, line);
          }, lines[i]);
        }
      }

      await this.sleep(80);
      await page.keyboard.press('Enter');
      await this.sleep(300);
      return true;
    } catch (err) {
      console.log('[Bot] Loi gui tin:', err.message);
      return false;
    }
  }

  // Gui file (anh, audio, video) qua Messenger
  async sendFile(page, filePath) {
    try {
      // Tim input[type="file"] an trong DOM
      // Messenger co 1 hidden file input de upload attachments
      let fileInput = await page.$('input[type="file"]');

      if (!fileInput) {
        // Thu click nut attach truoc de trigger render file input
        const attachBtn = await page.$('[aria-label="Attach file"], [aria-label="Đính kèm tệp"], [aria-label="Thêm tệp"]');
        if (attachBtn) {
          await attachBtn.click();
          await this.sleep(500);
          fileInput = await page.$('input[type="file"]');
        }
      }

      if (!fileInput) {
        console.log('[Bot] Khong tim thay file input!');
        return false;
      }

      // Upload file
      const absolutePath = path.resolve(filePath);
      await fileInput.uploadFile(absolutePath);
      await this.sleep(1000);

      // Nhan Enter de gui
      await page.keyboard.press('Enter');
      await this.sleep(500);

      console.log(`[Bot] Da gui file: ${path.basename(filePath)}`);
      return true;
    } catch (err) {
      console.log('[Bot] Loi gui file:', err.message);
      return false;
    }
  }

  // Detect group chat tu 1 page
  async detectGroup(page) {
    try {
      const url = page.url();
      if (url.includes('/g/')) return true;
      return await page.evaluate(() => {
        const main = document.querySelector('[role="main"]');
        if (!main) return false;
        const text = main.textContent || '';
        if (/\d+\s*(members|thành viên|người)/i.test(text)) return true;
        const headers = main.querySelectorAll('h2, h3');
        for (const h of headers) {
          if (h.textContent.includes(',') && h.textContent.split(',').length >= 2) return true;
        }
        return false;
      });
    } catch { return false; }
  }

  // Scan sidebar (mainPage) de tim unread threads
  async scanUnreads() {
    try {
      return await this.mainPage.evaluate(() => {
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

          // Lay ten tu span - chi lay span DAU TIEN co bold (ten thread)
          // Bo qua cac span sau (noi dung tin nhan, thoi gian, v.v.)
          const spans = link.querySelectorAll('span');
          let hasUnread = false;
          let name = '';
          let foundName = false;

          for (const span of spans) {
            const text = span.textContent.trim();
            const style = window.getComputedStyle(span);
            const isBold = parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold';

            if (isBold) {
              hasUnread = true;
              // Chi lay ten DANG TIEN - span dau tien co noi dung hop le
              // Ten thread thuong ngan (< 30 ky tu) va khong chua / hoac cac ky tu command
              if (!foundName && text.length > 0 && text.length < 40) {
                // Bo qua neu la thoi gian (vd: "2 gio", "10:30")
                // Bo qua neu la noi dung tin (thuong dai hon hoac chua /)
                if (!text.match(/^\d+\s*(gio|phut|giay|h|m|s|:)/i) &&
                    !text.startsWith('/') &&
                    !text.includes('sent') && !text.includes('gui')) {
                  name = text;
                  foundName = true;
                }
              }
            }
          }

          const ariaLabel = link.getAttribute('aria-label') || '';
          if (ariaLabel.toLowerCase().includes('unread')) hasUnread = true;

          // Neu chua tim duoc ten tu spans, thu lay tu aria-label
          if (!name && ariaLabel) {
            // aria-label thuong co dang "Chat voi Ten Nguoi"
            const labelMatch = ariaLabel.match(/(?:Chat with|Chat voi|Trò chuyện với)\s+(.+)/i);
            if (labelMatch) name = labelMatch[1].trim();
            // Hoac chi la ten
            else if (ariaLabel.length < 40 && !ariaLabel.includes('unread')) name = ariaLabel;
          }

          if (hasUnread && threadId) {
            threads.push({ id: threadId, name: name || threadId });
          }
        }
        return threads;
      });
    } catch (err) {
      console.log('[Bot] Loi scan sidebar:', err.message);
      return [];
    }
  }

  async replyToMessage(page, targetText, replyContent) {
    try {
      // 1. Tim tin nhan -> Hover -> Click Reply
      const clicked = await page.evaluate(async (textToFind) => {
        const rows = Array.from(document.querySelectorAll('[role="row"]'));
        const wait = (ms) => new Promise(r => setTimeout(r, ms));

        for (let i = rows.length - 1; i >= 0; i--) {
          const row = rows[i];
          const msgContent = row.textContent || '';

          if (msgContent.includes(textToFind) && !row.querySelector('[role="textbox"]')) {
            const mouseoverEvent = new MouseEvent('mouseover', {
              bubbles: true, cancelable: true, view: window
            });
            row.dispatchEvent(mouseoverEvent);
            await wait(300);

            const replyBtn = row.querySelector('[aria-label="Reply"], [aria-label="Trả lời"]');
            if (replyBtn) {
              replyBtn.click();
              return true;
            }
          }
        }
        return false;
      }, targetText);

      if (!clicked) {
        console.log(`[Bot] Khong tim thay nut Reply cho: "${targetText.substring(0, 15)}..."`);
        return await this.sendMessage(page, `"${targetText.substring(0, 10)}..."\n${replyContent}`);
      }

      await this.sleep(500);
      console.log(`[Bot] Dang reply tin nhan: "${targetText.substring(0, 15)}..."`);
      return await this.sendMessage(page, replyContent);

    } catch (err) {
      console.log('[Bot] Loi Reply:', err.message);
      return false;
    }
  }

  async readMessages(page, count = 20, threadId = null, isGroup = false) {
    try {
      await page.waitForSelector('[role="row"]', { timeout: 2000 }).catch(() => {});
      
      // Lay ID cua minh tu config de so sanh
      const myId = config.myId; 

      return await page.evaluate((cnt, _myId) => {
        const results = [];
        const rows = Array.from(document.querySelectorAll('[role="row"]'));
        const targetRows = rows.slice(-cnt);

        targetRows.forEach(row => {
            const textDiv = row.querySelector('div[dir="auto"]');
            if (!textDiv) return;
            
            const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
            if (!key) return;
            const fiber = textDiv[key];

            let messageData = null;
            let cleanText = "";
            let currentFiber = fiber;
            
            // Leo 20 cap cha
            for (let i = 0; i < 20; i++) {
                if (!currentFiber) break;
                const props = currentFiber.memoizedProps;
                
                if (props && props.message) messageData = props.message;
                
                if (props && props.text && typeof props.text === 'string' && !props.message) {
                    if (props.text.length < 500 && !props.text.includes('##')) {
                        cleanText = props.text;
                    }
                }
                currentFiber = currentFiber.return;
            }

            if (messageData) {
                // 1. FIX TIME: Lay timestamp hoac Date.now()
                let timestamp = Number(messageData.timestampMs || messageData.timestamp);
                if (!timestamp || isNaN(timestamp)) timestamp = Date.now();

                // 2. FIX SENDER ID & NAME
                const senderId = messageData.senderId || 'Unknown';
                // Thu tim ten trong messageData, neu khong co thi fallback
                let senderName = messageData.senderName || 'User';

                // 3. FIX ISME (QUAN TRONG NHAT)
                // - Check 1: isOutgoing cua FB
                // - Check 2: So sanh senderId voi myId (trong config)
                // - Check 3: Neu senderId chinh la threadId (trong truong hop chat 1-1 la minh gui) -> sai logic nay bo qua
                let isMe = messageData.isOutgoing === true;
                
                if (_myId && senderId === _myId) isMe = true;
                
                // FIX LOG NAME UNDEFINED
                if (isMe) senderName = 'Me';

                results.push({
                    messageId: messageData.messageId,
                    text: messageData.body || cleanText || "Media/Sticker",
                    timestamp: timestamp,
                    senderId: senderId,
                    sender: senderName, // Them truong sender name de log khong bi undefined
                    isMe: isMe
                });
            }
        });

        return results;
      }, count, myId);

    } catch (err) {
      console.log('[Bot] Loi doc React Fiber:', err.message);
      return [];
    }
  }

  findNewMessages(messages, threadId) {
    const newMsgs = [];
    const now = Date.now();
    const TIME_LIMIT = 10 * 60 * 1000; // 10 phut

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // 1. Chon loc isMe (Da fix o ham readMessages)
      if (msg.isMe) continue;
      
      // 2. [QUAN TRONG] LOC RAC LOOP
      // Neu tin nhan bat dau bang "Rep #" -> Day la tin do bot/script gui -> BO QUA
      if (msg.text.startsWith('Rep #')) continue;

      // 3. Check Thoi gian
      if (now - msg.timestamp > TIME_LIMIT) break; 
      
      // 4. Check Hash
      const hash = this.generateMsgHash(msg);
      if (this.processedMsgIds.has(hash)) break; 

      newMsgs.push(msg);
    }

    return newMsgs.reverse();
  }

  // Check tab & Reply
  async checkTab(threadId, tab, focus = false) {
    try {
      if (tab.page.isClosed()) { this.tabs.delete(threadId); return; }

      if (focus) {
        await tab.page.bringToFront();
        await this.sleep(1500); 
      }

      let loopCount = 0;
      while (loopCount < 3) { // Quet toi da 3 batch
        loopCount++;
        const messages = await this.readMessages(tab.page, 30, threadId, tab.isGroup);
        if (!messages.length) break;

        const newMsgs = this.findNewMessages(messages, threadId);
        if (newMsgs.length === 0) break;

        console.log(`[Bot] ${tab.name}: Phat hien ${newMsgs.length} tin moi (Batch ${loopCount})`);

        for (const msg of newMsgs) {
            console.log(`[Bot] >> Xu ly: "${msg.text.substring(0,20)}..." | Time: ${new Date(msg.timestamp).toLocaleTimeString()}`);
            
            // Xu ly & Reply
            const reply = await this.processMessage(msg, threadId, tab.isGroup, tab.page);
            if (reply) {
                await this.sleep(500); 
                if (typeof reply === 'string') {
                    const sent = await this.replyToMessage(tab.page, msg.text, reply);
                    if (!sent) await this.sendMessage(tab.page, reply);
                }
            }

            // DANH DAU DA XU LY
            const uniqueId = msg.messageId || `${msg.senderId}_${msg.timestamp}`;
            this.processedMsgIds.add(uniqueId);
            
            // Don dep bo nho (Giu 500 tin gan nhat)
            if (this.processedMsgIds.size > 500) {
                const it = this.processedMsgIds.values();
                this.processedMsgIds.delete(it.next().value);
            }
            await this.sleep(300);
        }
        await this.sleep(1000);
      }
    } catch (err) {
      console.log(`[Bot] Loi check tab ${tab.name}:`, err.message);
    }
  }

  // Parse message (DM va Group deu dung / de goi lenh)
  parseMessage(text, isGroup) {
    const trimmed = text.trim();

    // Ca DM va Group: bat dau bang / la command
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(/\s+/);
      return { isCommand: true, command: parts[0], args: parts.slice(1).join(' '), raw: trimmed };
    }

    // Group: @botname cung la command
    if (isGroup) {
      const botName = config.botName.toLowerCase();
      const lower = trimmed.toLowerCase();
      for (const pattern of [`@${botName}`, `@${config.botName}`]) {
        if (lower.startsWith(pattern.toLowerCase())) {
          const rest = trimmed.slice(pattern.length).trim();
          if (rest.startsWith('/')) {
            const parts = rest.slice(1).split(/\s+/);
            return { isCommand: true, command: parts[0], args: parts.slice(1).join(' '), raw: trimmed };
          }
          const parts = rest.split(/\s+/);
          return { isCommand: true, command: parts[0] || 'help', args: parts.slice(1).join(' '), raw: trimmed };
        }
      }
      // Group: khong co / va khong co @bot -> bo qua
      return { isCommand: false, raw: trimmed, ignored: true };
    }

    // DM: khong co / -> khong phai command
    return { isCommand: false, raw: trimmed };
  }

  // Sanitize input - chong injection
  sanitize(text) {
    if (!text) return '';
    return text.substring(0, 2000);
  }

  // Xu ly 1 tin nhan, tra ve reply text hoac null
  async processMessage(msg, threadId, isGroup, tabPage) {
    // Resolve senderId:
    // 1. Tu DOM extraction (msg.senderId)
    // 2. DM: threadId = userId
    // 3. Group: tim trong registry theo ten
    // 4. Fallback: dung ten lam key tam thoi
    let senderId = msg.senderId;
    if (!senderId && !isGroup) {
      senderId = threadId; // DM: threadId = userId
    }
    if (!senderId && msg.sender && msg.sender !== 'User') {
      // Group: tim ID tu registry theo ten
      const foundId = games.economy.findIdByName(msg.sender);
      if (foundId) senderId = foundId;
    }
    if (!senderId) {
      // Fallback cuoi: dung ten lam key tam (se duoc merge khi co ID that)
      senderId = msg.sender || 'Unknown';
    }

    // Update user registry
    if (senderId && msg.sender && msg.sender !== 'Me' && msg.sender !== 'User') {
      this.updateUserRegistry(senderId, msg.sender);
      // Cap nhat displayName trong economy
      games.economy.getPlayer(senderId, msg.sender);
    }

    // Rate limit (dung senderId)
    if (!this.rateLimiter.check(senderId)) {
      return 'Ban gui qua nhanh! Doi 1 chut.';
    }

    const parsed = this.parseMessage(this.sanitize(msg.text), isGroup);
    if (parsed.ignored) return null;

    // ctx dung senderId thay vi sender name
    const ctx = {
      sender: msg.sender,       // Display name (de hien thi)
      senderId: senderId,       // Facebook User ID (de luu DB)
      threadId,
      isGroup,
    };

    // Dang choi game -> forward input (dung senderId)
    if (games.hasActiveGame(threadId) && !parsed.isCommand) {
      const result = games.handleGameInput(threadId, parsed.raw, senderId);
      if (result) return result;
    }

    if (parsed.isCommand && parsed.command) {
      const cmd = parsed.command.toLowerCase();

      // AI commands
      if (cmd === 'chat') return await this.handleAIChat(threadId, parsed.args, msg.sender);
      if (cmd === 'clearchat') return this.ai.clearHistory(threadId);
      if (cmd === 'code') return await this.handleCode(parsed.args);

      // TTS command - can tabPage de gui file
      if (cmd === 'tts') {
        let ttsResult = handleCommand('tts', parsed.args, ctx);
        // handleTTS tra ve Promise
        if (ttsResult && typeof ttsResult.then === 'function') {
          ttsResult = await ttsResult;
        }
        if (ttsResult && typeof ttsResult === 'object' && ttsResult.file) {
          await this.sendFile(tabPage, ttsResult.file);
          return ttsResult.text || null;
        }
        return ttsResult;
      }

      // Debug
      if (cmd === 'debug' || cmd === 'bug') {
        const msgs = await this.readMessages(tabPage, 10, threadId, isGroup);
        let r = `DEBUG (${msgs.length} tin):\n`;
        msgs.forEach((m, i) => r += `${i + 1}. [${m.isMe ? 'ME' : `${m.sender}(${m.senderId})`}] ${m.text.substring(0, 50)}\n`);
        r += `Thread: ${threadId} | Group: ${isGroup} | Tabs: ${this.tabs.size}`;
        r += `\nYour ID: ${senderId}`;
        return r;
      }

      const result = handleCommand(parsed.command, parsed.args, ctx);
      if (result) return result;

      return `Khong hieu "${parsed.command}". /help de xem lenh.`;
    }

    // DM khong co command -> check auto-reply
    if (!isGroup) {
      const autoReply = checkAutoReply(parsed.raw);
      if (autoReply) return autoReply;
    }

    return null;
  }

  async handleAIChat(threadId, message, sender) {
    if (!message) return 'Noi gi di! VD: /chat xin chao';
    const health = await this.ai.checkHealth();
    if (health.online) return await this.ai.chat(threadId, message, sender);
    return 'AI dang offline.';
  }

  async handleCode(description) {
    if (!description) return '/code <mo ta>\nVD: /code ham tinh giai thua python';
    const health = await this.ai.checkHealth();
    if (!health.online) return 'AI dang offline.';

    const messages = [
      {
        role: 'system',
        content: 'Ban la lap trinh vien. Viet code ngan gon, sach. Chi tra ve code va giai thich ngan, khong co cac ham hay chi dan. KHONG dung markdown formatting. Dung comment trong code de giai thich. Code theo chu de sau:',
      },
      { role: 'user', content: description },
    ];
    const reply = await this.ai.callLMStudio(messages, { temperature: 0.3, maxTokens: 1500 });
    return reply ? reply.substring(0, 2000) : 'AI khong tra loi duoc.';
  }

  // === REPLY BY MESSAGE ID (hover -> click Reply -> type -> send) ===
  async replyByMessageId(page, targetMid, content) {
    if (!targetMid) return false;
    try {
      // 1. Tim row chua messageId trong DOM
      const rowHandle = await page.evaluateHandle((mid) => {
        const allRows = document.querySelectorAll('[role="row"]');
        for (const row of allRows) {
          const textDiv = row.querySelector('div[dir="auto"]');
          if (!textDiv) continue;
          const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
          if (!key) continue;
          let fiber = textDiv[key];
          for (let i = 0; i < 20; i++) {
            if (!fiber) break;
            if (fiber.memoizedProps?.message?.messageId === mid) {
              row.scrollIntoView({ block: 'center', behavior: 'instant' });
              return row;
            }
            fiber = fiber.return;
          }
        }
        return null;
      }, targetMid);

      const rowEl = rowHandle.asElement();
      if (!rowEl) return false;

      // 2. Hover de hien nut Reply
      const bubble = await rowEl.$('div[dir="auto"]');
      await (bubble || rowEl).hover();
      await this.sleep(600);

      // 3. Tim nut Reply
      let replyBtn = await rowEl.$('[aria-label="Trả lời"], [aria-label="Reply"]');

      if (!replyBtn) {
        // Thu nut "More" (...)
        const moreBtn = await rowEl.$('[aria-label="Xem thêm"], [aria-label="More"], [aria-label="Khác"]');
        if (moreBtn) {
          await moreBtn.click();
          await this.sleep(500);
          replyBtn = await page.$('[role="menuitem"][aria-label="Trả lời"]')
                  || await page.$('[role="menuitem"][aria-label="Reply"]');
          if (!replyBtn) {
            const handle = await page.evaluateHandle(() => {
              const items = document.querySelectorAll('[role="menuitem"]');
              for (const item of items) {
                if (item.textContent.includes('Trả lời') || item.textContent.includes('Reply')) return item;
              }
              return null;
            });
            replyBtn = handle.asElement();
          }
        }
      }

      if (!replyBtn) {
        console.log(`[Reply] Khong thay nut Reply cho mid: ${targetMid}`);
        return false;
      }

      await replyBtn.click();
      await this.sleep(800);

      // 4. Go noi dung va gui
      return await this.sendMessage(page, content);
    } catch (err) {
      console.log(`[Reply] Loi reply mid ${targetMid}:`, err.message);
      return false;
    }
  }

  // === READER LOOP (doc tin nhan lien tuc, day vao queue) ===
  async readerLoop() {
    console.log('[Reader] Bat dau doc tin nhan...');
    while (this.running) {
      try {
        // 1. Quet sidebar tim thread chua doc
        const unreads = await this.scanUnreads();
        for (const thread of unreads) {
          if (!this.tabs.has(thread.id)) {
            await this.openTab(thread.id, thread.name);
          }
        }

        // 2. Doc tin nhan tu tat ca tab dang mo
        for (const [threadId, tab] of this.tabs) {
          if (tab.page.isClosed()) { this.tabs.delete(threadId); continue; }

          try {
            const messages = await this.readMessages(tab.page, 30, threadId, tab.isGroup);
            if (!messages.length) continue;

            const newMsgs = this.findNewMessages(messages, threadId);
            if (!newMsgs.length) continue;

            // Day vao queue
            for (const msg of newMsgs) {
              this.messageQueue.push({ msg, threadId, tab });
              // Danh dau da thay de khong queue lai
              const hash = this.generateMsgHash(msg);
              this.processedMsgIds.add(hash);
            }

            // Don dep processedMsgIds
            while (this.processedMsgIds.size > 500) {
              const first = this.processedMsgIds.values().next().value;
              this.processedMsgIds.delete(first);
            }

            console.log(`[Reader] ${tab.name}: +${newMsgs.length} tin moi (queue: ${this.messageQueue.length})`);
          } catch (tabErr) {
            console.log(`[Reader] Loi doc tab ${tab.name}: ${tabErr.message}`);
          }
        }
      } catch (err) {
        console.log('[Reader] Loi:', err.message);
      }

      await this.sleep(1500);
    }
  }

  // === REPLIER LOOP (lay tu queue, reply tung tin) ===
  async replierLoop() {
    console.log('[Replier] San sang xu ly queue...');
    while (this.running) {
      if (this.messageQueue.length === 0) {
        await this.sleep(500);
        continue;
      }

      const { msg, threadId, tab } = this.messageQueue.shift();

      // Skip tin cu hon 1 phut
      if (msg.timestamp && Date.now() - msg.timestamp > 60000) {
        console.log(`[Replier] Skip (>1 phut): "${msg.text.substring(0, 20)}..."`);
        continue;
      }

      if (tab.page.isClosed()) continue;

      try {
        console.log(`[Replier] Xu ly: "${msg.text.substring(0, 30)}..." tu ${msg.sender}`);

        const reply = await this.processMessage(msg, threadId, tab.isGroup, tab.page);

        if (reply && typeof reply === 'string') {
          // Chuyen sang tab can reply
          await tab.page.bringToFront();
          await this.sleep(300);

          // Thu reply bang messageId (bam nut Reply)
          const sent = msg.messageId
            ? await this.replyByMessageId(tab.page, msg.messageId, reply)
            : false;

          // Fallback: gui tin thuong
          if (!sent) {
            await this.sendMessage(tab.page, reply);
          }

          console.log(`[Replier] Da reply: "${reply.substring(0, 50)}..."`);
        }

        // Luu checkpoint xuong DB
        this.markAsProcessed(threadId, msg);
      } catch (err) {
        console.log(`[Replier] Loi: ${err.message}`);
      }

      await this.sleep(500);
    }
  }

  // === MAIN LOOP (song song Reader + Replier) ===
  async startMonitoring() {
    this.running = true;
    console.log('[Bot] Khoi dong Reader + Replier song song...');

    // Scan sidebar lan dau, mo tab cho cac thread chua doc
    try {
      const unreads = await this.scanUnreads();
      console.log(`[Bot] Tim thay ${unreads.length} thread chua doc.`);
      for (const thread of unreads) {
        await this.openTab(thread.id, thread.name);
      }
    } catch (err) {
      console.log('[Bot] Loi init scan:', err.message);
    }

    // Chay 2 loop song song
    await Promise.all([
      this.readerLoop(),
      this.replierLoop(),
    ]);
  }

  // Check 1 tab: Vet sach tin nhan theo thu tu
  async checkTab(threadId, tab, focus = false) {
    try {
      if (tab.page.isClosed()) {
        this.tabs.delete(threadId);
        return;
      }

      if (focus) {
        await tab.page.bringToFront();
        // Cho du lau de DOM load het tin nhan (mang lag can tang len)
        await this.sleep(1500); 
      }

      // --- VONG LAP VET CAN TIN NHAN ---
      // Chung ta se quet 2 lan de dam bao khong sot tin luc dang reply
      let loopCount = 0;
      const MAX_LOOPS = 3; 

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        // 1. Doc tin nhan tu DOM (Lay 30 tin gan nhat)
        const messages = await this.readMessages(tab.page, 30, threadId, tab.isGroup);
        if (!messages.length) break;

        // 2. Tim cac tin chua xu ly (Dung logic hash checkpoint rieng)
        const newMsgs = this.findNewMessages(messages, threadId);

        if (newMsgs.length === 0) {
            // Neu khong co tin moi thi thoi, thoat loop de chuyen sang tab khac
            break; 
        }

        console.log(`[Bot] ${tab.name}: Phat hien ${newMsgs.length} tin moi (Batch ${loopCount})`);

        // 3. XU LY TUNG TIN NHAN TRONG HANG CHO (QUEUE)
        for (const msg of newMsgs) {
            console.log(`[Bot] >> Dang xu ly: "${msg.text.substring(0, 30)}..." tu ${msg.sender}`);
            
            // A. Xu ly Logic (Lay cau tra loi)
            const reply = await this.processMessage(msg, threadId, tab.isGroup, tab.page);
            
            // B. Reply (Neu can)
            if (reply) {
                // Delay nhe de giong nguoi va tranh bi Facebook block spam
                await this.sleep(500); 
                
                if (typeof reply === 'string') {
                    // Thu reply truc tiep
                    const sent = await this.replyToMessage(tab.page, msg.text, reply);
                    // Neu reply that bai (nut reply an) -> gui tin thuong
                    if (!sent) await this.sendMessage(tab.page, reply);
                }
            }

            // C. QUAN TRONG: DANH DAU DA XU LY
            // Sau khi da co gang reply (du thanh cong hay khong), ta danh dau tin nay vao Set
            // De vong lap sau khong xu ly lai nua
            this.markAsProcessed(threadId, msg);
            
            // Nghi mot xiu giua cac tin nhan trong cung 1 thread
            await this.sleep(300);
        }
        
        // Sau khi xu ly het 1 batch, cho DOM cap nhat roi quet lai ngay lap tuc
        // De xem trong luc reply co ai nhan them tin moi khong
        await this.sleep(1000);
      }

    } catch (err) {
      console.log(`[Bot] Loi check tab ${tab.name}:`, err.message);
    }
  }

  async randomDelay() {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 800));
  }

  stop() {
    this.running = false;
    console.log('[Bot] Dang dung...');
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  generateMsgHash(msg) {
    // Ưu tiên dùng MessageID của Facebook (nếu lấy được từ React Fiber)
    if (msg.messageId) return msg.messageId;
    
    // Nếu không thì dùng ID + Thời gian (đảm bảo duy nhất)
    return `${msg.senderId}_${msg.timestamp}`;
  }

  // Danh dau tin nhan la da xu ly
  markAsProcessed(threadId, msg) {
    if (!this.processedCheckpoints.has(threadId)) {
      this.processedCheckpoints.set(threadId, new Set());
    }
    const set = this.processedCheckpoints.get(threadId);
    const hash = this.generateMsgHash(msg);
    set.add(hash);

    // Don dep bo nho: Chi giu 50 tin gan nhat
    if (set.size > 50) {
      const first = set.values().next().value;
      set.delete(first);
    }
    
    // Dong thoi van luu checkpoint xuong DB de an toan khi restart
    this.saveCheckpoint(threadId, msg);
  }
}

module.exports = { Bot };

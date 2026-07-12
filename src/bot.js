const config = require('../config');
const { handleCommand, checkAutoReply, games } = require('./commands');
const { AIChat } = require('./ai');
const db = require('./db');
const path = require('path');
const domReader = require('./dom-reader');
const messageHandler = require('./message-handler');

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

    // Safety net chong tu-reply: luu text cac tin bot vua gui.
    // Neu isMe detection that bai (FB doi UI), van khong reply lai chinh minh.
    this.recentSent = [];
  }

  // Ghi nho text vua gui (chong loop tu-reply)
  rememberSent(text) {
    if (!text) return;
    this.recentSent.push(text.trim());
    while (this.recentSent.length > 40) this.recentSent.shift();
  }

  wasRecentlySent(text) {
    if (!text) return false;
    const t = text.trim();
    if (t.length < 2) return false;
    return this.recentSent.some(s => s === t || s.startsWith(t) || t.startsWith(s));
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
  async openTab(threadId, threadName, threadUrl = null) {
    if (this.tabs.has(threadId)) return this.tabs.get(threadId);

    console.log(`[Bot] Mo tab moi: ${threadName} (${threadId})`);
    const page = await this.browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // FIX: Xử lý URL an toàn, chống bị dính "https://...https://..."
    let finalUrl = `https://www.messenger.com/t/${threadId}`;
    if (threadUrl) {
      finalUrl = threadUrl.startsWith('http') ? threadUrl : `https://www.messenger.com${threadUrl.startsWith('/') ? '' : '/'}${threadUrl}`;
    }
      
    // Loop goto + cho den khi doc duoc tin nhan that su
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await page.goto(finalUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (e) {
        console.log(`[Bot] Tab ${threadName}: goto retry (${attempt})`);
        await this.sleep(1000);
        continue;
      }
      // Cho [role="article"] xuat hien (tin nhan) thay vi [role="row"] (sidebar)
      const found = await page.waitForSelector('[role="main"] [role="article"]', { timeout: 5000 }).catch(() => null);
      if (found) break;
      console.log(`[Bot] Tab ${threadName}: cho DOM render... (${attempt})`);
    }
    await this.sleep(2000);

    const tabInfo = { page, threadId, name: threadName, isGroup: null };
    this.tabs.set(threadId, tabInfo);

    tabInfo.isGroup = await domReader.detectGroup(page);

    const initMsgs = await domReader.readMessages(tabInfo.page, 30, threadId, tabInfo.isGroup);
    const now = Date.now();
    for (const msg of initMsgs) {
      if (now - msg.timestamp > 60000) {
        const hash = this.generateMsgHash(msg);
        this.processedMsgIds.add(hash);
      }
    }
    
    if (!this.getCheckpoint(threadId) && initMsgs.length > 0) {
      this.saveCheckpoint(threadId, initMsgs[initMsgs.length - 1]);
    }
    console.log(`[Bot] Tab ${threadName}: init ${initMsgs.length} tin, san sang nhan tin moi`);

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

  // Click nut Send trong composer (khong can dua tab ra truoc — hoat dong song song).
  // Fallback: nhan Enter qua CDP (van per-tab, khong can focus he dieu hanh).
  async clickSendButton(page) {
    // CHI khop aria-label CHINH XAC cua nut Send trong composer (khong regex bua
    // -> tranh click nham nut cua tin nhan cu chua chu "Gui"/"Send").
    const clicked = await page.evaluate(() => {
      const EXACT = ['Press enter to send', 'Press Enter to send', 'Send', 'Gửi', 'Nhấn Enter để gửi', 'Nhấn enter để gửi'];
      for (const l of EXACT) {
        const btn = document.querySelector(`[role="button"][aria-label="${l}"]`);
        if (btn) { btn.click(); return true; }
      }
      return false;
    }).catch(() => false);
    return clicked;
  }

  // Gui tin nhan vao 1 tab — FRONT-LESS hoan toan (khong bringToFront, khong keyboard).
  // Chen text bang su kien 'paste' (Lexical xu ly, giu xuong dong + tieng Viet) roi click Send.
  // => Gui song song nhieu tab cung luc trong 1 cua so.
  async sendMessage(page, text) {
    try {
      const ok = await page.evaluate((t) => {
        const box = document.querySelector('[role="textbox"][contenteditable="true"]');
        if (!box) return false;
        box.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        const dt = new DataTransfer();
        dt.setData('text/plain', String(t));
        box.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
        return true;
      }, text);
      if (!ok) { console.log('[Bot] Khong tim thay o nhap tin'); return false; }

      await this.sleep(180);
      const sent = await this.clickSendButton(page);
      await this.sleep(250);
      if (sent) this.rememberSent(text);
      return sent;
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
      await this.sleep(1500); // cho preview anh render

      // Gui bang cach click nut Send (front-less, khong can chuyen tab)
      await this.clickSendButton(page);
      await this.sleep(600);

      console.log(`[Bot] Da gui file: ${path.basename(filePath)}`);
      return true;
    } catch (err) {
      console.log('[Bot] Loi gui file:', err.message);
      return false;
    }
  }

  // === REPLY WRAPPERS (delegate to dom-reader) ===

  async replyToMessage(page, targetText, replyContent) {
    const clicked = await domReader.replyToMessage(page, targetText, (ms) => this.sleep(ms));
    if (!clicked) {
      return await this.sendMessage(page, `"${targetText.substring(0, 10)}..."\n${replyContent}`);
    }
    console.log(`[Bot] Dang reply tin nhan: "${targetText.substring(0, 15)}..."`);
    return await this.sendMessage(page, replyContent);
  }

  async replyByMessageId(page, targetMid, content) {
    const clicked = await domReader.replyByMessageId(page, targetMid, (ms) => this.sleep(ms));
    if (!clicked) return false;
    return await this.sendMessage(page, content);
  }

  findNewMessages(messages, threadId) {
    const newMsgs = [];
    const now = Date.now();
    const TIME_LIMIT = 30 * 60 * 1000; // 30 phut (tang len de khong sot tin khi LLM cham)

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // 1. Bo qua tin cua chinh minh
      if (msg.isMe) continue;

      // 1b. Safety net: bo qua neu trung text bot vua gui (isMe co the sai khi FB doi UI)
      if (this.wasRecentlySent(msg.text)) continue;

      // 2. Loc tin rac/loop
      if (msg.text.startsWith('Rep #')) continue;

      // 3. Check thoi gian — qua cu thi DUNG (break) vi tin cu hon chac chan da xu ly
      if (now - msg.timestamp > TIME_LIMIT) break; 
      
      // 4. Check hash — dung CONTINUE thay vi BREAK
      // Truoc day dung break -> gap 1 tin da xu ly la bo het tin phia truoc
      // Gio dung continue -> chi bo tin do, van check tiep cac tin khac
      const hash = this.generateMsgHash(msg);
      if (this.processedMsgIds.has(hash)) continue;

      newMsgs.push(msg);
    }

    return newMsgs.reverse();
  }

  // Xu ly 1 tin nhan — delegate to message-handler
  async processMessage(msg, threadId, isGroup, tabPage) {
    return await messageHandler.processMessage(msg, threadId, isGroup, tabPage, this);
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

  // === READER LOOP (doc tin nhan lien tuc, day vao queue) ===
  async readerLoop() {
    console.log('[Reader] Bat dau doc tin nhan...');
    while (this.running) {
      try {
        // 1. Quet sidebar tim thread chua doc
        const unreads = await domReader.scanUnreads(this.mainPage);
        for (const thread of unreads) {
          if (!this.tabs.has(thread.id)) {
            await this.openTab(thread.id, thread.name, thread.url);
          }
        }

        // 2. Check lottery/duel auto-expiry cho moi thread co session
        for (const [threadId, session] of games.sessions) {
          if (session.type === 'lottery') {
            const result = games.lottery.checkExpired(session, threadId, games);
            if (result) {
              const tab = this.tabs.get(threadId);
              if (tab && !tab.page.isClosed()) {
                await this.sendMessage(tab.page, result);
                console.log(`[Bot] Lottery expired in ${tab.name}, sent result`);
              }
            }
          }
          if (session.type === 'duel' && session.endTime && Date.now() >= session.endTime) {
            // Duel timeout - hoan xu va xoa session
            const challenger = session.challenger;
            games.economy.addXu(challenger.id, challenger.bet);
            games.sessions.delete(threadId);
            const tab = this.tabs.get(threadId);
            if (tab && !tab.page.isClosed()) {
              await this.sendMessage(tab.page, `⚔️ Thách đấu hết hạn! Hoàn ${challenger.bet} xu cho ${games.economy.getDisplayName(challenger.id)}.`);
            }
          }
        }

        // 3. Doc tin nhan tu tat ca tab dang mo
        for (const [threadId, tab] of this.tabs) {
          if (tab.page.isClosed()) { this.tabs.delete(threadId); continue; }

          try {
            const messages = await domReader.readMessages(tab.page, 30, threadId, tab.isGroup);
            if (!messages.length) { if (process.env.DEBUG_READ) console.log(`[R] ${tab.name}: 0 msgs`); continue; }

            // DBG: log 2 tin cuoi (chi khi DEBUG_READ=1)
            if (process.env.DEBUG_READ) {
              for (const m of messages.slice(-2)) {
                console.log(`[R] "${m.text.substring(0,12)}" sid=${m.senderId} isMe=${m.isMe} raw=${JSON.stringify(m._dbg)}`);
              }
            }

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

  // === REPLIER LOOP — xu ly SONG SONG nhieu thread ===
  // Moi thread chi xu ly 1 tin tai 1 thoi diem (giu thu tu trong thread),
  // nhung nhieu thread khac nhau chay dong thoi (khong bringToFront, gui front-less).
  async replierLoop() {
    console.log('[Replier] San sang xu ly queue (song song)...');
    const busy = new Set(); // threadId dang duoc xu ly

    while (this.running) {
      if (this.messageQueue.length === 0) { await this.sleep(300); continue; }

      // Lay tin dau tien thuoc thread chua ban
      const idx = this.messageQueue.findIndex(q => !busy.has(q.threadId));
      if (idx === -1) { await this.sleep(150); continue; }

      const item = this.messageQueue.splice(idx, 1)[0];
      busy.add(item.threadId);

      // KHONG await -> nhieu thread reply cung luc
      this.handleQueueItem(item)
        .catch(err => console.log(`[Replier] Loi thread ${item.threadId}: ${err.message}`))
        .finally(() => busy.delete(item.threadId));

      await this.sleep(60); // nhip nho tranh spin CPU
    }
  }

  // Xu ly 1 tin trong queue: sinh reply + gui (front-less)
  async handleQueueItem({ msg, threadId, tab }) {
    if (msg.timestamp && Date.now() - msg.timestamp > 5 * 60 * 1000) {
      console.log(`[Replier] Skip (>5 phut): "${msg.text.substring(0, 20)}..."`);
      return;
    }
    if (tab.page.isClosed()) return;

    console.log(`[Replier] Xu ly: "${msg.text.substring(0, 30)}..." tu ${msg.sender} @${tab.name}`);
    const reply = await this.processMessage(msg, threadId, tab.isGroup, tab.page);

    if (reply && typeof reply === 'string') {
      let quoted = false;
      // Best-effort: reply-quote bang mid that (hover + click Reply). Khong bat buoc.
      if (msg.messageId && !msg.messageId.startsWith('dom_') && !msg.messageId.startsWith('c_')) {
        quoted = await domReader.replyByMessageId(tab.page, msg.messageId, (ms) => this.sleep(ms)).catch(() => false);
      }
      if (!quoted) {
        quoted = await domReader.replyToMessage(tab.page, msg.text.substring(0, 30), (ms) => this.sleep(ms)).catch(() => false);
      }
      await this.sendMessage(tab.page, reply);
      console.log(`[Replier] Da ${quoted ? 'reply-quote' : 'gui'}: "${reply.substring(0, 40)}..." @${tab.name}`);
    }

    this.markAsProcessed(threadId, msg);
  }

  // === MAIN LOOP (song song Reader + Replier) ===
  async startMonitoring() {
    this.running = true;
    console.log('[Bot] Khoi dong Reader + Replier song song...');

    // Scan sidebar lan dau, mo tab cho cac thread chua doc
    try {
      const unreads = await domReader.scanUnreads(this.mainPage);
      console.log(`[Bot] Tim thay ${unreads.length} thread chua doc.`);
      for (const thread of unreads) {
        await this.openTab(thread.id, thread.name, thread.url);
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
        const messages = await domReader.readMessages(tab.page, 30, threadId, tab.isGroup);
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

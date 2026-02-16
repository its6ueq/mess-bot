const config = require('../config');
const { handleCommand, checkAutoReply, games } = require('./commands');
const { AIChat } = require('./ai');
const db = require('./db');

// Rate limiter don gian
class RateLimiter {
  constructor(maxPerMinute = 10) {
    this.max = maxPerMinute;
    this.hits = new Map(); // sender -> [timestamps]
  }
  check(sender) {
    const now = Date.now();
    const times = (this.hits.get(sender) || []).filter(t => now - t < 60000);
    if (times.length >= this.max) return false;
    times.push(now);
    this.hits.set(sender, times);
    return true;
  }
}

class Bot {
  constructor(browser, mainPage) {
    this.browser = browser;
    this.mainPage = mainPage;
    this.ai = new AIChat();
    this.running = false;
    this.tabs = new Map();
    this.checkpoints = db.load('checkpoints', {});
    this.rateLimiter = new RateLimiter(15); // 15 lenh/phut/nguoi
  }

  // Luu checkpoint: tin nhan cuoi cung da xu ly trong thread
  saveCheckpoint(threadId, msg) {
    this.checkpoints[threadId] = {
      text: msg.text,
      sender: msg.sender,
      time: Date.now(),
    };
    db.save('checkpoints');
  }

  getCheckpoint(threadId) {
    return this.checkpoints[threadId] || null;
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
    // Thu e2ee truoc, roi fallback ve thuong
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

    // Init: danh dau tat ca tin nhan hien tai la "da thay"
    // Neu chua co checkpoint -> tao checkpoint tu tin cuoi
    if (!this.getCheckpoint(threadId)) {
      const msgs = await this.readMessages(page);
      if (msgs.length > 0) {
        this.saveCheckpoint(threadId, msgs[msgs.length - 1]);
        console.log(`[Bot] Tab ${threadName}: checkpoint init (${msgs.length} tin cu)`);
      }
    }

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

  // Doc tin nhan tu 1 tab (page)
  async readMessages(page, count = 20) {
    try {
      return await page.evaluate((cnt) => {
        const messages = [];
        const rows = document.querySelectorAll('[role="row"]');
        const start = Math.max(0, rows.length - cnt);
        const recentRows = Array.from(rows).slice(start);

        let lastSender = '';

        for (const row of recentRows) {
          const div = row.querySelector('div[dir="auto"]');
          if (!div || div.closest('[role="textbox"]')) continue;

          const text = div.textContent.trim();
          if (!text) continue;

          const rect = div.getBoundingClientRect();
          const isMe = rect.left > (window.innerWidth / 2);

          let sender = isMe ? 'Me' : '';

          if (!isMe) {
            // Sender name tu img alt (avatar 28x28)
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
                  break;
                }
              }
            }
            // Tin lien tiep cua cung nguoi -> dung ten truoc do
            if (!sender && lastSender) sender = lastSender;
            if (!sender) sender = 'User';
          }

          if (!isMe && sender) lastSender = sender;
          else if (isMe) lastSender = '';

          messages.push({ text, sender, isMe });
        }
        return messages;
      }, count);
    } catch (err) {
      console.log('[Bot] Loi doc tin:', err.message);
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
          if (ariaLabel.toLowerCase().includes('unread')) hasUnread = true;

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

  // Tim tin nhan moi sau checkpoint
  findNewMessages(messages, checkpoint) {
    if (!checkpoint) return messages.filter(m => !m.isMe);

    // Tim vi tri checkpoint trong messages
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].text === checkpoint.text && messages[i].sender === checkpoint.sender) {
        // Tra ve tat ca tin sau checkpoint, bo tin cua minh
        return messages.slice(i + 1).filter(m => !m.isMe);
      }
    }

    // Khong tim thay checkpoint -> co the da troi qua xa
    // Chi lay tin cuoi cung de tranh spam
    const last = messages[messages.length - 1];
    if (last && !last.isMe) return [last];
    return [];
  }

  // Parse message (DM vs Group)
  parseMessage(text, isGroup) {
    const trimmed = text.trim();
    if (!isGroup) {
      if (trimmed.startsWith('/')) {
        const parts = trimmed.slice(1).split(/\s+/);
        return { isCommand: true, command: parts[0], args: parts.slice(1).join(' '), raw: trimmed };
      }
      return { isCommand: false, raw: trimmed };
    }
    // Group: can @botname
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
    return { isCommand: false, raw: trimmed, ignored: true };
  }

  // Sanitize input - chong injection
  sanitize(text) {
    if (!text) return '';
    // Gioi han do dai
    return text.substring(0, 2000);
  }

  // Xu ly 1 tin nhan, tra ve reply text hoac null
  async processMessage(msg, threadId, isGroup, tabPage) {
    // Rate limit
    if (!this.rateLimiter.check(msg.sender)) {
      return 'Ban gui qua nhanh! Doi 1 chut.';
    }

    const parsed = this.parseMessage(this.sanitize(msg.text), isGroup);
    if (parsed.ignored) return null;

    const ctx = { sender: msg.sender, threadId, isGroup };

    // Dang choi game -> forward input
    if (games.hasActiveGame(threadId) && !parsed.isCommand) {
      const result = games.handleGameInput(threadId, parsed.raw, msg.sender);
      if (result) return result;
    }

    if (parsed.isCommand && parsed.command) {
      const cmd = parsed.command.toLowerCase();

      // AI commands
      if (cmd === 'chat') return await this.handleAIChat(threadId, parsed.args, msg.sender);
      if (cmd === 'clearchat') return this.ai.clearHistory(threadId);
      if (cmd === 'code') return await this.handleCode(parsed.args);

      // Debug
      if (cmd === 'debug' || cmd === 'bug') {
        const msgs = await this.readMessages(tabPage, 10);
        let r = `DEBUG (${msgs.length} tin):\n`;
        msgs.forEach((m, i) => r += `${i + 1}. [${m.isMe ? 'ME' : m.sender}] ${m.text.substring(0, 50)}\n`);
        r += `Thread: ${threadId} | Group: ${isGroup} | Tabs: ${this.tabs.size}`;
        return r;
      }

      const result = handleCommand(parsed.command, parsed.args, ctx);
      if (result) return result;

      return `Khong hieu "${parsed.command}". /help de xem lenh.`;
    }

    // DM khong co command -> check auto-reply (KHONG goi AI tu dong)
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

  // /code <mo ta> - bot generate code, nguoi dung review
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

  // === MAIN LOOP ===
  async startMonitoring() {
    this.running = true;
    console.log('[Bot] Bat dau theo doi...');
    console.log(`[Bot] Bot: ${config.botName} | Admins: ${config.admins.join(', ')}`);
    console.log(`[Bot] DM: /command | Group: @${config.botName} command`);
    console.log(`[Bot] AI chi khi /chat`);

    const aiHealth = await this.ai.checkHealth();
    console.log(`[Bot] LM Studio: ${aiHealth.online ? 'ONLINE' : 'OFFLINE'}`);
    console.log('---');

    while (this.running) {
      try {
        // 1. Scan sidebar cho unread threads
        const unreads = await this.scanUnreads();
        const unreadIds = new Set(unreads.map(t => t.id));

        // 2. Mo tab cho thread chua co tab
        for (const thread of unreads) {
          if (!this.tabs.has(thread.id)) {
            await this.openTab(thread.id, thread.name);
            await this.sleep(1000);
          }
        }

        // 3. Check cac tab co unread (bring to front de DOM cap nhat)
        let checkedAny = false;
        for (const [threadId, tab] of this.tabs) {
          if (unreadIds.has(threadId)) {
            await this.checkTab(threadId, tab, true);
            checkedAny = true;
          }
        }

        // 4. Quay lai mainPage de sidebar tiep tuc scan
        if (checkedAny) {
          await this.mainPage.bringToFront();
          await this.sleep(500);
        }

      } catch (err) {
        console.log('[Bot] Loi loop:', err.message);
      }

      await this.sleep(config.pollInterval || 3000);
    }
  }

  // Check 1 tab: doc tin, tim tin moi, reply
  // focus=true: bring tab to front de Messenger cap nhat DOM
  async checkTab(threadId, tab, focus = false) {
    try {
      // Kiem tra tab con song khong
      if (tab.page.isClosed()) {
        this.tabs.delete(threadId);
        return;
      }

      // Bring to front de Messenger load tin nhan moi vao DOM
      if (focus) {
        await tab.page.bringToFront();
        await this.sleep(1500); // doi DOM cap nhat
      }

      const messages = await this.readMessages(tab.page);
      if (!messages.length) return;

      const checkpoint = this.getCheckpoint(threadId);
      const newMsgs = this.findNewMessages(messages, checkpoint);

      if (newMsgs.length === 0) return;

      console.log(`[Bot] ${tab.name}: ${newMsgs.length} tin moi`);

      for (const msg of newMsgs) {
        console.log(`[Bot] [${tab.name}] ${msg.sender}: ${msg.text.substring(0, 60)}`);

        const reply = await this.processMessage(msg, threadId, tab.isGroup, tab.page);
        if (reply) {
          await this.randomDelay();
          console.log(`[Bot] -> Reply: ${reply.substring(0, 80)}`);
          await this.sendMessage(tab.page, reply);
        }

        // Cap nhat checkpoint sau moi tin
        this.saveCheckpoint(threadId, msg);
      }

      // Doc lai messages sau khi gui reply (bao gom ca tin cua bot)
      // de checkpoint chinh xac, tranh xu ly trung
      await this.sleep(500);
      const updatedMsgs = await this.readMessages(tab.page);
      if (updatedMsgs.length > 0) {
        this.saveCheckpoint(threadId, updatedMsgs[updatedMsgs.length - 1]);
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
}

module.exports = { Bot };

// ============================================================
// MESSAGE-HANDLER — Extracted from bot.js
// Message parsing, routing, and processing.
// ZERO behavioral changes from original.
// ============================================================

const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { handleCommand, checkAutoReply, games, resolveTarget } = require('./commands');

// Bot có bị nhắc tới (tag) trong tin không?
function botAddressed(msg) {
  const botId = String(config.myId || '');
  if (botId && Array.isArray(msg.mentions) && msg.mentions.some(m => m && String(m.id) === botId)) return true;
  const bn = (config.botName || 'Bot').toLowerCase();
  return (msg.text || '').toLowerCase().includes('@' + bn);
}

// Bỏ phần "@Tên bot" khỏi text để đưa nội dung sạch cho AI
function stripBotMention(msg) {
  let clean = msg.text || '';
  const bm = (msg.mentions || []).find(m => String(m.id) === String(config.myId));
  if (bm && bm.name) clean = clean.split(bm.name).join(' ');
  return clean.replace(/@\S+/g, '').replace(/\s+/g, ' ').trim();
}

// Tải 1 URL (vd ảnh đại diện) về file tạm để gửi qua sendFile
async function downloadToTemp(url, name) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const fp = path.join(os.tmpdir(), name);
  fs.writeFileSync(fp, buf);
  return fp;
}

/**
 * Parse message text into command structure.
 * Exact same logic as the original bot.js parseMessage().
 */
function parseMessage(text, isGroup) {
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

/**
 * Sanitize input - chong injection.
 * Exact same logic as the original bot.js sanitize().
 */
function sanitize(text) {
  if (!text) return '';
  return text.substring(0, 2000);
}

/**
 * Process a single message and return reply text or null.
 * Exact same logic as the original bot.js processMessage().
 *
 * @param {object} msg - The message object from DOM reader
 * @param {string} threadId - Thread ID
 * @param {boolean} isGroup - Whether it's a group chat
 * @param {object} tabPage - Puppeteer page for the tab
 * @param {object} bot - Reference to Bot instance (for AI, rateLimiter, readMessages, sendFile)
 * @returns {string|null} Reply text
 */
async function processMessage(msg, threadId, isGroup, tabPage, bot) {
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
    bot.updateUserRegistry(senderId, msg.sender);
    // Cap nhat displayName trong economy
    games.economy.getPlayer(senderId, msg.sender);
  }

  // Dang ky cac @mention (id that tu fiber) vao registry de /rob, /transfer, /duel...
  // resolve duoc nguoi duoc tag ngay ca khi ho chua tung tuong tac voi bot.
  if (Array.isArray(msg.mentions)) {
    for (const mn of msg.mentions) {
      if (mn && mn.id && mn.name && mn.id !== config.myId) {
        games.economy.updateUser(mn.id, mn.name);
      }
    }
  }

  // Rate limit (dung senderId)
  if (!bot.rateLimiter.check(senderId)) {
    return 'Bạn gửi quá nhanh! Đợi một chút nhé.';
  }

  // Tag @Bot trong nhóm (không phải lệnh /) -> trò chuyện AI tự nhiên
  if (isGroup && botAddressed(msg)) {
    const clean = stripBotMention(msg);
    if (clean && !clean.startsWith('/')) {
      const r = await bot.ai.chat(threadId, clean, msg.sender);
      if (r) return r;
    }
  }

  const parsed = parseMessage(sanitize(msg.text), isGroup);

  // ctx dung senderId thay vi sender name
  const ctx = {
    sender: msg.sender,       // Display name (de hien thi)
    senderId: senderId,       // Facebook User ID (de luu DB)
    threadId,
    isGroup,
    mentions: msg.mentions || [],  // [{id, name}] tu @mention (id that FB)
  };

  // Dang choi game -> forward input (dung senderId) - CHECK TRUOC KHI BO QUA
  // Fix: trong group, tin khong co / van phai check game (vd: "hit" trong blackjack)
  if (games.hasActiveGame(threadId) && !parsed.isCommand) {
    const result = games.handleGameInput(threadId, parsed.raw, senderId);
    if (result) return result;
    // Neu co lottery dang chay, check expired
    const session = games.getSession(threadId);
    if (session && session.type === 'lottery') {
      const lotteryResult = games.lottery.checkExpired(session, threadId, games);
      if (lotteryResult) return lotteryResult;
    }
  }

  if (parsed.ignored) return null;

  if (parsed.isCommand && parsed.command) {
    const cmd = parsed.command.toLowerCase();

    // Card ảnh: /level, /tiền, /rank -> render card PNG rồi gửi ảnh
    if (cmd === 'level' || cmd === 'lv' || cmd === 'tien' || cmd === 'tiền' ||
        cmd === 'rank' || cmd === 'hang' || cmd === 'hạng') {
      const card = require('./card');
      const p = games.economy.getPlayer(senderId, msg.sender);
      const data = {
        id: senderId,
        name: p.displayName || msg.sender || 'Người chơi',
        level: p.level, exp: p.exp, expNeed: (p.level || 1) * 100,
        xu: p.xu, bank: p.bank,
        gamesWon: p.gamesWon, gamesPlayed: p.gamesPlayed,
        rank: games.economy.getRank(senderId),
        avatar: `https://graph.facebook.com/${senderId}/picture?width=400&height=400`,
      };
      try {
        const file = await card.renderCard(bot.browser, data);
        await bot.sendFile(tabPage, file);
        return null; // đã gửi ảnh, không cần text
      } catch (e) {
        console.log('[Card] loi render:', e.message);
        return `⭐ ${data.name}\nLevel ${data.level} (${data.exp}/${data.expNeed} EXP)\n💰 Ví: ${data.xu} xu | 🏦 Bank: ${data.bank} xu`;
      }
    }

    // Leaderboard ảnh: /top, /bxh, /leaderboard -> render PNG bảng xếp hạng + hạng người gửi
    if (cmd === 'top' || cmd === 'bxh' || cmd === 'leaderboard' || cmd === 'lb') {
      const lb = require('./leaderboard');
      const p = games.economy.getPlayer(senderId, msg.sender);
      const data = {
        top: games.economy.getTop(8),
        me: {
          id: senderId, name: p.displayName || msg.sender || 'Người chơi',
          total: (p.xu || 0) + (p.bank || 0), level: p.level, rank: games.economy.getRank(senderId),
        },
      };
      try {
        const file = await lb.renderLeaderboard(bot.browser, data);
        await bot.sendFile(tabPage, file);
        return null;
      } catch (e) {
        console.log('[LB] loi render:', e.message);
        return games.economy.top(); // fallback text
      }
    }

    // AI commands
    if (cmd === 'chat' || cmd === 'ai' || cmd === 'c') return await bot.handleAIChat(threadId, parsed.args, msg.sender);
    if (cmd === 'clearchat' || cmd === 'xoachat') return bot.ai.clearHistory(threadId);
    if (cmd === 'code') return await bot.handleCode(parsed.args);

    // TTS command - can tabPage de gui file
    if (cmd === 'tts') {
      let ttsResult = handleCommand('tts', parsed.args, ctx);
      // handleTTS tra ve Promise
      if (ttsResult && typeof ttsResult.then === 'function') {
        ttsResult = await ttsResult;
      }
      if (ttsResult && typeof ttsResult === 'object' && ttsResult.file) {
        await bot.sendFile(tabPage, ttsResult.file);
        return ttsResult.text || null;
      }
      return ttsResult;
    }

    // ─── AI tiện ích (dùng DeepSeek qua bot.ai.ask) ───
    if (cmd === 'dich' || cmd === 'translate') {
      if (!parsed.args) return 'Dịch gì nào? VD: /dich hello world';
      const sys = 'Bạn là công cụ dịch thuật. Nếu văn bản là tiếng Việt thì dịch sang tiếng Anh, nếu là ngôn ngữ khác thì dịch sang tiếng Việt. CHỈ trả về bản dịch, không thêm giải thích, không markdown.';
      const r = await bot.ai.ask(sys, parsed.args, { temperature: 0.3 });
      return r || 'Miku đang offline, thử lại sau nhé.';
    }

    if (cmd === 'hoi' || cmd === 'ask') {
      if (!parsed.args) return 'Hỏi gì nào? VD: /hoi thủ đô nước Pháp là gì';
      const sys = 'Bạn là trợ lý kiến thức thân thiện. Trả lời ngắn gọn, chính xác bằng tiếng Việt. Không dùng markdown.';
      const r = await bot.ai.ask(sys, parsed.args, { temperature: 0.5 });
      return r || 'Miku đang offline, thử lại sau nhé.';
    }

    if (cmd === 'tomtat' || cmd === 'summary') {
      const domReader = require('./dom-reader');
      const n = Math.min(50, Math.max(5, parseInt(parsed.args) || 25));
      const msgs = await domReader.readMessages(tabPage, n, threadId, isGroup);
      if (!msgs.length) return 'Không đọc được tin nhắn để tóm tắt.';
      const transcript = msgs.map(m => `${m.isMe ? 'Bot' : m.sender}: ${m.text}`).join('\n').substring(0, 6000);
      const sys = 'Bạn tóm tắt hội thoại. Tóm tắt ngắn gọn các ý chính bằng tiếng Việt theo gạch đầu dòng (dùng dấu -). Không dùng markdown.';
      const r = await bot.ai.ask(sys, `Tóm tắt cuộc trò chuyện sau:\n${transcript}`, { temperature: 0.4 });
      return r ? `📝 TÓM TẮT (${msgs.length} tin):\n${r}` : 'Miku đang offline, thử lại sau nhé.';
    }

    if (cmd === 'roast' || cmd === 'cakhia' || cmd === 'khen') {
      let name = ctx.sender;
      if (parsed.args && parsed.args.trim()) {
        const t = resolveTarget(parsed.args.trim());
        name = t ? t.displayName : parsed.args.trim().replace(/^@/, '');
      } else if (ctx.mentions && ctx.mentions[0]) {
        name = ctx.mentions[0].name;
      }
      const roast = (cmd === 'roast' || cmd === 'cakhia');
      const sys = roast
        ? 'Bạn là cao thủ cà khịa hài hước. Cà khịa (roast) người được nhắc tên một cách vui nhộn, châm biếm nhẹ nhàng bằng tiếng Việt, 1-2 câu. Hài hước chứ KHÔNG xúc phạm nặng, không phân biệt vùng miền/giới tính/ngoại hình thô tục. Không markdown.'
        : 'Bạn hãy khen ngợi người được nhắc tên một cách chân thành, dễ thương và tích cực bằng tiếng Việt, 1-2 câu. Không markdown.';
      const r = await bot.ai.ask(sys, `${roast ? 'Cà khịa' : 'Khen'} người tên "${name}".`, { temperature: 0.9 });
      return r || 'Miku đang offline, thử lại sau nhé.';
    }

    if (cmd === 'tarot' || cmd === 'rutbai' || cmd === 'boibai' || cmd === 'boi') {
      const TAROT = [
        ['Gã Khờ', 'The Fool', '🃏'], ['Nhà Ảo Thuật', 'The Magician', '🎩'],
        ['Nữ Tư Tế', 'The High Priestess', '🌙'], ['Nữ Hoàng', 'The Empress', '👑'],
        ['Hoàng Đế', 'The Emperor', '🏛️'], ['Giáo Hoàng', 'The Hierophant', '📿'],
        ['Tình Nhân', 'The Lovers', '💕'], ['Cỗ Xe', 'The Chariot', '🐎'],
        ['Sức Mạnh', 'Strength', '🦁'], ['Ẩn Sĩ', 'The Hermit', '🕯️'],
        ['Bánh Xe Số Phận', 'Wheel of Fortune', '🎡'], ['Công Lý', 'Justice', '⚖️'],
        ['Người Treo Ngược', 'The Hanged Man', '🙃'], ['Cái Chết', 'Death', '💀'],
        ['Điều Độ', 'Temperance', '🍷'], ['Ác Quỷ', 'The Devil', '😈'],
        ['Tòa Tháp', 'The Tower', '🗼'], ['Ngôi Sao', 'The Star', '⭐'],
        ['Mặt Trăng', 'The Moon', '🌕'], ['Mặt Trời', 'The Sun', '☀️'],
        ['Phán Xét', 'Judgement', '📯'], ['Thế Giới', 'The World', '🌍'],
      ];
      const [vi, en, e] = TAROT[Math.floor(Math.random() * TAROT.length)];
      const sys = `Bạn là Miku - thầy bói tarot dễ thương, huyền bí pha chút hài hước. Người dùng vừa rút lá "${vi}" (${en}). Hãy luận giải NGẮN GỌN (3-4 câu) bằng tiếng Việt về tình yêu, công việc và may mắn hôm nay theo ý nghĩa lá này. Xưng "em", gọi người dùng là "Onii-chan". Không markdown.`;
      const r = await bot.ai.ask(sys, `Rút lá ${vi} cho ${ctx.sender}.`, { temperature: 0.9 });
      return `${e} Lá bài của Onii-chan: ${vi} (${en})\n\n${r || 'Miku đang bận xem sao, thử lại sau nhé~'}`;
    }

    if (cmd === 'avatar' || cmd === 'avt') {
      let target = { id: senderId, displayName: ctx.sender };
      if (parsed.args && parsed.args.trim()) {
        const t = resolveTarget(parsed.args.trim());
        if (!t) return `Không tìm thấy "${parsed.args.trim()}"!`;
        target = t;
      } else if (ctx.mentions && ctx.mentions[0]) {
        target = { id: ctx.mentions[0].id, displayName: ctx.mentions[0].name };
      }
      try {
        const url = `https://graph.facebook.com/${target.id}/picture?width=800&height=800`;
        const fp = await downloadToTemp(url, `avt_${target.id}.jpg`);
        if (!fp) return 'Không tải được ảnh đại diện.';
        await bot.sendFile(tabPage, fp);
        return null;
      } catch (e) {
        console.log('[Avatar] loi:', e.message);
        return 'Lỗi khi lấy ảnh đại diện.';
      }
    }

    // Debug
    if (cmd === 'debug' || cmd === 'bug') {
      const domReader = require('./dom-reader');
      const msgs = await domReader.readMessages(tabPage, 10, threadId, isGroup);
      let r = `DEBUG (${msgs.length} tin):\n`;
      msgs.forEach((m, i) => r += `${i + 1}. [${m.isMe ? 'ME' : `${m.sender}(${m.senderId})`}] ${m.text.substring(0, 50)}\n`);
      r += `Thread: ${threadId} | Group: ${isGroup} | Tabs: ${bot.tabs.size}`;
      r += `\nYour ID: ${senderId}`;
      return r;
    }

    const result = handleCommand(parsed.command, parsed.args, ctx);
    if (result) return result;

    return `Không hiểu lệnh "${parsed.command}". Gõ /help để xem danh sách lệnh.`;
  }

  // DM khong co command -> check auto-reply
  if (!isGroup) {
    const autoReply = checkAutoReply(parsed.raw);
    if (autoReply) return autoReply;
  }

  return null;
}

module.exports = { parseMessage, sanitize, processMessage };

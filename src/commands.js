// ============================================================
// COMMANDS — Command registry pattern
// Refactored from if/else chain into Map-based registry.
// ZERO behavioral changes — same commands, same logic.
// ============================================================

const config = require('../config');
const G = require('./games/index');
const { handleTTS } = require('./tts');
const { getWeather } = require('./weather');

// Bình chọn đang mở theo thread: threadId -> { question, options[], votes{userId:idx}, by }
const polls = new Map();

function renderPoll(poll, final) {
  const counts = poll.options.map(() => 0);
  for (const v of Object.values(poll.votes)) counts[v] = (counts[v] || 0) + 1;
  const total = Object.keys(poll.votes).length;
  let m = `${final ? '📊 KẾT QUẢ' : '🗳️'} ${poll.question}\n\n`;
  poll.options.forEach((o, i) => {
    const n = counts[i];
    const pct = total ? Math.round((n / total) * 100) : 0;
    const filled = Math.round(pct / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    m += `${i + 1}. ${o}\n   ${bar} ${n} (${pct}%)\n`;
  });
  m += `\nTổng: ${total} phiếu`;
  if (final) m += ' — Đã đóng.';
  return m;
}

function isAdmin(senderId) {
  return config.admins.some(a => a === senderId);
}

// Resolve target: co the la @ten hoac ID truc tiep
// Tra ve { id, displayName } hoac null
function resolveTarget(input) {
  if (!input) return null;
  const cleaned = input.replace(/^@/, '').trim();
  if (!cleaned) return null;

  // Neu la so (Facebook ID)
  if (/^\d{5,}$/.test(cleaned)) {
    const name = G.economy.getDisplayName(cleaned);
    return { id: cleaned, displayName: name };
  }

  // Neu la ten -> tim trong registry
  const id = G.economy.findIdByName(cleaned);
  if (id) {
    return { id, displayName: cleaned };
  }

  // Khong tim thay
  return null;
}

// ============================================================
// COMMAND REGISTRY
// Each entry: { handler, admin, aliases }
// handler(args, ctx) -> string | null
// ============================================================
const registry = new Map();

function register(name, opts) {
  registry.set(name, opts);
  if (opts.aliases) {
    for (const alias of opts.aliases) {
      registry.set(alias, { ...opts, _aliasOf: name });
    }
  }
}

// ─── ADMIN COMMANDS ────────────────────────────────────
register('setrule', {
  admin: true,
  handler: (args) => {
    const m = args.match(/^(\S+)\s+(.+)$/);
    if (!m) return '/setrule <trigger> <response>';
    config.setRule(m[1], m[2]);
    return `Rule: "${m[1]}" -> "${m[2]}"`;
  },
});

register('delrule', {
  admin: true,
  handler: (args) => {
    if (!args) return '/delrule <trigger>';
    config.deleteRule(args.trim());
    return `Xoa rule: "${args.trim()}"`;
  },
});

register('rules', {
  admin: true,
  handler: () => {
    const r = config.rules;
    const e = Object.entries(r);
    if (!e.length) return 'Chua co rule!';
    return 'RULES:\n' + e.map(([t, r], i) => `${i + 1}. "${t}" -> "${r}"`).join('\n');
  },
});

register('addadmin', {
  admin: true,
  handler: (args) => {
    if (!args) return '/addadmin @ten hoac /addadmin ID';
    const target = resolveTarget(args.trim());
    if (!target) return `Khong tim thay user "${args.trim()}"! Ho can tuong tac voi bot truoc.`;
    config.addAdmin(target.id);
    return `+Admin: ${target.displayName} (${target.id})`;
  },
});

register('removeadmin', {
  admin: true,
  handler: (args) => {
    if (!args) return '/removeadmin @ten hoac /removeadmin ID';
    const target = resolveTarget(args.trim());
    if (!target) return `Khong tim thay user "${args.trim()}"!`;
    config.removeAdmin(target.id);
    return `-Admin: ${target.displayName} (${target.id})`;
  },
});

register('admins', {
  admin: true,
  handler: () => {
    const l = config.admins;
    if (!l.length) return 'Chua co admin!';
    return 'ADMINS:\n' + l.map((id, i) => {
      const name = G.economy.getDisplayName(id);
      return `${i + 1}. ${name} (${id})`;
    }).join('\n');
  },
});

register('shutdown', {
  admin: true,
  handler: () => { setTimeout(() => process.exit(0), 1000); return 'Bot dang tat...'; },
});

register('say', {
  admin: true,
  handler: (args) => args || '/say <text>',
});

register('status', {
  admin: true,
  handler: () => {
    const u = process.uptime();
    return `STATUS:\nUptime: ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m\nRules: ${Object.keys(config.rules).length}\nAdmins: ${config.admins.length}\nPlayers: ${Object.keys(G.economy.players).length}`;
  },
});

register('addxu', {
  admin: true,
  handler: (args) => {
    if (!args) return '/addxu @ten so\nVD: /addxu @Nguyen Duy 1000';

    const trimmed = args.trim();
    const nameFirst = trimmed.match(/^@?(.+?)\s+(\d+)$/);
    const moneyFirst = trimmed.match(/^(\d+)\s+@?(.+)$/);

    let targetStr = '';
    let amount = 0;

    if (nameFirst) {
      targetStr = nameFirst[1];
      amount = parseInt(nameFirst[2]);
    } else if (moneyFirst) {
      amount = parseInt(moneyFirst[1]);
      targetStr = moneyFirst[2];
    } else {
      return 'Cu phap: /addxu @ten so_xu';
    }

    const target = resolveTarget(targetStr);
    if (!target) return `Khong tim thay user "${targetStr}"! Ho can tuong tac voi bot truoc.`;

    G.economy.addXu(target.id, amount);
    return `+${amount} xu cho ${target.displayName} (${target.id})`;
  },
});

register('setxu', {
  admin: true,
  handler: (args) => {
    if (!args) return '/setxu @ten so_xu';
    const trimmed = args.trim();
    const nameFirst = trimmed.match(/^@?(.+?)\s+(\d+)$/);
    if (!nameFirst) return 'Cu phap: /setxu @ten so_xu';

    const target = resolveTarget(nameFirst[1]);
    if (!target) return `Khong tim thay user "${nameFirst[1]}"!`;

    const amount = parseInt(nameFirst[2]);
    const p = G.economy.getPlayer(target.id);
    p.xu = amount;
    G.economy._save();
    return `Set ${target.displayName} xu = ${amount}`;
  },
});

// ─── USER COMMANDS ─────────────────────────────────────

register('help', {
  aliases: ['menu', 'lenh', 'giupdo'],
  handler: (args, ctx) => {
    const topic = (args || '').trim().toLowerCase();

    // /help <game> - chi tiet tung game
    const gameHelp = {
      xoso: '🎰 XO SO (LOTTERY)\n\n' +
        'Choi nhieu nguoi, 1 nguoi thang!\n\n' +
        'CACH CHOI:\n' +
        '1. /xoso <xu> - Bat dau xo so (hoac tham gia)\n' +
        '2. Nguoi khac go /xoso <xu> de tham gia\n' +
        '3. Tu dong ket thuc sau 60 giay\n' +
        '4. /xoso end - Nguoi bat dau ket thuc som\n\n' +
        'LUAT:\n' +
        '- Cuoc toi thieu: 10 xu\n' +
        '- Can it nhat 2 nguoi choi\n' +
        '- Nha cai lay 2% tien\n' +
        '- 1 nguoi ngau nhien thang toan bo pot\n\n' +
        'VD: /xoso 500 (dat 500 xu)',
      xs: null, // redirect
      wordle: '📝 WORDLE\n\n' +
        '/wordle - Bat dau game\n' +
        'Doan tu tieng Anh 5 chu cai trong 6 luot.\n' +
        '🟩 = Dung vi tri | 🟨 = Sai vi tri | ⬛ = Khong co',
      blackjack: '🃏 BLACKJACK (Xi Dach)\n\n' +
        '/blackjack [xu] - Bat dau (mac dinh 50 xu)\n' +
        'Go "hit" de rut bai, "stand" de dung.\n' +
        'Gan 21 diem nhat thang!',
      bj: null,
      taixiu: '🎲 TAI XIU\n\n' +
        '/taixiu <t/x> [xu] - Dat cuoc\n' +
        't = tai (11-18), x = xiu (3-10)\n' +
        'VD: /taixiu t 200',
      tx: null,
      baucua: '🦀 BAU CUA\n\n' +
        '/baucua <con> [xu] - Dat cuoc\n' +
        'Con: bau/cua/tom/ca/ga/nai\n' +
        'VD: /baucua cua 100',
      bc: null,
      slots: '🎰 MAY QUAY\n\n' +
        '/slots [xu] - Quay (mac dinh 50 xu)\n' +
        '3 hinh giong nhau = thang lon!',
      rps: '✊ OAN TU TI\n\n' +
        '/rps <k/b/bao> [xu] - Choi\n' +
        'k = keo, b = bua, bao = bao\n' +
        'VD: /rps k 100',
      duel: '⚔️ DUEL (Thach dau)\n\n' +
        '/duel @ten <xu> - Thach dau\n' +
        'Doi thu go /accept de chap nhan\n' +
        '/decline - Tu choi thach dau\n\n' +
        'LUAT:\n' +
        '- Moi nguoi duoc chia 1 la bai\n' +
        '- Ai lon hon thang\n' +
        '- Nha cai lay 2%\n' +
        '- Tu dong huy sau 60s neu doi thu khong chap nhan',
      coinflip: '🪙 COINFLIP PvP\n\n' +
        '/cf @ten <xu> - Thach coin flip\n' +
        'Doi thu go /accept de chap nhan\n' +
        '/decline - Tu choi\n\n' +
        'LUAT:\n' +
        '- 50/50 sap/ngua\n' +
        '- Nha cai lay 2%\n' +
        'VD: /cf @Nguyen Duy 200',
      cf: null,
      rob: '🔫 ROB (Cuop xu)\n\n' +
        '/rob @ten - Cuop xu nguoi khac\n\n' +
        'LUAT:\n' +
        '- 40% thanh cong, cuop 10-30% xu doi phuong\n' +
        '- 60% bi bat, mat 20-40% xu cua minh lam phat\n' +
        '- Nan nhan duoc 50% tien phat boi thuong\n' +
        '- Cooldown 5 phut\n' +
        '- Can it nhat 50 xu de di cuop',
      cuop: null,
    };

    // Redirect aliases
    if (topic === 'xs') return gameHelp.xoso;
    if (topic === 'bj') return gameHelp.blackjack;
    if (topic === 'tx') return gameHelp.taixiu;
    if (topic === 'bc') return gameHelp.baucua;
    if (gameHelp[topic]) return gameHelp[topic];

    // /help (tổng quát)
    let msg = '📖 LỆNH BOT:\n\n';
    msg += '--- Chung ---\n';
    msg += '/help /ping /myid\n';
    msg += '/chat <lời nhắn> - Trò chuyện với AI\n';
    msg += '/code <mô tả> - AI viết code\n';
    msg += '/tts <chữ> - Đọc thành giọng nói\n\n';

    msg += '--- Kinh Tế ---\n';
    msg += '/daily /checkin - Nhận thưởng hằng ngày\n';
    msg += '/work - Đi làm kiếm xu\n';
    msg += '/profile /balance - Xem hồ sơ, số dư\n';
    msg += '/deposit /withdraw - Gửi/rút ngân hàng\n';
    msg += '/transfer @tên <xu> - Chuyển xu\n';
    msg += '/top - Bảng xếp hạng giàu nhất\n';
    msg += '/robbank - Cướp ngân hàng (rủi ro)\n\n';

    msg += '--- Thú Cưng (OwO) ---\n';
    msg += '/hunt - Đi săn bắt thú vào sở thú\n';
    msg += '/zoo - Xem sở thú của bạn\n';
    msg += '/team - Lập đội hình chiến đấu\n';
    msg += '/battle @tên - Đấu thú với người khác\n';
    msg += '/weapons /wequip /wremove - Vũ khí\n';
    msg += '/gems /gemequip /gemremove - Đá quý\n';
    msg += '/crates /open <id> - Mở rương đồ\n';
    msg += '/zsell <id> - Bán thú\n';
    msg += '/halbum - Bộ sưu tập thú\n\n';

    msg += '--- Game May Rủi ---\n';
    msg += '/wordle - Đoán chữ tiếng Anh\n';
    msg += '/blackjack [xu] - Xì dách\n';
    msg += '/taixiu <t/x> [xu] - Tài xỉu\n';
    msg += '/baucua <con> [xu] - Bầu cua\n';
    msg += '/slots [xu] - Máy quay\n';
    msg += '/rps <k/b/bao> [xu] - Oẳn tù tì\n';
    msg += '/xoso [xu] - Xổ số (nhiều người)\n';
    msg += '/duel @tên [xu] - Thách đấu đánh bài\n';
    msg += '/cf @tên [xu] - Tung đồng xu PvP\n';
    msg += '/rob @tên - Cướp xu người khác\n';
    msg += '/accept /decline - Nhận/từ chối thách đấu\n\n';

    msg += '--- Tiện Ích ---\n';
    msg += '/thoitiet <thành phố> - Xem thời tiết\n';
    msg += '/dich <chữ> - Dịch ngôn ngữ\n';
    msg += '/hoi <câu hỏi> - Hỏi AI kiến thức\n';
    msg += '/tomtat [n] - Tóm tắt hội thoại gần đây\n';
    msg += '/calc <phép tính> - Máy tính\n';
    msg += '/chon A | B | C - Chọn ngẫu nhiên\n';
    msg += '/random [min max] - Số ngẫu nhiên\n';
    msg += '/vote Câu hỏi? | A | B - Bình chọn\n';
    msg += '/avatar [@tên] - Lấy ảnh đại diện\n\n';

    msg += '--- Xã Hội ---\n';
    msg += '/marry @tên - Cầu hôn\n';
    msg += '/divorce - Ly hôn\n';
    msg += '/roast @tên - Cà khịa (AI)\n';
    msg += '/khen @tên - Khen ngợi (AI)\n';
    msg += '💬 Tag @Bot trong nhóm để trò chuyện với AI\n\n';

    msg += '--- Khác ---\n';
    msg += '/dice /flip /d20 - Xúc xắc, tung xu\n';
    msg += '/8ball <câu hỏi> - Bói toán\n';
    msg += '/lucky /emoji /card /td - Vui vẻ\n';
    msg += '/clearchat - Xoá lịch sử AI\n';
    msg += '/endgame - Kết thúc game đang chơi\n\n';

    if (ctx.isGroup) {
      msg += '💡 Trong nhóm: gõ lệnh bắt đầu bằng /  (VD: /daily)\n';
    }
    msg += 'Gõ /help <tên game> để xem chi tiết.\n';
    msg += 'VD: /help xoso, /help blackjack, /help rob\n';
    msg += '⚡ Viết tắt: /p /dl /lam /pf /z /gem /wd /ck /tt ...';

    if (isAdmin(ctx.senderId)) {
      msg += '\n\n--- Admin ---\n';
      msg += '/setrule /delrule /rules\n';
      msg += '/addadmin /removeadmin /admins\n';
      msg += '/say /status /shutdown\n';
      msg += '/addxu @tên <xu> /setxu @tên <xu>\n';
    }
    return msg;
  },
});

register('ping', {
  aliases: ['p'],
  handler: () => `Pong! (${new Date().toLocaleTimeString('vi-VN')})`,
});

register('myid', {
  aliases: ['id'],
  handler: (a, ctx) => `ID cua ban: ${ctx.senderId}\nTen: ${ctx.sender}`,
});

// ─── ECONOMY ───────────────────────────────────────────
register('daily', {
  aliases: ['dl'],
  handler: (a, ctx) => G.economy.daily(ctx.senderId),
});

register('checkin', {
  aliases: ['diemdanh', 'dd'],
  handler: (a, ctx) => G.misc.checkin(G.economy, ctx.senderId),
});

register('work', {
  aliases: ['lam', 'lamviec', 'w'],
  handler: (a, ctx) => G.economy.work(ctx.senderId),
});

register('profile', {
  aliases: ['pf', 'hoso', 'me'],
  handler: (a, ctx) => {
    if (a?.trim()) {
      const target = resolveTarget(a.trim());
      if (target) return G.economy.profile(target.id);
      return `Khong tim thay user "${a.trim()}"!`;
    }
    return G.economy.profile(ctx.senderId);
  },
});

register('balance', {
  aliases: ['bal'],
  handler: (a, ctx) => {
    const b = G.economy.getBalance(ctx.senderId);
    return `Vi: ${b.xu} xu\nBank: ${b.bank} xu\nTong: ${b.total} xu`;
  },
});

register('deposit', {
  aliases: ['gui', 'nap'],
  handler: (a, ctx) => G.economy.deposit(ctx.senderId, a?.trim() || 'all'),
});

register('withdraw', {
  aliases: ['rut'],
  handler: (a, ctx) => G.economy.withdraw(ctx.senderId, a?.trim() || 'all'),
});

register('top', {
  handler: () => G.economy.top(),
});

register('transfer', {
  aliases: ['ck', 'chuyen', 'give'],
  handler: (a, ctx) => {
    if (!a) return 'Nhan /transfer @ten <so xu>\nVD: /transfer @Nguyen Duy 100';

    const args = a.trim();
    let targetStr = '';
    let amount = 0;

    const nameFirst = args.match(/^@?(.+?)\s+(\d+)$/);
    const moneyFirst = args.match(/^(\d+)\s+@?(.+)$/);

    if (nameFirst) {
      targetStr = nameFirst[1];
      amount = parseInt(nameFirst[2]);
    } else if (moneyFirst) {
      amount = parseInt(moneyFirst[1]);
      targetStr = moneyFirst[2];
    } else {
      return 'Cu phap: /transfer @ten so_xu';
    }

    const target = resolveTarget(targetStr);
    if (!target) return `Khong tim thay user "${targetStr}"! Ho can tuong tac voi bot truoc.`;

    if (target.id === ctx.senderId) return 'Khong the chuyen xu cho chinh minh!';

    return G.economy.transfer(ctx.senderId, target.id, amount);
  },
});

// ─── SESSION GAMES ─────────────────────────────────────
register('wordle', {
  aliases: ['wd'],
  handler: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.wordle.start({ threadId: ctx.threadId, player: ctx.senderId, economy: G.economy, sessions: G.sessions });
  },
});

register('blackjack', {
  aliases: ['bj'],
  handler: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.blackjack.start({ threadId: ctx.threadId, player: ctx.senderId, economy: G.economy, sessions: G.sessions }, a?.trim());
  },
});

// ─── INSTANT GAMES ─────────────────────────────────────
register('taixiu', {
  aliases: ['tx'],
  handler: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.taixiuPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.taixiu.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
});

register('baucua', {
  aliases: ['bc'],
  handler: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.baucuaPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.baucua.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
});

register('slots', {
  aliases: ['slot'],
  handler: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.slotsPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.slots.play({ player: ctx.senderId, economy: G.economy }, a?.trim());
  },
});

register('rps', {
  handler: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.rpsPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.rps.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
});

register('xoso', {
  aliases: ['xs'],
  handler: (a, ctx) => G.lottery.start({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
});

register('duel', {
  handler: (a, ctx) => G.pvp.duel({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
});

register('cf', {
  aliases: ['coinflip'],
  handler: (a, ctx) => G.pvp.coinflip({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
});

register('rob', {
  aliases: ['cuop'],
  handler: (a, ctx) => G.pvp.rob({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
});

register('robbank', {
  aliases: ['cuopnganhang', 'heist'],
  handler: (a, ctx) => {
    const r = G.economy.robBank(ctx.senderId);
    if (r.ok && r.jackpot)
      return `💰🎰 JACKPOT! Bạn đột nhập kho bạc và cuỗm ${r.stolen} xu (${r.pct}% của ${r.poolTotal} xu trong ngân hàng)!`;
    if (r.ok)
      return `💰 Cướp ngân hàng thành công!\n+${r.stolen} xu (từ tổng ${r.poolTotal} xu).`;
    if (r.caught)
      return `🚔 Bị bắt khi cướp ngân hàng!\nPhạt ${r.fine} xu (${r.pct}%). Còn ${r.xu} xu.`;
    return r.msg || 'Không cướp được!';
  },
});

register('accept', {
  handler: (a, ctx) => G.pvp.accept({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
});

register('decline', {
  handler: (a, ctx) => G.pvp.decline({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }),
});

// ─── HUNTING (OwO) ─────────────────────────────────────
// /hunt bắt thú vào "zoo". Quản lý thú qua /zoo /team /battle /gems /weapons.
register('hunt', {
  aliases: ['h', 'san'],
  handler: (a, ctx) => G.hunt.hunt({ player: ctx.senderId, economy: G.economy }, a),
});

register('halbum', {
  aliases: ['album'],
  handler: (a, ctx) => G.hunt.huntAlbum({ player: ctx.senderId, economy: G.economy }),
});

// ─── ZOO / TEAM / GEMS / LOOTBOX / BATTLE ─────────────
register('zoo', {
  aliases: ['z', 'thu', 'sothu'],
  handler: (a, ctx) => G.zoo.zoo({ player: ctx.senderId, economy: G.economy }, a),
});

register('team', {
  aliases: ['doi', 'tm'],
  handler: (a, ctx) => G.zoo.team({ player: ctx.senderId, economy: G.economy }, a),
});

register('zsell', {
  aliases: ['banthu'],
  handler: (a, ctx) => G.zoo.zooSell({ player: ctx.senderId, economy: G.economy }, a),
});

register('wequip', {
  handler: (a, ctx) => G.zoo.weaponEquip({ player: ctx.senderId, economy: G.economy }, a),
});

register('wremove', {
  handler: (a, ctx) => G.zoo.weaponRemove({ player: ctx.senderId, economy: G.economy }, a),
});

register('weapons', {
  aliases: ['wp', 'vukhi'],
  handler: (a, ctx) => G.zoo.weapons({ player: ctx.senderId, economy: G.economy }),
});

register('gems', {
  aliases: ['gem', 'da'],
  handler: (a, ctx) => G.gems.gems({ player: ctx.senderId, economy: G.economy }),
});

register('gemequip', {
  handler: (a, ctx) => G.gems.gemEquip({ player: ctx.senderId, economy: G.economy }, a),
});

register('gemremove', {
  handler: (a, ctx) => G.gems.gemRemove({ player: ctx.senderId, economy: G.economy }, a),
});

register('open', {
  aliases: ['mo'],
  handler: (a, ctx) => G.lootbox.open({ player: ctx.senderId, economy: G.economy }, a),
});

register('crates', {
  aliases: ['crate', 'ruong'],
  handler: (a, ctx) => G.lootbox.crates({ player: ctx.senderId, economy: G.economy }),
});

register('battle', {
  aliases: ['pvp'],
  handler: (a, ctx) => G.battle.battle({ player: ctx.senderId, economy: G.economy, resolveTarget }, a),
});

// ─── MISC GAMES ────────────────────────────────────────
register('dice', {
  aliases: ['xucxac', 'roll'],
  handler: (a) => G.misc.dice(a),
});

register('flip', {
  aliases: ['tung'],
  handler: () => G.misc.flip(),
});

register('d20', {
  handler: () => G.misc.rollD20(),
});

register('8ball', {
  handler: (a) => G.misc.eightBall(a),
});

register('lucky', {
  handler: () => G.misc.lucky(),
});

register('td', {
  handler: (a) => G.misc.truthOrDare(a),
});

register('emoji', {
  handler: () => G.misc.emojiQuiz(),
});

register('card', {
  handler: () => G.misc.cardBattle(),
});

// ─── TIỆN ÍCH & XÃ HỘI ─────────────────────────────────
register('thoitiet', {
  aliases: ['weather', 'tt'],
  handler: (a) => getWeather(a || ''),   // async -> tra ve Promise<string>
});

register('chon', {
  aliases: ['pick'],
  handler: (a) => {
    const arg = (a || '').trim();
    if (!arg) return 'Cho mình vài lựa chọn nhé: /chon Phở | Bún | Cơm  (hoặc ngăn bằng dấu phẩy)';
    const opts = arg.split(/\||,|;/).map(s => s.trim()).filter(Boolean);
    if (opts.length < 2) return 'Cần ít nhất 2 lựa chọn nhé!';
    return `🎯 Mình chọn: ${opts[Math.floor(Math.random() * opts.length)]}`;
  },
});

register('random', {
  aliases: ['rand'],
  handler: (a) => {
    const nums = (a || '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    let min = 1, max = 100;
    if (nums.length === 1) max = nums[0];
    else if (nums.length >= 2) { min = nums[0]; max = nums[1]; }
    if (min > max) [min, max] = [max, min];
    const r = Math.floor(Math.random() * (max - min + 1)) + min;
    return `🎲 Số ngẫu nhiên (${min}–${max}): ${r}`;
  },
});

register('calc', {
  aliases: ['tinh'],
  handler: (a) => {
    const expr = (a || '').trim();
    if (!expr) return 'Nhập phép tính: /calc 2 + 2 * 3';
    if (!/^[0-9+\-*/(). %]+$/.test(expr)) return 'Chỉ hỗ trợ số và + - * / ( ) % thôi nhé!';
    try {
      const r = Function('"use strict";return (' + expr + ')')();
      if (typeof r !== 'number' || !isFinite(r)) return 'Phép tính không hợp lệ!';
      return `🧮 ${expr} = ${Math.round(r * 1e6) / 1e6}`;
    } catch { return 'Phép tính không hợp lệ!'; }
  },
});

register('vote', {
  aliases: ['poll', 'binhchon'],
  handler: (a, ctx) => {
    const arg = (a || '').trim();
    const poll = polls.get(ctx.threadId);
    if (!arg) {
      return poll ? renderPoll(poll)
        : 'Tạo bình chọn: /vote Câu hỏi? | Lựa chọn 1 | Lựa chọn 2\nBỏ phiếu: /vote <số>  •  Kết thúc: /vote ket';
    }
    if (/^(ket|end|xong|dong|close)$/i.test(arg)) {
      if (!poll) return 'Không có bình chọn nào đang mở!';
      const res = renderPoll(poll, true);
      polls.delete(ctx.threadId);
      return res;
    }
    if (/^\d+$/.test(arg)) {
      if (!poll) return 'Chưa có bình chọn nào! Tạo: /vote Câu hỏi? | A | B';
      const idx = parseInt(arg) - 1;
      if (idx < 0 || idx >= poll.options.length) return `Chọn số từ 1 đến ${poll.options.length}!`;
      poll.votes[ctx.senderId] = idx;
      return `✅ ${ctx.sender} đã bình chọn "${poll.options[idx]}".\n\n` + renderPoll(poll);
    }
    if (arg.includes('|')) {
      const parts = arg.split('|').map(s => s.trim()).filter(Boolean);
      const question = parts.shift();
      if (parts.length < 2) return 'Cần ít nhất 2 lựa chọn! VD: /vote Ăn gì? | Phở | Bún | Cơm';
      polls.set(ctx.threadId, { question, options: parts.slice(0, 10), votes: {}, by: ctx.sender });
      return `🗳️ BÌNH CHỌN:\n${question}\n\n` + parts.slice(0, 10).map((o, i) => `${i + 1}. ${o}`).join('\n') + `\n\nBỏ phiếu: /vote <số>`;
    }
    return 'Sai cú pháp! Tạo: /vote Câu hỏi? | A | B  •  Bỏ phiếu: /vote <số>';
  },
});

register('marry', {
  aliases: ['kethon', 'cuoi'],
  handler: (a, ctx) => {
    if (!a || !a.trim()) return 'Cầu hôn ai đó: /marry @tên';
    const t = resolveTarget(a.trim());
    if (!t) return `Không tìm thấy "${a.trim()}"! Người đó cần tương tác với bot trước.`;
    return G.economy.marry(ctx.senderId, t.id);
  },
});

register('divorce', {
  aliases: ['lyhon'],
  handler: (a, ctx) => G.economy.divorce(ctx.senderId),
});

// ─── TTS ───────────────────────────────────────────────
register('tts', {
  handler: (a, ctx) => {
    // Return promise - bot.js se handle async + gui file
    return handleTTS(a || '');
  },
});

register('endgame', {
  aliases: ['end', 'ketthuc', 'huy'],
  handler: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) {
      G.endGame(ctx.threadId);
      return 'Game ket thuc!';
    }
    return 'Khong co game nao!';
  },
});

// ============================================================
// DISPATCH — Same behavior as original handleCommand()
// ============================================================
function handleCommand(cmd, args, context) {
  const command = cmd.toLowerCase();
  console.log(`[DEBUG] Sender ID: "${context.senderId}" - Tên: "${context.sender}"`);

  // Game input (dang choi game)
  if (G.hasActiveGame(context.threadId) && !command.startsWith('/')) {
    const result = G.handleGameInput(context.threadId, cmd, context.senderId);
    if (result) return result;
  }

  // Lookup in registry
  const entry = registry.get(command);
  if (!entry) return null;

  // Admin check
  if (entry.admin && !isAdmin(context.senderId)) {
    return 'Bạn không phải admin!';
  }

  return entry.handler(args, context);
}

function checkAutoReply(text) {
  const rules = config.rules;
  const lower = text.toLowerCase().trim();
  if (rules[lower]) return rules[lower];
  for (const [trigger, response] of Object.entries(rules)) {
    if (lower.includes(trigger.toLowerCase())) return response;
  }
  return null;
}

module.exports = { handleCommand, checkAutoReply, isAdmin, games: G, resolveTarget };

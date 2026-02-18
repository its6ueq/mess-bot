const config = require('../config');
const G = require('./games/index');
const { handleTTS } = require('./tts');

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

// === ADMIN COMMANDS ===
const adminCmds = {
  setrule: (args) => {
    const m = args.match(/^(\S+)\s+(.+)$/);
    if (!m) return '/setrule <trigger> <response>';
    config.setRule(m[1], m[2]);
    return `Rule: "${m[1]}" -> "${m[2]}"`;
  },
  delrule: (args) => {
    if (!args) return '/delrule <trigger>';
    config.deleteRule(args.trim());
    return `Xoa rule: "${args.trim()}"`;
  },
  rules: () => {
    const r = config.rules;
    const e = Object.entries(r);
    if (!e.length) return 'Chua co rule!';
    return 'RULES:\n' + e.map(([t, r], i) => `${i + 1}. "${t}" -> "${r}"`).join('\n');
  },
  addadmin: (args) => {
    if (!args) return '/addadmin @ten hoac /addadmin ID';
    const target = resolveTarget(args.trim());
    if (!target) return `Khong tim thay user "${args.trim()}"! Ho can tuong tac voi bot truoc.`;
    config.addAdmin(target.id);
    return `+Admin: ${target.displayName} (${target.id})`;
  },
  removeadmin: (args) => {
    if (!args) return '/removeadmin @ten hoac /removeadmin ID';
    const target = resolveTarget(args.trim());
    if (!target) return `Khong tim thay user "${args.trim()}"!`;
    config.removeAdmin(target.id);
    return `-Admin: ${target.displayName} (${target.id})`;
  },
  admins: () => {
    const l = config.admins;
    if (!l.length) return 'Chua co admin!';
    return 'ADMINS:\n' + l.map((id, i) => {
      const name = G.economy.getDisplayName(id);
      return `${i + 1}. ${name} (${id})`;
    }).join('\n');
  },
  shutdown: () => { setTimeout(() => process.exit(0), 1000); return 'Bot dang tat...'; },
  say: (args) => args || '/say <text>',
  status: () => {
    const u = process.uptime();
    return `STATUS:\nUptime: ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m\nRules: ${Object.keys(config.rules).length}\nAdmins: ${config.admins.length}\nPlayers: ${Object.keys(G.economy.players).length}`;
  },
  // Admin transfer: /addxu @ten so hoac /addxu ID so (giong syntax transfer)
  addxu: (args) => {
    if (!args) return '/addxu @ten so\nVD: /addxu @Nguyen Duy 1000';

    const trimmed = args.trim();

    // Pattern: @ten so hoac ten so hoac ID so
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
  // Admin set xu: /setxu @ten so
  setxu: (args) => {
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
};

// === USER COMMANDS (game + economy + misc) ===
const userCmds = {
  help: (args, ctx) => {
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

    // /help (tong quat)
    let msg = 'LENH BOT:\n\n';
    msg += '--- Chung ---\n';
    msg += '/help /ping /myid\n';
    msg += '/chat <msg> - Chat voi AI\n';
    msg += '/code <mo ta> - AI viet code\n';
    msg += '/tts <text> - Text-to-Speech\n\n';
    msg += '--- Economy ---\n';
    msg += '/daily /checkin /work /profile\n';
    msg += '/balance /deposit /withdraw\n';
    msg += '/transfer @ten <xu> /top\n\n';
    msg += '--- Cau Ca ---\n';
    msg += '/fish [map] - Tha cau\n';
    msg += '/shop - Mua can/moi\n';
    msg += '/buy <ten> - Mua do\n';
    msg += '/sell [all/id] - Ban ca\n';
    msg += '/inventory - Xem kho ca\n';
    msg += '/moi [id] - Dung moi\n';
    msg += '/go <map> - Chuyen ho cau\n';
    msg += '/album - Bo suu tap ca\n\n';

    msg += '--- San Ban ---\n';
    msg += '/hunt - Di san\n';
    msg += '/trap [id] - Dat bay/Dung moi\n';
    msg += '/hshop - Shop vu khi/bay\n';
    msg += '/hbuy <ten> - Mua do san\n';
    msg += '/hsell [all] - Ban chien loi pham\n';
    msg += '/hkho - Xem kho san ban\n';
    msg += '/hgear - Xem trang bi san\n';
    msg += '/hgo <map> - Chuyen map san\n';
    msg += '/halbum - Bo suu tap thu\n\n';

    msg += '--- Games ---\n';
    msg += '/wordle - Wordle\n';
    msg += '/blackjack [xu] - Xi dach\n';
    msg += '/taixiu <t/x> [xu] - Tai xiu\n';
    msg += '/baucua <con> [xu] - Bau cua\n';
    msg += '/slots [xu] - May quay\n';
    msg += '/rps <k/b/bao> [xu] - Oan tu ti\n';
    msg += '/xoso [xu] - Xo so (nhieu nguoi)\n';
    msg += '/duel @ten [xu] - Thach dau danh bai\n';
    msg += '/cf @ten [xu] - Coinflip PvP\n';
    msg += '/rob @ten - Cuop xu\n\n';

    msg += '--- Khac ---\n';
    msg += '/dice /flip /d20 /8ball <cau hoi>\n';
    msg += '/lucky /emoji /card\n';
    msg += '/td <truth/dare>\n';
    msg += '/endgame - Ket thuc game\n\n';
    msg += 'Go /help <ten game> de xem chi tiet.\n';
    msg += 'VD: /help xoso, /help blackjack';

    if (isAdmin(ctx.senderId)) {
      msg += '\n\n--- Admin ---\n';
      msg += '/setrule /delrule /rules\n';
      msg += '/addadmin /removeadmin /admins\n';
      msg += '/say /status /shutdown\n';
      msg += '/addxu @ten so /setxu @ten so\n';
    }
    return msg;
  },

  ping: () => `Pong! (${new Date().toLocaleTimeString('vi-VN')})`,

  // Hien thi Facebook ID cua nguoi dung
  myid: (a, ctx) => `ID cua ban: ${ctx.senderId}\nTen: ${ctx.sender}`,

  // === ECONOMY (tat ca dung senderId) ===
  daily: (a, ctx) => G.economy.daily(ctx.senderId),
  checkin: (a, ctx) => G.misc.checkin(G.economy, ctx.senderId),
  work: (a, ctx) => G.economy.work(ctx.senderId),
  profile: (a, ctx) => {
    if (a?.trim()) {
      // Xem profile nguoi khac: /profile @ten hoac /profile ID
      const target = resolveTarget(a.trim());
      if (target) return G.economy.profile(target.id);
      return `Khong tim thay user "${a.trim()}"!`;
    }
    return G.economy.profile(ctx.senderId);
  },
  balance: (a, ctx) => {
    const b = G.economy.getBalance(ctx.senderId);
    return `Vi: ${b.xu} xu\nBank: ${b.bank} xu\nTong: ${b.total} xu`;
  },
  bal: (a, ctx) => userCmds.balance(a, ctx),
  deposit: (a, ctx) => G.economy.deposit(ctx.senderId, a?.trim() || 'all'),
  withdraw: (a, ctx) => G.economy.withdraw(ctx.senderId, a?.trim() || 'all'),
  top: (a, ctx) => G.economy.top(),

  transfer: (a, ctx) => {
    if (!a) return '/transfer @ten <so xu>\nVD: /transfer @Nguyen Duy 100';

    const args = a.trim();
    let targetStr = '';
    let amount = 0;

    // Pattern 1: Ten truoc, Tien sau (VD: /transfer @Nguyen Van A 100)
    const nameFirst = args.match(/^@?(.+?)\s+(\d+)$/);
    // Pattern 2: Tien truoc, Ten sau (VD: /transfer 100 @Nguyen Van A)
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

    // Resolve target -> ID
    const target = resolveTarget(targetStr);
    if (!target) return `Khong tim thay user "${targetStr}"! Ho can tuong tac voi bot truoc.`;

    if (target.id === ctx.senderId) return 'Khong the chuyen xu cho chinh minh!';

    return G.economy.transfer(ctx.senderId, target.id, amount);
  },

  // === SESSION GAMES (dung senderId) ===
  wordle: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.wordle.start({ threadId: ctx.threadId, player: ctx.senderId, economy: G.economy, sessions: G.sessions });
  },
  blackjack: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.blackjack.start({ threadId: ctx.threadId, player: ctx.senderId, economy: G.economy, sessions: G.sessions }, a?.trim());
  },
  bj: (a, ctx) => userCmds.blackjack(a, ctx),

  // === INSTANT GAMES (dung senderId) ===
  taixiu: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.taixiuPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.taixiu.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
  tx: (a, ctx) => userCmds.taixiu(a, ctx),
  baucua: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.baucuaPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.baucua.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
  bc: (a, ctx) => userCmds.baucua(a, ctx),
  slots: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.slotsPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.slots.play({ player: ctx.senderId, economy: G.economy }, a?.trim());
  },
  slot: (a, ctx) => userCmds.slots(a, ctx),
  rps: (a, ctx) => {
    if (a && a.includes('@')) {
      const r = G.pvp.rpsPvP({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a.trim());
      if (r) return r;
    }
    return G.rps.play({ player: ctx.senderId, economy: G.economy }, a || '');
  },
  xoso: (a, ctx) => G.lottery.start({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
  xs: (a, ctx) => userCmds.xoso(a, ctx),
  duel: (a, ctx) => G.pvp.duel({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
  cf: (a, ctx) => G.pvp.coinflip({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
  coinflip: (a, ctx) => userCmds.cf(a, ctx),
  rob: (a, ctx) => G.pvp.rob({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
  cuop: (a, ctx) => userCmds.rob(a, ctx),
  accept: (a, ctx) => G.pvp.accept({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }, a?.trim()),
  decline: (a, ctx) => G.pvp.decline({ player: ctx.senderId, economy: G.economy, threadId: ctx.threadId, sessions: G.sessions }),

// === FISHING (Update them lenh moi, go, map) ===
  fish: (a, ctx) => G.fishing.start({ player: ctx.senderId, economy: G.economy }, a?.trim() || ''),
  sell: (a, ctx) => G.fishing.sell({ player: ctx.senderId, economy: G.economy }, a?.trim() || ''),
  inventory: (a, ctx) => G.fishing.inventory({ player: ctx.senderId, economy: G.economy }),
  inv: (a, ctx) => userCmds.inventory(a, ctx),
  shop: (a, ctx) => G.fishing.shop({ player: ctx.senderId, economy: G.economy }),
  buy: (a, ctx) => G.fishing.buy({ player: ctx.senderId, economy: G.economy }, a?.trim() || ''),
  gear: (a, ctx) => G.fishing.gear({ player: ctx.senderId, economy: G.economy }),
  album: (a, ctx) => G.fishing.album({ player: ctx.senderId, economy: G.economy }),
  moi: (a, ctx) => G.fishing.useBait({ player: ctx.senderId, economy: G.economy }, a),
  go: (a, ctx) => G.fishing.goMap({ player: ctx.senderId, economy: G.economy }, a),
  map: (a, ctx) => G.fishing.mapList({ player: ctx.senderId, economy: G.economy }),

  // === HUNTING (Game moi) ===
  hunt: (a, ctx) => G.hunting.hunt({ player: ctx.senderId, economy: G.economy }, a),
  trap: (a, ctx) => G.hunting.setTrap({ player: ctx.senderId, economy: G.economy }, a),
  hshop: (a, ctx) => G.hunting.huntShop({ player: ctx.senderId, economy: G.economy }),
  hbuy: (a, ctx) => G.hunting.huntBuy({ player: ctx.senderId, economy: G.economy }, a),
  hsell: (a, ctx) => G.hunting.huntSell({ player: ctx.senderId, economy: G.economy }, a),
  hkho: (a, ctx) => G.hunting.huntInventory({ player: ctx.senderId, economy: G.economy }),
  hgear: (a, ctx) => G.hunting.huntGear({ player: ctx.senderId, economy: G.economy }),
  halbum: (a, ctx) => G.hunting.huntAlbum({ player: ctx.senderId, economy: G.economy }),
  hgo: (a, ctx) => G.hunting.huntGoMap({ player: ctx.senderId, economy: G.economy }, a),
  hmap: (a, ctx) => G.hunting.huntMapList({ player: ctx.senderId, economy: G.economy }),

  // === MISC GAMES ===
  dice: (a) => G.misc.dice(a),
  flip: () => G.misc.flip(),
  d20: () => G.misc.rollD20(),
  '8ball': (a) => G.misc.eightBall(a),
  lucky: () => G.misc.lucky(),
  td: (a) => G.misc.truthOrDare(a),
  emoji: () => G.misc.emojiQuiz(),
  card: () => G.misc.cardBattle(),

  // === TTS ===
  tts: (a, ctx) => {
    // Return promise - bot.js se handle async + gui file
    return handleTTS(a || '');
  },

  endgame: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) {
      G.endGame(ctx.threadId);
      return 'Game ket thuc!';
    }
    return 'Khong co game nao!';
  },
};

function handleCommand(cmd, args, context) {
  const command = cmd.toLowerCase();
  console.log(`[DEBUG] Sender ID: "${context.senderId}" - Tên: "${context.sender}"`);
  // Game input (dang choi game)
  if (G.hasActiveGame(context.threadId) && !command.startsWith('/')) {
    const result = G.handleGameInput(context.threadId, cmd, context.senderId);
    if (result) return result;
  }

  // Admin commands (check bang senderId)
  if (adminCmds[command]) {
    if (!isAdmin(context.senderId)) return 'Khong phai admin!';
    return adminCmds[command](args, context);
  }

  // User commands
  if (userCmds[command]) return userCmds[command](args, context);

  return null;
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

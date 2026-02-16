const config = require('../config');
const G = require('./games/index');

function isAdmin(name) {
  return config.admins.some(a => a.toLowerCase() === name.toLowerCase());
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
  addadmin: (args) => { if (!args) return '/addadmin <ten>'; config.addAdmin(args.trim()); return `+Admin: ${args.trim()}`; },
  removeadmin: (args) => { if (!args) return '/removeadmin <ten>'; config.removeAdmin(args.trim()); return `-Admin: ${args.trim()}`; },
  admins: () => { const l = config.admins; return l.length ? 'ADMINS:\n' + l.map((a, i) => `${i + 1}. ${a}`).join('\n') : 'Chua co admin!'; },
  shutdown: () => { setTimeout(() => process.exit(0), 1000); return 'Bot dang tat...'; },
  say: (args) => args || '/say <text>',
  status: () => {
    const u = process.uptime();
    return `STATUS:\nUptime: ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m\nRules: ${Object.keys(config.rules).length}\nAdmins: ${config.admins.length}\nPlayers: ${Object.keys(G.economy.players).length}`;
  },
  addxu: (args) => {
    const m = args.match(/^(\S+)\s+(\d+)$/);
    if (!m) return '/addxu <ten> <so>';
    G.economy.addXu(m[1], parseInt(m[2]));
    return `+${m[2]} xu cho ${m[1]}`;
  },
};

// === USER COMMANDS (game + economy + misc) ===
const userCmds = {
  help: (args, ctx) => {
    let msg = 'LENH BOT:\n\n';
    msg += '--- Chung ---\n';
    msg += '/help /ping\n';
    msg += '/chat <msg> - Chat voi AI\n';
    msg += '/code <mo ta> - AI viet code\n\n';
    msg += '--- Economy ---\n';
    msg += '/daily /checkin /work /profile\n';
    msg += '/balance /deposit <xu> /withdraw <xu>\n';
    msg += '/transfer <ten> <xu> /top\n\n';
    msg += '--- Games ---\n';
    msg += '/guess - Doan so\n';
    msg += '/wordle - Wordle\n';
    msg += '/math - Tinh nhanh\n';
    msg += '/scramble - Do tu\n';
    msg += '/blackjack [xu] - Xi dach\n';
    msg += '/taixiu <t/x> [xu] - Tai xiu\n';
    msg += '/baucua <con> [xu] - Bau cua\n';
    msg += '/slots [xu] - May quay\n';
    msg += '/rps <k/b/bao> [xu] - Oan tu ti\n';
    msg += '/fish - Cau ca\n';
    msg += '/sell [all] - Ban ca\n';
    msg += '/inventory - Xem kho\n\n';
    msg += '--- Khac ---\n';
    msg += '/dice /flip /d20 /8ball <cau hoi>\n';
    msg += '/trivia /lucky /emoji /card\n';
    msg += '/td <truth/dare> - Truth or Dare\n';
    msg += '/endgame - Ket thuc game\n';

    if (isAdmin(ctx.sender)) {
      msg += '\n--- Admin ---\n';
      msg += '/setrule /delrule /rules\n';
      msg += '/addadmin /removeadmin /admins\n';
      msg += '/say /status /shutdown /addxu\n';
    }
    return msg;
  },

  ping: () => `Pong! (${new Date().toLocaleTimeString('vi-VN')})`,

  // === ECONOMY ===
  daily: (a, ctx) => G.economy.daily(ctx.sender),
  checkin: (a, ctx) => G.misc.checkin(G.economy, ctx.sender),
  work: (a, ctx) => G.economy.work(ctx.sender),
  profile: (a, ctx) => G.economy.profile(a?.trim() || ctx.sender),
  balance: (a, ctx) => {
    const b = G.economy.getBalance(ctx.sender);
    return `Vi: ${b.xu} xu\nBank: ${b.bank} xu\nTong: ${b.total} xu`;
  },
  bal: (a, ctx) => userCmds.balance(a, ctx),
  deposit: (a, ctx) => G.economy.deposit(ctx.sender, a?.trim() || 'all'),
  withdraw: (a, ctx) => G.economy.withdraw(ctx.sender, a?.trim() || 'all'),
  transfer: (a, ctx) => {
    const m = a?.match(/^(\S+)\s+(\d+)$/);
    if (!m) return '/transfer <ten> <so xu>';
    return G.economy.transfer(ctx.sender, m[1], m[2]);
  },
  top: () => G.economy.top(),

  // === SESSION GAMES ===
  guess: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.guess.start({ threadId: ctx.threadId, player: ctx.sender, economy: G.economy, sessions: G.sessions });
  },
  wordle: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.wordle.start({ threadId: ctx.threadId, player: ctx.sender, economy: G.economy, sessions: G.sessions });
  },
  math: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.math.start({ threadId: ctx.threadId, player: ctx.sender, economy: G.economy, sessions: G.sessions });
  },
  scramble: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.scramble.start({ threadId: ctx.threadId, player: ctx.sender, economy: G.economy, sessions: G.sessions });
  },
  blackjack: (a, ctx) => {
    if (G.hasActiveGame(ctx.threadId)) return 'Dang co game! /endgame truoc.';
    return G.blackjack.start({ threadId: ctx.threadId, player: ctx.sender, economy: G.economy, sessions: G.sessions }, a?.trim());
  },
  bj: (a, ctx) => userCmds.blackjack(a, ctx),

  // === INSTANT GAMES ===
  taixiu: (a, ctx) => G.taixiu.play({ player: ctx.sender, economy: G.economy }, a || ''),
  tx: (a, ctx) => userCmds.taixiu(a, ctx),
  baucua: (a, ctx) => G.baucua.play({ player: ctx.sender, economy: G.economy }, a || ''),
  bc: (a, ctx) => userCmds.baucua(a, ctx),
  slots: (a, ctx) => G.slots.play({ player: ctx.sender, economy: G.economy }, a?.trim()),
  slot: (a, ctx) => userCmds.slots(a, ctx),
  rps: (a, ctx) => G.rps.play({ player: ctx.sender, economy: G.economy }, a || ''),

  // === FISHING ===
  fish: (a, ctx) => G.fishing.start({ player: ctx.sender, economy: G.economy }),
  sell: (a, ctx) => G.fishing.sell({ player: ctx.sender, economy: G.economy }, a?.trim() || ''),
  inventory: (a, ctx) => G.fishing.inventory({ player: ctx.sender, economy: G.economy }),
  inv: (a, ctx) => userCmds.inventory(a, ctx),

  // === MISC GAMES ===
  dice: (a) => G.misc.dice(a),
  flip: () => G.misc.flip(),
  d20: () => G.misc.rollD20(),
  '8ball': (a) => G.misc.eightBall(a),
  trivia: () => G.misc.trivia(),
  lucky: () => G.misc.lucky(),
  td: (a) => G.misc.truthOrDare(a),
  emoji: () => G.misc.emojiQuiz(),
  card: () => G.misc.cardBattle(),

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

  // Game input (dang choi game) - chi xu ly khi co active game trong thread
  if (G.hasActiveGame(context.threadId) && !command.startsWith('/')) {
    const result = G.handleGameInput(context.threadId, cmd, context.sender);
    if (result) return result;
  }

  // Admin commands
  if (adminCmds[command]) {
    if (!isAdmin(context.sender)) return 'Khong phai admin!';
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

module.exports = { handleCommand, checkAutoReply, isAdmin, games: G };

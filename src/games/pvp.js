// ================================================================
// PvP Games — Duel, Coinflip, Rob + PvP wrappers (taixiu, rps, baucua, slots)
// Refactored: shared challenge/accept flow + per-game resolve logic.
// ZERO behavioral changes — same game mechanics, same messages.
// ================================================================

const HOUSE_CUT = 0.02; // Nha cai 2%

// ========== HELPER ==========

function findTarget(economy, input) {
  if (!input) return null;
  const cleaned = input.trim();
  if (/^\d{5,}$/.test(cleaned)) return cleaned;
  return economy.findIdByName(cleaned);
}

// --- SHARED CHALLENGE SETUP (used by ALL PvP games) ---
// Parse args, validate, take xu, create session.
function challengeGame(ctx, args, gameType, parseArgsFn, opts = {}) {
  const { player, economy, threadId, sessions } = ctx;
  const minBet = opts.minBet || 10;

  const existing = sessions.get(threadId);
  if (existing) return 'Dang co game/thach dau! /endgame truoc.';

  const parsed = parseArgsFn(args);
  if (!parsed) return null; // caller shows usage

  const { targetStr, choice, bet } = parsed;
  if (bet < minBet) return `Cuoc toi thieu ${minBet} xu!`;

  const targetId = findTarget(economy, targetStr);
  if (!targetId) return `Khong tim thay "${targetStr}"!`;
  if (targetId === player) return 'Khong the thach chinh minh!';

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Khong du xu! Ban co ${bal.xu} xu.`;
  const targetBal = economy.getBalance(targetId);
  if (targetBal.xu < bet) return `${economy.getDisplayName(targetId)} khong du ${bet} xu!`;

  economy.removeXu(player, bet);
  sessions.set(threadId, {
    type: gameType,
    challenger: { id: player, bet, choice },
    opponent: { id: targetId, bet },
    endTime: Date.now() + 60000,
  });

  const cName = economy.getDisplayName(player);
  const oName = economy.getDisplayName(targetId);
  return opts.formatChallenge(cName, oName, bet, choice, targetId);
}

// --- SHARED ACCEPT HANDLER ---
// Check opponent, verify balance, take xu, run game resolve, handle result.
function acceptGame(ctx, resolveFn, choiceArg) {
  const { player, economy, threadId, sessions } = ctx;
  const session = sessions.get(threadId);
  if (player !== session.opponent.id) return 'Ban khong phai nguoi duoc thach!';

  const bet = session.opponent.bet;
  const bal = economy.getBalance(player);
  if (bal.xu < bet) {
    economy.addXu(session.challenger.id, session.challenger.bet);
    sessions.delete(threadId);
    return `Khong du xu! Can ${bet} xu. Thach dau huy.`;
  }
  economy.removeXu(player, bet);
  session.opponent.bet = bet;

  return resolveFn({ player, economy, threadId, sessions, session, bet, choiceArg });
}

function resolveWinner(economy, sessions, threadId, session, winnerId, loserId) {
  const totalPot = session.challenger.bet + session.opponent.bet;
  const house = Math.floor(totalPot * HOUSE_CUT);
  const prize = totalPot - house;

  economy.addXu(winnerId, prize);
  economy.recordGame(winnerId, true);
  economy.recordGame(loserId, false);
  sessions.delete(threadId);

  return { prize, house, totalPot };
}

// =================================================================
// DUEL — Moi nguoi chia 1 la bai, ai lon hon thang 
// =================================================================

function duel(ctx, args) {
  if (!args) return '/duel @ten <xu>\nVD: /duel @Nguyen Duy 500';

  return challengeGame(ctx, args, 'duel',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(\d+)$/);
      if (!m) return null;
      return { targetStr: m[1].trim(), bet: parseInt(m[2]) };
    },
    {
      minBet: 50,
      formatChallenge: (cName, oName, bet) =>
        `⚔️ THACH DAU!\n${cName} thach ${oName} - ${bet} xu!\n\n${oName} go /accept de chap nhan\n/decline de tu choi\nTu dong huy sau 60s`,
    }
  );
}

function resolveDuel({ player, economy, threadId, sessions, session }) {
  const card1 = Math.floor(Math.random() * 13) + 1;
  const card2 = Math.floor(Math.random() * 13) + 1;
  let f1 = card1, f2 = card2;
  if (card1 === card2) { f1 += Math.random(); f2 += Math.random(); }

  const winnerId = f1 > f2 ? session.challenger.id : player;
  const loserId = f1 > f2 ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);
  const cardNames = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suits = ['♠️', '♥️', '♦️', '♣️'];

  let msg = '⚔️ KET QUA DUEL!\n\n';
  msg += `${cName}: ${cardNames[card1]}${suits[Math.floor(Math.random() * 4)]}\n`;
  msg += `${oName}: ${cardNames[card2]}${suits[Math.floor(Math.random() * 4)]}\n\n`;
  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// COINFLIP PvP — 50/50 sap/ngua
// =================================================================

function coinflip(ctx, args) {
  if (!args) return '/cf @ten <xu>\nVD: /cf @Nguyen Duy 200';

  return challengeGame(ctx, args, 'coinflip',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(\d+)$/);
      if (!m) return null;
      return { targetStr: m[1].trim(), bet: parseInt(m[2]) };
    },
    {
      formatChallenge: (cName, oName, bet) =>
        `🪙 COINFLIP!\n${cName} thach ${oName} - ${bet} xu!\n\n${oName} go /accept de chap nhan\n/decline de tu choi\nTu dong huy sau 60s`,
    }
  );
}

function resolveCoinflip({ player, economy, threadId, sessions, session }) {
  const isHeads = Math.random() < 0.5;
  const winnerId = isHeads ? session.challenger.id : player;
  const loserId = isHeads ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);

  let msg = `🪙 COINFLIP!\n\n`;
  msg += `${cName} vs ${oName}\n`;
  msg += `Ket qua: ${isHeads ? '🪙 SAP (Heads)' : '🪙 NGUA (Tails)'}\n\n`;
  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// TAI XIU PvP — challenger chon t/x, opponent tu dong doi lap
// =================================================================

function taixiuPvP(ctx, args) {
  return challengeGame(ctx, args, 'pvp_taixiu',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(t|x|tai|xiu|tài|xỉu)\s+(\d+)$/i);
      if (!m) return null;
      const aliases = { 't': 'tai', 'tai': 'tai', 'tài': 'tai', 'x': 'xiu', 'xiu': 'xiu', 'xỉu': 'xiu' };
      const choice = aliases[m[2].toLowerCase()];
      if (!choice) return null;
      return { targetStr: m[1].trim(), choice, bet: parseInt(m[3]) };
    },
    {
      formatChallenge: (cName, oName, bet, choice) => {
        const label = { tai: 'TAI', xiu: 'XIU' };
        return `🎲 TAI XIU PvP!\n${cName} dat ${label[choice]} - ${bet} xu!\n${oName} se la ${label[choice === 'tai' ? 'xiu' : 'tai']}\n\n${oName} go /accept de chap nhan\n/decline de tu choi`;
      },
    }
  );
}

function resolveTaixiu({ player, economy, threadId, sessions, session }) {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const d3 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2 + d3;
  const result = total >= 11 ? 'tai' : 'xiu';
  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const label = { tai: 'TAI', xiu: 'XIU' };

  const challengerChoice = session.challenger.choice;
  const opponentChoice = challengerChoice === 'tai' ? 'xiu' : 'tai';

  const winnerId = result === challengerChoice ? session.challenger.id : player;
  const loserId = result === challengerChoice ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);

  let msg = `🎲 TAI XIU PvP!\n\n`;
  msg += `${cName}: ${label[challengerChoice]} | ${oName}: ${label[opponentChoice]}\n`;
  msg += `${dice[d1 - 1]} ${dice[d2 - 1]} ${dice[d3 - 1]} = ${total} → ${label[result]}\n\n`;
  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// RPS PvP — Oan Tu Ti, doi thu accept voi lua chon
// =================================================================

const RPS_ALIASES = {
  'kéo': 'keo', 'keo': 'keo', 'k': 'keo', 'scissors': 'keo',
  'búa': 'bua', 'bua': 'bua', 'b': 'bua', 'rock': 'bua',
  'bao': 'bao', 'giấy': 'bao', 'giay': 'bao', 'paper': 'bao',
};

function rpsPvP(ctx, args) {
  return challengeGame(ctx, args, 'pvp_rps',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(k|b|bao|keo|kéo|bua|búa|giay|giấy|scissors|rock|paper)\s+(\d+)$/i);
      if (!m) return null;
      const choice = RPS_ALIASES[m[2].toLowerCase()];
      if (!choice) return null;
      return { targetStr: m[1].trim(), choice, bet: parseInt(m[3]) };
    },
    {
      formatChallenge: (cName, oName, bet) =>
        `✊ OAN TU TI PvP!\n${cName} thach ${oName} - ${bet} xu!\n\n${oName} go /accept <k/b/bao> de chap nhan\n/decline de tu choi`,
    }
  );
}

function resolveRps({ player, economy, threadId, sessions, session, choiceArg }) {
  const opponentChoice = RPS_ALIASES[(choiceArg || '').toLowerCase()];
  if (!opponentChoice) return 'Chon k/b/bao! VD: /accept k';

  const challengerChoice = session.challenger.choice;
  const emojis = { keo: '✌️', bua: '✊', bao: '✋' };
  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);

  let msg = `✊ OAN TU TI PvP!\n\n`;
  msg += `${cName}: ${emojis[challengerChoice]} vs ${oName}: ${emojis[opponentChoice]}\n\n`;

  if (challengerChoice === opponentChoice) {
    // Hoa - hoan xu
    economy.addXu(session.challenger.id, session.challenger.bet);
    economy.addXu(player, session.opponent.bet);
    sessions.delete(threadId);
    msg += '🤝 HOA! Hoan xu.';
    return msg;
  }

  const wins = { keo: 'bao', bua: 'keo', bao: 'bua' };
  const winnerId = wins[challengerChoice] === opponentChoice ? session.challenger.id : player;
  const loserId = winnerId === session.challenger.id ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// BAU CUA PvP — diem nao trung nhieu hon thang
// =================================================================

const BC_ALIASES = {
  'bầu': 'bau', 'bau': 'bau', 'cua': 'cua',
  'tôm': 'tom', 'tom': 'tom', 'cá': 'ca', 'ca': 'ca',
  'gà': 'ga', 'ga': 'ga', 'nai': 'nai', 'hươu': 'nai', 'huou': 'nai',
};
const BC_EMOJIS = { bau: '🍐', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐔', nai: '🦌' };

function baucuaPvP(ctx, args) {
  return challengeGame(ctx, args, 'pvp_baucua',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(bau|bầu|cua|tom|tôm|ca|cá|ga|gà|nai|hươu|huou)\s+(\d+)$/i);
      if (!m) return null;
      const choice = BC_ALIASES[m[2].toLowerCase()];
      if (!choice) return null;
      return { targetStr: m[1].trim(), choice, bet: parseInt(m[3]) };
    },
    {
      formatChallenge: (cName, oName, bet, choice) =>
        `🦀 BAU CUA PvP!\n${cName} chon ${BC_EMOJIS[choice]} ${choice} - ${bet} xu!\n\n${oName} go /accept <con> de chap nhan\nCon: bau/cua/tom/ca/ga/nai\n/decline de tu choi`,
    }
  );
}

function resolveBaucua({ player, economy, threadId, sessions, session, choiceArg }) {
  const opponentChoice = BC_ALIASES[(choiceArg || '').toLowerCase()];
  if (!opponentChoice) return 'Chon con! VD: /accept cua';

  const items = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
  const r = [0, 0, 0].map(() => items[Math.floor(Math.random() * 6)]);
  const challengerChoice = session.challenger.choice;
  const cMatch = r.filter(x => x === challengerChoice).length;
  const oMatch = r.filter(x => x === opponentChoice).length;

  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);

  let msg = `🦀 BAU CUA PvP!\n\n`;
  msg += `${cName}: ${BC_EMOJIS[challengerChoice]} | ${oName}: ${BC_EMOJIS[opponentChoice]}\n`;
  msg += `Ket qua: ${r.map(x => BC_EMOJIS[x]).join(' ')}\n`;
  msg += `${cName}: ${cMatch} trung | ${oName}: ${oMatch} trung\n\n`;

  if (cMatch === oMatch) {
    economy.addXu(session.challenger.id, session.challenger.bet);
    economy.addXu(player, session.opponent.bet);
    sessions.delete(threadId);
    msg += '🤝 HOA! Hoan xu.';
    return msg;
  }

  const winnerId = cMatch > oMatch ? session.challenger.id : player;
  const loserId = winnerId === session.challenger.id ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// SLOTS PvP — both spin, higher score wins
// =================================================================

function slotsPvP(ctx, args) {
  return challengeGame(ctx, args, 'pvp_slots',
    (a) => {
      const m = a.trim().match(/^@?(.+?)\s+(\d+)$/);
      if (!m) return null;
      return { targetStr: m[1].trim(), bet: parseInt(m[2]) };
    },
    {
      formatChallenge: (cName, oName, bet) =>
        `🎰 SLOTS PvP!\n${cName} thach ${oName} - ${bet} xu!\n\n${oName} go /accept de chap nhan\n/decline de tu choi`,
    }
  );
}

function resolveSlots({ player, economy, threadId, sessions, session }) {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔', '⭐'];
  const scores =  [1,    2,    3,    4,    8,    10,   5,    5];

  function spin() {
    const r = [0, 0, 0].map(() => {
      const i = Math.floor(Math.random() * symbols.length);
      return { symbol: symbols[i], score: scores[i], index: i };
    });
    let total = r.reduce((s, x) => s + x.score, 0);
    if (r[0].index === r[1].index && r[1].index === r[2].index) total += 20;
    else if (r[0].index === r[1].index || r[1].index === r[2].index || r[0].index === r[2].index) total += 5;
    return { reels: r.map(x => x.symbol), total };
  }

  const spin1 = spin();
  const spin2 = spin();

  const cName = economy.getDisplayName(session.challenger.id);
  const oName = economy.getDisplayName(player);

  let msg = `🎰 SLOTS PvP!\n\n`;
  msg += `${cName}: | ${spin1.reels.join(' | ')} | (${spin1.total} diem)\n`;
  msg += `${oName}: | ${spin2.reels.join(' | ')} | (${spin2.total} diem)\n\n`;

  if (spin1.total === spin2.total) {
    economy.addXu(session.challenger.id, session.challenger.bet);
    economy.addXu(player, session.opponent.bet);
    sessions.delete(threadId);
    msg += '🤝 HOA! Hoan xu.';
    return msg;
  }

  const winnerId = spin1.total > spin2.total ? session.challenger.id : player;
  const loserId = winnerId === session.challenger.id ? player : session.challenger.id;
  const { prize, house } = resolveWinner(economy, sessions, threadId, session, winnerId, loserId);

  msg += `🏆 ${economy.getDisplayName(winnerId)} thang ${prize} xu!\n`;
  msg += `Nha cai: ${house} xu (2%)`;
  return msg;
}

// =================================================================
// ROB — Cuop xu, logic rieng (khong dung challenge system)
// =================================================================

function rob(ctx, args) {
  const { player, economy } = ctx;
  if (!args) return '/rob @ten\nVD: /rob @Nguyen Duy';

  const targetStr = args.trim().replace(/^@/, '');
  const targetId = findTarget(economy, targetStr);
  if (!targetId) return `Khong tim thay "${targetStr}"!`;
  if (targetId === player) return 'Khong the cuop chinh minh!';

  const p = economy.getPlayer(player);
  const now = Date.now();
  if (p.lastRob && now - new Date(p.lastRob).getTime() < 5 * 60000) {
    const remain = Math.ceil((5 * 60000 - (now - new Date(p.lastRob).getTime())) / 1000);
    return `Doi ${remain}s nua moi cuop tiep duoc!`;
  }

  const targetBal = economy.getBalance(targetId);
  if (targetBal.xu < 100) return `${economy.getDisplayName(targetId)} qua ngheo, khong co gi de cuop!`;

  const myBal = economy.getBalance(player);
  if (myBal.xu < 50) return 'Ban can it nhat 50 xu de di cuop (phong bi bat)!';

  p.lastRob = new Date().toISOString();
  economy._save();

  const robberName = economy.getDisplayName(player);
  const victimName = economy.getDisplayName(targetId);

  if (Math.random() < 0.3) {
    const percent = 0.1 + Math.random() * 0.3;
    const stolen = Math.floor(targetBal.xu * percent);
    const amount = Math.max(stolen, 10);
    economy.removeXu(targetId, amount);
    economy.addXu(player, amount);
    return `🔫 ${robberName} cuop thanh cong!\nLay ${amount} xu tu ${victimName}!`;
  } else {
    const percent = 0.2 + Math.random() * 0.2;
    const fine = Math.floor(myBal.xu * percent);
    const amount = Math.max(fine, 30);
    economy.removeXu(player, amount);
    economy.addXu(targetId, Math.floor(amount * 0.5));
    return `🚔 ${robberName} bi bat!\nPhat ${amount} xu! ${victimName} duoc boi thuong ${Math.floor(amount * 0.5)} xu.`;
  }
}

// =================================================================
// UNIFIED ACCEPT / DECLINE
// =================================================================

const PVP_TYPES = ['duel', 'coinflip', 'pvp_taixiu', 'pvp_rps', 'pvp_baucua', 'pvp_slots'];

const RESOLVERS = {
  duel: resolveDuel,
  coinflip: resolveCoinflip,
  pvp_taixiu: resolveTaixiu,
  pvp_rps: resolveRps,
  pvp_baucua: resolveBaucua,
  pvp_slots: resolveSlots,
};

function accept(ctx, choiceArg) {
  const { threadId, sessions } = ctx;
  const session = sessions.get(threadId);
  if (!session || !PVP_TYPES.includes(session.type)) return 'Khong co thach dau nao!';

  const resolver = RESOLVERS[session.type];
  return acceptGame(ctx, resolver, choiceArg);
}

function decline(ctx) {
  const { player, economy, threadId, sessions } = ctx;
  const session = sessions.get(threadId);
  if (!session || !PVP_TYPES.includes(session.type)) return 'Khong co thach dau nao!';

  if (player !== session.opponent.id && player !== session.challenger.id) {
    return 'Ban khong lien quan!';
  }

  economy.addXu(session.challenger.id, session.challenger.bet);
  sessions.delete(threadId);

  const labels = {
    duel: '⚔️ Thach dau', coinflip: '🪙 Coinflip',
    pvp_taixiu: '🎲 Tai xiu PvP', pvp_rps: '✊ Oan tu ti PvP',
    pvp_baucua: '🦀 Bau cua PvP', pvp_slots: '🎰 Slots PvP',
  };
  return `${labels[session.type] || 'Thach dau'} huy! Hoan xu.`;
}

// ========== CHECK @ TRONG ARGS ==========

function hasTarget(args) {
  if (!args) return false;
  return args.trim().startsWith('@') || /^.+?\s+(t|x|tai|xiu|k|b|bao|bau|cua|tom|ca|ga|nai)\s+\d+$/i.test(args.trim());
}

module.exports = {
  duel, coinflip, rob,
  taixiuPvP, rpsPvP, baucuaPvP, slotsPvP,
  accept, decline, hasTarget,
};

// Xo so - nhieu nguoi choi, 1 nguoi thang

function start(ctx, args) {
  const { player, economy, threadId, sessions } = ctx;

  // /xoso end - ket thuc som
  if (args && args.toLowerCase() === 'end') {
    return end(ctx);
  }

  const bet = parseInt(args) || 100;
  if (bet < 10) return 'Cuoc toi thieu 10 xu!';

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Khong du xu! Ban co ${bal.xu} xu.`;

  const existing = sessions.get(threadId);

  // Tham gia xo so dang chay
  if (existing && existing.type === 'lottery') {
    if (existing.players.some(p => p.id === player)) {
      return 'Ban da tham gia roi!';
    }
    economy.removeXu(player, bet);
    existing.players.push({ id: player, bet });
    existing.pot += bet;
    const timeLeft = Math.ceil((existing.endTime - Date.now()) / 1000);
    const name = economy.getDisplayName(player);
    return `🎰 ${name} tham gia xo so!\nCuoc: ${bet} xu | Pot: ${existing.pot} xu\nNguoi choi: ${existing.players.length}\nCon ${timeLeft}s`;
  }

  // Bat dau xo so moi
  economy.removeXu(player, bet);
  sessions.set(threadId, {
    type: 'lottery',
    players: [{ id: player, bet }],
    pot: bet,
    starter: player,
    startTime: Date.now(),
    endTime: Date.now() + 60000,
  });

  const name = economy.getDisplayName(player);
  return `🎰 XO SO BAT DAU!\n${name} dat ${bet} xu\n\nGo /xoso <xu> de tham gia!\nTu dong ket thuc sau 60s\n/xoso end de ket thuc som`;
}

function end(ctx) {
  const { player, threadId, sessions, economy } = ctx;
  const session = sessions.get(threadId);
  if (!session || session.type !== 'lottery') return 'Khong co xo so nao!';

  // Chi starter moi duoc end som
  if (player && session.starter !== player) {
    return 'Chi nguoi bat dau moi ket thuc duoc!';
  }

  return resolve(session, threadId, sessions, economy);
}

function resolve(session, threadId, sessions, economy) {
  // Can it nhat 2 nguoi
  if (session.players.length < 2) {
    const p = session.players[0];
    economy.addXu(p.id, p.bet);
    sessions.delete(threadId);
    return '🎰 Xo so huy - can it nhat 2 nguoi!\nDa hoan xu.';
  }

  // Chon nguoi thang ngau nhien
  let randomTicket = Math.floor(Math.random() * session.pot);
  let currentSum = 0;
  let winner = session.players[0]; // Mặc định đề phòng lỗi

  for (const p of session.players) {
    currentSum += p.bet;
    if (randomTicket < currentSum) {
      winner = p;
      break;
    }
  }
  const house = Math.floor( session.pot * 0.02 );
  const prize = session.pot - house;

  economy.addXu(winner.id, prize);
  economy.recordGame(winner.id, true);

  for (const p of session.players) {
    if (p.id !== winner.id) economy.recordGame(p.id, false);
  }

  sessions.delete(threadId);

  let msg = '🎰 KET QUA XO SO!\n';
  msg += `Nguoi choi: ${session.players.length}\n`;
  msg += `Pot: ${session.pot} xu\n`;
  msg += `Nha cai: ${house} xu (2%)\n`;
  msg += `🏆 ${economy.getDisplayName(winner.id)} thang ${prize} xu!\n\n`;
  for (const p of session.players) {
    const mark = p.id === winner.id ? '🏆' : '💀';
    msg += `${mark} ${economy.getDisplayName(p.id)}: ${p.bet} xu\n`;
  }
  return msg;
}

function checkExpired(session, threadId, games) {
  if (!session || session.type !== 'lottery') return null;
  if (Date.now() < session.endTime) return null;
  return resolve(session, threadId, games.sessions, games.economy);
}

module.exports = { start, end, checkExpired };

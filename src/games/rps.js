// Oan tu ti - co cuoc xu

function play(ctx, args) {
  const { player, economy } = ctx;
  const parts = args.trim().split(/\s+/);
  const choice = parts[0];
  const bet = parseInt(parts[1]) || 0;

  const aliases = {
    'kéo': 'keo', 'keo': 'keo', 'k': 'keo', 'scissors': 'keo',
    'búa': 'bua', 'bua': 'bua', 'b': 'bua', 'rock': 'bua',
    'bao': 'bao', 'giấy': 'bao', 'giay': 'bao', 'paper': 'bao',
  };

  const pick = aliases[choice?.toLowerCase()];
  if (!pick) return 'Cu phap: /rps <keo|bua|bao> [xu cuoc]\nVD: /rps keo 200';

  if (bet > 0) {
    const bal = economy.getBalance(player);
    if (bal.xu < bet) return `Ban chi co ${bal.xu} xu!`;
    economy.removeXu(player, bet);
  }

  const choices = ['keo', 'bua', 'bao'];
  const botPick = choices[Math.floor(Math.random() * 3)];
  const emojis = { keo: '✌️', bua: '✊', bao: '✋' };

  let msg = `${emojis[botPick]} vs ${emojis[pick]}`;
  if (bet > 0) msg += ` (cuoc: ${bet} xu)`;
  msg += '\n';

  if (pick === botPick) {
    if (bet > 0) economy.addXu(player, bet); // Tra lai
    msg += '🤝 HOA!';
  } else {
    const wins = { keo: 'bao', bua: 'keo', bao: 'bua' };
    if (wins[pick] === botPick) {
      const win = bet > 0 ? bet * 2 : 0;
      if (win > 0) economy.addXu(player, win);
      economy.recordGame(player, true);
      msg += `🎉 BAN THANG!${win > 0 ? ` +${win} xu` : ''}`;
    } else {
      economy.recordGame(player, false);
      msg += `😈 BOT THANG!${bet > 0 ? ` -${bet} xu` : ''}`;
    }
  }

  return msg;
}

module.exports = { play };

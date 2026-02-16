// Bau Cua Tom Ca - co cuoc xu

const items = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
const emojis = { bau: '🍐', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐔', nai: '🦌' };
const aliases = {
  'bầu': 'bau', 'bau': 'bau', 'cua': 'cua',
  'tôm': 'tom', 'tom': 'tom', 'cá': 'ca', 'ca': 'ca',
  'gà': 'ga', 'ga': 'ga', 'nai': 'nai', 'hươu': 'nai', 'huou': 'nai',
};

function play(ctx, args) {
  const { player, economy } = ctx;
  const parts = args.trim().split(/\s+/);
  const pick = aliases[parts[0]?.toLowerCase()];
  const bet = parseInt(parts[1]) || 100;

  if (!pick) return `Cu phap: /baucua <con> [xu]\n${items.map(i => `${emojis[i]} ${i}`).join(' | ')}`;

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Ban chi co ${bal.xu} xu!`;

  economy.removeXu(player, bet);

  const r = [0, 0, 0].map(() => items[Math.floor(Math.random() * 6)]);
  const matches = r.filter(x => x === pick).length;

  let msg = `🎰 BAU CUA! Cuoc: ${bet} xu (${emojis[pick]})\n`;
  msg += `${r.map(x => emojis[x]).join(' ')}\n\n`;

  if (matches === 0) {
    economy.recordGame(player, false);
    msg += `💀 Khong trung! -${bet} xu`;
  } else {
    const win = bet * (matches + 1);
    economy.addXu(player, win);
    economy.recordGame(player, true);
    msg += `🎉 Trung ${matches} mat! +${win} xu`;
  }

  return msg;
}

module.exports = { play };

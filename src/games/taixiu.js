// Tài Xỉu - có cược xu

function play(ctx, args) {
  const { player, economy } = ctx;
  const parts = args.trim().split(/\s+/);
  const choice = parts[0];
  const bet = parseInt(parts[1]) || 100;

  const aliases = { 'tai': 'tai', 'tài': 'tai', 't': 'tai', 'xiu': 'xiu', 'xỉu': 'xiu', 'x': 'xiu' };
  const pick = aliases[choice?.toLowerCase()];
  if (!pick) return 'Cú pháp: /taixiu <tài|xỉu> [số xu]\nVD: /taixiu tài 500';

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Bạn chỉ có ${bal.xu} xu! Cần ${bet} xu.`;

  economy.removeXu(player, bet);

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const d3 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2 + d3;
  const result = total >= 11 ? 'tai' : 'xiu';
  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const label = { tai: 'TÀI', xiu: 'XỈU' };

  let msg = `🎲 TÀI XỈU! Cược: ${bet} xu (${label[pick]})\n`;
  msg += `${dice[d1 - 1]} ${dice[d2 - 1]} ${dice[d3 - 1]} = ${total} → ${label[result]}\n\n`;

  if (pick === result) {
    const win = bet * 2;
    economy.addXu(player, win);
    economy.recordGame(player, true);
    msg += `🎉 THẮNG! +${win} xu`;
  } else {
    economy.recordGame(player, false);
    msg += `💀 THUA! -${bet} xu`;
  }

  return msg;
}

module.exports = { play };

// Slot machine - co cuoc xu

function play(ctx, betStr) {
  const { player, economy } = ctx;
  const bet = parseInt(betStr) || 100;

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Ban chi co ${bal.xu} xu!`;

  economy.removeXu(player, bet);

  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔', '⭐'];
  const weights = [20, 18, 16, 14, 5, 3, 12, 12]; // 7 va kim cuong hiem
  const total = weights.reduce((a, b) => a + b, 0);

  function spin() {
    let r = Math.floor(Math.random() * total);
    for (let i = 0; i < symbols.length; i++) {
      r -= weights[i];
      if (r < 0) return { symbol: symbols[i], index: i };
    }
    return { symbol: symbols[0], index: 0 };
  }

  const r1 = spin(), r2 = spin(), r3 = spin();
  let msg = `🎰 SLOTS! Cuoc: ${bet} xu\n| ${r1.symbol} | ${r2.symbol} | ${r3.symbol} |\n\n`;

  const allSame = r1.index === r2.index && r2.index === r3.index;
  const hasPair = r1.index === r2.index || r2.index === r3.index || r1.index === r3.index;

  if (allSame) {
    let multi = 5;
    if (r1.symbol === '7️⃣') multi = 50;
    else if (r1.symbol === '💎') multi = 30;
    else if (r1.symbol === '⭐') multi = 10;

    const win = bet * multi;
    economy.addXu(player, win);
    economy.recordGame(player, true);

    if (r1.symbol === '7️⃣') msg += `🔥 MEGA JACKPOT 777!!! +${win} xu`;
    else if (r1.symbol === '💎') msg += `💎 JACKPOT!!! +${win} xu`;
    else msg += `🎉 BA ${r1.symbol}! x${multi}! +${win} xu`;
  } else if (hasPair) {
    const win = Math.floor(bet * 1.5);
    economy.addXu(player, win);
    economy.recordGame(player, true);
    msg += `🎉 Trung doi! +${win} xu`;
  } else {
    economy.recordGame(player, false);
    msg += `💨 Thua! -${bet} xu`;
  }

  return msg;
}

module.exports = { play };

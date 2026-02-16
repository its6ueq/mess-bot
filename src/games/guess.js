// Doan so 1-100

function start(ctx) {
  const { threadId, player, economy, sessions } = ctx;
  const number = Math.floor(Math.random() * 100) + 1;
  sessions.set(threadId, { type: 'guess', number, attempts: 0, max: 7, player });
  return '🎯 DOAN SO!\nSo tu 1 den 100. Ban co 7 luot.\nNhap so di!';
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const guess = parseInt(text);
  if (isNaN(guess)) return 'Nhap 1 con so!';

  session.attempts++;

  if (guess === session.number) {
    const reward = (session.max - session.attempts + 1) * 50;
    economy.addXu(session.player, reward);
    economy.recordGame(session.player, true);
    endGame();
    return `🎉 DUNG! So la ${session.number}.\n${session.attempts} lan doan. +${reward} xu`;
  }

  if (session.attempts >= session.max) {
    economy.recordGame(session.player, false);
    endGame();
    return `💀 Het luot! Dap an: ${session.number}`;
  }

  const left = session.max - session.attempts;
  return guess < session.number
    ? `⬆️ CAO HON! (${left} luot)`
    : `⬇️ THAP HON! (${left} luot)`;
}

module.exports = { start, handleInput };

// Tinh nhanh - co thuong xu

function start(ctx) {
  const { threadId, player, sessions } = ctx;
  const ops = ['+', '-', 'x'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  if (op === '+') { a = 10 + Math.floor(Math.random() * 90); b = 10 + Math.floor(Math.random() * 90); answer = a + b; }
  else if (op === '-') { a = 50 + Math.floor(Math.random() * 50); b = 1 + Math.floor(Math.random() * 49); answer = a - b; }
  else { a = 2 + Math.floor(Math.random() * 18); b = 2 + Math.floor(Math.random() * 18); answer = a * b; }

  sessions.set(threadId, { type: 'math', answer, attempts: 0, max: 3, player, startTime: Date.now() });
  return `🧮 TINH NHANH!\n${a} ${op} ${b} = ?\n3 lan thu!`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const guess = parseInt(text);
  if (isNaN(guess)) return 'Nhap so!';

  session.attempts++;

  if (guess === session.answer) {
    const time = ((Date.now() - session.startTime) / 1000).toFixed(1);
    const reward = Math.max(30, 100 - Math.floor(parseFloat(time) * 5));
    economy.addXu(session.player, reward);
    economy.recordGame(session.player, true);
    endGame();
    return `🎉 DUNG! ${session.answer}. ${time}s. +${reward} xu`;
  }

  if (session.attempts >= session.max) {
    economy.recordGame(session.player, false);
    endGame();
    return `💀 Het luot! Dap an: ${session.answer}`;
  }

  return `❌ Sai! Con ${session.max - session.attempts} luot.`;
}

module.exports = { start, handleInput };

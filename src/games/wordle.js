// Wordle - doan tu 5 chu cai

const WORDS = [
  'HELLO', 'WORLD', 'CANDY', 'DREAM', 'FLAME', 'GHOST', 'HOUSE', 'JUICE',
  'KNIFE', 'LEMON', 'MANGO', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER',
  'SNAKE', 'TIGER', 'UNITY', 'VIDEO', 'WATER', 'YOUTH', 'ZEBRA', 'ANGEL',
  'BEACH', 'CHAIR', 'DANCE', 'EAGLE', 'FORCE', 'GRAPE', 'HEART', 'IMAGE',
  'MAGIC', 'NOBLE', 'OLIVE', 'PEARL', 'RADAR', 'SOLAR', 'TOWER', 'VOICE',
  'BRUSH', 'CLOUD', 'DRIVE', 'EXTRA', 'FLASH', 'GREEN', 'HAPPY', 'IVORY',
  'JOLLY', 'KNOCK', 'LIGHT', 'MONEY', 'NOTED', 'OUTER', 'POWER', 'QUICK',
  'ROYAL', 'SMART', 'TOTAL', 'UPPER', 'VITAL', 'WINDY', 'FUNNY', 'CRAZY',
  'BRAVE', 'CLEAN', 'FRUIT', 'GLASS', 'HONEY', 'LUCKY', 'METAL', 'PLANT',
  'ROUND', 'SHARP', 'STONE', 'TRAIN', 'URBAN', 'WHEEL', 'AVOID', 'BLACK',
];

function start(ctx) {
  const { threadId, player, sessions } = ctx;
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  sessions.set(threadId, {
    type: 'wordle',
    word,
    attempts: [],
    maxAttempts: 6,
    player,
  });

  return `📝 WORDLE!\nDoan tu 5 chu cai (tieng Anh).\nBan co 6 luot.\n🟩 = dung vi tri | 🟨 = co nhung sai cho | ⬛ = khong co\n\nNhap tu 5 chu di!`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const guess = text.toUpperCase().trim();

  if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) {
    return 'Nhap dung 5 chu cai tieng Anh!';
  }

  const result = checkWord(session.word, guess);
  session.attempts.push({ guess, result });

  // Hien thi tat ca cac luot doan
  let board = '📝 WORDLE:\n';
  for (const attempt of session.attempts) {
    board += attempt.result + ' ' + attempt.guess + '\n';
  }

  if (guess === session.word) {
    const reward = (session.maxAttempts - session.attempts.length + 1) * 100;
    economy.addXu(session.player, reward);
    economy.recordGame(session.player, true);
    endGame();
    return `${board}\n🎉 DUNG ROI! Tu la: ${session.word}\n${session.attempts.length}/${session.maxAttempts} luot. +${reward} xu`;
  }

  if (session.attempts.length >= session.maxAttempts) {
    economy.recordGame(session.player, false);
    endGame();
    return `${board}\n💀 Het luot! Tu dung la: ${session.word}`;
  }

  const left = session.maxAttempts - session.attempts.length;
  return `${board}\nCon ${left} luot.`;
}

function checkWord(answer, guess) {
  const result = ['⬛', '⬛', '⬛', '⬛', '⬛'];
  const ansArr = answer.split('');
  const used = [false, false, false, false, false];

  // Pass 1: tim dung vi tri (xanh la)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === ansArr[i]) {
      result[i] = '🟩';
      used[i] = true;
    }
  }

  // Pass 2: tim co nhung sai vi tri (vang)
  for (let i = 0; i < 5; i++) {
    if (result[i] === '🟩') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === ansArr[j]) {
        result[i] = '🟨';
        used[j] = true;
        break;
      }
    }
  }

  return result.join('');
}

module.exports = { start, handleInput };

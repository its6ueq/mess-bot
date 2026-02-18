// Wordle - đoán từ 5 chữ cái

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

  return `📝 WORDLE!\nĐoán từ 5 chữ cái (tiếng Anh).\nBạn có 6 lượt.\n🟩 = đúng vị trí | 🟨 = có nhưng sai chỗ | ⬛ = không có\n\nNhập từ 5 chữ đi!`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const guess = text.toUpperCase().trim();

  if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) {
    return 'Nhập đúng 5 chữ cái tiếng Anh!';
  }

  const result = checkWord(session.word, guess);
  session.attempts.push({ guess, result });

  let board = '📝 WORDLE:\n';
  for (const attempt of session.attempts) {
    board += attempt.result + ' ' + attempt.guess + '\n';
  }

  if (guess === session.word) {
    const reward = (session.maxAttempts - session.attempts.length + 1) * 100;
    economy.addXu(session.player, reward);
    economy.recordGame(session.player, true);
    endGame();
    return `${board}\n🎉 ĐÚNG RỒI! Từ là: ${session.word}\n${session.attempts.length}/${session.maxAttempts} lượt. +${reward} xu`;
  }

  if (session.attempts.length >= session.maxAttempts) {
    economy.recordGame(session.player, false);
    endGame();
    return `${board}\n💀 Hết lượt! Từ đúng là: ${session.word}`;
  }

  const left = session.maxAttempts - session.attempts.length;
  return `${board}\nCòn ${left} lượt.`;
}

function checkWord(answer, guess) {
  const result = ['⬛', '⬛', '⬛', '⬛', '⬛'];
  const ansArr = answer.split('');
  const used = [false, false, false, false, false];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === ansArr[i]) {
      result[i] = '🟩';
      used[i] = true;
    }
  }

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

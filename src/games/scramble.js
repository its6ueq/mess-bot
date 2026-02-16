// Do tu - xao tron chu cai

const WORDS = [
  { word: 'VIETNAM', hint: 'Quoc gia DNA' }, { word: 'FACEBOOK', hint: 'Mang xa hoi' },
  { word: 'COMPUTER', hint: 'Thiet bi dien tu' }, { word: 'GUITAR', hint: 'Nhac cu' },
  { word: 'BANANA', hint: 'Trai cay vang' }, { word: 'DRAGON', hint: 'Sinh vat huyen thoai' },
  { word: 'PYTHON', hint: 'Ngon ngu lap trinh' }, { word: 'COFFEE', hint: 'Thuc uong sang' },
  { word: 'CAMERA', hint: 'Chup anh' }, { word: 'SCHOOL', hint: 'Noi hoc tap' },
  { word: 'CHICKEN', hint: 'Gia cam' }, { word: 'MOBILE', hint: 'Dien thoai' },
  { word: 'ORANGE', hint: 'Trai cay + mau sac' }, { word: 'BOTTLE', hint: 'Dung nuoc' },
  { word: 'ISLAND', hint: 'Dat giua bien' }, { word: 'ROCKET', hint: 'Bay vao vu tru' },
];

function start(ctx) {
  const { threadId, player, sessions } = ctx;
  const item = WORDS[Math.floor(Math.random() * WORDS.length)];
  const scrambled = item.word.split('').sort(() => Math.random() - 0.5).join('');

  sessions.set(threadId, { type: 'scramble', word: item.word, hint: item.hint, attempts: 0, max: 5, player });
  return `🔤 DO TU!\nChu bi xao: ${scrambled}\nGoi y: ${item.hint}\n5 lan thu!`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  session.attempts++;

  if (text.toUpperCase().trim() === session.word) {
    const reward = (session.max - session.attempts + 1) * 50;
    economy.addXu(session.player, reward);
    economy.recordGame(session.player, true);
    endGame();
    return `🎉 DUNG! ${session.word}. +${reward} xu`;
  }

  if (session.attempts >= session.max) {
    economy.recordGame(session.player, false);
    endGame();
    return `💀 Het luot! Tu dung: ${session.word}`;
  }

  return `❌ Sai! Con ${session.max - session.attempts} luot. Goi y: ${session.hint}`;
}

module.exports = { start, handleInput };

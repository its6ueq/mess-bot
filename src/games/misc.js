// Cac game nho khong can session: 8ball, trivia, lucky, d20, flip, truthdare, emoji quiz, diem danh

function eightBall(question) {
  if (!question) return '🎱 Hoi 1 cau! VD: /8ball toi co giau khong?';
  const ans = [
    '🟢 Chac chan!', '🟢 Tuyet doi!', '🟢 Co the lam!', '🟢 Tin toi!',
    '🟡 Co le...', '🟡 Chua chac...', '🟡 Hoi lai sau!', '🟡 Kho noi...',
    '🔴 Khong!', '🔴 Khong co kha nang!', '🔴 Dung mo!', '🔴 0%!',
  ];
  return `🎱 "${question}"\n${ans[Math.floor(Math.random() * ans.length)]}`;
}

function lucky() {
  const n = Math.floor(Math.random() * 100) + 1;
  let msg = `🍀 So may man: ${n}\n`;
  if (n >= 90) msg += '🌟 SIEU MAY MAN!';
  else if (n >= 70) msg += '😊 May man!';
  else if (n >= 50) msg += '😐 Binh thuong!';
  else if (n >= 30) msg += '😅 Hoi xui!';
  else msg += '💀 Om roi...';
  return msg;
}

function rollD20() {
  const r = Math.floor(Math.random() * 20) + 1;
  let msg = `🎯 D20: ${r}`;
  if (r === 20) msg += ' - CRITICAL HIT! 💥';
  if (r === 1) msg += ' - CRITICAL FAIL! 💀';
  return msg;
}

function flip() {
  return Math.random() < 0.5 ? '🪙 SAP! (Heads)' : '🪙 NGUA! (Tails)';
}

function dice(input) {
  let count = 1, sides = 6;
  if (input) {
    const m = input.match(/^(\d+)?d?(\d+)?$/i);
    if (m) { if (m[1]) count = Math.min(parseInt(m[1]), 10); if (m[2]) sides = Math.min(parseInt(m[2]), 100); }
  }
  const results = [];
  for (let i = 0; i < count; i++) results.push(Math.floor(Math.random() * sides) + 1);
  const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  let display = results.map(r => sides === 6 ? (de[r - 1] || r) : `[${r}]`).join(' ');
  if (count > 1) display += `\nTong: ${results.reduce((a, b) => a + b, 0)}`;
  return `🎲 ${display}`;
}

function truthOrDare(choice) {
  const truths = [
    'Crush hien tai la ai?', 'Dieu xau ho nhat ban tung lam?',
    'Lan cuoi khoc la khi nao?', 'Bi mat chua ke cho ai?',
    'Ban co hay stalking ai tren FB?', 'Crush dau tien la ai?',
    'Dieu ban so nhat?', 'Ban da tung noi doi ban than?',
    'Mon an ghet nhat?', 'Dieu hoi han nhat?',
  ];
  const dares = [
    'Gui "Yeu ban" cho nguoi thu 3 trong danh ba!',
    'Selfie bay gio gui vao day!', 'Hat 1 bai va gui voice!',
    'Doi avatar thanh anh xau trong 1 gio!',
    'Gui sticker cho 5 nguoi lien tuc!',
    'Dang 1 status xau ho!', 'Gui "Em nho anh" cho nguoi cuoi cung nhan tin!',
  ];
  if (!choice) return 'Chon: truth (t) hoac dare (d)';
  const c = choice.toLowerCase();
  if (c === 'truth' || c === 't') return `🤔 SU THAT:\n${truths[Math.floor(Math.random() * truths.length)]}`;
  if (c === 'dare' || c === 'd') return `😈 THACH THUC:\n${dares[Math.floor(Math.random() * dares.length)]}`;
  return 'Chon: truth (t) hoac dare (d)';
}

function emojiQuiz() {
  const qs = [
    { e: '🦁👑', a: 'Vua su tu' }, { e: '🕷️🧑', a: 'Nguoi nhen' },
    { e: '❄️👸', a: 'Frozen' }, { e: '🧙‍♂️💍', a: 'Chua te nhan' },
    { e: '🦇🧑‍✈️', a: 'Batman' }, { e: '🚢💔', a: 'Titanic' },
    { e: '🌊🐠', a: 'Finding Nemo' }, { e: '🐀👨‍🍳', a: 'Ratatouille' },
    { e: '⚡🧙', a: 'Harry Potter' }, { e: '🤖❤️🌱', a: 'Wall-E' },
    { e: '🏴‍☠️⚓', a: 'Cuop bien Caribe' }, { e: '🦈🌊', a: 'Jaws' },
  ];
  const item = qs[Math.floor(Math.random() * qs.length)];
  return `🎬 DOAN PHIM:\n${item.e}\n\n💡 ${item.a}`;
}

function cardBattle() {
  const vals = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits = ['♠', '♥', '♦', '♣'];
  const pV = Math.floor(Math.random() * 13);
  const bV = Math.floor(Math.random() * 13);
  const pC = vals[pV] + suits[Math.floor(Math.random() * 4)];
  const bC = vals[bV] + suits[Math.floor(Math.random() * 4)];
  let msg = `🃏 SO BAI!\nBan: ${pC}\nBot: ${bC}\n\n`;
  if (pV > bV) msg += '🎉 BAN THANG!';
  else if (pV < bV) msg += '😈 BOT THANG!';
  else msg += '🤝 HOA!';
  return msg;
}

// Diem danh hang ngay
function checkin(economy, player) {
  const p = economy.getPlayer(player);
  const now = new Date();

  if (!p.checkinStreak) p.checkinStreak = 0;
  if (!p.lastCheckin) p.lastCheckin = null;

  if (p.lastCheckin) {
    const last = new Date(p.lastCheckin);
    if (now.toDateString() === last.toDateString()) {
      return `⏰ Ban da diem danh hom nay roi! (streak: ${p.checkinStreak} ngay)`;
    }
    // Check streak
    const diff = (now - last) / (1000 * 60 * 60 * 24);
    if (diff <= 2) {
      p.checkinStreak++;
    } else {
      p.checkinStreak = 1;
    }
  } else {
    p.checkinStreak = 1;
  }

  const base = 200;
  const bonus = Math.min(p.checkinStreak * 50, 500); // Max bonus 500
  const reward = base + bonus;

  p.xu += reward;
  p.totalEarned += reward;
  p.lastCheckin = now.toISOString();
  economy._save();

  let msg = `📋 DIEM DANH!\n`;
  msg += `🔥 Streak: ${p.checkinStreak} ngay lien tuc\n`;
  msg += `+${base} xu (co ban) +${bonus} xu (streak)\n`;
  msg += `= +${reward} xu!\nVi: ${p.xu} xu`;
  return msg;
}

module.exports = {
  eightBall, lucky, rollD20, flip, dice,
  truthOrDare, emojiQuiz, cardBattle, checkin,
};

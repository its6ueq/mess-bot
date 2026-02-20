// Các game nhỏ không cần session

function eightBall(question) {
  if (!question) return '🎱 Hỏi 1 câu! VD: /8ball tôi có giàu không?';
  const ans = [
    '🟢 Chắc chắn!', '🟢 Tuyệt đối!', '🟢 Có thể làm được!', '🟢 Tin tôi đi!',
    '🟡 Có lẽ...', '🟡 Chưa chắc...', '🟡 Hỏi lại sau!', '🟡 Khó nói...',
    '🔴 Không!', '🔴 Không có khả năng!', '🔴 Đừng mơ!', '🔴 0%!',
  ];
  return `🎱 "${question}"\n${ans[Math.floor(Math.random() * ans.length)]}`;
}

function lucky() {
  const n = Math.floor(Math.random() * 100) + 1;
  let msg = `🍀 Số may mắn: ${n}\n`;
  if (n >= 90) msg += '🌟 SIÊU MAY MẮN!';
  else if (n >= 70) msg += '😊 May mắn!';
  else if (n >= 50) msg += '😐 Bình thường!';
  else if (n >= 30) msg += '😅 Hơi xui!';
  else msg += '💀 Ôm rồi...';
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
  return Math.random() < 0.5 ? '🪙 SẤP! (Heads)' : '🪙 NGỬA! (Tails)';
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
  if (count > 1) display += `\nTổng: ${results.reduce((a, b) => a + b, 0)}`;
  return `🎲 ${display}`;
}

function truthOrDare(choice) {
  const truths = [
    'Crush hiện tại là ai?', 'Điều xấu hổ nhất bạn từng làm?',
    'Lần cuối khóc là khi nào?', 'Bí mật chưa kể cho ai?',
    'Bạn có hay stalking ai trên FB?', 'Crush đầu tiên là ai?',
    'Điều bạn sợ nhất?', 'Bạn đã từng nói dối bạn thân?',
    'Món ăn ghét nhất?', 'Điều hối hận nhất?',
  ];
  const dares = [
    'Gửi "Yêu bạn" cho người thứ 3 trong danh bạ!',
    'Selfie bây giờ gửi vào đây!', 'Hát 1 bài và gửi voice!',
    'Đổi avatar thành ảnh xấu trong 1 giờ!',
    'Gửi sticker cho 5 người liên tục!',
    'Đăng 1 status xấu hổ!', 'Gửi "Em nhớ anh" cho người cuối cùng nhắn tin!',
  ];
  if (!choice) return 'Chọn: truth (t) hoặc dare (d)';
  const c = choice.toLowerCase();
  if (c === 'truth' || c === 't') return `🤔 SỰ THẬT:\n${truths[Math.floor(Math.random() * truths.length)]}`;
  if (c === 'dare' || c === 'd') return `😈 THÁCH THỨC:\n${dares[Math.floor(Math.random() * dares.length)]}`;
  return 'Chọn: truth (t) hoặc dare (d)';
}

function emojiQuiz() {
  const qs = [
    { e: '🦁👑', a: 'Vua sư tử' }, { e: '🕷️🧑', a: 'Người nhện' },
    { e: '❄️👸', a: 'Frozen' }, { e: '🧙‍♂️💍', a: 'Chúa tể nhẫn' },
    { e: '🦇🧑‍✈️', a: 'Batman' }, { e: '🚢💔', a: 'Titanic' },
    { e: '🌊🐠', a: 'Finding Nemo' }, { e: '🐀👨‍🍳', a: 'Ratatouille' },
    { e: '⚡🧙', a: 'Harry Potter' }, { e: '🤖❤️🌱', a: 'Wall-E' },
    { e: '🏴‍☠️⚓', a: 'Cướp biển Caribe' }, { e: '🦈🌊', a: 'Jaws' },
  ];
  const item = qs[Math.floor(Math.random() * qs.length)];
  return `🎬 ĐOÁN PHIM:\n${item.e}\n\n💡 ${item.a}`;
}

function cardBattle() {
  const vals = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits = ['♠', '♥', '♦', '♣'];
  const pV = Math.floor(Math.random() * 13);
  const bV = Math.floor(Math.random() * 13);
  const pC = vals[pV] + suits[Math.floor(Math.random() * 4)];
  const bC = vals[bV] + suits[Math.floor(Math.random() * 4)];
  let msg = `🃏 SO BÀI!\nBạn: ${pC}\nBot: ${bC}\n\n`;
  if (pV > bV) msg += '🎉 BẠN THẮNG!';
  else if (pV < bV) msg += '😈 BOT THẮNG!';
  else msg += '🤝 HÒA!';
  return msg;
}

// Điểm danh hàng ngày (có chance rương)
function checkin(economy, player) {
  const p = economy.getPlayer(player);
  const now = new Date();

  if (!p.checkinStreak) p.checkinStreak = 0;
  if (!p.lastCheckin) p.lastCheckin = null;
  if (!p.lootBoxes) p.lootBoxes = {};

  if (p.lastCheckin) {
    const last = new Date(p.lastCheckin);
    if (now.toDateString() === last.toDateString()) {
      return `⏰ Bạn đã điểm danh hôm nay rồi! (streak: ${p.checkinStreak} ngày)`;
    }
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
  const bonus = Math.min(p.checkinStreak * 50, 500);
  const reward = base + bonus;

  p.xu += reward;
  p.totalEarned += reward;
  p.lastCheckin = now.toISOString();

  let msg = `📋 ĐIỂM DANH!\n`;
  msg += `🔥 Streak: ${p.checkinStreak} ngày liên tục\n`;
  msg += `+${base} xu (cơ bản) +${bonus} xu (streak)\n`;
  msg += `= +${reward} xu!\nVí: ${p.xu} xu`;

  // 15% chance nhận rương
  if (Math.random() < 0.15) {
    const roll = Math.random();
    let crateId = 'LB1';
    if (roll < 0.05) crateId = 'LB3';
    else if (roll < 0.30) crateId = 'LB2';
    p.lootBoxes[crateId] = (p.lootBoxes[crateId] || 0) + 1;
    const names = { LB1: '📦 Hộp Kho Báu', LB2: '📦 Hộp Hiếm', LB3: '📦 Hộp Sử Thi' };
    msg += `\n\n🎁 BONUS: Nhận ${names[crateId]}! /open để mở`;
  }

  economy._save();
  return msg;
}

module.exports = {
  eightBall, lucky, rollD20, flip, dice,
  truthOrDare, emojiQuiz, cardBattle, checkin,
};

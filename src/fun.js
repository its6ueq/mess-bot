// Nội dung vui soạn sẵn (KHÔNG cần AI): chọc nghẹo, thả thính, ghép đôi.
// Chạy tức thì, không sợ AI offline.

// ─── CHỌC NGHẸO (tease) ─── {t} = tên người bị chọc ───
const CHOC = [
  '{t} thông minh phết, tiếc là hôm nay quên mang não đi 🧠',
  'Nhìn {t} là biết mẹ thiên nhiên cũng có ngày làm ẩu 😌',
  '{t} mà im lặng thì cả xóm được nhờ 🤫',
  'IQ của {t} và nhiệt độ phòng đang ngang nhau đấy 🌡️',
  '{t} tự tin lắm, mà tự tin sai chỗ mới đáng nói 💅',
  'Gọi {t} là thiên tài đi — thiên về phía tai hại ấy 😆',
  '{t} cứ tự tin lên, dốt mà tự tin cũng là một loại tài năng 👏',
  'Wifi nhà {t} yếu, não cũng yếu — combo hoàn hảo 📶',
  '{t} sinh ra là để làm gương... cho người khác tránh 🪞',
  '{t} mà đi thi "ai lười nhất" chắc cũng trượt vì lười đi thi 🏆',
  'Người ta nuôi cá cảnh, còn {t} nuôi mộng 🐟',
  '{t} deadline dí sát nhưng vẫn bình tĩnh, vì có làm đâu mà lo 😎',
  'Đầu {t} to không phải vì nhiều não đâu nhé 🎈',
  'Trời sinh {t} ra chắc để cân bằng lượng người thông minh trên đời ⚖️',
  '{t} giỏi nhất khoản... tưởng mình giỏi 🥇',
  'Có {t} trong nhóm, mọi người thấy mình thông minh hẳn ra 🤓',
  '{t} mà chăm bằng một nửa lúc trốn việc thì đã thành CEO rồi 💼',
  'Nghe {t} kể chuyện cười xong, mình cười vì thấy thương 😢',
  '{t} unique lắm — unique tới mức không ai muốn giống 🦄',
  'Định khen {t} mà nghĩ mãi không ra 🤔',
  '{t} như wifi công cộng: ai cũng kết nối được nhưng chẳng ai tin tưởng 📡',
  '{t} mà bán sự lười chắc giàu to 💰',
  'Đừng buồn {t} ơi, dù sao bạn cũng... à thôi 🤐',
  '{t} cứ mơ đi, mơ là miễn phí mà 💭',
  'Bậc thầy trì hoãn {t} đã online 🐢',
  '{t} nói chuyện có duyên lắm, duyên đến mức ai nghe cũng muốn về 🚪',
];

// ─── THẢ THÍNH (pickup lines) ───
const THINH = [
  'Anh không giỏi toán, nhưng anh biết anh + em = chúng ta ❤️',
  'Em có phải wifi không? Vì anh thấy kết nối ngay lập tức 📶',
  'Trời hôm nay đẹp ghê, nhưng vẫn thua nụ cười của em 😍',
  'Em cầm giùm anh trái tim này nhé, anh cầm hoài mỏi tay quá 💓',
  'Google có đủ thứ, mà vẫn thiếu mỗi số của em 📱',
  'Anh bị lạc đường... vào tim em mất rồi 🗺️',
  'Nếu được chọn lại, anh vẫn chọn em, chọn cả nghìn lần 🔁',
  'Em là đường, anh là cà phê — thiếu em anh đắng cả ngày ☕',
  'Tim anh vừa lag, vì em vừa đi ngang qua 💗',
  'Em mệt không? Vì em chạy trong tâm trí anh cả ngày rồi 🏃',
  'Có phải em trồng cây không? Vì anh mọc cảm xúc với em rồi 🌱',
  'Bản đồ của anh hỏng rồi, chỉ toàn dẫn về phía em 🧭',
  'Em là 1 trong 8 tỉ người, mà sao anh chỉ thấy mỗi em 🌍',
  'Em có tin vào định mệnh không? Vì anh vừa gặp em nè ✨',
  'Anh muốn làm điện thoại của em, để được em cầm cả ngày 📲',
  'Em ngọt hơn trà sữa, mà lại không sợ tăng cân 🧋',
  'Anh không tin sét đánh 2 lần, nhưng gặp em tim anh giật liên tục ⚡',
  'Cho anh mượn tên em nhé, để anh điền vào ô "người yêu" 📝',
  'Nếu nhớ em là có lỗi thì chắc anh tù chung thân rồi 🔒',
  'Sao trên trời nhiều thế mà anh chỉ muốn ngắm mỗi em 🌟',
  'Em là lý do anh mở mắt buổi sáng và mất ngủ buổi tối 🌙',
  'Đường nào cũng ra biển, tim nào cũng về em 🌊',
  'Anh thấy lạnh, chắc tại thiếu cái ôm của em 🤗',
  'Anh không cần 3G, chỉ cần "gần gũi, gắn bó, gắng giữ" em thôi 💞',
  'Nhắm mắt lại anh thấy em, mở mắt ra anh muốn thấy em 👀',
];

// ─── GHÉP ĐÔI ─── lời phán theo mức điểm ───
const VERDICTS = [
  { max: 20, lines: ['Thôi… làm bạn cho lành 😅', 'Nước sông không phạm nước giếng nha 🌊', 'Cạch mặt là vừa 🙅'] },
  { max: 40, lines: ['Cần cố gắng nhiều lắm đấy 🤔', 'Còn nước còn tát 💧', 'Duyên hơi mỏng, phải chăm tưới 🌱'] },
  { max: 60, lines: ['Cũng có tương lai phết 😌', 'Tìm hiểu thêm xem sao 👀', 'Tiềm năng đấy, đừng bỏ lỡ ✨'] },
  { max: 80, lines: ['Đẹp đôi ghê! 😍', 'Nhìn là thấy hợp rồi 💘', 'Tiến tới đi còn chờ gì 🚀'] },
  { max: 95, lines: ['Trời sinh một cặp! 💕', 'Cưới được rồi đấy 💐', 'Xứng đôi vừa lứa quá 😘'] },
  { max: 100, lines: ['ĐỊNH MỆNH! Cưới luôn đi 💍', 'Ông tơ bà nguyệt gật đầu rồi 🥰', 'Không lấy nhau phí cả thanh xuân 💞'] },
];

function _norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '').trim();
}

function _hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

function _pick(arr, seed) {
  const i = (seed == null ? Math.floor(Math.random() * arr.length) : seed % arr.length);
  return arr[i];
}

function choc(name) {
  const t = (name && name.trim()) ? name.trim() : 'bạn';
  return _pick(CHOC).replace(/\{t\}/g, t);
}

function thinh() {
  return _pick(THINH);
}

function ghepDoi(a, b) {
  const nameA = (a || '').trim() || 'Ai đó';
  const nameB = (b || '').trim() || 'Ai đó';
  // Ổn định: cùng 1 cặp luôn ra cùng điểm (sắp xếp tên trước khi hash)
  const key = [_norm(nameA), _norm(nameB)].sort().join('|');
  const seed = _hash(key);
  const score = seed % 101; // 0..100
  const verdict = VERDICTS.find(v => score <= v.max) || VERDICTS[VERDICTS.length - 1];
  const line = _pick(verdict.lines, Math.floor(seed / 101));

  const hearts = Math.round(score / 10);
  const bar = '❤️'.repeat(hearts) + '🤍'.repeat(10 - hearts);

  return `💘 GHÉP ĐÔI 💘\n${nameA} 💗 ${nameB}\n\n${bar}\nĐộ hợp nhau: ${score}%\n\n${line}`;
}

module.exports = { choc, thinh, ghepDoi };

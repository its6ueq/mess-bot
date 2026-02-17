// ============================================================
// HỆ THỐNG CÂU CÁ - Bait Chain Progression
// Mồi nhỏ → Cá nhỏ → Dùng làm mồi → Cá to hơn → ...
// ============================================================

// === CẦN CÂU ===
const RODS = [
  { id: 'tre',          name: '🎣 Cần Tre',            price: 0,      quality: 0    },
  { id: 'carbon',       name: '🎣 Cần Carbon',         price: 3000,   quality: 0.06 },
  { id: 'thep',         name: '🎣 Cần Thép',           price: 12000,  quality: 0.12 },
  { id: 'vang',         name: '🎣 Cần Vàng',           price: 35000,  quality: 0.20 },
  { id: 'kimcuong',     name: '💎 Cần Kim Cương',      price: 120000, quality: 0.28 },
  { id: 'truyenthuyet', name: '🔱 Cần Truyền Thuyết',  price: 400000, quality: 0.38 },
];

// === CÁ THEO SIZE (1-10) ===
const FISH = {
  1: [
    { name: '🦗 Con Dế',           price: 3  },
    { name: '🐌 Ốc Bươu',         price: 5  },
    { name: '🦐 Tôm Tép',         price: 8  },
    { name: '🐟 Cá Bống',         price: 12 },
    { name: '🐟 Cá Rô Con',       price: 10 },
    { name: '👢 Giày Cũ',          price: 2  },
    { name: '🥫 Lon Bia',          price: 3  },
  ],
  2: [
    { name: '🐠 Cá Vàng',         price: 25 },
    { name: '🦀 Cua Đồng',        price: 30 },
    { name: '🐟 Cá Rô',           price: 22 },
    { name: '🐡 Cá Nóc',          price: 35 },
    { name: '🦐 Tôm Sú',          price: 28 },
    { name: '🐸 Ếch Đồng',        price: 20 },
    { name: '🐟 Cá Diếc',         price: 24 },
  ],
  3: [
    { name: '🐟 Cá Trê',          price: 50  },
    { name: '🐟 Cá Lóc',          price: 55  },
    { name: '🦐 Tôm Càng Xanh',   price: 60  },
    { name: '🐟 Cá Bống Mú',      price: 45  },
    { name: '🐢 Rùa Nhỏ',         price: 65  },
    { name: '🐟 Cá Chép',         price: 48  },
    { name: '🐟 Cá Mè',           price: 42  },
  ],
  4: [
    { name: '⚡ Lươn Điện',        price: 100 },
    { name: '🐉 Cá Trắm Đen',     price: 110 },
    { name: '✨ Cá Chép Vàng',     price: 130 },
    { name: '🐟 Cá Lăng',         price: 95  },
    { name: '🐢 Rùa Sông',        price: 120 },
    { name: '🐟 Cá Ngát',         price: 105 },
    { name: '🐍 Lươn Đồng',       price: 90  },
  ],
  5: [
    { name: '🦑 Mực Ống',          price: 180 },
    { name: '🐟 Cá Thu',           price: 200 },
    { name: '🐟 Cá Ngừ',          price: 210 },
    { name: '🦞 Tôm Hùm Nhỏ',    price: 190 },
    { name: '🐟 Cá Bớp',          price: 175 },
    { name: '🐡 Cá Nóc Biển',     price: 220 },
    { name: '🐟 Cá Cam',          price: 195 },
  ],
  6: [
    { name: '🐙 Bạch Tuộc',       price: 350 },
    { name: '⚔️ Cá Kiếm',         price: 380 },
    { name: '🦈 Cá Mập Nhỏ',      price: 400 },
    { name: '🐬 Cá Heo',          price: 420 },
    { name: '🦞 Tôm Hùm',        price: 360 },
    { name: '🐟 Cá Ngừ Đại Dương', price: 390 },
    { name: '🦀 Cua Hoàng Đế',    price: 440 },
  ],
  7: [
    { name: '🦈 Cá Mập',           price: 700  },
    { name: '🌙 Cá Mặt Trăng',    price: 680  },
    { name: '🦑 Mực Khổng Lồ',    price: 750  },
    { name: '🐋 Cá Voi Con',       price: 720  },
    { name: '🐙 Bạch Tuộc Xanh',  price: 690  },
    { name: '🐢 Rùa Biển',        price: 710  },
    { name: '🦈 Cá Đuối Gai',     price: 660  },
  ],
  8: [
    { name: '🦈 Cá Mập Trắng',    price: 1500 },
    { name: '🐋 Cá Voi',           price: 1800 },
    { name: '🐢 Rùa Biển Cổ',     price: 1600 },
    { name: '🐲 Rắn Biển',        price: 1700 },
    { name: '🦈 Cá Mập Búa',      price: 1400 },
    { name: '🐟 Cá Đuối Khổng Lồ', price: 1550 },
    { name: '🐙 Bạch Tuộc Đỏ',   price: 1650 },
  ],
  9: [
    { name: '🐙 Bạch Tuộc Khổng Lồ', price: 4000 },
    { name: '👹 Quái Vật Biển Sâu',   price: 5000 },
    { name: '🐋 Cá Voi Xanh',        price: 4500 },
    { name: '🦑 Mực Đại Vương',       price: 4200 },
    { name: '🔮 Cá Đèn Lồng Khổng Lồ', price: 3800 },
    { name: '🐉 Cá Rồng Biển',       price: 4800 },
  ],
  10: [
    { name: '🐉 Rồng Biển',       price: 15000 },
    { name: '🔱 Long Vương',       price: 25000 },
    { name: '🌊 Leviathan',        price: 20000 },
    { name: '💎 Ngọc Trai Thần',   price: 30000 },
    { name: '🦑 Kraken',           price: 18000 },
    { name: '⚡ Thần Sấm Biển',   price: 22000 },
  ],
};

// === MỒI CÂU BÁN TRONG SHOP ===
// Giá mua cao hơn giá bán cá cùng size 1 chút (phí tiện lợi)
const BAIT_SHOP = [
  { size: 1, name: '🪱 Giun',         price: 0   },
  { size: 2, name: '🦐 Mồi Tôm',     price: 40  },
  { size: 3, name: '🐟 Mồi Cá Nhỏ',  price: 90  },
  { size: 4, name: '🐟 Mồi Cá Vừa',  price: 180 },
  { size: 5, name: '🐟 Mồi Cá Lớn',  price: 350 },
  { size: 6, name: '🐙 Mồi Mực',     price: 700 },
  { size: 7, name: '🦈 Mồi Cá Mập',  price: 1500 },
  { size: 8, name: '🐋 Mồi Cá Voi',  price: 3500 },
  { size: 9, name: '👹 Mồi Quái Vật', price: 9000 },
];

// === RƯƠNG KHO BÁU (theo size mồi) ===
const TREASURES = [
  { minSize: 1,  maxSize: 3,  name: '📦 Rương Gỗ',          min: 30,   max: 100   },
  { minSize: 4,  maxSize: 5,  name: '📦 Rương Bạc',          min: 100,  max: 400   },
  { minSize: 6,  maxSize: 7,  name: '📦 Rương Vàng',         min: 400,  max: 1500  },
  { minSize: 8,  maxSize: 9,  name: '📦 Rương Kim Cương',    min: 1500, max: 5000  },
  { minSize: 10, maxSize: 10, name: '📦 Rương Truyền Thuyết', min: 5000, max: 20000 },
];

// === THƯỞNG ALBUM THEO SIZE ===
const ALBUM_BONUS = {
  1: 500, 2: 1000, 3: 2000, 4: 5000, 5: 10000,
  6: 20000, 7: 50000, 8: 100000, 9: 200000, 10: 500000,
};

const MAX_SIZE = 10;
const COOLDOWN = 10000; // 10 giây

// ============================================================
// HELPERS
// ============================================================

function getRod(rodId) {
  return RODS.find(r => r.id === rodId) || RODS[0];
}

function ensure(p) {
  if (!p.bait) p.bait = { name: '🪱 Giun', size: 1 };
  if (!p.rod) p.rod = 'tre';
  if (!p.maxBaitSize) p.maxBaitSize = 1;
  if (!p.album) p.album = {};
  if (!p.albumRewards) p.albumRewards = [];
  if (!p.inventory) p.inventory = [];
  if (!p.fishCaught) p.fishCaught = 0;
}

// Random 1 con cá từ pool của size đó
function randomFish(size) {
  const pool = FISH[size];
  if (!pool || pool.length === 0) return FISH[1][0];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Tìm treasure phù hợp với size mồi
function getTreasure(baitSize) {
  const t = TREASURES.find(tr => baitSize >= tr.minSize && baitSize <= tr.maxSize);
  if (!t) return TREASURES[0];
  const xu = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
  return { name: t.name, xu };
}

// Tính kết quả cast dựa trên rod quality
function rollOutcome(quality) {
  // Base rates
  let catchOk = 0.48;     // Bắt được, mồi còn nguyên
  let catchShrink = 0.22; // Bắt được, mồi bị gặm nhỏ
  let nibble = 0.10;      // Cá nhỏ gặm mồi, mất mồi 1 size
  let snap = 0.06;        // Cá lớn cắn đứt dây, mất mồi
  let treasure = 0.07;    // Nhặt được kho báu, mồi nguyên
  let perfect = 0.07;     // Câu hoàn hảo, cá to hơn, mồi nguyên

  // Rod quality: chuyển % từ xấu sang tốt
  catchOk += quality * 0.35;
  perfect += quality * 0.25;
  treasure += quality * 0.15;
  catchShrink -= quality * 0.30;
  nibble -= quality * 0.25;
  snap -= quality * 0.20;

  // Clamp
  catchShrink = Math.max(0.02, catchShrink);
  nibble = Math.max(0.01, nibble);
  snap = Math.max(0.01, snap);

  const outcomes = [
    { id: 'catch_ok', chance: catchOk },
    { id: 'catch_shrink', chance: catchShrink },
    { id: 'nibble', chance: nibble },
    { id: 'snap', chance: snap },
    { id: 'treasure', chance: treasure },
    { id: 'perfect', chance: perfect },
  ];

  let r = Math.random();
  for (const o of outcomes) {
    r -= o.chance;
    if (r <= 0) return o.id;
  }
  return 'catch_ok';
}

// Tính size cá bắt được dựa trên size mồi
function rollFishSize(baitSize, isPerfect) {
  if (isPerfect) {
    // Perfect: 60% size+1, 40% size+2
    const bonus = Math.random() < 0.6 ? 1 : 2;
    return Math.min(baitSize + bonus, MAX_SIZE);
  }
  // Bình thường: 15% size-1, 60% size, 25% size+1
  const roll = Math.random();
  if (roll < 0.15 && baitSize > 1) return baitSize - 1;
  if (roll < 0.75) return baitSize;
  return Math.min(baitSize + 1, MAX_SIZE);
}

function updateAlbum(p, fishName, size) {
  if (!p.album[fishName]) {
    p.album[fishName] = { count: 0, size };
  }
  p.album[fishName].count++;
}

function checkAlbumCompletion(p, size, economy, playerId) {
  const key = `size_${size}`;
  if (p.albumRewards.includes(key)) return null;
  const pool = FISH[size];
  if (!pool) return null;
  const allCaught = pool.every(f => p.album[f.name]?.count > 0);
  if (!allCaught) return null;

  p.albumRewards.push(key);
  const bonus = ALBUM_BONUS[size] || 0;
  if (bonus > 0) economy.addXu(playerId, bonus);
  return `🏆 HOÀN THÀNH ALBUM SIZE ${size}!\n+${bonus.toLocaleString()} xu thưởng!`;
}

// ============================================================
// LỆNH CHÍNH
// ============================================================

// === /fish - Thả câu ===
function start(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  // Cooldown
  const now = Date.now();
  if (p.lastFish && now - new Date(p.lastFish).getTime() < COOLDOWN) {
    const left = Math.ceil((COOLDOWN - (now - new Date(p.lastFish).getTime())) / 1000);
    return `⏰ Đợi ${left}s nữa mới câu tiếp được!`;
  }

  // Kiểm tra mồi
  if (!p.bait || p.bait.size <= 0) {
    p.bait = null;
    economy._save();
    return '🚫 Hết mồi rồi!\n/moi giun - Lấy giun miễn phí\n/moi <tên cá> - Dùng cá trong kho làm mồi\n/shop - Mua mồi';
  }

  const rod = getRod(p.rod);
  const bait = p.bait;
  p.lastFish = new Date().toISOString();

  // === Roll kết quả ===
  const outcome = rollOutcome(rod.quality);

  let msg = `🎣 Thả câu... (Mồi: ${bait.name} size ${bait.size})\n`;

  // === KHO BÁU ===
  if (outcome === 'treasure') {
    const t = getTreasure(bait.size);
    economy.addXu(player, t.xu);
    economy._save();
    msg += `\n💰 TÌM THẤY KHO BÁU!\n${t.name} → +${t.xu.toLocaleString()} xu`;
    msg += `\nMồi vẫn còn: ${bait.name} (size ${bait.size})`;
    msg += `\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
    return msg;
  }

  // === CÁ NHỎ GẶM MỒI ===
  if (outcome === 'nibble') {
    bait.size -= 1;
    if (bait.size <= 0) {
      p.bait = null;
      msg += `\n🐟 Cá nhỏ gặm sạch mồi! Mất mồi hoàn toàn!`;
      msg += `\n/moi giun hoặc /shop để lấy mồi mới`;
    } else {
      msg += `\n🐟 Cá nhỏ gặm mồi! Mồi bị nhỏ đi → size ${bait.size}`;
    }
    economy._save();
    return msg;
  }

  // === CÁ LỚN CẮN ĐỨT DÂY ===
  if (outcome === 'snap') {
    const lostName = bait.name;
    p.bait = null;
    economy._save();
    msg += `\n💥 Cá lớn cắn đứt dây! Mất ${lostName}!`;
    msg += `\n/moi giun hoặc /moi <tên cá> để câu tiếp`;
    return msg;
  }

  // === BẮT ĐƯỢC CÁ ===
  const isPerfect = outcome === 'perfect';
  const fishSize = rollFishSize(bait.size, isPerfect);
  const fish = randomFish(fishSize);

  // Thêm cá vào kho
  p.inventory.push({ name: fish.name, price: fish.price, size: fishSize });
  p.fishCaught++;
  updateAlbum(p, fish.name, fishSize);

  if (isPerfect) {
    msg += `\n🎯 CÂU HOÀN HẢO!`;
  }

  msg += `\n${fish.name} | Size ${fishSize} | ${fish.price.toLocaleString()} xu`;

  // Xử lý mồi sau khi câu
  if (outcome === 'catch_shrink') {
    bait.size -= 1;
    if (bait.size <= 0) {
      p.bait = null;
      msg += `\n⚠️ Mồi bị gặm hết sau khi câu!`;
    } else {
      msg += `\n⚠️ Mồi bị gặm nhỏ → size ${bait.size}`;
    }
  } else {
    msg += `\nMồi còn: ${bait.name} (size ${bait.size})`;
  }

  // Cập nhật maxBaitSize
  if (fishSize > p.maxBaitSize) {
    p.maxBaitSize = fishSize;
    msg += `\n🆕 Mở khoá mồi size ${fishSize} trong shop!`;
  }

  // Kiểm tra album
  const albumMsg = checkAlbumCompletion(p, fishSize, economy, player);
  if (albumMsg) msg += `\n\n${albumMsg}`;

  // Gợi ý
  if (fishSize > bait.size) {
    msg += `\n\n💡 /moi ${fish.name.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').trim()} để dùng cá này làm mồi lớn hơn!`;
  }

  economy._save();
  return msg;
}

// === /moi [tên] - Xem/Đổi mồi câu ===
function useBait(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const query = (args || '').trim().toLowerCase();

  // Không có args → hiện mồi hiện tại
  if (!query) {
    if (!p.bait || p.bait.size <= 0) {
      return '🪱 Chưa có mồi!\n/moi giun - Giun miễn phí\n/moi <tên cá> - Dùng cá trong kho\n/shop - Mua mồi';
    }
    return `🪱 Mồi hiện tại: ${p.bait.name} (size ${p.bait.size})\n/fish để thả câu`;
  }

  // "giun" → lấy giun miễn phí
  if (query === 'giun' || query === 'worm') {
    p.bait = { name: '🪱 Giun', size: 1 };
    economy._save();
    return '🪱 Đã lấy Giun làm mồi (size 1).\n/fish để thả câu!';
  }

  // Tìm cá trong kho theo tên
  const idx = p.inventory.findIndex(item =>
    item.name.toLowerCase().includes(query) ||
    item.name.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').trim().toLowerCase().includes(query)
  );

  if (idx === -1) {
    return `Không tìm thấy "${args}" trong kho!\n/inventory xem kho đồ`;
  }

  const fish = p.inventory.splice(idx, 1)[0];
  p.bait = { name: fish.name, size: fish.size };

  // Cập nhật maxBaitSize
  if (fish.size > p.maxBaitSize) p.maxBaitSize = fish.size;

  economy._save();
  return `🪱 Đã dùng ${fish.name} (size ${fish.size}) làm mồi!\nMất ${fish.price.toLocaleString()} xu tiềm năng bán.\n/fish để thả câu!`;
}

// === /shop ===
function shop(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const xu = economy.getBalance(player).xu;
  const curRodIdx = RODS.findIndex(r => r.id === p.rod);

  let msg = `🏪 CỬA HÀNG CÂU CÁ\nVí: ${xu.toLocaleString()} xu\n`;

  // Cần câu
  msg += `\n--- CẦN CÂU ---\n`;
  for (let i = 0; i < RODS.length; i++) {
    const r = RODS[i];
    if (r.id === p.rod) {
      msg += `${r.name} [ĐANG DÙNG]\n`;
    } else if (i < curRodIdx) {
      msg += `${r.name} [ĐÃ MUA]\n`;
    } else {
      const pct = Math.round(r.quality * 100);
      msg += `${r.name} - ${r.price.toLocaleString()} xu (+${pct}% chất lượng)\n`;
    }
  }

  // Mồi câu
  msg += `\n--- MỒI CÂU ---\n`;
  for (const b of BAIT_SHOP) {
    if (b.size > p.maxBaitSize) {
      msg += `🔒 ${b.name} (size ${b.size}) - Chưa mở khoá\n`;
    } else if (b.price === 0) {
      msg += `${b.name} (size ${b.size}) - MIỄN PHÍ\n`;
    } else {
      msg += `${b.name} (size ${b.size}) - ${b.price.toLocaleString()} xu\n`;
    }
  }

  msg += `\n/buy <tên> để mua\nVD: /buy carbon | /buy mồi tôm`;
  return msg;
}

// === /buy <item> ===
function buy(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (!args) return '/buy <tên>\nVD: /buy carbon | /buy mồi tôm | /buy giun';
  const q = args.trim().toLowerCase();

  // Tìm rod
  const rodIdx = RODS.findIndex(r =>
    r.id === q || r.name.toLowerCase().includes(q)
  );
  if (rodIdx >= 0) {
    const rod = RODS[rodIdx];
    const curIdx = RODS.findIndex(r => r.id === p.rod);
    if (rodIdx <= curIdx) return `Đã có ${rod.name} rồi!`;
    if (rodIdx > curIdx + 1) return `Phải mua ${RODS[curIdx + 1].name} trước! (${RODS[curIdx + 1].price.toLocaleString()} xu)`;
    if (p.xu < rod.price) return `Thiếu xu! Cần ${rod.price.toLocaleString()}, có ${p.xu.toLocaleString()} xu.`;
    economy.removeXu(player, rod.price);
    p.rod = rod.id;
    economy._save();
    const pct = Math.round(rod.quality * 100);
    return `🎣 Đã mua ${rod.name}!\nChất lượng +${pct}% (ít mất mồi, nhiều kho báu hơn)\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // Tìm mồi
  const baitItem = BAIT_SHOP.find(b =>
    b.name.toLowerCase().includes(q) ||
    q.includes(`size ${b.size}`) ||
    q === `${b.size}`
  );
  if (baitItem) {
    if (baitItem.size > p.maxBaitSize) return `🔒 Chưa mở khoá mồi size ${baitItem.size}! Phải câu được cá size đó trước.`;
    if (baitItem.price > 0 && p.xu < baitItem.price) return `Thiếu xu! Cần ${baitItem.price.toLocaleString()}, có ${p.xu.toLocaleString()} xu.`;
    if (baitItem.price > 0) economy.removeXu(player, baitItem.price);
    p.bait = { name: baitItem.name, size: baitItem.size };
    economy._save();
    const cost = baitItem.price > 0 ? `(-${baitItem.price.toLocaleString()} xu)` : '(miễn phí)';
    return `🪱 Đã mua ${baitItem.name} (size ${baitItem.size}) ${cost}\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\n/fish để thả câu!`;
  }

  return `Không tìm thấy "${args}"! /shop để xem danh sách.`;
}

// === /sell [all] ===
function sell(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (args === 'all') {
    if (p.inventory.length === 0) return 'Kho trống!';
    const total = p.inventory.reduce((s, i) => s + i.price, 0);
    const count = p.inventory.length;
    p.inventory = [];
    economy.addXu(player, total);
    return `💰 Đã bán ${count} con = ${total.toLocaleString()} xu!\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  if (p.inventory.length === 0) return 'Kho trống! /fish để câu cá.';
  const item = p.inventory.pop();
  economy.addXu(player, item.price);
  return `💰 Bán ${item.name} = ${item.price.toLocaleString()} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\nCòn ${p.inventory.length} con trong kho`;
}

// === /inventory ===
function inventory(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (p.inventory.length === 0) return '📦 Kho trống! /fish để câu cá.';

  // Nhóm theo tên
  const groups = {};
  let totalValue = 0;
  for (const item of p.inventory) {
    const key = item.name;
    if (!groups[key]) groups[key] = { count: 0, total: 0, size: item.size };
    groups[key].count++;
    groups[key].total += item.price;
    totalValue += item.price;
  }

  let msg = `📦 KHO ĐỒ (${p.inventory.length} con):\n`;
  // Sắp xếp theo size giảm dần
  const sorted = Object.entries(groups).sort((a, b) => b[1].size - a[1].size);
  for (const [name, d] of sorted) {
    msg += `${name} x${d.count} [S${d.size}] (${d.total.toLocaleString()} xu)\n`;
  }

  msg += `\nTổng: ${totalValue.toLocaleString()} xu`;
  msg += `\n/sell all bán hết | /moi <tên> dùng làm mồi`;
  return msg;
}

// === /gear ===
function gear(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const rod = getRod(p.rod);
  const pct = Math.round(rod.quality * 100);

  let msg = `🎒 TRANG BỊ:\n\n`;
  msg += `Cần câu: ${rod.name} (+${pct}%)\n`;
  msg += `Mồi: ${p.bait ? `${p.bait.name} (size ${p.bait.size})` : '❌ Chưa có'}\n`;
  msg += `Size cao nhất mở khoá: ${p.maxBaitSize}\n`;
  msg += `Cá đã bắt: ${p.fishCaught}\n`;
  msg += `Kho: ${p.inventory.length} con\n`;
  msg += `Album: ${Object.keys(p.album).length} loài`;
  return msg;
}

// === /album ===
function album(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (Object.keys(p.album).length === 0) return '📖 Album trống! /fish để bắt đầu câu cá.';

  let msg = '📖 ALBUM CÂU CÁ\n';
  let totalSpecies = 0, caught = 0;

  for (let size = 1; size <= MAX_SIZE; size++) {
    const pool = FISH[size];
    if (!pool) continue;
    const caughtHere = pool.filter(f => p.album[f.name]?.count > 0);

    totalSpecies += pool.length;
    caught += caughtHere.length;

    const done = p.albumRewards.includes(`size_${size}`);
    const locked = size > p.maxBaitSize + 1;

    msg += `\n${locked ? '🔒 ' : ''}Size ${size} [${caughtHere.length}/${pool.length}]`;
    if (done) msg += ' ✅';
    msg += '\n';

    if (!locked) {
      for (const fish of pool) {
        const e = p.album[fish.name];
        if (e) {
          msg += `  ✓ ${fish.name} x${e.count}\n`;
        } else {
          msg += `  ❓ ???\n`;
        }
      }
    }
  }

  msg += `\nTổng: ${caught}/${totalSpecies} loài`;
  return msg;
}

function handleInput() { return null; }

module.exports = { start, sell, inventory, shop, buy, gear, album, useBait, handleInput };

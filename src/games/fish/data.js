// ============================================================
// FISH DATA — Fish, Rods, Baits
// Thêm item mới: chỉ cần thêm vào array (FS69, RD5, BT10,...)
// ============================================================

// ============================================================
// FISH — Câu được, bán lấy xu. ID: FS1, FS2, ...
// ============================================================
const FISH = [
  // Size 1 (FS1-FS7)
  { id: 'FS1',  name: 'Dế Mèn',              emoji: '🦗', size: 1,  price: 3    },
  { id: 'FS2',  name: 'Ốc Bươu',             emoji: '🐌', size: 1,  price: 5    },
  { id: 'FS3',  name: 'Tép',                  emoji: '🦐', size: 1,  price: 4    },
  { id: 'FS4',  name: 'Cá Bống',              emoji: '🐟', size: 1,  price: 6    },
  { id: 'FS5',  name: 'Cá Rô Con',            emoji: '🐟', size: 1,  price: 8    },
  { id: 'FS6',  name: 'Giày Cũ',              emoji: '👟', size: 1,  price: 1    },
  { id: 'FS7',  name: 'Lon Bia',              emoji: '🥫', size: 1,  price: 2    },
  // Size 2 (FS8-FS14)
  { id: 'FS8',  name: 'Cá Vàng',              emoji: '🐠', size: 2,  price: 12   },
  { id: 'FS9',  name: 'Cua Đồng',             emoji: '🦀', size: 2,  price: 15   },
  { id: 'FS10', name: 'Cá Rô',                emoji: '🐟', size: 2,  price: 14   },
  { id: 'FS11', name: 'Ếch Đồng',             emoji: '🐸', size: 2,  price: 18   },
  { id: 'FS12', name: 'Cá Diếc',              emoji: '🐟', size: 2,  price: 10   },
  { id: 'FS13', name: 'Tôm Sú',               emoji: '🦐', size: 2,  price: 20   },
  { id: 'FS14', name: 'Cá Mương',             emoji: '🐟', size: 2,  price: 11   },
  // Size 3 (FS15-FS21)
  { id: 'FS15', name: 'Cá Trê',               emoji: '🐟', size: 3,  price: 30   },
  { id: 'FS16', name: 'Cá Lóc',               emoji: '🐟', size: 3,  price: 50   },
  { id: 'FS17', name: 'Tôm Càng Xanh',        emoji: '🦐', size: 3,  price: 55   },
  { id: 'FS18', name: 'Cá Chép',              emoji: '🐟', size: 3,  price: 45   },
  { id: 'FS19', name: 'Cá Mè',                emoji: '🐟', size: 3,  price: 38   },
  { id: 'FS20', name: 'Rùa Nhỏ',              emoji: '🐢', size: 3,  price: 48   },
  { id: 'FS21', name: 'Cá Bống Mú',           emoji: '🐟', size: 3,  price: 35   },
  // Size 4 (FS22-FS28)
  { id: 'FS22', name: 'Lươn Điện',            emoji: '⚡', size: 4,  price: 80   },
  { id: 'FS23', name: 'Cá Trắm Đen',         emoji: '🐟', size: 4,  price: 90   },
  { id: 'FS24', name: 'Cá Chép Vàng',         emoji: '🐠', size: 4,  price: 100  },
  { id: 'FS25', name: 'Cá Lăng',              emoji: '🐟', size: 4,  price: 85   },
  { id: 'FS26', name: 'Lươn Đồng',            emoji: '🐍', size: 4,  price: 75   },
  { id: 'FS27', name: 'Cá Ngát',              emoji: '🐟', size: 4,  price: 70   },
  { id: 'FS28', name: 'Rùa Sông',             emoji: '🐢', size: 4,  price: 95   },
  // Size 5 (FS29-FS35)
  { id: 'FS29', name: 'Mực Ống',              emoji: '🦑', size: 5,  price: 160  },
  { id: 'FS30', name: 'Cá Thu',               emoji: '🐟', size: 5,  price: 180  },
  { id: 'FS31', name: 'Cá Ngừ',               emoji: '🐟', size: 5,  price: 200  },
  { id: 'FS32', name: 'Cá Bớp',               emoji: '🐟', size: 5,  price: 155  },
  { id: 'FS33', name: 'Cá Nóc',               emoji: '🐡', size: 5,  price: 170  },
  { id: 'FS34', name: 'Tôm Hùm Nhỏ',         emoji: '🦞', size: 5,  price: 190  },
  { id: 'FS35', name: 'Cá Cam',               emoji: '🐟', size: 5,  price: 150  },
  // Size 6 (FS36-FS42)
  { id: 'FS36', name: 'Bạch Tuộc',            emoji: '🐙', size: 6,  price: 340  },
  { id: 'FS37', name: 'Cá Kiếm',              emoji: '⚔️', size: 6,  price: 380  },
  { id: 'FS38', name: 'Tôm Hùm',              emoji: '🦞', size: 6,  price: 310  },
  { id: 'FS39', name: 'Cá Heo',               emoji: '🐬', size: 6,  price: 420  },
  { id: 'FS40', name: 'Cá Ngừ Đại Dương',     emoji: '🐟', size: 6,  price: 360  },
  { id: 'FS41', name: 'Cua Hoàng Đế',         emoji: '🦀', size: 6,  price: 400  },
  { id: 'FS42', name: 'Cá Nóc Biển',          emoji: '🐡', size: 6,  price: 300  },
  // Size 7 (FS43-FS49)
  { id: 'FS43', name: 'Cá Mập',               emoji: '🦈', size: 7,  price: 650  },
  { id: 'FS44', name: 'Cá Mặt Trăng',         emoji: '🌙', size: 7,  price: 700  },
  { id: 'FS45', name: 'Mực Khổng Lồ',         emoji: '🦑', size: 7,  price: 750  },
  { id: 'FS46', name: 'Rùa Biển',             emoji: '🐢', size: 7,  price: 680  },
  { id: 'FS47', name: 'Bạch Tuộc Xanh',       emoji: '🐙', size: 7,  price: 620  },
  { id: 'FS48', name: 'Cá Đuối',              emoji: '🦈', size: 7,  price: 600  },
  { id: 'FS49', name: 'Cá Voi Con',            emoji: '🐋', size: 7,  price: 720  },
  // Size 8 (FS50-FS56)
  { id: 'FS50', name: 'Cá Mập Trắng',         emoji: '🦈', size: 8,  price: 1500 },
  { id: 'FS51', name: 'Cá Voi',               emoji: '🐋', size: 8,  price: 1800 },
  { id: 'FS52', name: 'Rắn Biển',             emoji: '🐲', size: 8,  price: 1600 },
  { id: 'FS53', name: 'Cá Mập Búa',           emoji: '🦈', size: 8,  price: 1400 },
  { id: 'FS54', name: 'Bạch Tuộc Đỏ',         emoji: '🐙', size: 8,  price: 1550 },
  { id: 'FS55', name: 'Cá Đuối Khổng Lồ',     emoji: '🦈', size: 8,  price: 1300 },
  { id: 'FS56', name: 'Rùa Biển Cổ',          emoji: '🐢', size: 8,  price: 1700 },
  // Size 9 (FS57-FS62)
  { id: 'FS57', name: 'Bạch Tuộc Khổng Lồ',   emoji: '🐙', size: 9,  price: 3500 },
  { id: 'FS58', name: 'Quái Vật Biển Sâu',     emoji: '👹', size: 9,  price: 5000 },
  { id: 'FS59', name: 'Cá Voi Xanh',          emoji: '🐋', size: 9,  price: 4200 },
  { id: 'FS60', name: 'Mực Đại Vương',        emoji: '🦑', size: 9,  price: 3800 },
  { id: 'FS61', name: 'Cá Đèn Lồng Khổng Lồ', emoji: '🔮', size: 9, price: 3000 },
  { id: 'FS62', name: 'Cá Rồng Biển',         emoji: '🐉', size: 9,  price: 4500 },
  // Size 10 (FS63-FS68)
  { id: 'FS63', name: 'Rồng Biển',            emoji: '🐉', size: 10, price: 12000 },
  { id: 'FS64', name: 'Long Vương',            emoji: '🔱', size: 10, price: 25000 },
  { id: 'FS65', name: 'Leviathan',             emoji: '🌊', size: 10, price: 18000 },
  { id: 'FS66', name: 'Ngọc Trai Thần',        emoji: '💎', size: 10, price: 22000 },
  { id: 'FS67', name: 'Kraken',                emoji: '🦑', size: 10, price: 15000 },
  { id: 'FS68', name: 'Thần Sấm Biển',         emoji: '⚡', size: 10, price: 10000 },
];

// ============================================================
// RODS — Cần câu. ID: RD1, RD2, ... catchCount = số cá/lần câu
// ============================================================
const RODS = [
  { id: 'RD1', name: '🎣 Cần Tre',             price: 0,      maxSize: 3,  quality: 0,    catchCount: 1 },
  { id: 'RD2', name: '🎣 Cần Carbon',          price: 15000,  maxSize: 5,  quality: 0.08, catchCount: 2 },
  { id: 'RD3', name: '🎣 Cần Vàng',            price: 80000,  maxSize: 8,  quality: 0.18, catchCount: 3 },
  { id: 'RD4', name: '🔱 Cần Truyền Thuyết',   price: 350000, maxSize: 10, quality: 0.32, catchCount: 4 },
];

// ============================================================
// BAITS — Mồi câu. ID: BT1, BT2, ...
// ============================================================
const BAITS = [
  { id: 'BT1', size: 1, name: '🪱 Giun',              price: 0    },
  { id: 'BT2', size: 2, name: '🦐 Mồi Tôm',          price: 35   },
  { id: 'BT3', size: 3, name: '🐟 Mồi Cá Nhỏ',       price: 80   },
  { id: 'BT4', size: 4, name: '🐟 Mồi Cá Vừa',       price: 160  },
  { id: 'BT5', size: 5, name: '🐟 Mồi Cá Lớn',       price: 300  },
  { id: 'BT6', size: 6, name: '🐙 Mồi Mực',          price: 600  },
  { id: 'BT7', size: 7, name: '🦈 Mồi Cá Mập',       price: 1200 },
  { id: 'BT8', size: 8, name: '🐋 Mồi Cá Voi',       price: 2800 },
  { id: 'BT9', size: 9, name: '👹 Mồi Quái Vật',      price: 7000 },
];

// ============================================================
// TREASURES — Rương kho báu theo bait size
// ============================================================
const TREASURES = [
  { minSize: 1,  maxSize: 3,  name: '📦 Rương Gỗ',           min: 20,   max: 80    },
  { minSize: 4,  maxSize: 5,  name: '📦 Rương Bạc',           min: 80,   max: 300   },
  { minSize: 6,  maxSize: 7,  name: '📦 Rương Vàng',          min: 300,  max: 1200  },
  { minSize: 8,  maxSize: 9,  name: '📦 Rương Kim Cương',     min: 1200, max: 4000  },
  { minSize: 10, maxSize: 10, name: '📦 Rương Truyền Thuyết', min: 4000, max: 15000 },
];

// ============================================================
// ALBUM BONUS
// ============================================================
const ALBUM_BONUS = {
  1: 300, 2: 800, 3: 2000, 4: 5000, 5: 12000,
  6: 25000, 7: 50000, 8: 100000, 9: 250000, 10: 500000,
};

const MAX_SIZE = 10;
const COOLDOWN = 8000;

// ============================================================
// INDEX MAPS
// ============================================================
const FISH_BY_ID = {};
const FISH_BY_SIZE = {};
for (const f of FISH) {
  FISH_BY_ID[f.id] = f;
  if (!FISH_BY_SIZE[f.size]) FISH_BY_SIZE[f.size] = [];
  FISH_BY_SIZE[f.size].push(f);
}

const ROD_BY_ID = {};
for (const r of RODS) ROD_BY_ID[r.id] = r;

const BAIT_BY_ID = {};
for (const b of BAITS) BAIT_BY_ID[b.id] = b;

// ============================================================
// HELPER
// ============================================================
function parseId(str) {
  const s = (str || '').trim().toUpperCase();
  const m = s.match(/^([A-Z]+)(\d+)$/);
  if (m) return { prefix: m[1], num: parseInt(m[2]), raw: `${m[1]}${m[2]}` };
  if (/^\d+$/.test(s)) return { prefix: 'FS', num: parseInt(s), raw: `FS${s}` };
  return null;
}

function fishDisplay(f) {
  return `${f.emoji} ${f.name}`;
}

// ============================================================
module.exports = {
  FISH, FISH_BY_ID, FISH_BY_SIZE,
  RODS, ROD_BY_ID,
  BAITS, BAIT_BY_ID,
  TREASURES, ALBUM_BONUS,
  MAX_SIZE, COOLDOWN,
  parseId, fishDisplay,
};

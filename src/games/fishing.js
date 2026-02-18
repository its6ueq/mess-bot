// ============================================================
// HE THONG CAU CA - Bait Chain Progression (ID-based)
// Moi nho -> Ca nho -> Dung lam moi -> Ca to hon -> ...
// ============================================================

// === CA THEO ID (1-68) ===
const FISH_LIST = [
  // Size 1 (ID 1-7)
  { id: 1,  name: 'De Men',          emoji: '🦗', size: 1,  price: 3   },
  { id: 2,  name: 'Oc Buou',         emoji: '🐌', size: 1,  price: 5   },
  { id: 3,  name: 'Tep',             emoji: '🦐', size: 1,  price: 8   },
  { id: 4,  name: 'Ca Bong',         emoji: '🐟', size: 1,  price: 10  },
  { id: 5,  name: 'Ca Ro Con',       emoji: '🐟', size: 1,  price: 7   },
  { id: 6,  name: 'Giay Cu',         emoji: '👢', size: 1,  price: 2   },
  { id: 7,  name: 'Lon Bia',         emoji: '🥫', size: 1,  price: 4   },
  // Size 2 (ID 8-14)
  { id: 8,  name: 'Ca Vang',         emoji: '🐠', size: 2,  price: 18  },
  { id: 9,  name: 'Cua Dong',        emoji: '🦀', size: 2,  price: 22  },
  { id: 10, name: 'Ca Ro',           emoji: '🐟', size: 2,  price: 16  },
  { id: 11, name: 'Ech Dong',        emoji: '🐸', size: 2,  price: 14  },
  { id: 12, name: 'Ca Diec',         emoji: '🐟', size: 2,  price: 20  },
  { id: 13, name: 'Tom Su',          emoji: '🦐', size: 2,  price: 25  },
  { id: 14, name: 'Ca Muong',        emoji: '🐟', size: 2,  price: 17  },
  // Size 3 (ID 15-21)
  { id: 15, name: 'Ca Tre',          emoji: '🐟', size: 3,  price: 40  },
  { id: 16, name: 'Ca Loc',          emoji: '🐟', size: 3,  price: 50  },
  { id: 17, name: 'Tom Cang Xanh',   emoji: '🦐', size: 3,  price: 55  },
  { id: 18, name: 'Ca Chep',         emoji: '🐟', size: 3,  price: 45  },
  { id: 19, name: 'Ca Me',           emoji: '🐟', size: 3,  price: 38  },
  { id: 20, name: 'Rua Nho',         emoji: '🐢', size: 3,  price: 48  },
  { id: 21, name: 'Ca Bong Mu',      emoji: '🐟', size: 3,  price: 35  },
  // Size 4 (ID 22-28)
  { id: 22, name: 'Luon Dien',       emoji: '⚡', size: 4,  price: 90  },
  { id: 23, name: 'Ca Tram Den',     emoji: '🐟', size: 4,  price: 100 },
  { id: 24, name: 'Ca Chep Vang',    emoji: '✨', size: 4,  price: 110 },
  { id: 25, name: 'Ca Lang',         emoji: '🐟', size: 4,  price: 80  },
  { id: 26, name: 'Luon Dong',       emoji: '🐍', size: 4,  price: 70  },
  { id: 27, name: 'Ca Ngat',         emoji: '🐟', size: 4,  price: 85  },
  { id: 28, name: 'Rua Song',        emoji: '🐢', size: 4,  price: 95  },
  // Size 5 (ID 29-35)
  { id: 29, name: 'Muc Ong',         emoji: '🦑', size: 5,  price: 160 },
  { id: 30, name: 'Ca Thu',          emoji: '🐟', size: 5,  price: 180 },
  { id: 31, name: 'Ca Ngu',          emoji: '🐟', size: 5,  price: 200 },
  { id: 32, name: 'Ca Bop',          emoji: '🐟', size: 5,  price: 155 },
  { id: 33, name: 'Ca Noc',          emoji: '🐡', size: 5,  price: 170 },
  { id: 34, name: 'Tom Hum Nho',     emoji: '🦞', size: 5,  price: 190 },
  { id: 35, name: 'Ca Cam',          emoji: '🐟', size: 5,  price: 150 },
  // Size 6 (ID 36-42)
  { id: 36, name: 'Bach Tuoc',       emoji: '🐙', size: 6,  price: 340 },
  { id: 37, name: 'Ca Kiem',         emoji: '⚔️',  size: 6,  price: 380 },
  { id: 38, name: 'Tom Hum',         emoji: '🦞', size: 6,  price: 310 },
  { id: 39, name: 'Ca Heo',          emoji: '🐬', size: 6,  price: 420 },
  { id: 40, name: 'Ca Ngu Dai Duong', emoji: '🐟', size: 6, price: 360 },
  { id: 41, name: 'Cua Hoang De',    emoji: '🦀', size: 6,  price: 400 },
  { id: 42, name: 'Ca Noc Bien',     emoji: '🐡', size: 6,  price: 300 },
  // Size 7 (ID 43-49)
  { id: 43, name: 'Ca Map',          emoji: '🦈', size: 7,  price: 650 },
  { id: 44, name: 'Ca Mat Trang',    emoji: '🌙', size: 7,  price: 700 },
  { id: 45, name: 'Muc Khong Lo',    emoji: '🦑', size: 7,  price: 750 },
  { id: 46, name: 'Rua Bien',        emoji: '🐢', size: 7,  price: 680 },
  { id: 47, name: 'Bach Tuoc Xanh',  emoji: '🐙', size: 7,  price: 620 },
  { id: 48, name: 'Ca Duoi',         emoji: '🦈', size: 7,  price: 600 },
  { id: 49, name: 'Ca Voi Con',      emoji: '🐋', size: 7,  price: 720 },
  // Size 8 (ID 50-56)
  { id: 50, name: 'Ca Map Trang',    emoji: '🦈', size: 8,  price: 1500 },
  { id: 51, name: 'Ca Voi',          emoji: '🐋', size: 8,  price: 1800 },
  { id: 52, name: 'Ran Bien',        emoji: '🐲', size: 8,  price: 1600 },
  { id: 53, name: 'Ca Map Bua',      emoji: '🦈', size: 8,  price: 1400 },
  { id: 54, name: 'Bach Tuoc Do',    emoji: '🐙', size: 8,  price: 1550 },
  { id: 55, name: 'Ca Duoi Khong Lo', emoji: '🦈', size: 8, price: 1300 },
  { id: 56, name: 'Rua Bien Co',     emoji: '🐢', size: 8,  price: 1700 },
  // Size 9 (ID 57-62)
  { id: 57, name: 'Bach Tuoc Khong Lo', emoji: '🐙', size: 9, price: 3500 },
  { id: 58, name: 'Quai Vat Bien Sau',  emoji: '👹', size: 9, price: 5000 },
  { id: 59, name: 'Ca Voi Xanh',     emoji: '🐋', size: 9,  price: 4200 },
  { id: 60, name: 'Muc Dai Vuong',   emoji: '🦑', size: 9,  price: 3800 },
  { id: 61, name: 'Ca Den Long Khong Lo', emoji: '🔮', size: 9, price: 3000 },
  { id: 62, name: 'Ca Rong Bien',    emoji: '🐉', size: 9,  price: 4500 },
  // Size 10 (ID 63-68)
  { id: 63, name: 'Rong Bien',       emoji: '🐉', size: 10, price: 12000 },
  { id: 64, name: 'Long Vuong',      emoji: '🔱', size: 10, price: 25000 },
  { id: 65, name: 'Leviathan',       emoji: '🌊', size: 10, price: 18000 },
  { id: 66, name: 'Ngoc Trai Than',  emoji: '💎', size: 10, price: 22000 },
  { id: 67, name: 'Kraken',          emoji: '🦑', size: 10, price: 15000 },
  { id: 68, name: 'Than Sam Bien',   emoji: '⚡', size: 10, price: 10000 },
];

// Index nhanh
const FISH_BY_ID = {};
const FISH_BY_SIZE = {};
for (const f of FISH_LIST) {
  FISH_BY_ID[f.id] = f;
  if (!FISH_BY_SIZE[f.size]) FISH_BY_SIZE[f.size] = [];
  FISH_BY_SIZE[f.size].push(f);
}

// Parse FS prefix: "fs5" or "FS5" -> 5, plain "5" -> 5
function parseFsId(str) {
  const s = (str || '').trim().toLowerCase();
  const m = s.match(/^fs(\d+)$/);
  if (m) return parseInt(m[1]);
  return parseInt(s);
}

// Ten hien thi voi dau tieng Viet
const VIET_NAMES = {
  1: 'Dế Mèn', 2: 'Ốc Bươu', 3: 'Tép', 4: 'Cá Bống', 5: 'Cá Rô Con',
  6: 'Giày Cũ', 7: 'Lon Bia',
  8: 'Cá Vàng', 9: 'Cua Đồng', 10: 'Cá Rô', 11: 'Ếch Đồng', 12: 'Cá Diếc',
  13: 'Tôm Sú', 14: 'Cá Mương',
  15: 'Cá Trê', 16: 'Cá Lóc', 17: 'Tôm Càng Xanh', 18: 'Cá Chép', 19: 'Cá Mè',
  20: 'Rùa Nhỏ', 21: 'Cá Bống Mú',
  22: 'Lươn Điện', 23: 'Cá Trắm Đen', 24: 'Cá Chép Vàng', 25: 'Cá Lăng',
  26: 'Lươn Đồng', 27: 'Cá Ngát', 28: 'Rùa Sông',
  29: 'Mực Ống', 30: 'Cá Thu', 31: 'Cá Ngừ', 32: 'Cá Bớp', 33: 'Cá Nóc',
  34: 'Tôm Hùm Nhỏ', 35: 'Cá Cam',
  36: 'Bạch Tuộc', 37: 'Cá Kiếm', 38: 'Tôm Hùm', 39: 'Cá Heo',
  40: 'Cá Ngừ Đại Dương', 41: 'Cua Hoàng Đế', 42: 'Cá Nóc Biển',
  43: 'Cá Mập', 44: 'Cá Mặt Trăng', 45: 'Mực Khổng Lồ', 46: 'Rùa Biển',
  47: 'Bạch Tuộc Xanh', 48: 'Cá Đuối', 49: 'Cá Voi Con',
  50: 'Cá Mập Trắng', 51: 'Cá Voi', 52: 'Rắn Biển', 53: 'Cá Mập Búa',
  54: 'Bạch Tuộc Đỏ', 55: 'Cá Đuối Khổng Lồ', 56: 'Rùa Biển Cổ',
  57: 'Bạch Tuộc Khổng Lồ', 58: 'Quái Vật Biển Sâu', 59: 'Cá Voi Xanh',
  60: 'Mực Đại Vương', 61: 'Cá Đèn Lồng Khổng Lồ', 62: 'Cá Rồng Biển',
  63: 'Rồng Biển', 64: 'Long Vương', 65: 'Leviathan',
  66: 'Ngọc Trai Thần', 67: 'Kraken', 68: 'Thần Sấm Biển',
};

function fishDisplay(f) {
  return `${f.emoji} ${VIET_NAMES[f.id] || f.name}`;
}

// === CAN CAU (4 tiers) ===
const RODS = [
  { id: 'tre',          did: 'RD1', name: '🎣 Cần Tre',             price: 0,      maxSize: 3,  quality: 0    },
  { id: 'carbon',       did: 'RD2', name: '🎣 Cần Carbon',          price: 15000,  maxSize: 5,  quality: 0.08 },
  { id: 'vang',         did: 'RD3', name: '🎣 Cần Vàng',            price: 80000,  maxSize: 8,  quality: 0.18 },
  { id: 'truyenthuyet', did: 'RD4', name: '🔱 Cần Truyền Thuyết',   price: 350000, maxSize: 10, quality: 0.32 },
];

// === BAN DO (8 maps) ===
const MAPS = [
  { id: 'aolang',    name: '🏡 Ao Làng',     minSize: 1, maxSize: 3,  req: 0     },
  { id: 'songque',   name: '🌾 Sông Quê',    minSize: 1, maxSize: 4,  req: 200   },
  { id: 'honui',     name: '🏔️ Hồ Núi',      minSize: 2, maxSize: 5,  req: 600   },
  { id: 'damlay',    name: '🌿 Đầm Lầy',     minSize: 3, maxSize: 6,  req: 1500  },
  { id: 'cangbien',  name: '⚓ Cảng Biển',    minSize: 4, maxSize: 7,  req: 3000  },
  { id: 'bienkhoi',  name: '🌊 Biển Khơi',    minSize: 5, maxSize: 8,  req: 5500  },
  { id: 'daiduong',  name: '🌀 Đại Dương',    minSize: 6, maxSize: 9,  req: 9000  },
  { id: 'vucsau',    name: '🕳️ Vực Sâu',      minSize: 8, maxSize: 10, req: 14000 },
];

// === MOI CAU BAN TRONG SHOP ===
const BAIT_SHOP = [
  { did: 'BT1', size: 1, name: '🪱 Giun',              price: 0    },
  { did: 'BT2', size: 2, name: '🦐 Mồi Tôm',          price: 35   },
  { did: 'BT3', size: 3, name: '🐟 Mồi Cá Nhỏ',       price: 80   },
  { did: 'BT4', size: 4, name: '🐟 Mồi Cá Vừa',       price: 160  },
  { did: 'BT5', size: 5, name: '🐟 Mồi Cá Lớn',       price: 300  },
  { did: 'BT6', size: 6, name: '🐙 Mồi Mực',          price: 600  },
  { did: 'BT7', size: 7, name: '🦈 Mồi Cá Mập',       price: 1200 },
  { did: 'BT8', size: 8, name: '🐋 Mồi Cá Voi',       price: 2800 },
  { did: 'BT9', size: 9, name: '👹 Mồi Quái Vật',      price: 7000 },
];

// === RUONG KHO BAU ===
const TREASURES = [
  { minSize: 1,  maxSize: 3,  name: '📦 Rương Gỗ',           min: 20,   max: 80    },
  { minSize: 4,  maxSize: 5,  name: '📦 Rương Bạc',           min: 80,   max: 300   },
  { minSize: 6,  maxSize: 7,  name: '📦 Rương Vàng',          min: 300,  max: 1200  },
  { minSize: 8,  maxSize: 9,  name: '📦 Rương Kim Cương',     min: 1200, max: 4000  },
  { minSize: 10, maxSize: 10, name: '📦 Rương Truyền Thuyết', min: 4000, max: 15000 },
];

// === THUONG ALBUM THEO SIZE ===
const ALBUM_BONUS = {
  1: 300, 2: 800, 3: 2000, 4: 5000, 5: 12000,
  6: 25000, 7: 50000, 8: 100000, 9: 250000, 10: 500000,
};

const MAX_SIZE = 10;
const COOLDOWN = 8000; // 8 giay

// ============================================================
// HELPERS
// ============================================================

function getRod(rodId) {
  return RODS.find(r => r.id === rodId) || RODS[0];
}

function getMap(mapId) {
  return MAPS.find(m => m.id === mapId) || MAPS[0];
}

function getRodIndex(rodId) {
  return RODS.findIndex(r => r.id === rodId);
}

// Di chuyen du lieu cu (name-based) sang ID-based
function migrateOldData(p) {
  // Migrate inventory: { name, price, size } -> { id, size, price }
  if (p.inventory && p.inventory.length > 0 && p.inventory[0].name && !p.inventory[0].id) {
    const newInv = [];
    for (const item of p.inventory) {
      const found = FISH_LIST.find(f => {
        const vn = VIET_NAMES[f.id] || f.name;
        const itemClean = (item.name || '').replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').trim();
        return vn === itemClean || f.name === itemClean ||
               (item.name || '').includes(vn) || (item.name || '').includes(f.name);
      });
      if (found) {
        newInv.push({ id: found.id, size: found.size, price: item.price || found.price });
      }
      // Bo qua item khong tim thay (mat du lieu cu)
    }
    p.inventory = newInv;
  }

  // Migrate album: { "emoji Name": { count, size } } -> { fishId: count }
  if (p.album && typeof p.album === 'object') {
    const keys = Object.keys(p.album);
    if (keys.length > 0 && isNaN(parseInt(keys[0]))) {
      const newAlbum = {};
      for (const [oldName, data] of Object.entries(p.album)) {
        const found = FISH_LIST.find(f => {
          const vn = VIET_NAMES[f.id] || f.name;
          const clean = oldName.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').trim();
          return vn === clean || f.name === clean || oldName.includes(vn) || oldName.includes(f.name);
        });
        if (found) {
          newAlbum[found.id] = (typeof data === 'object') ? (data.count || 1) : (data || 1);
        }
      }
      p.album = newAlbum;
    }
  }

  // Migrate bait: { name, size } -> { id, size } or { id: 0 } for worm
  if (p.bait && p.bait.name && p.bait.id === undefined) {
    if (p.bait.name.includes('Giun') || p.bait.name.includes('giun')) {
      p.bait = { id: 0, size: 1 };
    } else {
      const found = FISH_LIST.find(f => {
        const vn = VIET_NAMES[f.id] || f.name;
        return (p.bait.name || '').includes(vn) || (p.bait.name || '').includes(f.name);
      });
      if (found) {
        p.bait = { id: found.id, size: found.size };
      } else {
        p.bait = { id: 0, size: 1 };
      }
    }
  }
}

function ensure(p) {
  if (!p.bait) p.bait = { id: 0, size: 1 }; // Giun mien phi
  if (p.bait.id === undefined) p.bait = { id: 0, size: 1 };
  if (!p.rod) p.rod = 'tre';
  if (!p.fishMap) p.fishMap = 'aolang';
  if (!p.album) p.album = {};
  if (!p.albumRewards) p.albumRewards = [];
  if (!p.inventory) p.inventory = [];
  if (!p.fishCaught) p.fishCaught = 0;
  migrateOldData(p);
}

function baitDisplay(bait) {
  if (!bait || bait.id === 0) return '🪱 Giun (S1)';
  const f = FISH_BY_ID[bait.id];
  if (!f) return '🪱 Giun (S1)';
  return `${fishDisplay(f)} (S${bait.size})`;
}

// Random 1 con ca tu pool cua size do
function randomFish(size) {
  const pool = FISH_BY_SIZE[size];
  if (!pool || pool.length === 0) return FISH_BY_SIZE[1][0];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Tim treasure phu hop voi size moi
function getTreasure(baitSize) {
  const t = TREASURES.find(tr => baitSize >= tr.minSize && baitSize <= tr.maxSize);
  if (!t) return { name: TREASURES[0].name, xu: 20 };
  const xu = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
  return { name: t.name, xu };
}

// Roll ket qua dua tren rod quality
function rollOutcome(quality) {
  let catchOk = 0.48;
  let catchShrink = 0.22;
  let nibble = 0.10;
  let snap = 0.06;
  let treasure = 0.07;
  let perfect = 0.07;

  // Rod quality: chuyen % tu xau sang tot
  catchOk += quality * 0.35;
  perfect += quality * 0.25;
  treasure += quality * 0.15;
  catchShrink -= quality * 0.30;
  nibble -= quality * 0.25;
  snap -= quality * 0.20;

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

// Roll size ca bat duoc
function rollFishSize(baitSize, isPerfect) {
  if (isPerfect) {
    const bonus = Math.random() < 0.6 ? 1 : 2;
    return Math.min(baitSize + bonus, MAX_SIZE);
  }
  const roll = Math.random();
  if (roll < 0.15 && baitSize > 1) return baitSize - 1;
  if (roll < 0.75) return baitSize;
  return Math.min(baitSize + 1, MAX_SIZE);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function updateAlbum(p, fishId) {
  if (!p.album[fishId]) p.album[fishId] = 0;
  p.album[fishId]++;
}

function checkAlbumCompletion(p, size, economy, playerId) {
  const key = `size_${size}`;
  if (p.albumRewards.includes(key)) return null;
  const pool = FISH_BY_SIZE[size];
  if (!pool) return null;
  const allCaught = pool.every(f => (p.album[f.id] || 0) > 0);
  if (!allCaught) return null;

  p.albumRewards.push(key);
  const bonus = ALBUM_BONUS[size] || 0;
  if (bonus > 0) economy.addXu(playerId, bonus);
  return `🏆 HOÀN THÀNH ALBUM SIZE ${size}!\n+${bonus.toLocaleString()} xu thưởng!`;
}

// ============================================================
// LENH CHINH
// ============================================================

// === /fish - Tha cau ===
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

  // Kiem tra moi
  if (!p.bait || p.bait.size <= 0) {
    p.bait = null;
    economy._save();
    return '🚫 Hết mồi rồi!\n/moi 0 - Giun miễn phí\n/moi <ID> - Dùng cá làm mồi\n/shop - Mua mồi';
  }

  const rod = getRod(p.rod);
  const map = getMap(p.fishMap);
  const bait = p.bait;

  // Kiem tra can cau co du manh cho map nay khong
  if (rod.maxSize < map.minSize) {
    return `🚫 ${rod.name} quá yếu cho ${map.name}!\nCần câu tối đa S${rod.maxSize}, bản đồ yêu cầu tối thiểu S${map.minSize}.\n/shop để nâng cấp cần câu.`;
  }

  p.lastFish = new Date().toISOString();

  // Roll ket qua
  const outcome = rollOutcome(rod.quality);

  let msg = `🎣 Thả câu tại ${map.name}\nMồi: ${baitDisplay(bait)}\n`;

  // === KHO BAU ===
  if (outcome === 'treasure') {
    const t = getTreasure(bait.size);
    economy.addXu(player, t.xu);
    economy._save();
    msg += `\n💰 TÌM THẤY KHO BÁU!\n${t.name} → +${t.xu.toLocaleString()} xu`;
    msg += `\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
    return msg;
  }

  // === CA NHO GAM MOI ===
  if (outcome === 'nibble') {
    bait.size -= 1;
    if (bait.size <= 0) {
      p.bait = null;
      msg += `\n🐟 Cá nhỏ gặm sạch mồi! Mất mồi!`;
      msg += `\n/moi 0 hoặc /shop để lấy mồi mới`;
    } else {
      msg += `\n🐟 Cá nhỏ gặm mồi! Mồi giảm → S${bait.size}`;
    }
    economy._save();
    return msg;
  }

  // === CA LON CAN DUT DAY ===
  if (outcome === 'snap') {
    const lostBait = baitDisplay(bait);
    p.bait = null;
    economy._save();
    msg += `\n💥 Cá lớn cắn đứt dây! Mất ${lostBait}!`;
    msg += `\n/moi 0 hoặc /moi <ID> để câu tiếp`;
    return msg;
  }

  // === BAT DUOC CA ===
  const isPerfect = outcome === 'perfect';
  let fishSize = rollFishSize(bait.size, isPerfect);
  // Clamp theo map va rod
  const effectiveMax = Math.min(map.maxSize, rod.maxSize);
  fishSize = clamp(fishSize, map.minSize, effectiveMax);

  const fish = randomFish(fishSize);

  // Them ca vao kho
  p.inventory.push({ id: fish.id, size: fish.size, price: fish.price });
  p.fishCaught++;
  updateAlbum(p, fish.id);

  if (isPerfect) {
    msg += `\n🎯 CÂU HOÀN HẢO!`;
  }

  msg += `\n${fishDisplay(fish)} [FS${fish.id}] | S${fishSize} | ${fish.price.toLocaleString()} xu`;

  // Xu ly moi sau khi cau
  if (outcome === 'catch_shrink') {
    bait.size -= 1;
    if (bait.size <= 0) {
      p.bait = null;
      msg += `\n⚠️ Mồi bị gặm hết!`;
    } else {
      msg += `\n⚠️ Mồi bị gặm → S${bait.size}`;
    }
  }

  // Kiem tra album
  const albumMsg = checkAlbumCompletion(p, fishSize, economy, player);
  if (albumMsg) msg += `\n\n${albumMsg}`;

  // Goi y dung ca lam moi
  if (fishSize > bait.size && fishSize > 1) {
    msg += `\n💡 /moi fs${fish.id} để dùng làm mồi S${fishSize}!`;
  }

  economy._save();
  return msg;
}

// === /moi [id] - Xem/doi moi cau ===
function useBait(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const query = (args || '').trim();

  // Khong co args -> hien moi hien tai
  if (!query) {
    if (!p.bait || p.bait.size <= 0) {
      return '🪱 Chưa có mồi!\n/moi 0 - Giun miễn phí\n/moi <ID> - Dùng cá trong kho\n/shop - Mua mồi';
    }
    return `🪱 Mồi hiện tại: ${baitDisplay(p.bait)}\n/fish để thả câu`;
  }

  // "0" hoac "giun" -> giun mien phi
  if (query === '0' || query.toLowerCase() === 'giun' || query.toLowerCase() === 'worm') {
    p.bait = { id: 0, size: 1 };
    economy._save();
    return '🪱 Đã lấy Giun làm mồi (S1).\n/fish để thả câu!';
  }

  // Tim ca trong kho theo fish ID (FS prefix)
  const fishId = parseFsId(query);
  if (isNaN(fishId)) {
    return `❌ Dùng ID cá! VD: /moi fs15\n/inv để xem kho và ID.`;
  }

  const idx = p.inventory.findIndex(item => item.id === fishId);
  if (idx === -1) {
    const fishInfo = FISH_BY_ID[fishId];
    if (fishInfo) {
      return `❌ Không có ${fishDisplay(fishInfo)} trong kho!\n/inv xem kho đồ`;
    }
    return `❌ Không tìm thấy cá FS${fishId}!\n/inv xem kho đồ`;
  }

  const item = p.inventory.splice(idx, 1)[0];
  const fishInfo = FISH_BY_ID[item.id];
  p.bait = { id: item.id, size: item.size };

  economy._save();
  return `🪱 Đã dùng ${fishDisplay(fishInfo)} (S${item.size}) làm mồi!\n/fish để thả câu!`;
}

// === /shop ===
function shop(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const xu = economy.getBalance(player).xu;
  const curRodIdx = getRodIndex(p.rod);

  let msg = `🏪 CỬA HÀNG\nVí: ${xu.toLocaleString()} xu\n`;

  // Can cau
  msg += `\n--- CẦN CÂU ---\n`;
  for (let i = 0; i < RODS.length; i++) {
    const r = RODS[i];
    if (i === curRodIdx) {
      msg += `[${r.did}] ${r.name} [✓] (max S${r.maxSize})\n`;
    } else if (i < curRodIdx) {
      msg += `[${r.did}] ${r.name} [✓]\n`;
    } else {
      msg += `[${r.did}] ${r.name} - ${r.price.toLocaleString()} xu (max S${r.maxSize})\n`;
    }
  }

  // Moi cau
  msg += `\n--- MỒI CÂU ---\n`;
  for (const b of BAIT_SHOP) {
    const cost = b.price > 0 ? `${b.price.toLocaleString()} xu` : 'Free';
    msg += `[${b.did}] ${b.name} (S${b.size}) - ${cost}\n`;
  }

  msg += `\n/buy <ID>\nVD: /buy rd2 | /buy bt3`;
  return msg;
}

// === /buy <item> ===
function buy(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (!args) return '/buy <ID hoặc tên>\nVD: /buy rd2 | /buy bt3 | /buy carbon';
  const q = args.trim().toLowerCase();

  // Tim rod (by did, id, or name)
  const rodIdx = RODS.findIndex(r =>
    r.did.toLowerCase() === q || r.id === q || r.name.toLowerCase().includes(q)
  );
  if (rodIdx >= 0) {
    const rod = RODS[rodIdx];
    const curIdx = getRodIndex(p.rod);
    if (rodIdx <= curIdx) return `Đã có ${rod.name} rồi!`;
    if (rodIdx > curIdx + 1) return `Phải mua ${RODS[curIdx + 1].name} trước! (${RODS[curIdx + 1].price.toLocaleString()} xu)`;
    const xu = economy.getBalance(player).xu;
    if (xu < rod.price) return `Thiếu xu! Cần ${rod.price.toLocaleString()}, có ${xu.toLocaleString()} xu.`;
    economy.removeXu(player, rod.price);
    p.rod = rod.id;
    economy._save();
    return `🎣 Đã mua [${rod.did}] ${rod.name}! (max S${rod.maxSize})\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // Tim moi by BT ID: /buy bt3
  const btMatch = q.match(/^bt(\d+)$/);
  if (btMatch) {
    const btNum = parseInt(btMatch[1]);
    const baitItem = BAIT_SHOP.find(b => b.did === `BT${btNum}`);
    if (baitItem) return _buyBait(p, baitItem, player, economy);
    return `Không tìm thấy mồi BT${btNum}! /shop để xem.`;
  }

  // Tim moi: /buy moi 3 hoac /buy moi tom
  const baitMatch = q.match(/^m[oồ]i\s+(.+)$/);
  if (baitMatch) {
    const baitQ = baitMatch[1].trim();
    const sizeNum = parseInt(baitQ);
    let baitItem;
    if (!isNaN(sizeNum)) baitItem = BAIT_SHOP.find(b => b.size === sizeNum);
    if (!baitItem) baitItem = BAIT_SHOP.find(b => b.name.toLowerCase().includes(baitQ));
    if (baitItem) return _buyBait(p, baitItem, player, economy);
    return `Không tìm thấy mồi "${baitQ}"! /shop để xem.`;
  }

  // Tim moi theo ten truc tiep
  const baitDirect = BAIT_SHOP.find(b => b.name.toLowerCase().includes(q) || q === `${b.size}` || b.did.toLowerCase() === q);
  if (baitDirect) return _buyBait(p, baitDirect, player, economy);

  return `Không tìm thấy "${args}"! /shop để xem danh sách.`;
}

// Helper mua moi
function _buyBait(p, baitItem, player, economy) {
  const xu = economy.getBalance(player).xu;
  if (baitItem.price > 0 && xu < baitItem.price) return `Thiếu xu! Cần ${baitItem.price.toLocaleString()}, có ${xu.toLocaleString()} xu.`;
  if (baitItem.price > 0) economy.removeXu(player, baitItem.price);
  p.bait = { id: 0, size: baitItem.size };
  economy._save();
  const cost = baitItem.price > 0 ? `(-${baitItem.price.toLocaleString()} xu)` : '(Free)';
  return `🪱 Đã mua [${baitItem.did}] ${baitItem.name} (S${baitItem.size}) ${cost}\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\n/fish để thả câu!`;
}

// === /sell [id|all] ===
function sell(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const q = (args || '').trim().toLowerCase();

  // /sell all
  if (q === 'all') {
    if (p.inventory.length === 0) return 'Kho trống!';
    const total = p.inventory.reduce((s, i) => s + i.price, 0);
    const count = p.inventory.length;
    p.inventory = [];
    economy.addXu(player, total);
    economy._save();
    return `💰 Đã bán ${count} con = ${total.toLocaleString()} xu!\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // /sell <fsID> - ban theo loai ca (accept "fs5" or "5")
  const fishId = parseFsId(q);
  if (!isNaN(fishId) && fishId > 0) {
    const indices = [];
    let total = 0;
    for (let i = 0; i < p.inventory.length; i++) {
      if (p.inventory[i].id === fishId) {
        indices.push(i);
        total += p.inventory[i].price;
      }
    }
    if (indices.length === 0) {
      const fishInfo = FISH_BY_ID[fishId];
      if (fishInfo) return `Không có ${fishDisplay(fishInfo)} trong kho!`;
      return `Không tìm thấy cá FS${fishId}!`;
    }
    const fishInfo = FISH_BY_ID[fishId];
    for (let i = indices.length - 1; i >= 0; i--) {
      p.inventory.splice(indices[i], 1);
    }
    economy.addXu(player, total);
    economy._save();
    return `💰 Bán ${indices.length}x ${fishDisplay(fishInfo)} [FS${fishId}] = ${total.toLocaleString()} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // /sell (khong co args) - ban con cuoi cung
  if (p.inventory.length === 0) return 'Kho trống! /fish để câu cá.';
  const item = p.inventory.pop();
  const fishInfo = FISH_BY_ID[item.id];
  economy.addXu(player, item.price);
  economy._save();
  return `💰 Bán ${fishInfo ? fishDisplay(fishInfo) : `FS${item.id}`} = ${item.price.toLocaleString()} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\nCòn ${p.inventory.length} con trong kho`;
}

// === /inventory ===
function inventory(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (p.inventory.length === 0) return '📦 Kho trống! /fish để câu cá.';

  // Nhom theo fish ID
  const groups = {};
  let totalValue = 0;
  for (const item of p.inventory) {
    const key = item.id;
    if (!groups[key]) groups[key] = { count: 0, total: 0, size: item.size };
    groups[key].count++;
    groups[key].total += item.price;
    totalValue += item.price;
  }

  let msg = `📦 KHO ĐỒ (${p.inventory.length} con):\n`;
  // Sap xep theo size giam dan
  const sorted = Object.entries(groups).sort((a, b) => b[1].size - a[1].size);
  for (const [idStr, d] of sorted) {
    const fid = parseInt(idStr);
    const f = FISH_BY_ID[fid];
    const name = f ? fishDisplay(f) : `#${fid}`;
    msg += `${name} [FS${fid}] x${d.count} S${d.size} (${d.total.toLocaleString()} xu)\n`;
  }

  msg += `\nTổng: ${totalValue.toLocaleString()} xu`;
  msg += `\n/sell all | /sell fs<ID> | /moi fs<ID> làm mồi`;
  return msg;
}

// === /gear ===
function gear(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const rod = getRod(p.rod);
  const map = getMap(p.fishMap);

  let msg = `🎒 TRANG BỊ:\n`;
  msg += `Cần: [${rod.did}] ${rod.name} (max S${rod.maxSize})\n`;
  msg += `Mồi: ${p.bait ? baitDisplay(p.bait) : '❌ Chưa có'}\n`;
  msg += `Bản đồ: ${map.name} (S${map.minSize}-${map.maxSize})\n`;
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
    const pool = FISH_BY_SIZE[size];
    if (!pool) continue;
    const caughtHere = pool.filter(f => (p.album[f.id] || 0) > 0);

    totalSpecies += pool.length;
    caught += caughtHere.length;

    const done = p.albumRewards.includes(`size_${size}`);

    msg += `\nSize ${size} [${caughtHere.length}/${pool.length}]`;
    if (done) msg += ' ✅';
    msg += ` (thưởng: ${ALBUM_BONUS[size].toLocaleString()} xu)\n`;

    for (const fish of pool) {
      const cnt = p.album[fish.id] || 0;
      if (cnt > 0) {
        msg += `  ✓ ${fishDisplay(fish)} [FS${fish.id}] x${cnt}\n`;
      } else {
        msg += `  ❓ ???\n`;
      }
    }
  }

  msg += `\nTổng: ${caught}/${totalSpecies} loài`;
  return msg;
}

// === /go <map> - Doi ban do ===
function goMap(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (!args || !args.trim()) {
    return `📍 Đang ở: ${getMap(p.fishMap).name}\n/map để xem danh sách bản đồ\n/go <tên> để di chuyển`;
  }

  const q = args.trim().toLowerCase();

  const target = MAPS.find(m =>
    m.id === q ||
    m.name.toLowerCase().includes(q) ||
    q.includes(m.id.replace(/[^a-z]/g, ''))
  );

  if (!target) return `❌ Không tìm thấy bản đồ "${args}"!\n/map để xem danh sách.`;

  if (p.fishCaught < target.req) {
    return `🔒 ${target.name} yêu cầu ${target.req.toLocaleString()} cá đã bắt!\nBạn mới bắt ${p.fishCaught.toLocaleString()} con.`;
  }

  if (p.fishMap === target.id) {
    return `📍 Đang ở ${target.name} rồi!`;
  }

  // Kiem tra can cau co du khong
  const rod = getRod(p.rod);
  if (rod.maxSize < target.minSize) {
    return `🚫 ${rod.name} (max S${rod.maxSize}) quá yếu cho ${target.name} (min S${target.minSize})!\n/shop để nâng cấp.`;
  }

  p.fishMap = target.id;
  economy._save();
  return `📍 Đã di chuyển đến ${target.name}!\nSize cá: S${target.minSize}-${target.maxSize}\n/fish để thả câu!`;
}

// === /map - Danh sach ban do ===
function mapList(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  let msg = '🗺️ DANH SÁCH BẢN ĐỒ\n';
  const currentMap = p.fishMap || 'aolang';

  for (const m of MAPS) {
    const unlocked = p.fishCaught >= m.req;
    const isCurrent = m.id === currentMap;

    if (isCurrent) {
      msg += `▶ ${m.name} (S${m.minSize}-${m.maxSize}) [ĐANG Ở]\n`;
    } else if (unlocked) {
      msg += `  ${m.name} (S${m.minSize}-${m.maxSize}) ✅\n`;
    } else {
      msg += `  🔒 ${m.name} (S${m.minSize}-${m.maxSize}) - cần ${m.req.toLocaleString()} cá\n`;
    }
  }

  msg += `\nĐã bắt: ${p.fishCaught.toLocaleString()} cá`;
  msg += `\n/go <tên> để di chuyển`;
  return msg;
}

function handleInput() { return null; }

module.exports = { start, sell, inventory, shop, buy, gear, album, useBait, handleInput, goMap, mapList, ensure };

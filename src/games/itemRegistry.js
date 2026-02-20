// ============================================================
// ITEM REGISTRY — Unified ID system for ALL game items
// Every item in the game has a unique numeric ID
// ============================================================

// === CATEGORY CONSTANTS ===
const CAT = {
  ANIMAL:  'animal',
  FISH:    'fish',
  WEAPON:  'weapon',
  TRAP:    'trap',
  ROD:     'rod',
  BAIT:    'bait',
  GEM:     'gem',
  LOOTBOX: 'lootbox',
};

// === RARITY LEVELS ===
const RARITY = {
  COMMON:    'common',
  UNCOMMON:  'uncommon',
  RARE:      'rare',
  EPIC:      'epic',
  LEGENDARY: 'legendary',
};

const RARITY_EMOJI = {
  [RARITY.COMMON]:    '⚪',
  [RARITY.UNCOMMON]:  '🟢',
  [RARITY.RARE]:      '🔵',
  [RARITY.EPIC]:      '🟣',
  [RARITY.LEGENDARY]: '🟡',
};

// ============================================================
// ANIMALS (ID 1–68) — Hunted, go to Zoo
// ============================================================
const ANIMALS = [
  // Level 1 — Common (ID 1-7)
  { id: 1,  name: '🐀 Chuột Cống',     level: 1, rarity: RARITY.COMMON, atk: 2,  hp: 8,   price: 3   },
  { id: 2,  name: '🦎 Thạch Sùng',      level: 1, rarity: RARITY.COMMON, atk: 3,  hp: 6,   price: 5   },
  { id: 3,  name: '🐍 Rắn Mối',         level: 1, rarity: RARITY.COMMON, atk: 4,  hp: 7,   price: 8   },
  { id: 4,  name: '🦇 Dơi Nhỏ',         level: 1, rarity: RARITY.COMMON, atk: 3,  hp: 5,   price: 10  },
  { id: 5,  name: '🐺 Chó Hoang',        level: 1, rarity: RARITY.COMMON, atk: 5,  hp: 10,  price: 12  },
  { id: 6,  name: '🕷️ Nhện Độc',        level: 1, rarity: RARITY.COMMON, atk: 4,  hp: 4,   price: 7   },
  { id: 7,  name: '🐛 Sâu Bọ',          level: 1, rarity: RARITY.COMMON, atk: 1,  hp: 3,   price: 2   },
  // Level 2 — Common (ID 8-14)
  { id: 8,  name: '🐗 Lợn Rừng',        level: 2, rarity: RARITY.COMMON, atk: 8,  hp: 18,  price: 18  },
  { id: 9,  name: '🦊 Cáo Đỏ',          level: 2, rarity: RARITY.COMMON, atk: 10, hp: 14,  price: 22  },
  { id: 10, name: '🐺 Sói Xám',          level: 2, rarity: RARITY.COMMON, atk: 9,  hp: 16,  price: 20  },
  { id: 11, name: '🦅 Đại Bàng',         level: 2, rarity: RARITY.COMMON, atk: 11, hp: 12,  price: 25  },
  { id: 12, name: '🐍 Rắn Hổ Mang',     level: 2, rarity: RARITY.COMMON, atk: 12, hp: 10,  price: 16  },
  { id: 13, name: '🦌 Nai Rừng',         level: 2, rarity: RARITY.COMMON, atk: 6,  hp: 20,  price: 24  },
  { id: 14, name: '🐻 Gấu Con',          level: 2, rarity: RARITY.COMMON, atk: 7,  hp: 15,  price: 15  },
  // Level 3 — Uncommon (ID 15-21)
  { id: 15, name: '🐻 Gấu Nâu',         level: 3, rarity: RARITY.UNCOMMON, atk: 15, hp: 30,  price: 40  },
  { id: 16, name: '🐅 Hổ Con',           level: 3, rarity: RARITY.UNCOMMON, atk: 18, hp: 25,  price: 50  },
  { id: 17, name: '🦍 Khỉ Đột',          level: 3, rarity: RARITY.UNCOMMON, atk: 16, hp: 28,  price: 45  },
  { id: 18, name: '🐊 Cá Sấu Nhỏ',      level: 3, rarity: RARITY.UNCOMMON, atk: 14, hp: 32,  price: 38  },
  { id: 19, name: '🦅 Phượng Hoàng',     level: 3, rarity: RARITY.UNCOMMON, atk: 20, hp: 22,  price: 55  },
  { id: 20, name: '🐺 Sói Trắng',        level: 3, rarity: RARITY.UNCOMMON, atk: 17, hp: 26,  price: 42  },
  { id: 21, name: '🐃 Trâu Rừng',        level: 3, rarity: RARITY.UNCOMMON, atk: 13, hp: 35,  price: 35  },
  // Level 4 — Uncommon (ID 22-28)
  { id: 22, name: '🐅 Hổ Bengal',         level: 4, rarity: RARITY.UNCOMMON, atk: 25, hp: 40,  price: 85  },
  { id: 23, name: '🐊 Cá Sấu',           level: 4, rarity: RARITY.UNCOMMON, atk: 22, hp: 48,  price: 90  },
  { id: 24, name: '🦏 Tê Giác Con',       level: 4, rarity: RARITY.UNCOMMON, atk: 20, hp: 55,  price: 110 },
  { id: 25, name: '🐘 Voi Con',           level: 4, rarity: RARITY.UNCOMMON, atk: 18, hp: 60,  price: 100 },
  { id: 26, name: '🦁 Sư Tử Trẻ',        level: 4, rarity: RARITY.UNCOMMON, atk: 28, hp: 38,  price: 80  },
  { id: 27, name: '🐻‍❄️ Gấu Bắc Cực',  level: 4, rarity: RARITY.UNCOMMON, atk: 23, hp: 45,  price: 75  },
  { id: 28, name: '🦬 Bò Tót',            level: 4, rarity: RARITY.UNCOMMON, atk: 21, hp: 50,  price: 70  },
  // Level 5 — Rare (ID 29-35)
  { id: 29, name: '🦁 Sư Tử',            level: 5, rarity: RARITY.RARE, atk: 35, hp: 60,  price: 170 },
  { id: 30, name: '🐘 Voi Châu Phi',     level: 5, rarity: RARITY.RARE, atk: 28, hp: 80,  price: 200 },
  { id: 31, name: '🦏 Tê Giác',          level: 5, rarity: RARITY.RARE, atk: 32, hp: 70,  price: 190 },
  { id: 32, name: '🐊 Cá Sấu Khổng Lồ', level: 5, rarity: RARITY.RARE, atk: 30, hp: 75,  price: 160 },
  { id: 33, name: '🦍 King Kong Nhỏ',    level: 5, rarity: RARITY.RARE, atk: 38, hp: 65,  price: 180 },
  { id: 34, name: '🐅 Hổ Trắng',         level: 5, rarity: RARITY.RARE, atk: 36, hp: 55,  price: 150 },
  { id: 35, name: '🐻‍❄️ Gấu Bắc Cực Lớn', level: 5, rarity: RARITY.RARE, atk: 33, hp: 68, price: 175 },
  // Level 6 — Rare (ID 36-42)
  { id: 36, name: '🐉 Rồng Con',          level: 6, rarity: RARITY.RARE, atk: 45, hp: 90,  price: 350 },
  { id: 37, name: '🦖 Khủng Long Nhỏ',    level: 6, rarity: RARITY.RARE, atk: 42, hp: 95,  price: 320 },
  { id: 38, name: '👹 Quỷ Đỏ',            level: 6, rarity: RARITY.RARE, atk: 50, hp: 85,  price: 380 },
  { id: 39, name: '🧟 Zombie Khổng Lồ',   level: 6, rarity: RARITY.RARE, atk: 40, hp: 100, price: 340 },
  { id: 40, name: '🦂 Bọ Cạp Vua',        level: 6, rarity: RARITY.RARE, atk: 48, hp: 80,  price: 300 },
  { id: 41, name: '🕷️ Nhện Khổng Lồ',    level: 6, rarity: RARITY.RARE, atk: 44, hp: 88,  price: 360 },
  { id: 42, name: '🐍 Mãng Xà',           level: 6, rarity: RARITY.RARE, atk: 52, hp: 82,  price: 400 },
  // Level 7 — Epic (ID 43-49)
  { id: 43, name: '🐉 Rồng Lửa',          level: 7, rarity: RARITY.EPIC, atk: 60,  hp: 120, price: 650  },
  { id: 44, name: '🧛 Ma Cà Rồng',        level: 7, rarity: RARITY.EPIC, atk: 65,  hp: 110, price: 700  },
  { id: 45, name: '👹 Quỷ Sừng',           level: 7, rarity: RARITY.EPIC, atk: 62,  hp: 115, price: 680  },
  { id: 46, name: '🦖 T-Rex',              level: 7, rarity: RARITY.EPIC, atk: 70,  hp: 130, price: 720  },
  { id: 47, name: '👻 Bóng Ma Cổ Đại',    level: 7, rarity: RARITY.EPIC, atk: 58,  hp: 105, price: 640  },
  { id: 48, name: '🧟 Xác Ướp',            level: 7, rarity: RARITY.EPIC, atk: 55,  hp: 125, price: 600  },
  { id: 49, name: '🐲 Thuồng Luồng',      level: 7, rarity: RARITY.EPIC, atk: 68,  hp: 135, price: 750  },
  // Level 8 — Epic (ID 50-56)
  { id: 50, name: '🐉 Rồng Băng',              level: 8, rarity: RARITY.EPIC, atk: 78,  hp: 160, price: 1400 },
  { id: 51, name: '👿 Ác Quỷ',                  level: 8, rarity: RARITY.EPIC, atk: 85,  hp: 150, price: 1700 },
  { id: 52, name: '🦕 Brontosaurus',            level: 8, rarity: RARITY.EPIC, atk: 72,  hp: 180, price: 1500 },
  { id: 53, name: '👹 Oni Đỏ',                  level: 8, rarity: RARITY.EPIC, atk: 80,  hp: 155, price: 1600 },
  { id: 54, name: '🧙 Phù Thủy Bóng Tối',     level: 8, rarity: RARITY.EPIC, atk: 88,  hp: 140, price: 1300 },
  { id: 55, name: '☠️ Thần Chết Con',           level: 8, rarity: RARITY.EPIC, atk: 82,  hp: 145, price: 1450 },
  { id: 56, name: '🐲 Hydra',                   level: 8, rarity: RARITY.EPIC, atk: 75,  hp: 170, price: 1550 },
  // Level 9 — Legendary (ID 57-62)
  { id: 57, name: '🐉 Rồng Thần',                  level: 9, rarity: RARITY.LEGENDARY, atk: 95,  hp: 200, price: 3500 },
  { id: 58, name: '👿 Chúa Quỷ',                    level: 9, rarity: RARITY.LEGENDARY, atk: 110, hp: 220, price: 4500 },
  { id: 59, name: '💀 Thần Chết',                   level: 9, rarity: RARITY.LEGENDARY, atk: 105, hp: 190, price: 4000 },
  { id: 60, name: '🧙‍♂️ Pháp Sư Tối Thượng',     level: 9, rarity: RARITY.LEGENDARY, atk: 100, hp: 210, price: 3800 },
  { id: 61, name: '🐲 Rồng 9 Đầu',                 level: 9, rarity: RARITY.LEGENDARY, atk: 90,  hp: 230, price: 3200 },
  { id: 62, name: '⚡ Thần Sấm',                    level: 9, rarity: RARITY.LEGENDARY, atk: 115, hp: 185, price: 4200 },
  // Level 10 — Legendary (ID 63-68)
  { id: 63, name: '🐉 Rồng Vàng',              level: 10, rarity: RARITY.LEGENDARY, atk: 130, hp: 300, price: 12000 },
  { id: 64, name: '👑 Chúa Tể Bóng Tối',       level: 10, rarity: RARITY.LEGENDARY, atk: 150, hp: 350, price: 20000 },
  { id: 65, name: '💀 Tử Thần',                 level: 10, rarity: RARITY.LEGENDARY, atk: 140, hp: 280, price: 16000 },
  { id: 66, name: '🌋 Titan Lửa',               level: 10, rarity: RARITY.LEGENDARY, atk: 160, hp: 400, price: 25000 },
  { id: 67, name: '🌊 Titan Nước',              level: 10, rarity: RARITY.LEGENDARY, atk: 120, hp: 320, price: 14000 },
  { id: 68, name: '⚡ Titan Sấm',               level: 10, rarity: RARITY.LEGENDARY, atk: 145, hp: 280, price: 18000 },
];

// Index by ID and level
const ANIMAL_BY_ID = {};
const ANIMAL_BY_LEVEL = {};
for (const a of ANIMALS) {
  ANIMAL_BY_ID[a.id] = a;
  if (!ANIMAL_BY_LEVEL[a.level]) ANIMAL_BY_LEVEL[a.level] = [];
  ANIMAL_BY_LEVEL[a.level].push(a);
}

// ============================================================
// FISH (ID 101–168) — Caught, sold for xu
// ============================================================
const FISH = [
  // Size 1 (ID 101-107)
  { id: 101, name: 'Dế Mèn',              emoji: '🦗', size: 1,  price: 3    },
  { id: 102, name: 'Ốc Bươu',             emoji: '🐌', size: 1,  price: 5    },
  { id: 103, name: 'Tép',                  emoji: '🦐', size: 1,  price: 4    },
  { id: 104, name: 'Cá Bống',              emoji: '🐟', size: 1,  price: 6    },
  { id: 105, name: 'Cá Rô Con',            emoji: '🐟', size: 1,  price: 8    },
  { id: 106, name: 'Giày Cũ',              emoji: '👟', size: 1,  price: 1    },
  { id: 107, name: 'Lon Bia',              emoji: '🥫', size: 1,  price: 2    },
  // Size 2 (ID 108-114)
  { id: 108, name: 'Cá Vàng',              emoji: '🐠', size: 2,  price: 12   },
  { id: 109, name: 'Cua Đồng',             emoji: '🦀', size: 2,  price: 15   },
  { id: 110, name: 'Cá Rô',                emoji: '🐟', size: 2,  price: 14   },
  { id: 111, name: 'Ếch Đồng',             emoji: '🐸', size: 2,  price: 18   },
  { id: 112, name: 'Cá Diếc',              emoji: '🐟', size: 2,  price: 10   },
  { id: 113, name: 'Tôm Sú',               emoji: '🦐', size: 2,  price: 20   },
  { id: 114, name: 'Cá Mương',             emoji: '🐟', size: 2,  price: 11   },
  // Size 3 (ID 115-121)
  { id: 115, name: 'Cá Trê',               emoji: '🐟', size: 3,  price: 30   },
  { id: 116, name: 'Cá Lóc',               emoji: '🐟', size: 3,  price: 50   },
  { id: 117, name: 'Tôm Càng Xanh',        emoji: '🦐', size: 3,  price: 55   },
  { id: 118, name: 'Cá Chép',              emoji: '🐟', size: 3,  price: 45   },
  { id: 119, name: 'Cá Mè',                emoji: '🐟', size: 3,  price: 38   },
  { id: 120, name: 'Rùa Nhỏ',              emoji: '🐢', size: 3,  price: 48   },
  { id: 121, name: 'Cá Bống Mú',           emoji: '🐟', size: 3,  price: 35   },
  // Size 4 (ID 122-128)
  { id: 122, name: 'Lươn Điện',            emoji: '⚡', size: 4,  price: 80   },
  { id: 123, name: 'Cá Trắm Đen',         emoji: '🐟', size: 4,  price: 90   },
  { id: 124, name: 'Cá Chép Vàng',         emoji: '🐠', size: 4,  price: 100  },
  { id: 125, name: 'Cá Lăng',              emoji: '🐟', size: 4,  price: 85   },
  { id: 126, name: 'Lươn Đồng',            emoji: '🐍', size: 4,  price: 75   },
  { id: 127, name: 'Cá Ngát',              emoji: '🐟', size: 4,  price: 70   },
  { id: 128, name: 'Rùa Sông',             emoji: '🐢', size: 4,  price: 95   },
  // Size 5 (ID 129-135)
  { id: 129, name: 'Mực Ống',              emoji: '🦑', size: 5,  price: 160  },
  { id: 130, name: 'Cá Thu',               emoji: '🐟', size: 5,  price: 180  },
  { id: 131, name: 'Cá Ngừ',               emoji: '🐟', size: 5,  price: 200  },
  { id: 132, name: 'Cá Bớp',               emoji: '🐟', size: 5,  price: 155  },
  { id: 133, name: 'Cá Nóc',               emoji: '🐡', size: 5,  price: 170  },
  { id: 134, name: 'Tôm Hùm Nhỏ',         emoji: '🦞', size: 5,  price: 190  },
  { id: 135, name: 'Cá Cam',               emoji: '🐟', size: 5,  price: 150  },
  // Size 6 (ID 136-142)
  { id: 136, name: 'Bạch Tuộc',            emoji: '🐙', size: 6,  price: 340  },
  { id: 137, name: 'Cá Kiếm',              emoji: '⚔️', size: 6,  price: 380  },
  { id: 138, name: 'Tôm Hùm',              emoji: '🦞', size: 6,  price: 310  },
  { id: 139, name: 'Cá Heo',               emoji: '🐬', size: 6,  price: 420  },
  { id: 140, name: 'Cá Ngừ Đại Dương',     emoji: '🐟', size: 6,  price: 360  },
  { id: 141, name: 'Cua Hoàng Đế',         emoji: '🦀', size: 6,  price: 400  },
  { id: 142, name: 'Cá Nóc Biển',          emoji: '🐡', size: 6,  price: 300  },
  // Size 7 (ID 143-149)
  { id: 143, name: 'Cá Mập',               emoji: '🦈', size: 7,  price: 650  },
  { id: 144, name: 'Cá Mặt Trăng',         emoji: '🌙', size: 7,  price: 700  },
  { id: 145, name: 'Mực Khổng Lồ',         emoji: '🦑', size: 7,  price: 750  },
  { id: 146, name: 'Rùa Biển',             emoji: '🐢', size: 7,  price: 680  },
  { id: 147, name: 'Bạch Tuộc Xanh',       emoji: '🐙', size: 7,  price: 620  },
  { id: 148, name: 'Cá Đuối',              emoji: '🦈', size: 7,  price: 600  },
  { id: 149, name: 'Cá Voi Con',            emoji: '🐋', size: 7,  price: 720  },
  // Size 8 (ID 150-156)
  { id: 150, name: 'Cá Mập Trắng',         emoji: '🦈', size: 8,  price: 1500 },
  { id: 151, name: 'Cá Voi',               emoji: '🐋', size: 8,  price: 1800 },
  { id: 152, name: 'Rắn Biển',             emoji: '🐲', size: 8,  price: 1600 },
  { id: 153, name: 'Cá Mập Búa',           emoji: '🦈', size: 8,  price: 1400 },
  { id: 154, name: 'Bạch Tuộc Đỏ',         emoji: '🐙', size: 8,  price: 1550 },
  { id: 155, name: 'Cá Đuối Khổng Lồ',     emoji: '🦈', size: 8,  price: 1300 },
  { id: 156, name: 'Rùa Biển Cổ',          emoji: '🐢', size: 8,  price: 1700 },
  // Size 9 (ID 157-162)
  { id: 157, name: 'Bạch Tuộc Khổng Lồ',   emoji: '🐙', size: 9,  price: 3500 },
  { id: 158, name: 'Quái Vật Biển Sâu',     emoji: '👹', size: 9,  price: 5000 },
  { id: 159, name: 'Cá Voi Xanh',          emoji: '🐋', size: 9,  price: 4200 },
  { id: 160, name: 'Mực Đại Vương',        emoji: '🦑', size: 9,  price: 3800 },
  { id: 161, name: 'Cá Đèn Lồng Khổng Lồ', emoji: '🔮', size: 9, price: 3000 },
  { id: 162, name: 'Cá Rồng Biển',         emoji: '🐉', size: 9,  price: 4500 },
  // Size 10 (ID 163-168)
  { id: 163, name: 'Rồng Biển',            emoji: '🐉', size: 10, price: 12000 },
  { id: 164, name: 'Long Vương',            emoji: '🔱', size: 10, price: 25000 },
  { id: 165, name: 'Leviathan',             emoji: '🌊', size: 10, price: 18000 },
  { id: 166, name: 'Ngọc Trai Thần',        emoji: '💎', size: 10, price: 22000 },
  { id: 167, name: 'Kraken',                emoji: '🦑', size: 10, price: 15000 },
  { id: 168, name: 'Thần Sấm Biển',         emoji: '⚡', size: 10, price: 10000 },
];

const FISH_BY_ID = {};
const FISH_BY_SIZE = {};
for (const f of FISH) {
  FISH_BY_ID[f.id] = f;
  if (!FISH_BY_SIZE[f.size]) FISH_BY_SIZE[f.size] = [];
  FISH_BY_SIZE[f.size].push(f);
}

// ============================================================
// WEAPONS (ID 201–204)
// ============================================================
const WEAPONS = [
  { id: 201, name: '🗡️ Dao Gỉ',      price: 0,      maxLevel: 3,  quality: 0,    atkBonus: 0,  effect: 'none',   effectDesc: '' },
  { id: 202, name: '⚔️ Kiếm Sắt',     price: 20000,  maxLevel: 5,  quality: 0.08, atkBonus: 5,  effect: 'bleed',  effectDesc: '🩸 Chảy máu (5% dmg/lượt)' },
  { id: 203, name: '🏹 Cung Tên',      price: 100000, maxLevel: 8,  quality: 0.18, atkBonus: 15, effect: 'pierce', effectDesc: '🎯 Xuyên giáp (bỏ qua 10% HP)' },
  { id: 204, name: '🔫 Súng Thần',     price: 400000, maxLevel: 10, quality: 0.30, atkBonus: 30, effect: 'stun',   effectDesc: '⚡ Choáng (15% miss lượt)' },
];

const WEAPON_BY_ID = {};
for (const w of WEAPONS) WEAPON_BY_ID[w.id] = w;

// ============================================================
// TRAPS (ID 211–219)
// ============================================================
const TRAPS = [
  { id: 211, level: 1,  name: '🪤 Bẫy Chuột',      price: 0    },
  { id: 212, level: 2,  name: '🪤 Bẫy Sắt',        price: 40   },
  { id: 213, level: 3,  name: '🪤 Bẫy Gấu',        price: 90   },
  { id: 214, level: 4,  name: '🪤 Bẫy Lớn',        price: 180  },
  { id: 215, level: 5,  name: '🪤 Bẫy Thép',       price: 350  },
  { id: 216, level: 6,  name: '🪤 Bẫy Ma Thuật',   price: 700  },
  { id: 217, level: 7,  name: '🪤 Bẫy Lửa',        price: 1500 },
  { id: 218, level: 8,  name: '🪤 Bẫy Hắc Ám',     price: 3500 },
  { id: 219, level: 9,  name: '🪤 Bẫy Thần',        price: 9000 },
];

const TRAP_BY_ID = {};
for (const t of TRAPS) TRAP_BY_ID[t.id] = t;

// ============================================================
// RODS (ID 221–224) — catchCount = how many fish per cast
// ============================================================
const RODS = [
  { id: 221, name: '🎣 Cần Tre',             price: 0,      maxSize: 3,  quality: 0,    catchCount: 1 },
  { id: 222, name: '🎣 Cần Carbon',          price: 15000,  maxSize: 5,  quality: 0.08, catchCount: 2 },
  { id: 223, name: '🎣 Cần Vàng',            price: 80000,  maxSize: 8,  quality: 0.18, catchCount: 3 },
  { id: 224, name: '🔱 Cần Truyền Thuyết',   price: 350000, maxSize: 10, quality: 0.32, catchCount: 4 },
];

const ROD_BY_ID = {};
for (const r of RODS) ROD_BY_ID[r.id] = r;

// ============================================================
// BAITS (ID 231–239)
// ============================================================
const BAITS = [
  { id: 231, size: 1, name: '🪱 Giun',              price: 0    },
  { id: 232, size: 2, name: '🦐 Mồi Tôm',          price: 35   },
  { id: 233, size: 3, name: '🐟 Mồi Cá Nhỏ',       price: 80   },
  { id: 234, size: 4, name: '🐟 Mồi Cá Vừa',       price: 160  },
  { id: 235, size: 5, name: '🐟 Mồi Cá Lớn',       price: 300  },
  { id: 236, size: 6, name: '🐙 Mồi Mực',          price: 600  },
  { id: 237, size: 7, name: '🦈 Mồi Cá Mập',       price: 1200 },
  { id: 238, size: 8, name: '🐋 Mồi Cá Voi',       price: 2800 },
  { id: 239, size: 9, name: '👹 Mồi Quái Vật',      price: 7000 },
];

const BAIT_BY_ID = {};
for (const b of BAITS) BAIT_BY_ID[b.id] = b;

// ============================================================
// GEMS (ID 301–309) — 3 types × 3 tiers
// ============================================================
const GEM_TYPES = {
  HUNT:  'hunt',   // 🔴 Hunt more animals
  LUCK:  'luck',   // 🟢 Rarer animals
  POWER: 'power',  // 🔵 Boost ATK/HP
};

const GEM_TIERS = {
  COMMON: 'common',
  RARE:   'rare',
  EPIC:   'epic',
};

const GEMS = [
  // Hunt Gems — catch more per hunt
  { id: 301, name: '🔴 Ngọc Săn (Thường)',    type: GEM_TYPES.HUNT,  tier: GEM_TIERS.COMMON, price: 500,   bonus: 0.15, desc: '+15% số thú săn được' },
  { id: 302, name: '🔴 Ngọc Săn (Hiếm)',      type: GEM_TYPES.HUNT,  tier: GEM_TIERS.RARE,   price: 2500,  bonus: 0.30, desc: '+30% số thú săn được' },
  { id: 303, name: '🔴 Ngọc Săn (Sử Thi)',    type: GEM_TYPES.HUNT,  tier: GEM_TIERS.EPIC,   price: 10000, bonus: 0.50, desc: '+50% số thú săn được' },
  // Luck Gems — rarer catches
  { id: 304, name: '🟢 Ngọc May Mắn (Thường)', type: GEM_TYPES.LUCK,  tier: GEM_TIERS.COMMON, price: 500,   bonus: 0.05, desc: '+5% cơ hội thú hiếm' },
  { id: 305, name: '🟢 Ngọc May Mắn (Hiếm)',   type: GEM_TYPES.LUCK,  tier: GEM_TIERS.RARE,   price: 2500,  bonus: 0.10, desc: '+10% cơ hội thú hiếm' },
  { id: 306, name: '🟢 Ngọc May Mắn (Sử Thi)', type: GEM_TYPES.LUCK,  tier: GEM_TIERS.EPIC,   price: 10000, bonus: 0.20, desc: '+20% cơ hội thú hiếm' },
  // Power Gems — boost stats
  { id: 307, name: '🔵 Ngọc Sức Mạnh (Thường)', type: GEM_TYPES.POWER, tier: GEM_TIERS.COMMON, price: 500,   bonus: 0.05, desc: '+5% ATK/HP' },
  { id: 308, name: '🔵 Ngọc Sức Mạnh (Hiếm)',   type: GEM_TYPES.POWER, tier: GEM_TIERS.RARE,   price: 2500,  bonus: 0.10, desc: '+10% ATK/HP' },
  { id: 309, name: '🔵 Ngọc Sức Mạnh (Sử Thi)', type: GEM_TYPES.POWER, tier: GEM_TIERS.EPIC,   price: 10000, bonus: 0.20, desc: '+20% ATK/HP' },
];

const GEM_BY_ID = {};
for (const g of GEMS) GEM_BY_ID[g.id] = g;

// ============================================================
// LOOT BOXES (ID 401–405) — Drops only (checkin, treasure)
// ============================================================
const LOOTBOXES = [
  { id: 401, name: '📦 Hộp Thường',       rarity: RARITY.COMMON,   rewards: { xuMin: 50,  xuMax: 200,  gemChance: 0.15, gemPool: [301, 304, 307] } },
  { id: 402, name: '📦 Hộp Hiếm',         rarity: RARITY.RARE,     rewards: { xuMin: 200, xuMax: 500,  gemChance: 0.30, gemPool: [301, 302, 304, 305, 307, 308] } },
  { id: 403, name: '📦 Hộp Sử Thi',       rarity: RARITY.EPIC,     rewards: { xuMin: 500, xuMax: 2000, gemChance: 0.50, gemPool: [302, 303, 305, 306, 308, 309] } },
  { id: 404, name: '📦 Hộp Truyền Thuyết', rarity: RARITY.LEGENDARY, rewards: { xuMin: 2000, xuMax: 8000, gemChance: 0.70, gemPool: [303, 306, 309] } },
  { id: 405, name: '📦 Hộp Cá',           rarity: RARITY.UNCOMMON, rewards: { xuMin: 100, xuMax: 400,  gemChance: 0.10, gemPool: [301, 304, 307] } },
];

const LOOTBOX_BY_ID = {};
for (const lb of LOOTBOXES) LOOTBOX_BY_ID[lb.id] = lb;

// ============================================================
// HUNT MAPS
// ============================================================
const HUNT_MAPS = [
  { id: 'rungtre',   name: '🌲 Rừng Tre',    minLevel: 1, maxLevel: 3,  killReq: 0     },
  { id: 'nuida',     name: '🏔️ Núi Đá',     minLevel: 1, maxLevel: 4,  killReq: 200   },
  { id: 'hangdong',  name: '🌋 Hang Động',    minLevel: 2, maxLevel: 5,  killReq: 600   },
  { id: 'samac',     name: '🏜️ Sa Mạc',      minLevel: 3, maxLevel: 6,  killReq: 1500  },
  { id: 'rungtoi',   name: '🌑 Rừng Tối',     minLevel: 4, maxLevel: 7,  killReq: 3000  },
  { id: 'thanhco',   name: '🏚️ Thành Cổ',    minLevel: 5, maxLevel: 8,  killReq: 5500  },
  { id: 'nuilua',    name: '🌋 Núi Lửa',      minLevel: 6, maxLevel: 9,  killReq: 9000  },
  { id: 'dianguc',   name: '🕳️ Địa Ngục',    minLevel: 8, maxLevel: 10, killReq: 14000 },
];

// ============================================================
// HUNT TREASURES
// ============================================================
const HUNT_TREASURES = [
  { minLv: 1,  maxLv: 3,  name: '📦 Rương Gỗ',              min: 30,    max: 100   },
  { minLv: 4,  maxLv: 5,  name: '📦 Rương Bạc',              min: 100,   max: 400   },
  { minLv: 6,  maxLv: 7,  name: '📦 Rương Vàng',             min: 400,   max: 1500  },
  { minLv: 8,  maxLv: 9,  name: '📦 Rương Kim Cương',        min: 1500,  max: 5000  },
  { minLv: 10, maxLv: 10, name: '📦 Rương Truyền Thuyết',    min: 5000,  max: 20000 },
];

// ============================================================
// ALBUM BONUSES
// ============================================================
const HUNT_ALBUM_BONUS = {
  1: 500, 2: 1000, 3: 2000, 4: 5000, 5: 10000,
  6: 20000, 7: 50000, 8: 100000, 9: 200000, 10: 500000,
};

const FISH_ALBUM_BONUS = {
  1: 300, 2: 800, 3: 2000, 4: 5000, 5: 12000,
  6: 25000, 7: 50000, 8: 100000, 9: 250000, 10: 500000,
};

// ============================================================
// UNIFIED LOOKUP
// ============================================================
const ALL_ITEMS = {};
function _reg(list, cat) {
  for (const item of list) ALL_ITEMS[item.id] = { ...item, category: cat };
}
_reg(ANIMALS,   CAT.ANIMAL);
_reg(FISH,      CAT.FISH);
_reg(WEAPONS,   CAT.WEAPON);
_reg(TRAPS,     CAT.TRAP);
_reg(RODS,      CAT.ROD);
_reg(BAITS,     CAT.BAIT);
_reg(GEMS,      CAT.GEM);
_reg(LOOTBOXES, CAT.LOOTBOX);

function getItem(id) {
  return ALL_ITEMS[id] || null;
}

function getShop(category) {
  return Object.values(ALL_ITEMS).filter(i => i.category === category && i.price > 0);
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  CAT, RARITY, RARITY_EMOJI,
  GEM_TYPES, GEM_TIERS,
  // Data arrays
  ANIMALS, FISH, WEAPONS, TRAPS, RODS, BAITS, GEMS, LOOTBOXES,
  // Index maps
  ANIMAL_BY_ID, ANIMAL_BY_LEVEL,
  FISH_BY_ID, FISH_BY_SIZE,
  WEAPON_BY_ID,
  TRAP_BY_ID,
  ROD_BY_ID,
  BAIT_BY_ID,
  GEM_BY_ID,
  LOOTBOX_BY_ID,
  // Hunt data
  HUNT_MAPS, HUNT_TREASURES, HUNT_ALBUM_BONUS,
  // Fish data
  FISH_ALBUM_BONUS,
  // Unified
  ALL_ITEMS, getItem, getShop,
};

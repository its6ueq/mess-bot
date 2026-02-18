// ============================================================
// HỆ THỐNG SĂN BẮN - Monster Hunt Progression
// Vũ khí → Bẫy → Săn quái → Dùng quái làm mồi → Quái mạnh hơn
// ============================================================

// === VŨ KHÍ ===
const WEAPONS = [
  { id: 'dao',    did: 'WP1', name: '🗡️ Dao Gỉ',      price: 0,      maxLevel: 3,  quality: 0    },
  { id: 'kiem',   did: 'WP2', name: '⚔️ Kiếm Sắt',     price: 20000,  maxLevel: 5,  quality: 0.08 },
  { id: 'cung',   did: 'WP3', name: '🏹 Cung Tên',      price: 100000, maxLevel: 8,  quality: 0.18 },
  { id: 'sung',   did: 'WP4', name: '🔫 Súng Thần',     price: 400000, maxLevel: 10, quality: 0.30 },
];

// === QUÁI VẬT THEO LEVEL (1-10) ===
const MONSTERS = {
  1: [
    { id: 1,  name: '🐀 Chuột Cống',     price: 3   },
    { id: 2,  name: '🦎 Thạch Sùng',      price: 5   },
    { id: 3,  name: '🐍 Rắn Mối',         price: 8   },
    { id: 4,  name: '🦇 Dơi Nhỏ',         price: 10  },
    { id: 5,  name: '🐺 Chó Hoang',        price: 12  },
    { id: 6,  name: '🕷️ Nhện Độc',        price: 7   },
    { id: 7,  name: '🐛 Sâu Bọ',          price: 2   },
  ],
  2: [
    { id: 8,  name: '🐗 Lợn Rừng',        price: 18  },
    { id: 9,  name: '🦊 Cáo Đỏ',          price: 22  },
    { id: 10, name: '🐺 Sói Xám',          price: 20  },
    { id: 11, name: '🦅 Đại Bàng',         price: 25  },
    { id: 12, name: '🐍 Rắn Hổ Mang',     price: 16  },
    { id: 13, name: '🦌 Nai Rừng',         price: 24  },
    { id: 14, name: '🐻 Gấu Con',          price: 15  },
  ],
  3: [
    { id: 15, name: '🐻 Gấu Nâu',         price: 40  },
    { id: 16, name: '🐅 Hổ Con',           price: 50  },
    { id: 17, name: '🦍 Khỉ Đột',          price: 45  },
    { id: 18, name: '🐊 Cá Sấu Nhỏ',      price: 38  },
    { id: 19, name: '🦅 Phượng Hoàng',     price: 55  },
    { id: 20, name: '🐺 Sói Trắng',        price: 42  },
    { id: 21, name: '🐃 Trâu Rừng',        price: 35  },
  ],
  4: [
    { id: 22, name: '🐅 Hổ Bengal',         price: 85  },
    { id: 23, name: '🐊 Cá Sấu',           price: 90  },
    { id: 24, name: '🦏 Tê Giác Con',       price: 110 },
    { id: 25, name: '🐘 Voi Con',           price: 100 },
    { id: 26, name: '🦁 Sư Tử Trẻ',        price: 80  },
    { id: 27, name: '🐻‍❄️ Gấu Bắc Cực',  price: 75  },
    { id: 28, name: '🦬 Bò Tót',            price: 70  },
  ],
  5: [
    { id: 29, name: '🦁 Sư Tử',            price: 170 },
    { id: 30, name: '🐘 Voi Châu Phi',     price: 200 },
    { id: 31, name: '🦏 Tê Giác',          price: 190 },
    { id: 32, name: '🐊 Cá Sấu Khổng Lồ', price: 160 },
    { id: 33, name: '🦍 King Kong Nhỏ',    price: 180 },
    { id: 34, name: '🐅 Hổ Trắng',         price: 150 },
    { id: 35, name: '🐻‍❄️ Gấu Bắc Cực Lớn', price: 175 },
  ],
  6: [
    { id: 36, name: '🐉 Rồng Con',          price: 350 },
    { id: 37, name: '🦖 Khủng Long Nhỏ',    price: 320 },
    { id: 38, name: '👹 Quỷ Đỏ',            price: 380 },
    { id: 39, name: '🧟 Zombie Khổng Lồ',   price: 340 },
    { id: 40, name: '🦂 Bọ Cạp Vua',        price: 300 },
    { id: 41, name: '🕷️ Nhện Khổng Lồ',    price: 360 },
    { id: 42, name: '🐍 Mãng Xà',           price: 400 },
  ],
  7: [
    { id: 43, name: '🐉 Rồng Lửa',          price: 650  },
    { id: 44, name: '🧛 Ma Cà Rồng',        price: 700  },
    { id: 45, name: '👹 Quỷ Sừng',           price: 680  },
    { id: 46, name: '🦖 T-Rex',              price: 720  },
    { id: 47, name: '👻 Bóng Ma Cổ Đại',    price: 640  },
    { id: 48, name: '🧟 Xác Ướp',            price: 600  },
    { id: 49, name: '🐲 Thuồng Luồng',      price: 750  },
  ],
  8: [
    { id: 50, name: '🐉 Rồng Băng',              price: 1400 },
    { id: 51, name: '👿 Ác Quỷ',                  price: 1700 },
    { id: 52, name: '🦕 Brontosaurus',            price: 1500 },
    { id: 53, name: '👹 Oni Đỏ',                  price: 1600 },
    { id: 54, name: '🧙 Phù Thủy Bóng Tối',     price: 1300 },
    { id: 55, name: '☠️ Thần Chết Con',           price: 1450 },
    { id: 56, name: '🐲 Hydra',                   price: 1550 },
  ],
  9: [
    { id: 57, name: '🐉 Rồng Thần',                  price: 3500 },
    { id: 58, name: '👿 Chúa Quỷ',                    price: 4500 },
    { id: 59, name: '💀 Thần Chết',                   price: 4000 },
    { id: 60, name: '🧙‍♂️ Pháp Sư Tối Thượng',     price: 3800 },
    { id: 61, name: '🐲 Rồng 9 Đầu',                 price: 3200 },
    { id: 62, name: '⚡ Thần Sấm',                    price: 4200 },
  ],
  10: [
    { id: 63, name: '🐉 Rồng Vàng',              price: 12000 },
    { id: 64, name: '👑 Chúa Tể Bóng Tối',       price: 20000 },
    { id: 65, name: '💀 Tử Thần',                 price: 16000 },
    { id: 66, name: '🌋 Titan Lửa',               price: 25000 },
    { id: 67, name: '🌊 Titan Nước',              price: 14000 },
    { id: 68, name: '⚡ Titan Sấm',               price: 18000 },
  ],
};

// === BẪY BÁN TRONG SHOP ===
const TRAP_SHOP = [
  { did: 'TR1', level: 1,  name: '🪤 Bẫy Chuột',      price: 0    },
  { did: 'TR2', level: 2,  name: '🪤 Bẫy Sắt',        price: 40   },
  { did: 'TR3', level: 3,  name: '🪤 Bẫy Gấu',        price: 90   },
  { did: 'TR4', level: 4,  name: '🪤 Bẫy Lớn',        price: 180  },
  { did: 'TR5', level: 5,  name: '🪤 Bẫy Thép',       price: 350  },
  { did: 'TR6', level: 6,  name: '🪤 Bẫy Ma Thuật',   price: 700  },
  { did: 'TR7', level: 7,  name: '🪤 Bẫy Lửa',        price: 1500 },
  { did: 'TR8', level: 8,  name: '🪤 Bẫy Hắc Ám',     price: 3500 },
  { did: 'TR9', level: 9,  name: '🪤 Bẫy Thần',        price: 9000 },
];

// === BẢN ĐỒ SĂN BẮN ===
const MAPS = [
  { id: 'rungtre',   name: '🌲 Rừng Tre',    minLevel: 1, maxLevel: 3,  killReq: 0     },
  { id: 'nuida',     name: '🏔️ Núi Đá',     minLevel: 1, maxLevel: 4,  killReq: 200   },
  { id: 'hangdong',  name: '🌋 Hang Động',    minLevel: 2, maxLevel: 5,  killReq: 600   },
  { id: 'samac',     name: '🏜️ Sa Mạc',      minLevel: 3, maxLevel: 6,  killReq: 1500  },
  { id: 'rungtoi',   name: '🌑 Rừng Tối',     minLevel: 4, maxLevel: 7,  killReq: 3000  },
  { id: 'thanhco',   name: '🏚️ Thành Cổ',    minLevel: 5, maxLevel: 8,  killReq: 5500  },
  { id: 'nuilua',    name: '🌋 Núi Lửa',      minLevel: 6, maxLevel: 9,  killReq: 9000  },
  { id: 'dianguc',   name: '🕳️ Địa Ngục',    minLevel: 8, maxLevel: 10, killReq: 14000 },
];

// === RƯƠNG KHO BÁU (theo trap level) ===
const TREASURES = [
  { minLv: 1,  maxLv: 3,  name: '📦 Rương Gỗ',              min: 30,    max: 100   },
  { minLv: 4,  maxLv: 5,  name: '📦 Rương Bạc',              min: 100,   max: 400   },
  { minLv: 6,  maxLv: 7,  name: '📦 Rương Vàng',             min: 400,   max: 1500  },
  { minLv: 8,  maxLv: 9,  name: '📦 Rương Kim Cương',        min: 1500,  max: 5000  },
  { minLv: 10, maxLv: 10, name: '📦 Rương Truyền Thuyết',    min: 5000,  max: 20000 },
];

// === THƯỞNG ALBUM THEO LEVEL ===
const ALBUM_BONUS = {
  1: 500, 2: 1000, 3: 2000, 4: 5000, 5: 10000,
  6: 20000, 7: 50000, 8: 100000, 9: 200000, 10: 500000,
};

const MAX_LEVEL = 10;
const COOLDOWN = 8000; // 8 giây

// Parse MT prefix: "mt5" or "MT5" -> 5, plain "5" -> 5
function parseMtId(str) {
  const s = (str || '').trim().toLowerCase();
  const m = s.match(/^mt(\d+)$/);
  if (m) return parseInt(m[1]);
  return parseInt(s);
}

// ============================================================
// HELPERS
// ============================================================

function getWeapon(weaponId) {
  return WEAPONS.find(w => w.id === weaponId) || WEAPONS[0];
}

/** Khởi tạo dữ liệu săn bắn cho player (không đụng fishing) */
function ensure(p) {
  if (!p.huntTrap)        p.huntTrap = { name: '🪤 Bẫy Chuột', level: 1 };
  if (!p.huntWeapon)      p.huntWeapon = 'dao';
  if (!p.huntMap)         p.huntMap = 'rungtre';
  if (!p.huntMaxTrapLv)   p.huntMaxTrapLv = 1;
  if (!p.huntAlbum)       p.huntAlbum = {};
  if (!p.huntAlbumRewards) p.huntAlbumRewards = [];
  if (!p.huntInventory)   p.huntInventory = [];
  if (!p.monstersKilled)  p.monstersKilled = 0;
}

/** Random 1 quái vật từ pool của level đó */
function randomMonster(level) {
  const pool = MONSTERS[level];
  if (!pool || pool.length === 0) return MONSTERS[1][0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Tìm treasure phù hợp với trap level */
function getTreasure(trapLevel) {
  const t = TREASURES.find(tr => trapLevel >= tr.minLv && trapLevel <= tr.maxLv);
  if (!t) return TREASURES[0];
  const xu = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
  return { name: t.name, xu };
}

/** Lấy map object hiện tại */
function getMap(mapId) {
  return MAPS.find(m => m.id === mapId) || MAPS[0];
}

/** Tính kết quả tấn công dựa trên weapon quality */
function rollOutcome(quality) {
  // Base rates (giống fishing)
  let catchOk      = 0.48; // Hạ được quái, bẫy còn nguyên
  let trapDamaged  = 0.22; // Hạ được quái, bẫy bị hư
  let monsterEscape = 0.10; // Quái phá bẫy chạy thoát
  let trapDestroyed = 0.06; // Quái phá hủy bẫy
  let treasure     = 0.07; // Nhặt kho báu
  let criticalHit  = 0.07; // Đòn chí mạng, quái mạnh hơn

  // Weapon quality bonus
  catchOk      += quality * 0.35;
  criticalHit  += quality * 0.25;
  treasure     += quality * 0.15;
  trapDamaged  -= quality * 0.30;
  monsterEscape -= quality * 0.25;
  trapDestroyed -= quality * 0.20;

  // Clamp
  trapDamaged   = Math.max(0.02, trapDamaged);
  monsterEscape = Math.max(0.01, monsterEscape);
  trapDestroyed = Math.max(0.01, trapDestroyed);

  const outcomes = [
    { id: 'catch_ok',        chance: catchOk },
    { id: 'trap_damaged',    chance: trapDamaged },
    { id: 'monster_escapes', chance: monsterEscape },
    { id: 'trap_destroyed',  chance: trapDestroyed },
    { id: 'treasure',        chance: treasure },
    { id: 'critical_hit',    chance: criticalHit },
  ];

  let r = Math.random();
  for (const o of outcomes) {
    r -= o.chance;
    if (r <= 0) return o.id;
  }
  return 'catch_ok';
}

/** Tính level quái bắt được dựa trên trap level + map */
function rollMonsterLevel(trapLevel, map, isCritical) {
  const minLv = map.minLevel;
  const maxLv = map.maxLevel;

  if (isCritical) {
    // Đòn chí mạng: 60% trapLevel+1, 40% trapLevel+2 (trong phạm vi map)
    const bonus = Math.random() < 0.6 ? 1 : 2;
    return Math.min(Math.max(trapLevel + bonus, minLv), maxLv);
  }

  // Bình thường: 15% trapLevel-1, 60% trapLevel, 25% trapLevel+1
  const roll = Math.random();
  let level;
  if (roll < 0.15 && trapLevel > 1) {
    level = trapLevel - 1;
  } else if (roll < 0.75) {
    level = trapLevel;
  } else {
    level = trapLevel + 1;
  }

  // Clamp vào phạm vi map
  return Math.min(Math.max(level, minLv), maxLv);
}

function updateAlbum(p, monsterName, level) {
  if (!p.huntAlbum[monsterName]) {
    p.huntAlbum[monsterName] = { count: 0, level };
  }
  p.huntAlbum[monsterName].count++;
}

function checkAlbumCompletion(p, level, economy, playerId) {
  const key = `level_${level}`;
  if (p.huntAlbumRewards.includes(key)) return null;
  const pool = MONSTERS[level];
  if (!pool) return null;
  const allKilled = pool.every(m => p.huntAlbum[m.name]?.count > 0);
  if (!allKilled) return null;

  p.huntAlbumRewards.push(key);
  const bonus = ALBUM_BONUS[level] || 0;
  if (bonus > 0) economy.addXu(playerId, bonus);
  return `🏆 HOÀN THÀNH ALBUM LEVEL ${level}!\n+${bonus.toLocaleString()} xu thưởng!`;
}

/** Tìm quái trong MONSTERS theo ID số */
function findMonsterById(id) {
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    const pool = MONSTERS[lv];
    if (!pool) continue;
    const m = pool.find(mon => mon.id === id);
    if (m) return { ...m, level: lv };
  }
  return null;
}

// ============================================================
// LỆNH CHÍNH
// ============================================================

// === /hunt - Đi săn ===
function hunt(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  // Cooldown
  const now = Date.now();
  if (p.lastHunt && now - new Date(p.lastHunt).getTime() < COOLDOWN) {
    const left = Math.ceil((COOLDOWN - (now - new Date(p.lastHunt).getTime())) / 1000);
    return `⏰ Đợi ${left}s nữa mới săn tiếp được!`;
  }

  // Kiểm tra bẫy
  if (!p.huntTrap || p.huntTrap.level <= 0) {
    p.huntTrap = null;
    economy._save();
    return '🚫 Hết bẫy rồi!\n/trap 0 - Lấy Bẫy Chuột miễn phí\n/trap <id quái> - Dùng quái làm mồi nhử\n/hshop - Mua bẫy';
  }

  const weapon = getWeapon(p.huntWeapon);
  const map = getMap(p.huntMap);
  const trap = p.huntTrap;

  // Kiểm tra weapon maxLevel vs map
  if (weapon.maxLevel < map.minLevel) {
    return `⚠️ ${weapon.name} quá yếu cho ${map.name}! Cần vũ khí mạnh hơn.\n/hshop để nâng cấp.`;
  }

  p.lastHunt = new Date().toISOString();

  // === Roll kết quả ===
  const outcome = rollOutcome(weapon.quality);

  let msg = `⚔️ Đi săn tại ${map.name}... (Bẫy: ${trap.name} Lv${trap.level})\n`;

  // === KHO BÁU ===
  if (outcome === 'treasure') {
    const t = getTreasure(trap.level);
    economy.addXu(player, t.xu);
    economy._save();
    msg += `\n💰 TÌM THẤY KHO BÁU!\n${t.name} → +${t.xu.toLocaleString()} xu`;
    msg += `\nBẫy vẫn còn: ${trap.name} (Lv${trap.level})`;
    msg += `\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
    return msg;
  }

  // === QUÁI PHÁ BẪY CHẠY THOÁT ===
  if (outcome === 'monster_escapes') {
    trap.level -= 1;
    if (trap.level <= 0) {
      p.huntTrap = null;
      msg += `\n🐾 Quái vật phá nát bẫy và chạy thoát! Mất bẫy!`;
      msg += `\n/trap 0 hoặc /hshop để lấy bẫy mới`;
    } else {
      msg += `\n🐾 Quái vật thoát! Bẫy bị hư → Lv${trap.level}`;
    }
    economy._save();
    return msg;
  }

  // === QUÁI PHÁ HỦY BẪY ===
  if (outcome === 'trap_destroyed') {
    const lostName = trap.name;
    p.huntTrap = null;
    economy._save();
    msg += `\n💥 Quái vật phá hủy ${lostName} và trốn mất!`;
    msg += `\n/trap 0 hoặc /trap <id quái> để đặt bẫy mới`;
    return msg;
  }

  // === HẠ ĐƯỢC QUÁI ===
  const isCritical = outcome === 'critical_hit';
  const monsterLevel = rollMonsterLevel(trap.level, map, isCritical);
  const monster = randomMonster(monsterLevel);

  // Thêm quái vào kho
  p.huntInventory.push({ id: monster.id, name: monster.name, price: monster.price, level: monsterLevel });
  p.monstersKilled++;
  updateAlbum(p, monster.name, monsterLevel);

  if (isCritical) {
    msg += `\n🎯 ĐÒN CHÍ MẠNG!`;
  }

  msg += `\n${monster.name} [MT${monster.id}] | Lv${monsterLevel} | ${monster.price.toLocaleString()} xu`;

  // Xử lý bẫy sau khi săn
  if (outcome === 'trap_damaged') {
    trap.level -= 1;
    if (trap.level <= 0) {
      p.huntTrap = null;
      msg += `\n⚠️ Bẫy bị phá hủy sau trận đánh!`;
    } else {
      msg += `\n⚠️ Bẫy bị hư → Lv${trap.level}`;
    }
  } else {
    msg += `\nBẫy còn: ${trap.name} (Lv${trap.level})`;
  }

  // Cập nhật huntMaxTrapLv
  if (monsterLevel > p.huntMaxTrapLv) {
    p.huntMaxTrapLv = monsterLevel;
    msg += `\n🆕 Mở khoá bẫy Lv${monsterLevel} trong shop!`;
  }

  // Kiểm tra album
  const albumMsg = checkAlbumCompletion(p, monsterLevel, economy, player);
  if (albumMsg) msg += `\n\n${albumMsg}`;

  // Gợi ý dùng quái làm mồi
  if (monsterLevel > trap.level) {
    msg += `\n\n💡 /trap mt${monster.id} để dùng ${monster.name} làm mồi nhử quái mạnh hơn!`;
  }

  // Kiểm tra mở map mới
  const nextMap = MAPS.find(m => m.killReq > 0 && p.monstersKilled >= m.killReq && m.killReq > (getMap(p.huntMap).killReq || 0));
  if (nextMap && nextMap.id !== p.huntMap) {
    const alreadyUnlocked = MAPS.filter(m => p.monstersKilled >= m.killReq);
    const newest = alreadyUnlocked[alreadyUnlocked.length - 1];
    if (newest && p.monstersKilled >= newest.killReq && p.monstersKilled - 1 < newest.killReq) {
      msg += `\n\n🗺️ Mở khoá bản đồ mới: ${newest.name}!\n/hgo ${newest.id} để di chuyển`;
    }
  }

  economy._save();
  return msg;
}

// === /trap [id] - Xem/Đặt bẫy ===
function setTrap(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const query = (args || '').trim();

  // Không có args → hiện bẫy hiện tại
  if (!query) {
    if (!p.huntTrap || p.huntTrap.level <= 0) {
      return '🪤 Chưa có bẫy!\n/trap 0 - Bẫy Chuột miễn phí\n/trap <id quái> - Dùng quái trong kho làm mồi nhử\n/hshop - Mua bẫy';
    }
    return `🪤 Bẫy hiện tại: ${p.huntTrap.name} (Lv${p.huntTrap.level})\n/hunt để đi săn`;
  }

  // "0" → lấy Bẫy Chuột miễn phí
  if (query === '0') {
    p.huntTrap = { name: '🪤 Bẫy Chuột', level: 1 };
    economy._save();
    return '🪤 Đã đặt Bẫy Chuột (Lv1).\n/hunt để đi săn!';
  }

  // Tìm quái trong kho theo ID (MT prefix)
  const monsterId = parseMtId(query);
  if (!isNaN(monsterId)) {
    const idx = p.huntInventory.findIndex(item => item.id === monsterId);
    if (idx === -1) {
      // Thử tìm theo tên
      return _setTrapByName(p, query, economy);
    }
    const loot = p.huntInventory.splice(idx, 1)[0];
    p.huntTrap = { name: loot.name, level: loot.level };
    if (loot.level > p.huntMaxTrapLv) p.huntMaxTrapLv = loot.level;
    economy._save();
    return `🪤 Đã dùng ${loot.name} (Lv${loot.level}) làm mồi nhử!\nMất ${loot.price.toLocaleString()} xu tiềm năng bán.\n/hunt để đi săn!`;
  }

  // Tìm theo tên
  return _setTrapByName(p, query, economy);
}

function _setTrapByName(p, query, economy) {
  const q = query.toLowerCase();
  const idx = p.huntInventory.findIndex(item =>
    item.name.toLowerCase().includes(q) ||
    item.name.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').trim().toLowerCase().includes(q)
  );

  if (idx === -1) {
    return `Không tìm thấy "${query}" trong kho!\n/hkho xem kho chiến lợi phẩm`;
  }

  const loot = p.huntInventory.splice(idx, 1)[0];
  p.huntTrap = { name: loot.name, level: loot.level };
  if (loot.level > p.huntMaxTrapLv) p.huntMaxTrapLv = loot.level;
  economy._save();
  return `🪤 Đã dùng ${loot.name} (Lv${loot.level}) làm mồi nhử!\nMất ${loot.price.toLocaleString()} xu tiềm năng bán.\n/hunt để đi săn!`;
}

// === /hshop - Cửa hàng săn bắn ===
function huntShop(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const xu = economy.getBalance(player).xu;
  const curWeaponIdx = WEAPONS.findIndex(w => w.id === p.huntWeapon);

  let msg = `🏪 CỬA HÀNG SĂN BẮN\nVí: ${xu.toLocaleString()} xu\n`;

  // Vũ khí
  msg += `\n--- VŨ KHÍ ---\n`;
  for (let i = 0; i < WEAPONS.length; i++) {
    const w = WEAPONS[i];
    if (w.id === p.huntWeapon) {
      msg += `[${w.did}] ${w.name} [✓] (max Lv${w.maxLevel})\n`;
    } else if (i < curWeaponIdx) {
      msg += `[${w.did}] ${w.name} [✓]\n`;
    } else {
      msg += `[${w.did}] ${w.name} - ${w.price.toLocaleString()} xu (max Lv${w.maxLevel})\n`;
    }
  }

  // Bẫy
  msg += `\n--- BẪY ---\n`;
  for (const t of TRAP_SHOP) {
    if (t.level > p.huntMaxTrapLv) {
      msg += `🔒 [${t.did}] ${t.name} (Lv${t.level})\n`;
    } else {
      const cost = t.price > 0 ? `${t.price.toLocaleString()} xu` : 'Free';
      msg += `[${t.did}] ${t.name} (Lv${t.level}) - ${cost}\n`;
    }
  }

  msg += `\n/hbuy <ID>\nVD: /hbuy wp2 | /hbuy tr3`;
  return msg;
}

// === /hbuy <item> - Mua vũ khí/bẫy ===
function huntBuy(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (!args) return '/hbuy <ID hoặc tên>\nVD: /hbuy wp2 | /hbuy tr3 | /hbuy kiếm';
  const q = args.trim().toLowerCase();

  // Tìm weapon (by did, id, or name)
  const weaponIdx = WEAPONS.findIndex(w =>
    w.did.toLowerCase() === q || w.id === q || w.name.toLowerCase().includes(q)
  );
  if (weaponIdx >= 0) {
    const weapon = WEAPONS[weaponIdx];
    const curIdx = WEAPONS.findIndex(w => w.id === p.huntWeapon);
    if (weaponIdx <= curIdx) return `Đã có ${weapon.name} rồi!`;
    if (weaponIdx > curIdx + 1) return `Phải mua ${WEAPONS[curIdx + 1].name} trước! (${WEAPONS[curIdx + 1].price.toLocaleString()} xu)`;
    if (economy.getBalance(player).xu < weapon.price) return `Thiếu xu! Cần ${weapon.price.toLocaleString()}, có ${economy.getBalance(player).xu.toLocaleString()} xu.`;
    economy.removeXu(player, weapon.price);
    p.huntWeapon = weapon.id;
    economy._save();
    const pct = Math.round(weapon.quality * 100);
    return `⚔️ Đã mua [${weapon.did}] ${weapon.name}!\n+${pct}% chất lượng, max Lv${weapon.maxLevel}\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // Tìm bẫy (by did, name, or level)
  const trapItem = TRAP_SHOP.find(t =>
    t.did.toLowerCase() === q ||
    t.name.toLowerCase().includes(q) ||
    q.includes(`lv${t.level}`) ||
    q.includes(`level ${t.level}`) ||
    q === `${t.level}`
  );
  if (trapItem) {
    if (trapItem.level > p.huntMaxTrapLv) return `🔒 Chưa mở khoá bẫy Lv${trapItem.level}! Phải hạ quái level đó trước.`;
    if (trapItem.price > 0 && economy.getBalance(player).xu < trapItem.price) return `Thiếu xu! Cần ${trapItem.price.toLocaleString()}, có ${economy.getBalance(player).xu.toLocaleString()} xu.`;
    if (trapItem.price > 0) economy.removeXu(player, trapItem.price);
    p.huntTrap = { name: trapItem.name, level: trapItem.level };
    economy._save();
    const cost = trapItem.price > 0 ? `(-${trapItem.price.toLocaleString()} xu)` : '(miễn phí)';
    return `🪤 Đã mua [${trapItem.did}] ${trapItem.name} (Lv${trapItem.level}) ${cost}\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\n/hunt để đi săn!`;
  }

  return `Không tìm thấy "${args}"! /hshop để xem danh sách.`;
}

// === /hsell [all] - Bán chiến lợi phẩm ===
function huntSell(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const q = (args || '').trim().toLowerCase();

  if (q === 'all') {
    if (p.huntInventory.length === 0) return 'Kho trống!';
    const total = p.huntInventory.reduce((s, i) => s + i.price, 0);
    const count = p.huntInventory.length;
    p.huntInventory = [];
    economy.addXu(player, total);
    return `💰 Đã bán ${count} chiến lợi phẩm = ${total.toLocaleString()} xu!\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  // /hsell mt5 - ban theo ID quai
  const mtId = parseMtId(q);
  if (!isNaN(mtId) && mtId > 0) {
    const indices = [];
    let total = 0;
    for (let i = 0; i < p.huntInventory.length; i++) {
      if (p.huntInventory[i].id === mtId) {
        indices.push(i);
        total += p.huntInventory[i].price;
      }
    }
    if (indices.length === 0) {
      const mon = findMonsterById(mtId);
      if (mon) return `Không có ${mon.name} trong kho!`;
      return `Không tìm thấy quái MT${mtId}!`;
    }
    const mon = findMonsterById(mtId);
    for (let i = indices.length - 1; i >= 0; i--) {
      p.huntInventory.splice(indices[i], 1);
    }
    economy.addXu(player, total);
    return `💰 Bán ${indices.length}x ${mon ? mon.name : `MT${mtId}`} = ${total.toLocaleString()} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  if (p.huntInventory.length === 0) return 'Kho trống! /hunt để đi săn.';
  const item = p.huntInventory.pop();
  economy.addXu(player, item.price);
  return `💰 Bán ${item.name} [MT${item.id}] = ${item.price.toLocaleString()} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu\nCòn ${p.huntInventory.length} chiến lợi phẩm trong kho`;
}

// === /hkho - Kho chiến lợi phẩm ===
function huntInventory(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (p.huntInventory.length === 0) return '📦 Kho trống! /hunt để đi săn.';

  // Nhóm theo tên
  const groups = {};
  let totalValue = 0;
  for (const item of p.huntInventory) {
    const key = item.name;
    if (!groups[key]) groups[key] = { count: 0, total: 0, level: item.level, id: item.id };
    groups[key].count++;
    groups[key].total += item.price;
    totalValue += item.price;
  }

  let msg = `📦 KHO CHIẾN LỢI PHẨM (${p.huntInventory.length} con):\n`;
  // Sắp xếp theo level giảm dần
  const sorted = Object.entries(groups).sort((a, b) => b[1].level - a[1].level);
  for (const [name, d] of sorted) {
    msg += `${name} [MT${d.id}] x${d.count} Lv${d.level} (${d.total.toLocaleString()} xu)\n`;
  }

  msg += `\nTổng: ${totalValue.toLocaleString()} xu`;
  msg += `\n/hsell all | /hsell mt<ID> | /trap mt<ID> làm mồi`;
  return msg;
}

// === /hgear - Trang bị săn bắn ===
function huntGear(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const weapon = getWeapon(p.huntWeapon);
  const map = getMap(p.huntMap);
  const pct = Math.round(weapon.quality * 100);

  let msg = `🎒 TRANG BỊ SĂN BẮN:\n\n`;
  msg += `Vũ khí: [${weapon.did}] ${weapon.name} (+${pct}%, max Lv${weapon.maxLevel})\n`;
  msg += `Bẫy: ${p.huntTrap ? `${p.huntTrap.name} (Lv${p.huntTrap.level})` : '❌ Chưa có'}\n`;
  msg += `Bản đồ: ${map.name} (Lv${map.minLevel}-${map.maxLevel})\n`;
  msg += `Bẫy cao nhất mở khoá: Lv${p.huntMaxTrapLv}\n`;
  msg += `Quái đã hạ: ${p.monstersKilled}\n`;
  msg += `Kho: ${p.huntInventory.length} chiến lợi phẩm\n`;
  msg += `Album: ${Object.keys(p.huntAlbum).length} loài`;
  return msg;
}

// === /halbum - Album quái vật ===
function huntAlbum(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (Object.keys(p.huntAlbum).length === 0) return '📖 Album trống! /hunt để bắt đầu săn bắn.';

  let msg = '📖 ALBUM QUÁI VẬT\n';
  let totalSpecies = 0, caught = 0;

  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    const pool = MONSTERS[lv];
    if (!pool) continue;
    const killedHere = pool.filter(m => p.huntAlbum[m.name]?.count > 0);

    totalSpecies += pool.length;
    caught += killedHere.length;

    const done = p.huntAlbumRewards.includes(`level_${lv}`);
    const locked = lv > p.huntMaxTrapLv + 1;

    msg += `\n${locked ? '🔒 ' : ''}Level ${lv} [${killedHere.length}/${pool.length}]`;
    if (done) msg += ' ✅';
    msg += '\n';

    if (!locked) {
      for (const mon of pool) {
        const e = p.huntAlbum[mon.name];
        if (e) {
          msg += `  ✓ ${mon.name} [MT${mon.id}] x${e.count}\n`;
        } else {
          msg += `  ❓ ???\n`;
        }
      }
    }
  }

  msg += `\nTổng: ${caught}/${totalSpecies} loài`;
  return msg;
}

// === /hgo <mapId> - Chuyển bản đồ ===
function huntGoMap(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (!args) {
    return '/hgo <tên map>\nVD: /hgo nuida | /hgo samac\n/hmap để xem danh sách bản đồ';
  }

  const q = args.trim().toLowerCase();
  const target = MAPS.find(m =>
    m.id === q || m.name.toLowerCase().includes(q)
  );

  if (!target) return `Không tìm thấy bản đồ "${args}"!\n/hmap để xem danh sách.`;

  if (p.monstersKilled < target.killReq) {
    return `🔒 ${target.name} yêu cầu ${target.killReq.toLocaleString()} kills.\nBạn mới hạ ${p.monstersKilled.toLocaleString()} quái.`;
  }

  if (p.huntMap === target.id) return `Bạn đang ở ${target.name} rồi!`;

  p.huntMap = target.id;
  economy._save();
  return `🗺️ Đã di chuyển đến ${target.name}!\nQuái Lv${target.minLevel}-${target.maxLevel}\n/hunt để bắt đầu săn!`;
}

// === /hmap - Danh sách bản đồ ===
function huntMapList(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  let msg = '🗺️ BẢN ĐỒ SĂN BẮN\n';
  msg += `Quái đã hạ: ${p.monstersKilled.toLocaleString()}\n`;

  for (const m of MAPS) {
    const unlocked = p.monstersKilled >= m.killReq;
    const current = p.huntMap === m.id;

    if (current) {
      msg += `\n➤ ${m.name} [ĐANG Ở ĐÂY]`;
    } else if (unlocked) {
      msg += `\n✅ ${m.name}`;
    } else {
      msg += `\n🔒 ${m.name} (cần ${m.killReq.toLocaleString()} kills)`;
    }
    msg += ` | Lv${m.minLevel}-${m.maxLevel}`;
  }

  msg += `\n\n/hgo <tên> để di chuyển\nVD: /hgo nuida`;
  return msg;
}

function handleInput() { return null; }

module.exports = {
  hunt,
  setTrap,
  huntShop,
  huntBuy,
  huntSell,
  huntInventory,
  huntGear,
  huntAlbum,
  huntGoMap,
  huntMapList,
  handleInput,
  ensure,
};

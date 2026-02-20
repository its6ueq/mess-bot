// ============================================================
// WEAPONS — Trang bị cho thú. ID: WP1, WP2, ...
// Mỗi weapon có 1 skill duy nhất. Drop từ Treasure Crate.
// Thêm weapon: thêm vào cuối (WP17, WP18, ...)
// ============================================================
const { RARITY } = require('./config');

const WEAPONS = [
  // ======================== AD WEAPONS ========================
  { id: 'WP1',  name: '🗡️ Kiếm Ngắn',     rarity: RARITY.COMMON,
    stats: { atk: 5 },
    effect: null, effectDesc: '' },
  { id: 'WP2',  name: '⚔️ Kiếm Dài',       rarity: RARITY.UNCOMMON,
    stats: { atk: 12, atkPen: 3 },
    effect: 'bleed', effectDesc: '🩸 Chảy máu (3% HP/lượt, 3 lượt)' },
  { id: 'WP3',  name: '🔥 Kiếm Lửa',       rarity: RARITY.RARE,
    stats: { atk: 20, atkPen: 5 },
    effect: 'burn', effectDesc: '🔥 Thiêu đốt (5% HP/lượt, 2 lượt)' },
  { id: 'WP4',  name: '💀 Lưỡi Hái',        rarity: RARITY.EPIC,
    stats: { atk: 35, atkPen: 10, crit: 0.10 },
    effect: 'execute', effectDesc: '💀 Hành quyết (x2 dmg nếu <20% HP)' },

  // ======================== AP WEAPONS ========================
  { id: 'WP5',  name: '🪄 Gậy Phép',        rarity: RARITY.COMMON,
    stats: { ap: 5 },
    effect: null, effectDesc: '' },
  { id: 'WP6',  name: '📖 Sách Cổ',         rarity: RARITY.UNCOMMON,
    stats: { ap: 12, magPen: 3 },
    effect: 'silence', effectDesc: '🤐 Câm lặng (vô hiệu hiệu ứng 1 lượt)' },
  { id: 'WP7',  name: '❄️ Trượng Băng',     rarity: RARITY.RARE,
    stats: { ap: 20, magPen: 5 },
    effect: 'slow', effectDesc: '❄️ Đóng băng (-30% SPD, 2 lượt)' },
  { id: 'WP8',  name: '⚡ Trượng Sấm',      rarity: RARITY.EPIC,
    stats: { ap: 35, magPen: 10 },
    effect: 'chain', effectDesc: '⚡ Sấm dây chuyền (30% dmg lan 2 mục tiêu)' },

  // ======================== TANK WEAPONS ========================
  { id: 'WP9',  name: '🛡️ Khiên Gỗ',       rarity: RARITY.COMMON,
    stats: { def: 5, hp: 15 },
    effect: null, effectDesc: '' },
  { id: 'WP10', name: '🛡️ Khiên Sắt',      rarity: RARITY.UNCOMMON,
    stats: { def: 12, mr: 5, hp: 30 },
    effect: 'taunt', effectDesc: '🛡️ Khiêu khích (hút đòn 1 lượt)' },
  { id: 'WP11', name: '💎 Giáp Kim Cương',   rarity: RARITY.RARE,
    stats: { def: 20, mr: 10, hp: 50 },
    effect: 'reflect', effectDesc: '💎 Phản dame (phản 10% dmg nhận)' },
  { id: 'WP12', name: '👑 Vương Miện',        rarity: RARITY.EPIC,
    stats: { def: 15, mr: 15, hp: 80, atk: 5, ap: 5 },
    effect: 'aura', effectDesc: '👑 Hào quang (+10% toàn bộ stat cả team)' },

  // ======================== CRIT WEAPONS ========================
  { id: 'WP15', name: '🏹 Cung Tốc Độ',      rarity: RARITY.UNCOMMON,
    stats: { atk: 8, spd: 8, crit: 0.10 },
    effect: null, effectDesc: '' },
  { id: 'WP16', name: '⚡ Giày Thần Tốc',    rarity: RARITY.RARE,
    stats: { spd: 15, crit: 0.08, critDmg: 0.3 },
    effect: 'doubleStrike', effectDesc: '⚡ Đánh đôi (20% đánh 2 lần)' },

  // ======================== HYBRID / UTILITY ========================
  { id: 'WP13', name: '💍 Nhẫn Máu',         rarity: RARITY.RARE,
    stats: { atk: 10, hp: 30 },
    effect: 'lifesteal', effectDesc: '💍 Hút máu (hồi 10% dmg gây ra)' },
  { id: 'WP14', name: '🌀 Áo Choàng Ma',     rarity: RARITY.RARE,
    stats: { def: 8, mr: 8, spd: 10 },
    effect: 'dodge', effectDesc: '🌀 Né tránh (12% dodge)' },
];

// Weapon drop rates from crates (by rarity)
const WEAPON_DROP_RATES = [
  { rarity: RARITY.COMMON,   chance: 0.40 },
  { rarity: RARITY.UNCOMMON, chance: 0.30 },
  { rarity: RARITY.RARE,     chance: 0.22 },
  { rarity: RARITY.EPIC,     chance: 0.08 },
];

// Index maps
const WEAPON_BY_ID = {};
const WEAPON_BY_RARITY = {};
for (const w of WEAPONS) {
  WEAPON_BY_ID[w.id] = w;
  const key = w.rarity.key;
  if (!WEAPON_BY_RARITY[key]) WEAPON_BY_RARITY[key] = [];
  WEAPON_BY_RARITY[key].push(w);
}

function rollWeapon() {
  let r = Math.random();
  let rarity = RARITY.COMMON;
  for (const rate of WEAPON_DROP_RATES) {
    r -= rate.chance;
    if (r <= 0) { rarity = rate.rarity; break; }
  }
  const pool = WEAPON_BY_RARITY[rarity.key];
  if (!pool || pool.length === 0) return WEAPONS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { WEAPONS, WEAPON_BY_ID, WEAPON_BY_RARITY, WEAPON_DROP_RATES, rollWeapon };

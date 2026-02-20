// ============================================================
// GEMS — Ngọc buff cho thú. ID: GM1, GM2, ...
// 5 loại × 6 cấp (Common → Mythical). CHỈ nhận từ Treasure Crate.
// ============================================================
const { RARITY } = require('./config');

const GEM_TYPES = {
  HUNT:  'hunt',   // +% chance bắt thêm thú
  LUCK:  'luck',   // +% chance rarity cao hơn
  POWER: 'power',  // +% toàn bộ stat trong battle
  CRIT:  'crit',   // +% crit rate
  SPEED: 'speed',  // +% speed
};

const GEMS = [
  // ====== HUNT GEMS — tăng số thú bắt được ======
  { id: 'GM1',  name: '🔴 Ngọc Săn I',      type: GEM_TYPES.HUNT,  tier: 1, rarity: RARITY.COMMON,    bonus: 0.05 },
  { id: 'GM2',  name: '🔴 Ngọc Săn II',     type: GEM_TYPES.HUNT,  tier: 2, rarity: RARITY.UNCOMMON,  bonus: 0.10 },
  { id: 'GM3',  name: '🔴 Ngọc Săn III',    type: GEM_TYPES.HUNT,  tier: 3, rarity: RARITY.RARE,      bonus: 0.20 },
  { id: 'GM4',  name: '🔴 Ngọc Săn IV',     type: GEM_TYPES.HUNT,  tier: 4, rarity: RARITY.EPIC,      bonus: 0.40 },
  { id: 'GM5',  name: '🔴 Ngọc Săn V',      type: GEM_TYPES.HUNT,  tier: 5, rarity: RARITY.LEGENDARY, bonus: 0.70 },
  { id: 'GM6',  name: '🔴 Ngọc Săn VI',     type: GEM_TYPES.HUNT,  tier: 6, rarity: RARITY.MYTHICAL,  bonus: 1.00 },

  // ====== LUCK GEMS — tăng tỉ lệ rare+ ======
  { id: 'GM7',  name: '🟢 Ngọc May I',      type: GEM_TYPES.LUCK,  tier: 1, rarity: RARITY.COMMON,    bonus: 0.03 },
  { id: 'GM8',  name: '🟢 Ngọc May II',     type: GEM_TYPES.LUCK,  tier: 2, rarity: RARITY.UNCOMMON,  bonus: 0.06 },
  { id: 'GM9',  name: '🟢 Ngọc May III',    type: GEM_TYPES.LUCK,  tier: 3, rarity: RARITY.RARE,      bonus: 0.12 },
  { id: 'GM10', name: '🟢 Ngọc May IV',     type: GEM_TYPES.LUCK,  tier: 4, rarity: RARITY.EPIC,      bonus: 0.25 },
  { id: 'GM11', name: '🟢 Ngọc May V',      type: GEM_TYPES.LUCK,  tier: 5, rarity: RARITY.LEGENDARY, bonus: 0.45 },
  { id: 'GM12', name: '🟢 Ngọc May VI',     type: GEM_TYPES.LUCK,  tier: 6, rarity: RARITY.MYTHICAL,  bonus: 0.80 },

  // ====== POWER GEMS — tăng toàn bộ stat ======
  { id: 'GM13', name: '🔵 Ngọc Lực I',      type: GEM_TYPES.POWER, tier: 1, rarity: RARITY.COMMON,    bonus: 0.03 },
  { id: 'GM14', name: '🔵 Ngọc Lực II',     type: GEM_TYPES.POWER, tier: 2, rarity: RARITY.UNCOMMON,  bonus: 0.06 },
  { id: 'GM15', name: '🔵 Ngọc Lực III',    type: GEM_TYPES.POWER, tier: 3, rarity: RARITY.RARE,      bonus: 0.12 },
  { id: 'GM16', name: '🔵 Ngọc Lực IV',     type: GEM_TYPES.POWER, tier: 4, rarity: RARITY.EPIC,      bonus: 0.25 },
  { id: 'GM17', name: '🔵 Ngọc Lực V',      type: GEM_TYPES.POWER, tier: 5, rarity: RARITY.LEGENDARY, bonus: 0.45 },
  { id: 'GM18', name: '🔵 Ngọc Lực VI',     type: GEM_TYPES.POWER, tier: 6, rarity: RARITY.MYTHICAL,  bonus: 0.80 },

  // ====== CRIT GEMS — tăng crit rate ======
  { id: 'GM19', name: '💛 Ngọc Chí Mạng I',  type: GEM_TYPES.CRIT, tier: 1, rarity: RARITY.COMMON,    bonus: 0.03 },
  { id: 'GM20', name: '💛 Ngọc Chí Mạng II', type: GEM_TYPES.CRIT, tier: 2, rarity: RARITY.UNCOMMON,  bonus: 0.06 },
  { id: 'GM21', name: '💛 Ngọc Chí Mạng III',type: GEM_TYPES.CRIT, tier: 3, rarity: RARITY.RARE,      bonus: 0.12 },
  { id: 'GM22', name: '💛 Ngọc Chí Mạng IV', type: GEM_TYPES.CRIT, tier: 4, rarity: RARITY.EPIC,      bonus: 0.20 },
  { id: 'GM23', name: '💛 Ngọc Chí Mạng V',  type: GEM_TYPES.CRIT, tier: 5, rarity: RARITY.LEGENDARY, bonus: 0.35 },
  { id: 'GM24', name: '💛 Ngọc Chí Mạng VI', type: GEM_TYPES.CRIT, tier: 6, rarity: RARITY.MYTHICAL,  bonus: 0.50 },

  // ====== SPEED GEMS — tăng speed ======
  { id: 'GM25', name: '💜 Ngọc Tốc Độ I',    type: GEM_TYPES.SPEED, tier: 1, rarity: RARITY.COMMON,    bonus: 0.05 },
  { id: 'GM26', name: '💜 Ngọc Tốc Độ II',   type: GEM_TYPES.SPEED, tier: 2, rarity: RARITY.UNCOMMON,  bonus: 0.10 },
  { id: 'GM27', name: '💜 Ngọc Tốc Độ III',  type: GEM_TYPES.SPEED, tier: 3, rarity: RARITY.RARE,      bonus: 0.20 },
  { id: 'GM28', name: '💜 Ngọc Tốc Độ IV',   type: GEM_TYPES.SPEED, tier: 4, rarity: RARITY.EPIC,      bonus: 0.35 },
  { id: 'GM29', name: '💜 Ngọc Tốc Độ V',    type: GEM_TYPES.SPEED, tier: 5, rarity: RARITY.LEGENDARY, bonus: 0.55 },
  { id: 'GM30', name: '💜 Ngọc Tốc Độ VI',   type: GEM_TYPES.SPEED, tier: 6, rarity: RARITY.MYTHICAL,  bonus: 0.80 },
];

const GEM_BY_ID = {};
for (const g of GEMS) GEM_BY_ID[g.id] = g;

// Drop rates (same as animal rarity tiers)
const GEM_DROP_RATES = [
  { rarity: RARITY.COMMON,    chance: 0.60   },
  { rarity: RARITY.UNCOMMON,  chance: 0.35   },
  { rarity: RARITY.RARE,      chance: 0.03   },
  { rarity: RARITY.EPIC,      chance: 0.0175 },
  { rarity: RARITY.LEGENDARY, chance: 0.002375 },
  { rarity: RARITY.MYTHICAL,  chance: 0.000125 },
];

const GEM_BY_RARITY = {};
for (const g of GEMS) {
  const key = g.rarity.key;
  if (!GEM_BY_RARITY[key]) GEM_BY_RARITY[key] = [];
  GEM_BY_RARITY[key].push(g);
}

function rollGem() {
  let r = Math.random();
  let rarity = RARITY.COMMON;
  for (const rate of GEM_DROP_RATES) {
    r -= rate.chance;
    if (r <= 0) { rarity = rate.rarity; break; }
  }
  const pool = GEM_BY_RARITY[rarity.key];
  if (!pool || pool.length === 0) return GEMS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { GEM_TYPES, GEMS, GEM_BY_ID, GEM_BY_RARITY, GEM_DROP_RATES, rollGem };

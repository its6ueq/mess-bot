// ============================================================
// LOOTBOX / TREASURE CRATE — ID: LB1, LB2, ...
// Sources: hunting, battle win, check-in
// Contents: weapons or gems or xu
// ============================================================
const { RARITY } = require('./config');

const LOOTBOXES = [
  { id: 'LB1', name: '📦 Hộp Kho Báu',     rarity: RARITY.COMMON,
    rewards: { weaponChance: 0.55, gemChance: 0.30, xuMin: 100, xuMax: 500 } },
  { id: 'LB2', name: '📦 Hộp Hiếm',        rarity: RARITY.UNCOMMON,
    rewards: { weaponChance: 0.60, gemChance: 0.30, xuMin: 300, xuMax: 1500 } },
  { id: 'LB3', name: '📦 Hộp Sử Thi',       rarity: RARITY.RARE,
    rewards: { weaponChance: 0.65, gemChance: 0.25, xuMin: 800, xuMax: 3000 } },
  { id: 'LB4', name: '📦 Hộp Truyền Thuyết', rarity: RARITY.EPIC,
    rewards: { weaponChance: 0.70, gemChance: 0.25, xuMin: 2000, xuMax: 8000 } },
];

const LOOTBOX_BY_ID = {};
for (const lb of LOOTBOXES) LOOTBOX_BY_ID[lb.id] = lb;

// Drop rates: which crate from hunting/battle/checkin
const CHECKIN_CRATE_CHANCE = 0.15;
const CHECKIN_CRATE_POOL = [
  { id: 'LB1', chance: 0.70 },
  { id: 'LB2', chance: 0.25 },
  { id: 'LB3', chance: 0.05 },
];

module.exports = { LOOTBOXES, LOOTBOX_BY_ID, CHECKIN_CRATE_CHANCE, CHECKIN_CRATE_POOL };

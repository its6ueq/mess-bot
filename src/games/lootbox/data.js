// ============================================================
// LOOT BOX DATA — Hộp đồ. ID: LB1, LB2, ...
// Thêm hộp: thêm vào array (LB6, LB7, ...)
// ============================================================

const LOOTBOXES = [
  {
    id: 'LB1', name: '📦 Hộp Thường', rarity: 'common',
    rewards: { xuMin: 50, xuMax: 200, gemChance: 0.15, gemPool: ['GM1', 'GM4', 'GM7'] },
  },
  {
    id: 'LB2', name: '📦 Hộp Hiếm', rarity: 'rare',
    rewards: { xuMin: 200, xuMax: 500, gemChance: 0.30, gemPool: ['GM1', 'GM2', 'GM4', 'GM5', 'GM7', 'GM8'] },
  },
  {
    id: 'LB3', name: '📦 Hộp Sử Thi', rarity: 'epic',
    rewards: { xuMin: 500, xuMax: 2000, gemChance: 0.50, gemPool: ['GM2', 'GM3', 'GM5', 'GM6', 'GM8', 'GM9'] },
  },
  {
    id: 'LB4', name: '📦 Hộp Truyền Thuyết', rarity: 'legendary',
    rewards: { xuMin: 2000, xuMax: 8000, gemChance: 0.70, gemPool: ['GM3', 'GM6', 'GM9'] },
  },
  {
    id: 'LB5', name: '📦 Hộp Cá', rarity: 'uncommon',
    rewards: { xuMin: 100, xuMax: 400, gemChance: 0.10, gemPool: ['GM1', 'GM4', 'GM7'] },
  },
];

// Tỉ lệ drop khi checkin
const CHECKIN_DROPS = [
  { boxId: 'LB1', chance: 0.20, minStreak: 0 },  // 20% mọi lúc
  { boxId: 'LB2', chance: 0.10, minStreak: 0 },  // 10% mọi lúc
  { boxId: 'LB3', chance: 0.05, minStreak: 7 },  // 5% khi streak >= 7
];

// Tỉ lệ drop khi tìm kho báu (fishing treasure)
const TREASURE_DROPS = [
  { boxId: 'LB5', chance: 0.25 },  // 25% khi tìm kho báu
  { boxId: 'LB1', chance: 0.10 },  // 10%
];

// Index
const LOOTBOX_BY_ID = {};
for (const lb of LOOTBOXES) LOOTBOX_BY_ID[lb.id] = lb;

module.exports = {
  LOOTBOXES, LOOTBOX_BY_ID,es
  CHECKIN_DROPS, TREASURE_DROPS,
};

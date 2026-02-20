// ============================================================
// CONFIG — Rarity, constants, stat helpers
// Shared across all game data and logic
// ============================================================

// === RARITY ===
const RARITY = {
  COMMON:    { key: 'common',    emoji: '⚪', label: 'Thường',         color: '⬜' },
  UNCOMMON:  { key: 'uncommon',  emoji: '🟢', label: 'Không Thường',   color: '🟩' },
  RARE:      { key: 'rare',      emoji: '🔵', label: 'Hiếm',          color: '🟦' },
  EPIC:      { key: 'epic',      emoji: '🟣', label: 'Sử Thi',        color: '🟪' },
  LEGENDARY: { key: 'legendary', emoji: '🟡', label: 'Truyền Thuyết', color: '🟨' },
  MYTHICAL:  { key: 'mythical',  emoji: '🔴', label: 'Thần Thoại',    color: '🟥' },
};

// Common+Uncommon = 95%, Rare+Epic = 4.75%, Legendary+Mythical = 0.25%
const RARITY_RATES = [
  { rarity: RARITY.COMMON,    chance: 0.60   },
  { rarity: RARITY.UNCOMMON,  chance: 0.35   },
  { rarity: RARITY.RARE,      chance: 0.03   },
  { rarity: RARITY.EPIC,      chance: 0.0175 },
  { rarity: RARITY.LEGENDARY, chance: 0.002375 },
  { rarity: RARITY.MYTHICAL,  chance: 0.000125 },
];

// === CONSTANTS ===
const HUNT_COOLDOWN = 15000;
const HUNT_COST = 5;
const TREASURE_CHANCE = 0.03;

const XP_PER_LEVEL = 100;
const MAX_ANIMAL_LEVEL = 50;

const BATTLE_XP_WIN = 200;
const BATTLE_XP_LOSE = 50;
const BATTLE_XP_TIE = 100;
const BATTLE_COOLDOWN = 15000;
const BATTLE_TREASURE_CHANCE = 0.05;

// === STAT HELPERS ===
function getAnimalStats(animal, level) {
  const g = animal.growth || {};
  return {
    hp:      Math.floor(animal.hp     + (level - 1) * (g.hp     || 0)),
    atk:     Math.floor(animal.atk    + (level - 1) * (g.atk    || 0)),
    ap:      Math.floor(animal.ap     + (level - 1) * (g.ap     || 0)),
    def:     Math.floor(animal.def    + (level - 1) * (g.def    || 0)),
    mr:      Math.floor(animal.mr     + (level - 1) * (g.mr     || 0)),
    atkPen:  Math.floor(animal.atkPen + (level - 1) * (g.atkPen || 0)),
    magPen:  Math.floor(animal.magPen + (level - 1) * (g.magPen || 0)),
    crit:    Math.min(1, animal.crit  + (level - 1) * (g.crit   || 0)),
    critDmg: animal.critDmg + (level - 1) * (g.critDmg || 0),
    spd:     Math.floor(animal.spd    + (level - 1) * (g.spd    || 0)),
  };
}

function getFinalStats(animal, level, weapon, gemBuffs) {
  const base = getAnimalStats(animal, level);
  const ws = (weapon && weapon.stats) || {};
  const gm = gemBuffs || {};

  const final = {
    hp:      base.hp      + (ws.hp      || 0),
    atk:     base.atk     + (ws.atk     || 0),
    ap:      base.ap      + (ws.ap      || 0),
    def:     base.def     + (ws.def     || 0),
    mr:      base.mr      + (ws.mr      || 0),
    atkPen:  base.atkPen  + (ws.atkPen  || 0),
    magPen:  base.magPen  + (ws.magPen  || 0),
    crit:    Math.min(1, base.crit + (ws.crit || 0)),
    critDmg: base.critDmg + (ws.critDmg || 0),
    spd:     base.spd     + (ws.spd     || 0),
  };

  // Power gem: +% toàn bộ stat
  if (gm.powerBonus) {
    final.hp  = Math.floor(final.hp  * (1 + gm.powerBonus));
    final.atk = Math.floor(final.atk * (1 + gm.powerBonus));
    final.ap  = Math.floor(final.ap  * (1 + gm.powerBonus));
    final.def = Math.floor(final.def * (1 + gm.powerBonus));
    final.mr  = Math.floor(final.mr  * (1 + gm.powerBonus));
  }
  // Crit gem: +% crit rate
  if (gm.critBonus) {
    final.crit = Math.min(1, final.crit + gm.critBonus);
  }
  // Speed gem: +% speed
  if (gm.speedBonus) {
    final.spd = Math.floor(final.spd * (1 + gm.speedBonus));
  }

  return final;
}

function rollRarity(luckBonus) {
  const rates = RARITY_RATES.map(r => ({ ...r }));
  if (luckBonus > 0) {
    const shift = rates[0].chance * luckBonus;
    rates[0].chance -= shift;
    const rareCount = rates.length - 1;
    for (let i = 1; i < rates.length; i++) {
      rates[i].chance += shift / rareCount;
    }
  }
  let r = Math.random();
  for (const rate of rates) {
    r -= rate.chance;
    if (r <= 0) return rate.rarity;
  }
  return RARITY.COMMON;
}

// ============================================================
// ensurePlayer — Khởi tạo tất cả fields cho hệ thống OwO
// Gọi trước bất kỳ thao tác hunt/zoo/battle/gem/lootbox nào
// ============================================================
function ensurePlayer(p) {
  if (!p.zoo) p.zoo = [];
  if (!p.team) p.team = [null, null, null];
  if (!p.zooNextId) p.zooNextId = 1;
  if (!p.huntAlbum) p.huntAlbum = {};
  if (!p.monstersKilled) p.monstersKilled = 0;
  if (!p.lootBoxes) p.lootBoxes = {};
  if (!p.weapons) p.weapons = [];
  if (!p.weaponNextId) p.weaponNextId = 1;
  if (!p.ownedGems) p.ownedGems = {};

  // Migrate old huntInventory → xu (nếu còn sót)
  if (p.huntInventory && p.huntInventory.length > 0) {
    let total = 0;
    for (const item of p.huntInventory) total += (item.price || 10);
    p.xu = (p.xu || 0) + total;
    p.huntInventory = [];
  }
}

function parseId(str) {
  const s = (str || '').trim().toUpperCase();
  const m = s.match(/^([A-Z]+)(\d+)$/);
  if (m) return `${m[1]}${m[2]}`;
  if (/^\d+$/.test(s)) return `MT${s}`;
  return null;
}

module.exports = {
  RARITY, RARITY_RATES,
  HUNT_COOLDOWN, HUNT_COST, TREASURE_CHANCE,
  XP_PER_LEVEL, MAX_ANIMAL_LEVEL,
  BATTLE_XP_WIN, BATTLE_XP_LOSE, BATTLE_XP_TIE, BATTLE_COOLDOWN, BATTLE_TREASURE_CHANCE,
  getAnimalStats, getFinalStats, rollRarity, parseId, ensurePlayer,
};

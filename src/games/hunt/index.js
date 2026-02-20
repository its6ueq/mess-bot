// ============================================================
// HUNT — /hunt or /h — Pure RNG hunt, no maps/traps
// ============================================================
const D = require('../gamedata');

function hunt(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  // Cooldown
  const now = Date.now();
  if (p.lastHunt && now - new Date(p.lastHunt).getTime() < D.HUNT_COOLDOWN) {
    const left = Math.ceil((D.HUNT_COOLDOWN - (now - new Date(p.lastHunt).getTime())) / 1000);
    return `⏰ Đợi ${left}s nữa mới săn tiếp được!`;
  }

  // Chi phí
  const bal = economy.getBalance(player);
  if (bal.xu < D.HUNT_COST) {
    return `🚫 Cần ${D.HUNT_COST} xu để săn! Bạn có ${bal.xu} xu.`;
  }
  economy.removeXu(player, D.HUNT_COST);
  p.lastHunt = new Date().toISOString();

  // Tính gem bonuses từ team
  const gemBonuses = getTeamGemBonuses(p);

  // Số thú săn được (base 1 + hunt gem bonus)
  let catchCount = 1;
  if (gemBonuses.huntBonus > 0 && Math.random() < gemBonuses.huntBonus) {
    catchCount++;
  }

  let msg = `🏹 ĐI SĂN!\n`;

  for (let i = 0; i < catchCount; i++) {
    const rarity = D.rollRarity(gemBonuses.luckBonus);
    const animal = D.rollAnimal(rarity);

    // Thêm vào zoo
    const uid = p.zooNextId++;
    const entry = {
      uid,
      animalId: animal.id,
      level: 1,
      exp: 0,
      weaponUid: null,
      gems: [null, null, null],
    };
    p.zoo.push(entry);
    p.monstersKilled = (p.monstersKilled || 0) + 1;

    // Album
    if (!p.huntAlbum[animal.id]) p.huntAlbum[animal.id] = 0;
    p.huntAlbum[animal.id]++;

    msg += `\n${rarity.emoji} ${animal.name} [${animal.id}] #${uid}`;
    msg += ` | HP:${animal.hp} ATK:${animal.atk} AP:${animal.ap} DEF:${animal.def}`;
  }

  // Chance tìm treasure crate
  if (Math.random() < D.TREASURE_CHANCE) {
    if (!p.lootBoxes) p.lootBoxes = {};
    p.lootBoxes['LB1'] = (p.lootBoxes['LB1'] || 0) + 1;
    msg += `\n\n📦 Tìm thấy Hộp Kho Báu! /open để mở`;
  }

  economy._save();
  msg += `\n\nXu: ${economy.getBalance(player).xu.toLocaleString()} | Zoo: ${p.zoo.length} con`;
  return msg;
}

// ============================================================
// HELPERS
// ============================================================
function ensure(p) { D.ensurePlayer(p); }

function getTeamGemBonuses(p) {
  let huntBonus = 0, luckBonus = 0, powerBonus = 0, critBonus = 0, speedBonus = 0;
  if (!p.team) return { huntBonus, luckBonus, powerBonus, critBonus, speedBonus };

  for (const uid of p.team) {
    if (!uid) continue;
    const animal = p.zoo.find(a => a.uid === uid);
    if (!animal || !animal.gems) continue;

    for (const gemId of animal.gems) {
      if (!gemId) continue;
      const gem = D.GEM_BY_ID[gemId];
      if (!gem) continue;
      if (gem.type === D.GEM_TYPES.HUNT) huntBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.LUCK) luckBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.POWER) powerBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.CRIT) critBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.SPEED) speedBonus += gem.bonus;
    }
  }
  return { huntBonus, luckBonus, powerBonus, critBonus, speedBonus };
}

// ============================================================
// ALBUM
// ============================================================
function huntAlbum(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  if (Object.keys(p.huntAlbum).length === 0) return '📖 Album trống! /hunt để bắt đầu.';

  let msg = '📖 ALBUM SĂN BẮN\n';
  const byRarity = {};

  for (const [id, count] of Object.entries(p.huntAlbum)) {
    const animal = D.ANIMAL_BY_ID[id];
    if (!animal) continue;
    const key = animal.rarity.key;
    if (!byRarity[key]) byRarity[key] = [];
    byRarity[key].push({ animal, count });
  }

  for (const [, rarity] of Object.entries(D.RARITY)) {
    const group = byRarity[rarity.key];
    if (!group || group.length === 0) continue;
    const total = D.ANIMAL_BY_RARITY[rarity.key]?.length || 0;
    msg += `\n${rarity.emoji} ${rarity.label} [${group.length}/${total}]\n`;
    for (const { animal, count } of group) {
      msg += `  ${animal.name} [${animal.id}] x${count}\n`;
    }
  }
  return msg;
}

function handleInput() { return null; }

module.exports = { hunt, huntAlbum, handleInput, ensure, getTeamGemBonuses };

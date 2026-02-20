// ============================================================
// LOOTBOX — /open — Mở rương nhận weapon / gem / xu
// Sources: hunting (3%), battle win (5%), check-in (15%)
// ============================================================
const D = require('../gamedata');
const huntModule = require('../hunt/index');

function ensure(p) { D.ensurePlayer(p); }

// === /open [lootboxId] — Mở 1 crate ===
function open(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  huntModule.ensure(p);
  ensure(p);

  // Tìm crate để mở
  const q = (args || '').trim().toUpperCase();
  let crateId = null;

  if (q && D.LOOTBOX_BY_ID[q]) {
    crateId = q;
  } else {
    // Mở crate đầu tiên có
    for (const [id, count] of Object.entries(p.lootBoxes)) {
      if (count > 0) { crateId = id; break; }
    }
  }

  if (!crateId || !p.lootBoxes[crateId] || p.lootBoxes[crateId] <= 0) {
    return '📦 Không có rương nào! Săn thú, đánh trận, hoặc điểm danh để nhận.';
  }

  const crate = D.LOOTBOX_BY_ID[crateId];
  if (!crate) return '❌ Rương lỗi!';

  p.lootBoxes[crateId]--;

  const rewards = crate.rewards;
  const roll = Math.random();
  let msg = `📦 Mở ${crate.name}...\n`;

  if (roll < rewards.weaponChance) {
    // Drop weapon
    const wpData = D.rollWeapon();
    const wpUid = p.weaponNextId++;
    p.weapons.push({ uid: wpUid, weaponId: wpData.id, equippedOn: null });

    msg += `\n🔧 VŨ KHÍ MỚI!\n`;
    msg += `${wpData.rarity.emoji} ${wpData.name} [${wpData.id}] #${wpUid}\n`;
    const st = wpData.stats;
    const parts = [];
    if (st.atk) parts.push(`+${st.atk} ATK`);
    if (st.ap) parts.push(`+${st.ap} AP`);
    if (st.def) parts.push(`+${st.def} DEF`);
    if (st.mr) parts.push(`+${st.mr} MR`);
    if (st.hp) parts.push(`+${st.hp} HP`);
    if (st.spd) parts.push(`+${st.spd} SPD`);
    if (st.atkPen) parts.push(`+${st.atkPen} AtkPen`);
    if (st.magPen) parts.push(`+${st.magPen} MagPen`);
    if (st.crit) parts.push(`+${(st.crit*100).toFixed(0)}% Crit`);
    if (st.critDmg) parts.push(`+${(st.critDmg*100).toFixed(0)}% CritDmg`);
    msg += `Stats: ${parts.join(', ')}`;
    if (wpData.effect) msg += `\nSkill: ${wpData.effectDesc}`;

  } else if (roll < rewards.weaponChance + rewards.gemChance) {
    // Drop gem
    const gem = D.rollGem();
    p.ownedGems[gem.id] = (p.ownedGems[gem.id] || 0) + 1;

    msg += `\n💎 NGỌC MỚI!\n`;
    msg += `${gem.rarity.emoji} ${gem.name} [${gem.id}]\n`;
    msg += `Hiệu ứng: +${(gem.bonus * 100).toFixed(0)}% ${gem.type === 'hunt' ? 'Săn' : gem.type === 'luck' ? 'May mắn' : 'Sức mạnh'}`;

  } else {
    // Drop xu
    const xu = rewards.xuMin + Math.floor(Math.random() * (rewards.xuMax - rewards.xuMin));
    economy.addXu(player, xu);
    msg += `\n💰 ${xu.toLocaleString()} XU!`;
  }

  economy._save();

  // Show remaining crates
  const remaining = Object.entries(p.lootBoxes).filter(([, c]) => c > 0);
  if (remaining.length > 0) {
    msg += `\n\nRương còn: ${remaining.map(([id, c]) => `${D.LOOTBOX_BY_ID[id]?.name || id} x${c}`).join(', ')}`;
  }

  return msg;
}

// === /crates — Xem rương ===
function crates(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const owned = Object.entries(p.lootBoxes).filter(([, c]) => c > 0);
  if (owned.length === 0) return '📦 Không có rương! Săn thú, đánh trận, hoặc điểm danh để nhận.';

  let msg = '📦 RƯƠNG CỦA BẠN\n';
  for (const [id, count] of owned) {
    const lb = D.LOOTBOX_BY_ID[id];
    if (!lb) continue;
    msg += `\n${lb.rarity.emoji} ${lb.name} [${id}] x${count}`;
    msg += ` | ${(lb.rewards.weaponChance*100).toFixed(0)}% VK, ${(lb.rewards.gemChance*100).toFixed(0)}% Gem, ${((1-lb.rewards.weaponChance-lb.rewards.gemChance)*100).toFixed(0)}% Xu`;
  }
  msg += `\n\n/open [lbId] để mở`;
  return msg;
}

module.exports = { open, crates, ensure };

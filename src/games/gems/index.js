// ============================================================
// GEMS — /gems, /gemequip, /gemremove
// Gems nhận từ Treasure Crate, KHÔNG BÁN trong shop.
// Lắp cho thú trong team (3 slot gem mỗi con).
// ============================================================
const D = require('../gamedata');

function ensure(p) { D.ensurePlayer(p); }

// === /gems — Xem ngọc sở hữu ===
function gems(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const owned = Object.entries(p.ownedGems || {}).filter(([, c]) => c > 0);
  if (owned.length === 0) return '💎 Chưa có ngọc! Mở Hộp Kho Báu (/open) để nhận.';

  let msg = '💎 NGỌC CỦA BẠN\n';
  for (const [id, count] of owned) {
    const gem = D.GEM_BY_ID[id];
    if (!gem) continue;
    msg += `\n${gem.rarity.emoji} ${gem.name} [${gem.id}] x${count}`;
    msg += ` | ${gem.type === 'hunt' ? '+Săn' : gem.type === 'luck' ? '+May' : '+Lực'}: ${(gem.bonus * 100).toFixed(0)}%`;
  }
  msg += `\n\n/gemequip <gemId> <animalUid> <slot 1-3>`;
  return msg;
}

// === /gemequip <gemId> <animalUid> <slot> ===
function gemEquip(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const parts = (args || '').trim().split(/\s+/);
  if (parts.length < 3) return '/gemequip <gemId> <animalUid> <slot 1-3>';

  const gemId = parts[0].toUpperCase();
  const animalUid = parseInt(parts[1]);
  const slot = parseInt(parts[2]) - 1;

  if (slot < 0 || slot > 2) return '❌ Slot phải từ 1-3!';

  const gem = D.GEM_BY_ID[gemId];
  if (!gem) return `❌ Không tìm thấy ngọc ${gemId}!`;
  if (!p.ownedGems[gemId] || p.ownedGems[gemId] <= 0) return `❌ Bạn không có ${gem.name}!`;

  const animal = (p.zoo || []).find(a => a.uid === animalUid);
  if (!animal) return `❌ Không tìm thấy thú #${animalUid}!`;
  if (!animal.gems) animal.gems = [null, null, null];

  // Nếu slot đã có gem, trả lại
  if (animal.gems[slot]) {
    const oldId = animal.gems[slot];
    p.ownedGems[oldId] = (p.ownedGems[oldId] || 0) + 1;
  }

  animal.gems[slot] = gemId;
  p.ownedGems[gemId]--;
  economy._save();

  const info = D.ANIMAL_BY_ID[animal.animalId];
  return `💎 Đã lắp ${gem.name} vào ${info?.name || `#${animalUid}`} slot ${slot + 1}!`;
}

// === /gemremove <animalUid> <slot> ===
function gemRemove(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);

  const parts = (args || '').trim().split(/\s+/);
  if (parts.length < 2) return '/gemremove <animalUid> <slot 1-3>';

  const animalUid = parseInt(parts[0]);
  const slot = parseInt(parts[1]) - 1;
  if (slot < 0 || slot > 2) return '❌ Slot phải từ 1-3!';

  const animal = (p.zoo || []).find(a => a.uid === animalUid);
  if (!animal) return `❌ Không tìm thấy thú #${animalUid}!`;
  if (!animal.gems || !animal.gems[slot]) return `Slot ${slot + 1} trống!`;

  const gemId = animal.gems[slot];
  animal.gems[slot] = null;
  p.ownedGems[gemId] = (p.ownedGems[gemId] || 0) + 1;
  economy._save();

  const gem = D.GEM_BY_ID[gemId];
  return `✅ Đã gỡ ${gem?.name || gemId} khỏi thú #${animalUid} slot ${slot + 1}.`;
}

module.exports = { gems, gemEquip, gemRemove, ensure };

// ============================================================
// ZOO — Bộ sưu tập thú + Team 3 con + Quản lý vũ khí
// ============================================================
const D = require('../gamedata');

function ensure(p) { D.ensurePlayer(p); }

// === TÌM THÚ: chấp nhận UID số (#1, 1) HOẶC animal ID (MT3) ===
function findAnimal(p, input) {
  const q = (input || '').trim().replace(/^#/, '');
  if (!q) return null;

  // Thử numeric UID trước
  const num = parseInt(q);
  if (!isNaN(num)) {
    const byUid = p.zoo.find(a => a.uid === num);
    if (byUid) return byUid;
  }

  // Thử animal species ID (VD: MT3, MT10)
  const upper = q.toUpperCase();
  const matches = p.zoo.filter(a => a.animalId === upper);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return { multiple: matches }; // nhiều con cùng loài

  return null;
}

// === /zoo — Xem bộ sưu tập ===
function zoo(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  const q = (args || '').trim();

  // /zoo <uid|animalId> — xem chi tiết 1 con
  if (q) {
    const result = findAnimal(p, q);
    if (!result) return `❌ Không tìm thấy thú "${q}" trong zoo!`;
    if (result.multiple) {
      let msg = `⚠️ Có ${result.multiple.length} con "${q.toUpperCase()}":\n`;
      for (const a of result.multiple) {
        const info = D.ANIMAL_BY_ID[a.animalId];
        msg += `  #${a.uid} ${info?.name || a.animalId} Lv${a.level}\n`;
      }
      msg += `Dùng /zoo <#uid> để xem chi tiết.`;
      return msg;
    }
    return showAnimalDetail(result, p);
  }

  if (p.zoo.length === 0) return '🏠 Zoo trống! /hunt để bắt thú.';

  let msg = `🏠 ZOO (${p.zoo.length} con)\n`;
  const groups = {};
  for (const entry of p.zoo) {
    const info = D.ANIMAL_BY_ID[entry.animalId];
    if (!info) continue;
    const key = info.rarity.key;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ entry, info });
  }

  // Chỉ hiện rarity tier có thú
  for (const [, rarity] of Object.entries(D.RARITY)) {
    const group = groups[rarity.key];
    if (!group || group.length === 0) continue;
    msg += `\n${rarity.emoji} ${rarity.label}:\n`;
    for (const { entry, info } of group) {
      const inTeam = p.team.includes(entry.uid) ? ' ⭐' : '';
      const wp = entry.weaponUid ? ' 🔧' : '';
      msg += `  #${entry.uid} ${info.name} [${info.id}] Lv${entry.level}${wp}${inTeam}\n`;
    }
  }
  msg += `\n/zoo <#uid hoặc MT3> chi tiết | /team set <slot> <#uid>`;
  return msg;
}

function showAnimalDetail(entry, p) {
  const info = D.ANIMAL_BY_ID[entry.animalId];
  if (!info) return '❌ Dữ liệu thú lỗi!';

  const stats = D.getAnimalStats(info, entry.level);
  const inTeam = p.team.indexOf(entry.uid);
  const xpNeeded = entry.level * 100; // XP arithmetic

  let msg = `${info.rarity.emoji} ${info.name} [${info.id}] #${entry.uid}\n`;
  msg += `Lv: ${entry.level} | EXP: ${entry.exp}/${xpNeeded} | Role: ${info.role}\n`;
  msg += `Giá bán: ${info.price} xu\n`;
  if (inTeam >= 0) msg += `⭐ Trong team slot ${inTeam + 1}\n`;
  msg += `\n--- STATS (Lv${entry.level}) ---\n`;
  msg += `❤️ HP: ${stats.hp} | ⚔️ ATK: ${stats.atk} | 🔮 AP: ${stats.ap}\n`;
  msg += `🛡️ DEF: ${stats.def} | 🧿 MR: ${stats.mr}\n`;
  msg += `🗡️ AtkPen: ${stats.atkPen} | 🔯 MagPen: ${stats.magPen}\n`;
  msg += `💥 Crit: ${(stats.crit * 100).toFixed(0)}% | CritDmg: ${((1 + stats.critDmg) * 100).toFixed(0)}%\n`;
  msg += `💨 SPD: ${stats.spd}\n`;

  if (entry.weaponUid) {
    const wpInst = p.weapons.find(w => w.uid === entry.weaponUid);
    if (wpInst) {
      const wpInfo = D.WEAPON_BY_ID[wpInst.weaponId];
      if (wpInfo) {
        msg += `\n🔧 VŨ KHÍ: ${wpInfo.name} [${wpInfo.id}] #${wpInst.uid}\n`;
        const st = wpInfo.stats;
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
        msg += `Stats: ${parts.join(', ')}\n`;
        if (wpInfo.effect) msg += `Skill: ${wpInfo.effectDesc}\n`;
      }
    }
  }

  msg += `\n💎 GEMS: `;
  const gemParts = [];
  for (let i = 0; i < 3; i++) {
    const gid = entry.gems ? entry.gems[i] : null;
    if (gid) {
      const gem = D.GEM_BY_ID[gid];
      gemParts.push(gem ? gem.name : gid);
    } else {
      gemParts.push('[ trống ]');
    }
  }
  msg += gemParts.join(' | ');
  return msg;
}

// === /team ===
function team(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  const parts = (args || '').trim().split(/\s+/);
  const sub = parts[0]?.toLowerCase();

  if (sub === 'set' && parts.length >= 3) {
    const slot = parseInt(parts[1]) - 1;
    if (slot < 0 || slot > 2) return '❌ Slot phải từ 1-3!';

    // Tìm thú: chấp nhận #1, 1, MT3
    const result = findAnimal(p, parts[2]);
    if (!result) return `❌ Không tìm thấy thú "${parts[2]}" trong zoo! Xem /zoo`;
    if (result.multiple) {
      let msg = `⚠️ Có ${result.multiple.length} con "${parts[2].toUpperCase()}":\n`;
      for (const a of result.multiple) msg += `  #${a.uid} Lv${a.level}\n`;
      msg += `Dùng /team set ${parts[1]} <#uid>`;
      return msg;
    }

    const uid = result.uid;
    const existing = p.team.indexOf(uid);
    if (existing >= 0 && existing !== slot) p.team[existing] = null;
    p.team[slot] = uid;
    economy._save();
    const info = D.ANIMAL_BY_ID[result.animalId];
    return `⭐ Đã đặt ${info?.name || `#${uid}`} vào slot ${slot + 1}!`;
  }

  if (sub === 'remove' && parts.length >= 2) {
    const slot = parseInt(parts[1]) - 1;
    if (slot < 0 || slot > 2) return '❌ Slot phải từ 1-3!';
    if (!p.team[slot]) return `Slot ${slot + 1} đã trống!`;
    p.team[slot] = null;
    economy._save();
    return `✅ Đã gỡ thú khỏi slot ${slot + 1}.`;
  }

  let msg = `⭐ TEAM\n`;
  let teamDirty = false;
  for (let i = 0; i < 3; i++) {
    const uid = p.team[i];
    msg += `\nSlot ${i + 1}: `;
    if (!uid) { msg += '[ trống ]'; continue; }
    const animal = p.zoo.find(a => a.uid === uid);
    if (!animal) { msg += '[ đã xoá ]'; p.team[i] = null; teamDirty = true; continue; }
    const info = D.ANIMAL_BY_ID[animal.animalId];
    if (!info) { msg += '[ lỗi ]'; continue; }
    const stats = D.getAnimalStats(info, animal.level);
    msg += `${info.rarity.emoji} ${info.name} [${info.id}] #${uid} Lv${animal.level} (${info.role})`;
    msg += `\n      HP:${stats.hp} ATK:${stats.atk} AP:${stats.ap} DEF:${stats.def} MR:${stats.mr} SPD:${stats.spd}`;
    if (animal.weaponUid) {
      const wpInst = p.weapons.find(w => w.uid === animal.weaponUid);
      if (wpInst) {
        const wpInfo = D.WEAPON_BY_ID[wpInst.weaponId];
        if (wpInfo) msg += `\n      🔧 ${wpInfo.name}`;
        if (wpInfo?.effect) msg += ` [${wpInfo.effectDesc}]`;
      }
    }
  }
  msg += `\n\n/team set <1-3> <#uid hoặc MT3> | /team remove <1-3>`;
  if (teamDirty) economy._save();
  return msg;
}

// === /zsell ===
// Bán thú: xoá khỏi zoo, gỡ weapon trả lại kho
function zooSell(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  const q = (args || '').trim().toLowerCase();
  if (!q) return '/zsell <#uid hoặc MT3> hoặc /zsell all';

  if (q === 'all') {
    const toSell = p.zoo.filter(a => !p.team.includes(a.uid));
    if (toSell.length === 0) return 'Không có thú nào ngoài team để bán!';
    let total = 0;
    for (const entry of toSell) {
      const info = D.ANIMAL_BY_ID[entry.animalId];
      total += info ? info.price : 5;
      // Gỡ weapon
      if (entry.weaponUid) {
        const wpInst = p.weapons.find(w => w.uid === entry.weaponUid);
        if (wpInst) wpInst.equippedOn = null;
        entry.weaponUid = null;
      }
      // Trả gems về kho
      if (entry.gems) {
        for (const gid of entry.gems) {
          if (gid) p.ownedGems[gid] = (p.ownedGems[gid] || 0) + 1;
        }
      }
    }
    p.zoo = p.zoo.filter(a => p.team.includes(a.uid));
    economy.addXu(player, total);
    economy._save();
    return `💰 Đã bán ${toSell.length} con = ${total.toLocaleString()} xu!\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
  }

  const result = findAnimal(p, q);
  if (!result) return `❌ Không tìm thấy thú "${q}" trong zoo!`;
  if (result.multiple) {
    let msg = `⚠️ Có ${result.multiple.length} con cùng loài:\n`;
    for (const a of result.multiple) msg += `  #${a.uid} Lv${a.level}\n`;
    msg += `Dùng /zsell <#uid> để bán con cụ thể.`;
    return msg;
  }

  const uid = result.uid;
  if (p.team.includes(uid)) return `❌ Thú #${uid} đang trong team! /team remove trước.`;
  const idx = p.zoo.findIndex(a => a.uid === uid);
  const entry = p.zoo[idx];
  const info = D.ANIMAL_BY_ID[entry.animalId];
  const price = info ? info.price : 5;
  // Gỡ weapon
  if (entry.weaponUid) {
    const wpInst = p.weapons.find(w => w.uid === entry.weaponUid);
    if (wpInst) wpInst.equippedOn = null;
  }
  // Trả gems về kho
  if (entry.gems) {
    for (const gid of entry.gems) {
      if (gid) p.ownedGems[gid] = (p.ownedGems[gid] || 0) + 1;
    }
  }
  p.zoo.splice(idx, 1);
  economy.addXu(player, price);
  economy._save();
  return `💰 Bán ${info?.name || `#${uid}`} = ${price} xu\nVí: ${economy.getBalance(player).xu.toLocaleString()} xu`;
}

// === /wequip /wremove /weapons ===
function weaponEquip(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  const parts = (args || '').trim().split(/\s+/);
  if (parts.length < 2) return '/wequip <weaponUid> <animalUid hoặc MT3>';
  const wpUid = parseInt(parts[0]);
  const wpInst = p.weapons.find(w => w.uid === wpUid);
  if (!wpInst) return `❌ Không tìm thấy vũ khí #${wpUid}! /weapons xem kho.`;

  const animal = findAnimal(p, parts[1]);
  if (!animal) return `❌ Không tìm thấy thú "${parts[1]}"!`;
  if (animal.multiple) return `⚠️ Nhiều con cùng loài! Dùng /wequip ${wpUid} <#uid>`;

  if (animal.weaponUid) {
    const oldWp = p.weapons.find(w => w.uid === animal.weaponUid);
    if (oldWp) oldWp.equippedOn = null;
  }
  if (wpInst.equippedOn) {
    const oldAnimal = p.zoo.find(a => a.uid === wpInst.equippedOn);
    if (oldAnimal) oldAnimal.weaponUid = null;
  }
  animal.weaponUid = wpUid;
  wpInst.equippedOn = animal.uid;
  economy._save();
  const wpInfo = D.WEAPON_BY_ID[wpInst.weaponId];
  const animalInfo = D.ANIMAL_BY_ID[animal.animalId];
  let msg = `🔧 Đã lắp ${wpInfo?.name || `WP#${wpUid}`} cho ${animalInfo?.name || `#${animal.uid}`}!`;
  if (wpInfo?.effect) msg += `\nSkill: ${wpInfo.effectDesc}`;
  return msg;
}

function weaponRemove(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  const animal = findAnimal(p, (args || '').trim());
  if (!animal) return '/wremove <#uid hoặc MT3>';
  if (animal.multiple) return `⚠️ Nhiều con cùng loài! Dùng /wremove <#uid>`;
  if (!animal.weaponUid) return `Thú #${animal.uid} chưa lắp vũ khí!`;
  const wpInst = p.weapons.find(w => w.uid === animal.weaponUid);
  if (wpInst) wpInst.equippedOn = null;
  const wpInfo = wpInst ? D.WEAPON_BY_ID[wpInst.weaponId] : null;
  animal.weaponUid = null;
  economy._save();
  return `✅ Đã gỡ ${wpInfo?.name || 'vũ khí'} khỏi thú #${animal.uid}.`;
}

function weapons(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  ensure(p);
  if (p.weapons.length === 0) return '🔧 Chưa có vũ khí! Mở Hộp Kho Báu (/open) để nhận.';
  let msg = `🔧 VŨ KHÍ (${p.weapons.length})\n`;
  for (const wpInst of p.weapons) {
    const info = D.WEAPON_BY_ID[wpInst.weaponId];
    if (!info) continue;
    const equipped = wpInst.equippedOn
      ? (() => { const a = p.zoo.find(x => x.uid === wpInst.equippedOn); const ai = a ? D.ANIMAL_BY_ID[a.animalId] : null; return ai ? ` → ${ai.name} #${a.uid}` : ' → ???'; })()
      : '';
    msg += `\n${info.rarity.emoji} #${wpInst.uid} ${info.name} [${info.id}]${equipped}`;
    if (info.effect) msg += ` | ${info.effectDesc}`;
  }
  msg += `\n\n/wequip <wpUid> <#uid hoặc MT3> | /wremove <#uid>`;
  return msg;
}

module.exports = { zoo, team, zooSell, weaponEquip, weaponRemove, weapons, ensure };

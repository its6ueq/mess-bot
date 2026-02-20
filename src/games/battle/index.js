// ============================================================
// BATTLE — Turn-based 3v3 combat (PvE / PvP)
// Full damage formula: AD/AP, DEF/MR, Pen, Crit, weapon effects
// ============================================================
const D = require('../gamedata');
const huntModule = require('../hunt/index');

function calcDamage(attacker, target) {
  const effectiveDef = Math.max(0, target.def - attacker.atkPen);
  const physReduction = effectiveDef / (effectiveDef + 50);
  let physDmg = Math.max(0, attacker.atk * (1 - physReduction));

  const effectiveMr = Math.max(0, target.mr - attacker.magPen);
  const magReduction = effectiveMr / (effectiveMr + 50);
  let magDmg = Math.max(0, attacker.ap * (1 - magReduction));

  let isCrit = false;
  let critMult = 1;
  if (Math.random() < attacker.crit) {
    isCrit = true;
    critMult = 1 + attacker.critDmg;
  }

  let total = Math.floor((physDmg + magDmg) * critMult);
  total = Math.max(1, total);
  return { total, isCrit };
}

function createBattleEntity(entry, playerData) {
  const info = D.ANIMAL_BY_ID[entry.animalId];
  if (!info) return null;

  let weapon = null;
  if (entry.weaponUid && playerData.weapons) {
    const wpInst = playerData.weapons.find(w => w.uid === entry.weaponUid);
    if (wpInst) weapon = D.WEAPON_BY_ID[wpInst.weaponId];
  }

  // Tính tất cả gem bonus (power, crit, speed)
  const gemBonuses = { powerBonus: 0, critBonus: 0, speedBonus: 0 };
  if (entry.gems) {
    for (const gid of entry.gems) {
      if (!gid) continue;
      const gem = D.GEM_BY_ID[gid];
      if (!gem) continue;
      if (gem.type === D.GEM_TYPES.POWER) gemBonuses.powerBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.CRIT) gemBonuses.critBonus += gem.bonus;
      if (gem.type === D.GEM_TYPES.SPEED) gemBonuses.speedBonus += gem.bonus;
    }
  }

  const stats = D.getFinalStats(info, entry.level, weapon, gemBonuses);

  return {
    uid: entry.uid, animalId: entry.animalId, name: info.name,
    rarity: info.rarity, level: entry.level,
    maxHp: stats.hp, hp: stats.hp,
    atk: stats.atk, ap: stats.ap, def: stats.def, mr: stats.mr,
    atkPen: stats.atkPen, magPen: stats.magPen,
    crit: stats.crit, critDmg: stats.critDmg, spd: stats.spd,
    weapon, debuffs: [], alive: true,
  };
}

// ==========================
// PvE Generation — ~60% player win rate
// Logic: đội PvE yếu hơn player 1 chút:
// - 1-3 con (random, bias 2 con nếu player 3 con)
// - Level: bằng hoặc thấp hơn player
// - Rarity: chủ yếu common/uncommon, hiếm khi rare+
// - Weapon: 30% chance có weapon (player thường cũng chưa có)
// - Stat bị nerf 15% so với chuẩn
// ==========================
function generatePvETeam(playerTeam) {
  const avgLv = Math.max(1, Math.floor(playerTeam.reduce((s, e) => s + e.level, 0) / playerTeam.length));
  const playerCount = playerTeam.length;

  // Số lượng quái: nếu player 3 con → quái 2-3 con, nếu 2 → 1-2, nếu 1 → 1
  let enemyCount;
  if (playerCount >= 3) enemyCount = Math.random() < 0.6 ? 3 : 2;
  else if (playerCount === 2) enemyCount = Math.random() < 0.5 ? 2 : 1;
  else enemyCount = 1;

  const team = [];
  const NERF = 0.85; // nerf 15% stat

  // PvE rarity: bias common/uncommon cho dễ thắng
  const pveRarityRates = [
    { rarity: D.RARITY.COMMON,    chance: 0.50 },
    { rarity: D.RARITY.UNCOMMON,  chance: 0.30 },
    { rarity: D.RARITY.RARE,      chance: 0.13 },
    { rarity: D.RARITY.EPIC,      chance: 0.05 },
    { rarity: D.RARITY.LEGENDARY, chance: 0.018 },
    { rarity: D.RARITY.MYTHICAL,  chance: 0.002 },
  ];

  for (let i = 0; i < enemyCount; i++) {
    // Level: từ avgLv-2 đến avgLv+1 (bias thấp hơn)
    const lv = Math.max(1, avgLv + Math.floor(Math.random() * 4) - 2);

    // Roll rarity (bias thấp)
    let r = Math.random();
    let rarity = D.RARITY.COMMON;
    for (const rate of pveRarityRates) {
      r -= rate.chance;
      if (r <= 0) { rarity = rate.rarity; break; }
    }

    const animal = D.rollAnimal(rarity);
    const stats = D.getAnimalStats(animal, lv);

    // Chance weapon (30%)
    let weapon = null;
    if (Math.random() < 0.30) {
      weapon = D.WEAPONS[Math.floor(Math.random() * D.WEAPONS.length)];
    }
    const ws = (weapon && weapon.stats) || {};

    team.push({
      uid: -(i + 1), animalId: animal.id, name: animal.name,
      rarity: animal.rarity, level: lv,
      maxHp: Math.floor((stats.hp + (ws.hp || 0)) * NERF),
      hp: Math.floor((stats.hp + (ws.hp || 0)) * NERF),
      atk: Math.floor((stats.atk + (ws.atk || 0)) * NERF),
      ap: Math.floor((stats.ap + (ws.ap || 0)) * NERF),
      def: Math.floor((stats.def + (ws.def || 0)) * NERF),
      mr: Math.floor((stats.mr + (ws.mr || 0)) * NERF),
      atkPen: Math.floor((stats.atkPen + (ws.atkPen || 0))),
      magPen: Math.floor((stats.magPen + (ws.magPen || 0))),
      crit: Math.min(1, stats.crit + (ws.crit || 0)),
      critDmg: stats.critDmg + (ws.critDmg || 0),
      spd: Math.floor((stats.spd + (ws.spd || 0)) * NERF),
      weapon, debuffs: [], alive: true,
    });
  }
  return team;
}

function processWeaponEffect(attacker, target, damage, allEnemies, allAllies, log) {
  if (!attacker.weapon || !attacker.weapon.effect) return damage;
  const effect = attacker.weapon.effect;

  switch (effect) {
    case 'bleed':
      target.debuffs.push({ type: 'bleed', turns: 3, value: 0.03 });
      log.push(`  🩸 ${target.name} chảy máu!`);
      break;
    case 'burn':
      target.debuffs.push({ type: 'burn', turns: 2, value: 0.05 });
      log.push(`  🔥 ${target.name} bị cháy!`);
      break;
    case 'execute':
      if (target.hp < target.maxHp * 0.2) { damage *= 2; log.push(`  💀 HÀNH QUYẾT! x2!`); }
      break;
    case 'silence':
      target.debuffs.push({ type: 'silence', turns: 1, value: 0 });
      log.push(`  🤐 ${target.name} bị câm lặng!`);
      break;
    case 'slow':
      target.debuffs.push({ type: 'slow', turns: 2, value: 0.30 });
      log.push(`  ❄️ ${target.name} bị đóng băng!`);
      break;
    case 'chain': {
      const others = allEnemies.filter(e => e.alive && e.uid !== target.uid);
      const chainDmg = Math.floor(damage * 0.30);
      for (const o of others) {
        o.hp -= chainDmg;
        if (o.hp <= 0) { o.hp = 0; o.alive = false; }
        log.push(`  ⚡ Sấm lan → ${o.name}: ${chainDmg} dmg`);
      }
      break;
    }
    case 'taunt':
      attacker.debuffs.push({ type: 'taunt', turns: 1, value: 0 });
      log.push(`  🛡️ ${attacker.name} khiêu khích!`);
      break;
    case 'lifesteal': {
      const heal = Math.floor(damage * 0.10);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      log.push(`  💍 ${attacker.name} hút ${heal} HP!`);
      break;
    }
    case 'aura': case 'reflect': case 'dodge': case 'doubleStrike':
      break; // Handled elsewhere
  }
  return damage;
}

function applyDebuffs(entity, log) {
  const remaining = [];
  for (const d of entity.debuffs) {
    if (d.type === 'bleed') { const dmg = Math.floor(entity.maxHp * d.value); entity.hp -= dmg; log.push(`  🩸 ${entity.name}: -${dmg}`); }
    if (d.type === 'burn') { const dmg = Math.floor(entity.maxHp * d.value); entity.hp -= dmg; log.push(`  🔥 ${entity.name}: -${dmg}`); }
    d.turns--;
    if (d.turns > 0) remaining.push(d);
  }
  entity.debuffs = remaining;
  if (entity.hp <= 0) { entity.hp = 0; entity.alive = false; log.push(`  💀 ${entity.name} gục ngã!`); }
}

function simulateBattle(teamA, teamB) {
  const log = [];
  // Aura
  for (const team of [teamA, teamB]) {
    for (const e of team) {
      if (e.weapon && e.weapon.effect === 'aura') {
        for (const a of team) {
          a.atk = Math.floor(a.atk * 1.10); a.ap = Math.floor(a.ap * 1.10);
          a.def = Math.floor(a.def * 1.10); a.mr = Math.floor(a.mr * 1.10);
          a.hp = Math.floor(a.hp * 1.10); a.maxHp = Math.floor(a.maxHp * 1.10);
        }
        log.push(`👑 ${e.name} Hào quang! (+10% team)`);
      }
    }
  }

  for (let turn = 1; turn <= 30; turn++) {
    const aliveA = teamA.filter(e => e.alive);
    const aliveB = teamB.filter(e => e.alive);
    if (aliveA.length === 0 || aliveB.length === 0) break;

    log.push(`\n--- Lượt ${turn} ---`);
    const allAlive = [...aliveA, ...aliveB].sort((a, b) => {
      let sa = a.spd, sb = b.spd;
      if (a.debuffs.find(d => d.type === 'slow')) sa = Math.floor(sa * 0.7);
      if (b.debuffs.find(d => d.type === 'slow')) sb = Math.floor(sb * 0.7);
      return sb - sa;
    });

    for (const atk of allAlive) {
      if (!atk.alive) continue;
      applyDebuffs(atk, log);
      if (!atk.alive) continue;
      const silenced = atk.debuffs.some(d => d.type === 'silence');
      const isA = teamA.includes(atk);
      const enemies = (isA ? teamB : teamA).filter(e => e.alive);
      const allies = (isA ? teamA : teamB).filter(e => e.alive);
      if (enemies.length === 0) break;

      let target = enemies[Math.floor(Math.random() * enemies.length)];
      const tauntT = enemies.find(e => e.debuffs.some(d => d.type === 'taunt'));
      if (tauntT) target = tauntT;

      if (!silenced && target.weapon && target.weapon.effect === 'dodge' && Math.random() < 0.12) {
        log.push(`${atk.name} → ${target.name} 🌀 NÉ!`); continue;
      }

      let { total, isCrit } = calcDamage(atk, target);
      if (!silenced) total = processWeaponEffect(atk, target, total, enemies, allies, log);

      target.hp -= total;
      log.push(`${atk.name} → ${target.name}: ${total}${isCrit ? ' 💥CRIT' : ''} (${Math.max(0,target.hp)}/${target.maxHp})`);

      if (!silenced && target.weapon && target.weapon.effect === 'reflect' && target.alive) {
        const rd = Math.floor(total * 0.10); atk.hp -= rd;
        log.push(`  💎 Phản ${rd} → ${atk.name}`);
        if (atk.hp <= 0) { atk.hp = 0; atk.alive = false; log.push(`  💀 ${atk.name} gục!`); }
      }

      if (target.hp <= 0) { target.hp = 0; target.alive = false; log.push(`  💀 ${target.name} gục!`); }

      if (!silenced && atk.alive && atk.weapon && atk.weapon.effect === 'doubleStrike' && Math.random() < 0.20) {
        const e2 = (isA ? teamB : teamA).filter(e => e.alive);
        if (e2.length > 0) {
          const t2 = e2[Math.floor(Math.random() * e2.length)];
          const r2 = calcDamage(atk, t2);
          t2.hp -= r2.total;
          log.push(`  ⚡ ĐÁNH ĐÔI → ${t2.name}: ${r2.total}${r2.isCrit ? ' 💥' : ''}`);
          if (t2.hp <= 0) { t2.hp = 0; t2.alive = false; log.push(`  💀 ${t2.name} gục!`); }
        }
      }
    }
    if (teamA.filter(e => e.alive).length === 0 || teamB.filter(e => e.alive).length === 0) break;
  }

  const aA = teamA.filter(e => e.alive).length;
  const bA = teamB.filter(e => e.alive).length;
  return { result: aA > 0 && bA === 0 ? 'A' : bA > 0 && aA === 0 ? 'B' : 'TIE', log };
}

// XP cần để lên level tăng theo cấp số cộng: Lv1→2=100, Lv2→3=200, ...
function xpForLevel(level) {
  return level * 100;
}

function battle(ctx, args) {
  const { player, economy, resolveTarget } = ctx;
  const p = economy.getPlayer(player);
  huntModule.ensure(p);
  const teamUids = p.team.filter(uid => uid !== null);
  if (teamUids.length === 0) return '🚫 Chưa có team! /hunt bắt thú → /team set 1 <#uid>';

  const now = Date.now();
  if (p.lastBattle && now - new Date(p.lastBattle).getTime() < D.BATTLE_COOLDOWN) {
    const left = Math.ceil((D.BATTLE_COOLDOWN - (now - new Date(p.lastBattle).getTime())) / 1000);
    return `⏰ Đợi ${left}s!`;
  }
  p.lastBattle = new Date().toISOString();

  const playerTeam = [];
  for (const uid of p.team) {
    if (!uid) continue;
    const entry = p.zoo.find(a => a.uid === uid);
    if (!entry) continue;
    const entity = createBattleEntity(entry, p);
    if (entity) playerTeam.push(entity);
  }
  if (playerTeam.length === 0) return '🚫 Team trống!';

  let isPvP = false, opponentTeam, opponentName = 'Quái Vật Hoang';
  const targetArg = (args || '').trim();

  if (targetArg && targetArg.includes('@') && resolveTarget) {
    const targetId = resolveTarget(targetArg);
    if (targetId && targetId !== player) {
      const op = economy.getPlayer(targetId);
      huntModule.ensure(op);
      if ((op.team || []).filter(u => u).length === 0) return '🚫 Đối thủ chưa có team!';
      opponentTeam = [];
      for (const uid of op.team) {
        if (!uid) continue;
        const entry = op.zoo.find(a => a.uid === uid);
        if (!entry) continue;
        const entity = createBattleEntity(entry, op);
        if (entity) opponentTeam.push(entity);
      }
      if (opponentTeam.length === 0) return '🚫 Team đối thủ lỗi!';
      isPvP = true;
      opponentName = economy.getDisplayName ? economy.getDisplayName(targetId) || `@${targetId}` : `@${targetId}`;
    }
  }

  if (!isPvP) {
    opponentTeam = generatePvETeam(playerTeam);
  }

  const { result, log } = simulateBattle([...playerTeam], [...opponentTeam]);

  let msg = `⚔️ BATTLE${isPvP ? ` vs ${opponentName}` : ''}\n`;
  msg += `📋 Bạn: ${playerTeam.map(e => `${e.rarity.emoji}${e.name} Lv${e.level}`).join(', ')}\n`;
  msg += `👹 ${opponentName}: ${opponentTeam.map(e => {
    const wpTag = e.weapon ? ` 🔧${e.weapon.name}` : '';
    return `${e.rarity.emoji}${e.name} Lv${e.level}${wpTag}`;
  }).join(', ')}\n`;

  const showLog = log.slice(-12);
  msg += `\n--- CHIẾN ĐẤU ---\n`;
  if (log.length > 12) msg += `... (${log.length - 12} dòng trước)\n`;
  for (const line of showLog) msg += line + '\n';

  if (result === 'A') {
    const xp = D.BATTLE_XP_WIN;
    msg += `\n🏆 THẮNG! +${xp} EXP`;
    addTeamXP(p, xp);
    const xu = 20 + Math.floor(Math.random() * 30);
    economy.addXu(player, xu);
    msg += ` +${xu} xu`;
    if (Math.random() < D.BATTLE_TREASURE_CHANCE) {
      if (!p.lootBoxes) p.lootBoxes = {};
      p.lootBoxes['LB2'] = (p.lootBoxes['LB2'] || 0) + 1;
      msg += `\n📦 Tìm thấy Hộp Hiếm!`;
    }
  } else if (result === 'B') {
    const xp = D.BATTLE_XP_LOSE;
    msg += `\n😞 THUA! +${xp} EXP`;
    addTeamXP(p, xp);
  } else {
    const xp = D.BATTLE_XP_TIE;
    msg += `\n🤝 HOÀ! +${xp} EXP`;
    addTeamXP(p, xp);
  }

  economy._save();
  return msg;
}

// XP tăng cấp số cộng: Lv1→2 = 100, Lv2→3 = 200, Lv3→4 = 300, ...
function addTeamXP(p, xp) {
  for (const uid of p.team) {
    if (!uid) continue;
    const animal = p.zoo.find(a => a.uid === uid);
    if (!animal || animal.level >= D.MAX_ANIMAL_LEVEL) continue;
    animal.exp += xp;
    let needed = xpForLevel(animal.level);
    while (animal.exp >= needed && animal.level < D.MAX_ANIMAL_LEVEL) {
      animal.exp -= needed;
      animal.level++;
      needed = xpForLevel(animal.level);
    }
  }
}

function handleInput() { return null; }
module.exports = { battle, handleInput };

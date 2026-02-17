#!/usr/bin/env node
// Migration script: chuyen du lieu tu name-based sang ID-based
// Chay: node migrate-to-id.js
//
// Can chay inspect-sidebar.js hoac bot truoc de co user registry (data/users.json)
// Hoac nhap ID thu cong cho tung player

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BACKUP_FILE = path.join(DATA_DIR, 'players_backup_name.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

async function migrate() {
  console.log('=== MIGRATION: Name-based -> ID-based ===\n');

  // 1. Doc players.json hien tai
  if (!fs.existsSync(PLAYERS_FILE)) {
    console.log('Khong tim thay data/players.json!');
    process.exit(1);
  }

  const playersRaw = fs.readFileSync(PLAYERS_FILE, 'utf8');
  const players = JSON.parse(playersRaw);

  const names = Object.keys(players);
  if (!names.length) {
    console.log('Khong co player nao de migrate!');
    process.exit(0);
  }

  console.log(`Tim thay ${names.length} players:\n`);
  names.forEach((name, i) => {
    const p = players[name];
    console.log(`  ${i + 1}. ${name} - ${p.xu} xu, bank ${p.bank}, lv${p.level}`);
  });

  // 2. Doc user registry (neu co)
  let users = {};
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    console.log(`\nUser registry co ${Object.keys(users).length} entries.`);
  } else {
    console.log('\nChua co user registry (data/users.json). Ban se can nhap ID thu cong.');
  }

  // Build reverse map: name -> id
  const nameToId = {};
  for (const [id, info] of Object.entries(users)) {
    if (info.name) {
      nameToId[info.name.toLowerCase()] = id;
    }
  }

  // 3. Mapping tung player
  console.log('\n--- MAPPING ---\n');
  console.log('Nhap Facebook ID cho tung player. Nhan Enter de bo qua (xoa player do).');
  console.log('Neu trung ID, du lieu se duoc gop.\n');

  const newPlayers = {};
  const mapping = {}; // oldName -> newId

  for (const name of names) {
    const p = players[name];

    // Tu dong match tu registry
    const autoId = nameToId[name.toLowerCase()];
    const hint = autoId ? ` [Auto: ${autoId}]` : '';

    const input = await ask(`  ${name}${hint}: `);
    const id = (input.trim() || autoId || '').trim();

    if (!id) {
      console.log(`    -> BO QUA (player bi xoa)`);
      continue;
    }

    if (!/^\d+$/.test(id)) {
      console.log(`    -> ID khong hop le (phai la so)! Bo qua.`);
      continue;
    }

    mapping[name] = id;

    if (newPlayers[id]) {
      // Gop du lieu
      console.log(`    -> GOP voi player ID ${id} da co`);
      const existing = newPlayers[id];
      existing.xu += p.xu;
      existing.bank += p.bank;
      existing.totalEarned += p.totalEarned;
      existing.totalSpent += p.totalSpent;
      existing.fishCaught += p.fishCaught;
      existing.gamesPlayed += p.gamesPlayed;
      existing.gamesWon += p.gamesWon;
      existing.inventory.push(...p.inventory);
      if (p.level > existing.level) existing.level = p.level;
      if (p.exp > existing.exp) existing.exp = p.exp;
    } else {
      newPlayers[id] = {
        id: id,
        displayName: name,
        xu: p.xu,
        bank: p.bank,
        level: p.level,
        exp: p.exp,
        totalEarned: p.totalEarned,
        totalSpent: p.totalSpent,
        fishCaught: p.fishCaught,
        gamesPlayed: p.gamesPlayed,
        gamesWon: p.gamesWon,
        inventory: [...p.inventory],
        lastDaily: p.lastDaily,
        lastFish: p.lastFish,
        lastWork: p.lastWork,
        createdAt: p.createdAt,
        checkinStreak: p.checkinStreak || 0,
        lastCheckin: p.lastCheckin || null,
      };
      console.log(`    -> OK: ${name} = ${id}`);
    }
  }

  // 4. Xac nhan
  console.log('\n--- KET QUA ---\n');
  for (const [id, p] of Object.entries(newPlayers)) {
    console.log(`  ${p.displayName} (${id}): ${p.xu} xu, bank ${p.bank}`);
  }

  const confirm = await ask('\nLuu thay doi? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Huy bo!');
    rl.close();
    return;
  }

  // 5. Backup va ghi
  console.log(`\nBackup -> ${BACKUP_FILE}`);
  fs.writeFileSync(BACKUP_FILE, playersRaw, 'utf8');

  console.log(`Ghi ${Object.keys(newPlayers).length} players moi -> ${PLAYERS_FILE}`);
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(newPlayers, null, 2), 'utf8');

  // Update user registry
  for (const [oldName, newId] of Object.entries(mapping)) {
    users[newId] = { name: oldName, lastSeen: new Date().toISOString() };
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

  console.log('\nMigration hoan tat!');
  console.log('Mapping:', JSON.stringify(mapping, null, 2));

  rl.close();
}

migrate().catch(err => {
  console.error('Loi:', err);
  rl.close();
  process.exit(1);
});

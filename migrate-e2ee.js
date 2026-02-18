// ============================================================
// MIGRATE E2EE - Chuyen raw e2ee keys sang Facebook User ID
// Backup -> Decode -> Merge duplicates -> Clean up
// Chay: node migrate-e2ee.js
// ============================================================

const fs = require('fs');
const path = require('path');

const PLAYERS_FILE = path.join(__dirname, 'data', 'players.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const CHECKPOINTS_FILE = path.join(__dirname, 'data', 'checkpoints.json');
const BACKUP_DIR = path.join(__dirname, 'data', 'backup');

function decodeBigInt(arr) {
  if (!arr) return null;
  if (typeof arr === 'string') return arr;
  if (typeof arr === 'number') return String(arr);
  if (!Array.isArray(arr) || arr.length !== 2) return null;
  try {
    const high = BigInt(arr[0]);
    const low = BigInt(arr[1] >>> 0); // unsigned
    return ((high << 32n) + low).toString();
  } catch (e) { return null; }
}

function decodeKeyToId(key) {
  // "23295,3504810323" -> [23295, 3504810323] -> decode
  const parts = key.split(',').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return decodeBigInt(parts);
}

function isRawKey(key) {
  return /^\d+,\d+$/.test(key);
}

// Merge: raw entry (active/recent) + old entry (has proper displayName)
function mergeEntries(rawEntry, oldEntry, decodedId, users) {
  const merged = { ...rawEntry };

  // Fix id and displayName
  merged.id = decodedId;
  merged.displayName = oldEntry.displayName || users[decodedId]?.name || decodedId;

  // Sum xu and bank
  merged.xu = (rawEntry.xu || 0) + (oldEntry.xu || 0);
  merged.bank = (rawEntry.bank || 0) + (oldEntry.bank || 0);

  // Keep higher level, sum exp
  if ((oldEntry.level || 1) > (rawEntry.level || 1)) {
    merged.level = oldEntry.level;
    merged.exp = oldEntry.exp || 0;
  }

  // Sum stats
  merged.totalEarned = (rawEntry.totalEarned || 0) + (oldEntry.totalEarned || 0);
  merged.totalSpent = (rawEntry.totalSpent || 0) + (oldEntry.totalSpent || 0);
  merged.fishCaught = (rawEntry.fishCaught || 0) + (oldEntry.fishCaught || 0);
  merged.gamesPlayed = (rawEntry.gamesPlayed || 0) + (oldEntry.gamesPlayed || 0);
  merged.gamesWon = (rawEntry.gamesWon || 0) + (oldEntry.gamesWon || 0);
  merged.monstersKilled = (rawEntry.monstersKilled || 0) + (oldEntry.monstersKilled || 0);

  // Concatenate inventories (remove old name-based items, keep id-based)
  const rawInv = rawEntry.inventory || [];
  const oldInv = (oldEntry.inventory || []).filter(i => i.id); // only keep id-based items
  merged.inventory = [...rawInv, ...oldInv];

  // Keep earliest createdAt
  if (oldEntry.createdAt && rawEntry.createdAt) {
    merged.createdAt = new Date(oldEntry.createdAt) < new Date(rawEntry.createdAt)
      ? oldEntry.createdAt : rawEntry.createdAt;
  }

  // Keep most recent timestamps
  const pickLatest = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return new Date(a) > new Date(b) ? a : b;
  };
  merged.lastDaily = pickLatest(rawEntry.lastDaily, oldEntry.lastDaily);
  merged.lastFish = pickLatest(rawEntry.lastFish, oldEntry.lastFish);
  merged.lastWork = pickLatest(rawEntry.lastWork, oldEntry.lastWork);
  merged.lastCheckin = pickLatest(rawEntry.lastCheckin, oldEntry.lastCheckin);
  merged.lastHunt = pickLatest(rawEntry.lastHunt, oldEntry.lastHunt);

  // Keep checkin streak from most recent
  if (rawEntry.lastCheckin && oldEntry.lastCheckin) {
    if (new Date(rawEntry.lastCheckin) > new Date(oldEntry.lastCheckin)) {
      merged.checkinStreak = rawEntry.checkinStreak || 0;
    } else {
      merged.checkinStreak = oldEntry.checkinStreak || 0;
    }
  }

  // Keep game progress from raw entry (has actual progress)
  // rod, bait, fishMap, album, albumRewards, maxBaitSize
  // huntTrap, huntWeapon, huntMap, huntAlbum, etc.
  // These are already in merged from rawEntry spread

  return merged;
}

function migrate() {
  console.log('='.repeat(60));
  console.log('  MIGRATE E2EE -> FACEBOOK USER ID');
  console.log('='.repeat(60));

  // Load data
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
  const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : {};

  // Step 1: Backup
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(BACKUP_DIR, `players_${timestamp}.json`), JSON.stringify(players, null, 2));
  if (fs.existsSync(CHECKPOINTS_FILE)) {
    const checkpoints = JSON.parse(fs.readFileSync(CHECKPOINTS_FILE, 'utf8'));
    fs.writeFileSync(path.join(BACKUP_DIR, `checkpoints_${timestamp}.json`), JSON.stringify(checkpoints, null, 2));
  }
  console.log(`\n[1] Backup saved to data/backup/`);

  // Step 2: Decode raw keys
  console.log(`\n[2] Decoding raw e2ee keys...`);
  const rawEntries = {};
  const properEntries = {};
  const toRemove = [];

  for (const [key, data] of Object.entries(players)) {
    if (key === 'Unknown') {
      console.log(`  SKIP: "Unknown" (will be removed)`);
      toRemove.push(key);
      continue;
    }

    if (isRawKey(key)) {
      const decodedId = decodeKeyToId(key);
      if (decodedId) {
        console.log(`  RAW: "${key}" -> ${decodedId}`);
        rawEntries[key] = { decodedId, data };
        toRemove.push(key);
      } else {
        console.log(`  ERROR: Cannot decode "${key}"`);
      }
    } else {
      properEntries[key] = data;
    }
  }

  // Step 3: Merge duplicates
  console.log(`\n[3] Merging entries...`);
  const result = { ...properEntries };

  for (const [rawKey, { decodedId, data: rawData }] of Object.entries(rawEntries)) {
    if (result[decodedId]) {
      // Duplicate! Merge
      const oldData = result[decodedId];
      console.log(`  MERGE: "${rawKey}" + existing "${decodedId}" (${oldData.displayName})`);
      console.log(`    Old: xu=${oldData.xu}, fish=${oldData.fishCaught}, games=${oldData.gamesPlayed}`);
      console.log(`    Raw: xu=${rawData.xu}, fish=${rawData.fishCaught}, games=${rawData.gamesPlayed}`);
      result[decodedId] = mergeEntries(rawData, oldData, decodedId, users);
      const m = result[decodedId];
      console.log(`    Result: xu=${m.xu}, fish=${m.fishCaught}, games=${m.gamesPlayed}`);
    } else {
      // New entry, just fix id/displayName
      const fixed = { ...rawData };
      fixed.id = decodedId;
      fixed.displayName = users[decodedId]?.name || decodedId;
      console.log(`  NEW: "${rawKey}" -> ${decodedId} (${fixed.displayName})`);
      result[decodedId] = fixed;
    }
  }

  // Step 4: Remove old raw keys and Unknown
  for (const key of toRemove) {
    delete result[key];
  }

  // Step 5: Fix any remaining entries with array id/displayName
  for (const [key, data] of Object.entries(result)) {
    if (Array.isArray(data.id)) {
      data.id = key;
    }
    if (Array.isArray(data.displayName)) {
      data.displayName = users[key]?.name || key;
    }
    if (data.displayName === 'Unknown' || data.displayName === 'User') {
      data.displayName = users[key]?.name || key;
    }
  }

  // Step 6: Save
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(result, null, 2));
  console.log(`\n[4] Saved clean players.json`);

  // Step 7: Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`Before: ${Object.keys(players).length} entries`);
  console.log(`After:  ${Object.keys(result).length} entries`);
  console.log(`Removed raw keys: ${toRemove.length}`);
  console.log(`\nAll players:`);
  for (const [id, data] of Object.entries(result)) {
    console.log(`  ${id} - ${data.displayName} (xu=${data.xu}, lv=${data.level})`);
  }
}

migrate();

// migrate.js — Dọn dẹp fields cũ, thêm fields mới NẾU THIẾU
// KHÔNG xoá zoo/team/weapons/xu hay bất kỳ data nào của player
// Chạy: node migrate.js

const db = require('./src/db');

const players = db.load('players', {});
let count = 0;
let changed = 0;

// Fields từ hệ thống cũ (fish + hunt cũ) — không dùng nữa
const LEGACY_FIELDS = [
  // Fish system
  'fishCaught', 'inventory', 'rod', 'boat', 'album', 'albumRewards',
  'lastFish', 'bait', 'currentMap',
  // Old hunt system
  'huntInventory', 'huntGear', 'huntTrap', 'huntMap',
  'huntWeapon', 'huntMaxTrapLv', 'huntAlbumRewards',
  // Misc
  'maxBaitSize', 'fishMap',
  // Dead field từ bug (đã fix): hunt/ensure() từng set p.gems thay vì p.ownedGems
  'gems',
];

for (const [id, p] of Object.entries(players)) {
  count++;
  let dirty = false;

  // Xoá legacy fields
  for (const field of LEGACY_FIELDS) {
    if (field in p) {
      delete p[field];
      dirty = true;
    }
  }

  // Thêm fields mới nếu thiếu (KHÔNG reset nếu đã có)
  if (!p.zoo)          { p.zoo = []; dirty = true; }
  if (!p.team)         { p.team = [null, null, null]; dirty = true; }
  if (!p.zooNextId)    { p.zooNextId = 1; dirty = true; }
  if (!p.weapons)      { p.weapons = []; dirty = true; }
  if (!p.weaponNextId) { p.weaponNextId = 1; dirty = true; }
  if (!p.ownedGems)    { p.ownedGems = {}; dirty = true; }
  if (!p.lootBoxes)    { p.lootBoxes = {}; dirty = true; }
  if (!p.huntAlbum)    { p.huntAlbum = {}; dirty = true; }
  if (typeof p.monstersKilled !== 'number') { p.monstersKilled = 0; dirty = true; }

  if (dirty) {
    changed++;
    console.log(`  [${count}] ${p.displayName || id}: cleaned`);
  }
}

if (changed > 0) {
  db._writeSync('players');
  console.log(`\n✅ Đã dọn ${changed}/${count} players.`);
  console.log('   Legacy fields xoá | New fields thêm nếu thiếu | Data player giữ nguyên.');
} else {
  console.log('\n✅ DB đã sạch, không cần migrate gì.');
}

process.exit(0);

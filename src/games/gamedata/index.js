// ============================================================
// DATA INDEX — Re-export tất cả data từ 1 chỗ
// Usage: const D = require('./data');
// ============================================================
const config = require('./config');
const animals = require('./animals');
const weapons = require('./weapons');
const gems = require('./gems');
const lootbox = require('./lootbox');

module.exports = {
  ...config,
  ...animals,
  ...weapons,
  ...gems,
  ...lootbox,
};

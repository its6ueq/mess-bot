// ============================================================
// ANIMALS — Thú săn được. ID: MT1, MT2, ...
// Mỗi con có vai trò: AD / AP / Tank / Hybrid
// Thêm thú: thêm vào cuối array (MT55, MT56, ...)
// ============================================================
const { RARITY } = require('./config');

const ANIMALS = [
  // ============================================================
  // COMMON (60%) — 10 con
  // ============================================================
  // AD
  { id: 'MT1',  name: '🐀 Chuột Cống',     rarity: RARITY.COMMON, role: 'AD',
    hp: 40, atk: 10, ap: 0,  def: 3,  mr: 2,  atkPen: 1, magPen: 0, crit: 0.05, critDmg: 0.5, spd: 12,
    growth: { hp: 8,  atk: 2.5, ap: 0,  def: 0.8, mr: 0.5, spd: 0.5 }, price: 5 },
  { id: 'MT3',  name: '🐍 Rắn Mối',         rarity: RARITY.COMMON, role: 'AD',
    hp: 38, atk: 11, ap: 0,  def: 2,  mr: 2,  atkPen: 2, magPen: 0, crit: 0.08, critDmg: 0.5, spd: 10,
    growth: { hp: 7,  atk: 2.8, ap: 0,  def: 0.5, mr: 0.5, spd: 0.3 }, price: 8 },
  { id: 'MT5',  name: '🐺 Chó Hoang',        rarity: RARITY.COMMON, role: 'AD',
    hp: 45, atk: 9,  ap: 0,  def: 4,  mr: 2,  atkPen: 1, magPen: 0, crit: 0.06, critDmg: 0.5, spd: 11,
    growth: { hp: 9,  atk: 2.2, ap: 0,  def: 1,  mr: 0.5, spd: 0.5 }, price: 8 },
  { id: 'MT9',  name: '🐔 Gà Rừng',          rarity: RARITY.COMMON, role: 'AD',
    hp: 36, atk: 8,  ap: 0,  def: 3,  mr: 2,  atkPen: 0, magPen: 0, crit: 0.12, critDmg: 0.6, spd: 13,
    growth: { hp: 7,  atk: 2,  ap: 0,  def: 0.8, mr: 0.5, spd: 0.7 }, price: 6 },
  // AP
  { id: 'MT4',  name: '🦇 Dơi Nhỏ',         rarity: RARITY.COMMON, role: 'AP',
    hp: 30, atk: 3,  ap: 10, def: 1,  mr: 4,  atkPen: 0, magPen: 2, crit: 0.04, critDmg: 0.5, spd: 16,
    growth: { hp: 6,  atk: 0.5, ap: 2.5, def: 0.3, mr: 1,  spd: 1   }, price: 6 },
  { id: 'MT6',  name: '🕷️ Nhện Độc',        rarity: RARITY.COMMON, role: 'AP',
    hp: 28, atk: 2,  ap: 12, def: 1,  mr: 2,  atkPen: 0, magPen: 3, crit: 0.04, critDmg: 0.5, spd: 13,
    growth: { hp: 5,  atk: 0.5, ap: 3,  def: 0.3, mr: 0.5, spd: 0.6 }, price: 7 },
  { id: 'MT8',  name: '🐸 Ếch Độc',          rarity: RARITY.COMMON, role: 'AP',
    hp: 32, atk: 2,  ap: 11, def: 2,  mr: 3,  atkPen: 0, magPen: 3, crit: 0.03, critDmg: 0.5, spd: 9,
    growth: { hp: 6,  atk: 0.5, ap: 2.8, def: 0.5, mr: 0.8, spd: 0.4 }, price: 7 },
  // Tank
  { id: 'MT7',  name: '🐛 Sâu Bọ',          rarity: RARITY.COMMON, role: 'Tank',
    hp: 55, atk: 3,  ap: 0,  def: 8,  mr: 5,  atkPen: 0, magPen: 0, crit: 0.02, critDmg: 0.5, spd: 5,
    growth: { hp: 14, atk: 0.5, ap: 0,  def: 2,  mr: 1.2, spd: 0.2 }, price: 3 },
  { id: 'MT10', name: '🦔 Nhím',              rarity: RARITY.COMMON, role: 'Tank',
    hp: 50, atk: 4,  ap: 0,  def: 9,  mr: 4,  atkPen: 0, magPen: 0, crit: 0.03, critDmg: 0.5, spd: 6,
    growth: { hp: 12, atk: 0.8, ap: 0,  def: 2.2, mr: 1,   spd: 0.2 }, price: 6 },
  // Hybrid
  { id: 'MT2',  name: '🦎 Thạch Sùng',      rarity: RARITY.COMMON, role: 'Hybrid',
    hp: 35, atk: 6,  ap: 5,  def: 2,  mr: 3,  atkPen: 0, magPen: 0, crit: 0.04, critDmg: 0.5, spd: 14,
    growth: { hp: 7,  atk: 1.5, ap: 1.2, def: 0.5, mr: 0.8, spd: 0.8 }, price: 5 },

  // ============================================================
  // UNCOMMON (35%) — 10 con
  // ============================================================
  // AD
  { id: 'MT13', name: '🐺 Sói Xám',          rarity: RARITY.UNCOMMON, role: 'AD',
    hp: 58, atk: 18, ap: 0,  def: 5,  mr: 3,  atkPen: 4, magPen: 0, crit: 0.10, critDmg: 0.6, spd: 13,
    growth: { hp: 11, atk: 3.5, ap: 0,  def: 1.2, mr: 0.8, spd: 0.6 }, price: 22 },
  { id: 'MT14', name: '🦅 Đại Bàng',         rarity: RARITY.UNCOMMON, role: 'AD',
    hp: 45, atk: 20, ap: 0,  def: 3,  mr: 4,  atkPen: 5, magPen: 0, crit: 0.14, critDmg: 0.7, spd: 18,
    growth: { hp: 8,  atk: 4,  ap: 0,  def: 0.8, mr: 1,   spd: 1   }, price: 28 },
  { id: 'MT11', name: '🐗 Lợn Rừng',        rarity: RARITY.UNCOMMON, role: 'AD',
    hp: 65, atk: 16, ap: 0,  def: 6,  mr: 3,  atkPen: 3, magPen: 0, crit: 0.07, critDmg: 0.5, spd: 9,
    growth: { hp: 12, atk: 3.2, ap: 0,  def: 1.5, mr: 0.8, spd: 0.4 }, price: 20 },
  // AP
  { id: 'MT15', name: '🐍 Rắn Hổ Mang',     rarity: RARITY.UNCOMMON, role: 'AP',
    hp: 48, atk: 3,  ap: 18, def: 3,  mr: 3,  atkPen: 0, magPen: 6, crit: 0.06, critDmg: 0.5, spd: 12,
    growth: { hp: 8,  atk: 0.5, ap: 4,  def: 0.8, mr: 0.8, spd: 0.5 }, price: 24 },
  { id: 'MT18', name: '🦂 Bọ Cạp',           rarity: RARITY.UNCOMMON, role: 'AP',
    hp: 40, atk: 3,  ap: 19, def: 5,  mr: 3,  atkPen: 0, magPen: 5, crit: 0.08, critDmg: 0.6, spd: 10,
    growth: { hp: 7,  atk: 0.5, ap: 4.2, def: 1.2, mr: 0.8, spd: 0.4 }, price: 26 },
  { id: 'MT20', name: '🦉 Cú Mèo',           rarity: RARITY.UNCOMMON, role: 'AP',
    hp: 42, atk: 3,  ap: 20, def: 3,  mr: 6,  atkPen: 0, magPen: 4, crit: 0.07, critDmg: 0.5, spd: 16,
    growth: { hp: 8,  atk: 0.5, ap: 4.5, def: 0.8, mr: 1.5, spd: 0.8 }, price: 24 },
  // Tank
  { id: 'MT16', name: '🦌 Nai Rừng',         rarity: RARITY.UNCOMMON, role: 'Tank',
    hp: 80, atk: 8,  ap: 0,  def: 8,  mr: 6,  atkPen: 0, magPen: 0, crit: 0.05, critDmg: 0.5, spd: 10,
    growth: { hp: 16, atk: 1.5, ap: 0,  def: 2,  mr: 1.5, spd: 0.4 }, price: 20 },
  { id: 'MT17', name: '🐻 Gấu Con',          rarity: RARITY.UNCOMMON, role: 'Tank',
    hp: 85, atk: 10, ap: 0,  def: 10, mr: 5,  atkPen: 1, magPen: 0, crit: 0.06, critDmg: 0.5, spd: 7,
    growth: { hp: 18, atk: 2,  ap: 0,  def: 2.5, mr: 1.2, spd: 0.3 }, price: 22 },
  { id: 'MT19', name: '🐊 Cá Sấu Nhỏ',      rarity: RARITY.UNCOMMON, role: 'Tank',
    hp: 90, atk: 12, ap: 0,  def: 12, mr: 4,  atkPen: 2, magPen: 0, crit: 0.05, critDmg: 0.5, spd: 6,
    growth: { hp: 18, atk: 2.5, ap: 0,  def: 3,  mr: 1,   spd: 0.2 }, price: 30 },
  // Hybrid
  { id: 'MT12', name: '🦊 Cáo Đỏ',          rarity: RARITY.UNCOMMON, role: 'Hybrid',
    hp: 50, atk: 12, ap: 8,  def: 4,  mr: 5,  atkPen: 2, magPen: 2, crit: 0.10, critDmg: 0.6, spd: 15,
    growth: { hp: 9,  atk: 2.5, ap: 1.8, def: 1,  mr: 1.2, spd: 0.8 }, price: 25 },

  // ============================================================
  // RARE (3%) — 10 con
  // ============================================================
  // AD
  { id: 'MT22', name: '🐅 Hổ Con',           rarity: RARITY.RARE, role: 'AD',
    hp: 90,  atk: 28, ap: 0,  def: 8,  mr: 5,  atkPen: 8, magPen: 0, crit: 0.14, critDmg: 0.8, spd: 14,
    growth: { hp: 16, atk: 5.5, ap: 0,  def: 2,  mr: 1.2, spd: 0.7 }, price: 70 },
  { id: 'MT25', name: '🐺 Sói Trắng',        rarity: RARITY.RARE, role: 'AD',
    hp: 85,  atk: 26, ap: 0,  def: 7,  mr: 5,  atkPen: 6, magPen: 0, crit: 0.18, critDmg: 0.9, spd: 16,
    growth: { hp: 15, atk: 5,  ap: 0,  def: 1.8, mr: 1,   spd: 0.8 }, price: 68 },
  { id: 'MT23', name: '🦍 Khỉ Đột',          rarity: RARITY.RARE, role: 'AD',
    hp: 100, atk: 24, ap: 0,  def: 10, mr: 6,  atkPen: 5, magPen: 0, crit: 0.10, critDmg: 0.7, spd: 10,
    growth: { hp: 18, atk: 5,  ap: 0,  def: 2.5, mr: 1.5, spd: 0.4 }, price: 65 },
  // AP
  { id: 'MT24', name: '🦅 Phượng Hoàng',     rarity: RARITY.RARE, role: 'AP',
    hp: 70,  atk: 5,  ap: 28, def: 5,  mr: 10, atkPen: 0, magPen: 8, crit: 0.08, critDmg: 0.6, spd: 18,
    growth: { hp: 12, atk: 1,  ap: 6,  def: 1.2, mr: 2.5, spd: 1   }, price: 75 },
  { id: 'MT27', name: '🦇 Dơi Ma',            rarity: RARITY.RARE, role: 'AP',
    hp: 65,  atk: 4,  ap: 30, def: 4,  mr: 12, atkPen: 0, magPen: 9, crit: 0.10, critDmg: 0.6, spd: 20,
    growth: { hp: 10, atk: 0.8, ap: 6.5, def: 1,  mr: 3,   spd: 1.2 }, price: 72 },
  { id: 'MT30', name: '🧙 Phù Thủy Nhỏ',     rarity: RARITY.RARE, role: 'AP',
    hp: 60,  atk: 3,  ap: 32, def: 3,  mr: 14, atkPen: 0, magPen: 10, crit: 0.06, critDmg: 0.5, spd: 12,
    growth: { hp: 10, atk: 0.5, ap: 7,  def: 0.8, mr: 3.5, spd: 0.5 }, price: 80 },
  // Tank
  { id: 'MT21', name: '🐻 Gấu Nâu',         rarity: RARITY.RARE, role: 'Tank',
    hp: 130, atk: 15, ap: 0,  def: 15, mr: 8,  atkPen: 2, magPen: 0, crit: 0.06, critDmg: 0.5, spd: 7,
    growth: { hp: 24, atk: 3,  ap: 0,  def: 3.5, mr: 2,   spd: 0.2 }, price: 60 },
  { id: 'MT26', name: '🐊 Cá Sấu',           rarity: RARITY.RARE, role: 'Tank',
    hp: 140, atk: 14, ap: 0,  def: 16, mr: 6,  atkPen: 3, magPen: 0, crit: 0.05, critDmg: 0.5, spd: 6,
    growth: { hp: 26, atk: 2.8, ap: 0,  def: 3.8, mr: 1.5, spd: 0.2 }, price: 55 },
  { id: 'MT28', name: '🐃 Trâu Rừng',        rarity: RARITY.RARE, role: 'Tank',
    hp: 150, atk: 12, ap: 0,  def: 18, mr: 7,  atkPen: 2, magPen: 0, crit: 0.04, critDmg: 0.5, spd: 5,
    growth: { hp: 28, atk: 2.5, ap: 0,  def: 4,  mr: 1.8, spd: 0.1 }, price: 58 },
  { id: 'MT29', name: '🦏 Tê Giác Con',       rarity: RARITY.RARE, role: 'Tank',
    hp: 160, atk: 13, ap: 0,  def: 20, mr: 6,  atkPen: 2, magPen: 0, crit: 0.03, critDmg: 0.5, spd: 4,
    growth: { hp: 30, atk: 2.5, ap: 0,  def: 4.5, mr: 1.5, spd: 0.1 }, price: 62 },

  // ============================================================
  // EPIC (1.75%) — 10 con
  // ============================================================
  // AD
  { id: 'MT32', name: '🐅 Hổ Bengal',         rarity: RARITY.EPIC, role: 'AD',
    hp: 130, atk: 42, ap: 0,  def: 12, mr: 7,  atkPen: 12, magPen: 0,  crit: 0.20, critDmg: 1.0, spd: 15,
    growth: { hp: 22, atk: 8,  ap: 0,  def: 2.5, mr: 1.5, spd: 0.8 }, price: 220 },
  { id: 'MT35', name: '🦖 T-Rex',              rarity: RARITY.EPIC, role: 'AD',
    hp: 160, atk: 45, ap: 0,  def: 14, mr: 6,  atkPen: 14, magPen: 0,  crit: 0.16, critDmg: 0.9, spd: 10,
    growth: { hp: 28, atk: 9,  ap: 0,  def: 3,  mr: 1.5, spd: 0.4 }, price: 240 },
  { id: 'MT40', name: '🐍 Mãng Xà',           rarity: RARITY.EPIC, role: 'AD',
    hp: 125, atk: 38, ap: 5,  def: 10, mr: 8,  atkPen: 10, magPen: 0,  crit: 0.18, critDmg: 0.9, spd: 14,
    growth: { hp: 20, atk: 7.5, ap: 1,  def: 2,  mr: 2,   spd: 0.7 }, price: 225 },
  // AP
  { id: 'MT36', name: '👹 Quỷ Đỏ',            rarity: RARITY.EPIC, role: 'AP',
    hp: 140, atk: 8,  ap: 40, def: 8,  mr: 18, atkPen: 0,  magPen: 12, crit: 0.10, critDmg: 0.6, spd: 12,
    growth: { hp: 22, atk: 1.5, ap: 8.5, def: 2,  mr: 4,   spd: 0.5 }, price: 230 },
  { id: 'MT37', name: '🧛 Ma Cà Rồng',        rarity: RARITY.EPIC, role: 'AP',
    hp: 100, atk: 6,  ap: 44, def: 6,  mr: 20, atkPen: 0,  magPen: 14, crit: 0.08, critDmg: 0.6, spd: 17,
    growth: { hp: 16, atk: 1,  ap: 9,  def: 1.5, mr: 4.5, spd: 0.9 }, price: 260 },
  { id: 'MT39', name: '🦂 Bọ Cạp Vua',        rarity: RARITY.EPIC, role: 'AP',
    hp: 110, atk: 6,  ap: 38, def: 12, mr: 10, atkPen: 0,  magPen: 10, crit: 0.12, critDmg: 0.7, spd: 11,
    growth: { hp: 18, atk: 1,  ap: 8,  def: 2.5, mr: 2.5, spd: 0.5 }, price: 215 },
  // Tank
  { id: 'MT31', name: '🦁 Sư Tử',            rarity: RARITY.EPIC, role: 'Tank',
    hp: 180, atk: 25, ap: 0,  def: 18, mr: 10, atkPen: 6,  magPen: 0,  crit: 0.10, critDmg: 0.6, spd: 11,
    growth: { hp: 30, atk: 5,  ap: 0,  def: 4,  mr: 2.5, spd: 0.5 }, price: 200 },
  { id: 'MT33', name: '🐘 Voi',               rarity: RARITY.EPIC, role: 'Tank',
    hp: 220, atk: 18, ap: 0,  def: 22, mr: 12, atkPen: 2,  magPen: 0,  crit: 0.04, critDmg: 0.5, spd: 4,
    growth: { hp: 40, atk: 3.5, ap: 0,  def: 5,  mr: 3,   spd: 0.1 }, price: 180 },
  { id: 'MT38', name: '🐻‍❄️ Gấu Bắc Cực',  rarity: RARITY.EPIC, role: 'Tank',
    hp: 200, atk: 22, ap: 0,  def: 20, mr: 12, atkPen: 4,  magPen: 0,  crit: 0.06, critDmg: 0.5, spd: 7,
    growth: { hp: 35, atk: 4.5, ap: 0,  def: 4.5, mr: 3,   spd: 0.2 }, price: 210 },
  // Hybrid
  { id: 'MT34', name: '🐉 Rồng Con',          rarity: RARITY.EPIC, role: 'Hybrid',
    hp: 140, atk: 25, ap: 22, def: 10, mr: 12, atkPen: 5,  magPen: 5,  crit: 0.12, critDmg: 0.7, spd: 14,
    growth: { hp: 22, atk: 5,  ap: 4.5, def: 2.5, mr: 3,   spd: 0.7 }, price: 250 },

  // ============================================================
  // LEGENDARY (0.2375%) — 8 con
  // ============================================================
  // AD
  { id: 'MT42', name: '🦁 Chúa Sơn Lâm',      rarity: RARITY.LEGENDARY, role: 'AD',
    hp: 220, atk: 55, ap: 0,  def: 20, mr: 12, atkPen: 16, magPen: 0,  crit: 0.22, critDmg: 1.0, spd: 13,
    growth: { hp: 35, atk: 10, ap: 0,  def: 4,  mr: 2.5, spd: 0.6 }, price: 900 },
  { id: 'MT43', name: '🦖 Raptor Cổ Đại',     rarity: RARITY.LEGENDARY, role: 'AD',
    hp: 180, atk: 58, ap: 0,  def: 14, mr: 10, atkPen: 18, magPen: 0,  crit: 0.25, critDmg: 1.1, spd: 18,
    growth: { hp: 28, atk: 11, ap: 0,  def: 3,  mr: 2,   spd: 1   }, price: 1000 },
  // AP
  { id: 'MT44', name: '👿 Chúa Quỷ',           rarity: RARITY.LEGENDARY, role: 'AP',
    hp: 190, atk: 8,  ap: 58, def: 12, mr: 24, atkPen: 0,  magPen: 18, crit: 0.12, critDmg: 0.8, spd: 15,
    growth: { hp: 28, atk: 1.5, ap: 12, def: 2.5, mr: 5.5, spd: 0.8 }, price: 950 },
  { id: 'MT45', name: '💀 Thần Chết',           rarity: RARITY.LEGENDARY, role: 'AP',
    hp: 170, atk: 10, ap: 52, def: 10, mr: 18, atkPen: 0,  magPen: 15, crit: 0.15, critDmg: 0.9, spd: 16,
    growth: { hp: 25, atk: 2,  ap: 10, def: 2,  mr: 4,   spd: 0.8 }, price: 880 },
  // Tank
  { id: 'MT46', name: '🐲 Hydra',               rarity: RARITY.LEGENDARY, role: 'Tank',
    hp: 280, atk: 30, ap: 10, def: 25, mr: 15, atkPen: 5,  magPen: 3,  crit: 0.08, critDmg: 0.6, spd: 8,
    growth: { hp: 45, atk: 5.5, ap: 2,  def: 5.5, mr: 3.5, spd: 0.3 }, price: 850 },
  { id: 'MT48', name: '🛡️ Titan Đá',           rarity: RARITY.LEGENDARY, role: 'Tank',
    hp: 320, atk: 22, ap: 0,  def: 32, mr: 20, atkPen: 3,  magPen: 0,  crit: 0.04, critDmg: 0.5, spd: 3,
    growth: { hp: 55, atk: 4,  ap: 0,  def: 7,  mr: 4.5, spd: 0.1 }, price: 860 },
  // Hybrid
  { id: 'MT41', name: '🐉 Rồng Lửa',          rarity: RARITY.LEGENDARY, role: 'Hybrid',
    hp: 200, atk: 40, ap: 30, def: 16, mr: 14, atkPen: 10, magPen: 8,  crit: 0.15, critDmg: 0.9, spd: 14,
    growth: { hp: 30, atk: 8,  ap: 6,  def: 3.5, mr: 3,   spd: 0.7 }, price: 800 },
  { id: 'MT47', name: '⚡ Thần Sấm',            rarity: RARITY.LEGENDARY, role: 'Hybrid',
    hp: 180, atk: 32, ap: 35, def: 12, mr: 16, atkPen: 8,  magPen: 10, crit: 0.14, critDmg: 0.8, spd: 20,
    growth: { hp: 26, atk: 6,  ap: 7,  def: 2.5, mr: 3.5, spd: 1.2 }, price: 920 },

  // ============================================================
  // MYTHICAL (0.0125%) — 6 con
  // ============================================================
  // AD
  { id: 'MT54', name: '💀 Tử Thần',                 rarity: RARITY.MYTHICAL, role: 'AD',
    hp: 260, atk: 72, ap: 15, def: 16, mr: 18, atkPen: 22, magPen: 5,  crit: 0.28, critDmg: 1.3, spd: 20,
    growth: { hp: 32, atk: 15, ap: 3,  def: 3,  mr: 3.5, spd: 1   }, price: 7000 },
  // AP
  { id: 'MT52', name: '🌊 Titan Nước',              rarity: RARITY.MYTHICAL, role: 'AP',
    hp: 320, atk: 12, ap: 65, def: 18, mr: 30, atkPen: 3,  magPen: 22, crit: 0.12, critDmg: 0.8, spd: 14,
    growth: { hp: 45, atk: 2,  ap: 14, def: 3.5, mr: 6,   spd: 0.7 }, price: 5800 },
  // Tank
  { id: 'MT51', name: '🌋 Titan Lửa',               rarity: RARITY.MYTHICAL, role: 'Tank',
    hp: 400, atk: 40, ap: 20, def: 30, mr: 18, atkPen: 10, magPen: 5,  crit: 0.12, critDmg: 0.8, spd: 8,
    growth: { hp: 55, atk: 8,  ap: 4,  def: 6,  mr: 3.5, spd: 0.3 }, price: 5500 },
  // Hybrid
  { id: 'MT49', name: '🐉 Rồng Vàng',              rarity: RARITY.MYTHICAL, role: 'Hybrid',
    hp: 320, atk: 50, ap: 40, def: 22, mr: 22, atkPen: 15, magPen: 12, crit: 0.22, critDmg: 1.1, spd: 16,
    growth: { hp: 42, atk: 10, ap: 8,  def: 4.5, mr: 4.5, spd: 0.8 }, price: 5000 },
  { id: 'MT50', name: '👑 Chúa Tể Bóng Tối',       rarity: RARITY.MYTHICAL, role: 'Hybrid',
    hp: 300, atk: 55, ap: 35, def: 20, mr: 24, atkPen: 18, magPen: 12, crit: 0.24, critDmg: 1.2, spd: 18,
    growth: { hp: 40, atk: 12, ap: 7,  def: 4,  mr: 5,   spd: 1   }, price: 6000 },
  { id: 'MT53', name: '⚡ Titan Sấm',               rarity: RARITY.MYTHICAL, role: 'Hybrid',
    hp: 280, atk: 42, ap: 48, def: 16, mr: 16, atkPen: 14, magPen: 14, crit: 0.20, critDmg: 1.0, spd: 22,
    growth: { hp: 38, atk: 8,  ap: 10, def: 3.5, mr: 3.5, spd: 1.2 }, price: 6500 },
];

// Index maps
const ANIMAL_BY_ID = {};
const ANIMAL_BY_RARITY = {};
for (const a of ANIMALS) {
  ANIMAL_BY_ID[a.id] = a;
  const key = a.rarity.key;
  if (!ANIMAL_BY_RARITY[key]) ANIMAL_BY_RARITY[key] = [];
  ANIMAL_BY_RARITY[key].push(a);
}

function rollAnimal(rarity) {
  const pool = ANIMAL_BY_RARITY[rarity.key];
  if (!pool || pool.length === 0) return ANIMALS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { ANIMALS, ANIMAL_BY_ID, ANIMAL_BY_RARITY, rollAnimal };

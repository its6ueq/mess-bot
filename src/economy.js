// He thong kinh te - tai khoan ngan hang, xu, inventory
// KEY = Facebook User ID (so), hien thi = displayName
const db = require('./db');

const COLLECTION = 'players';
const USERS_COLLECTION = 'users'; // Registry: id -> { name, lastSeen }

class Economy {
  constructor() {
    // Load tu db module (co cache, chi doc file 1 lan)
    this.players = db.load(COLLECTION, {});
    this.users = db.load(USERS_COLLECTION, {}); // User registry
  }

  _save() {
    db.save(COLLECTION);
  }

  _saveUsers() {
    db.save(USERS_COLLECTION);
  }

  // Update user registry: map ID -> display name
  updateUser(id, displayName) {
    if (!id || !displayName) return;
    this.users[id] = {
      name: displayName,
      lastSeen: new Date().toISOString(),
    };
    this._saveUsers();
  }

  // Lay display name tu ID (tra ve ID neu chua biet ten)
  getDisplayName(id) {
    if (this.players[id]?.displayName) return this.players[id].displayName;
    if (this.users[id]?.name) return this.users[id].name;
    return id;
  }

  // Tim ID tu display name (cho transfer khi user nhap ten)
  findIdByName(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    // Tim trong players truoc
    for (const [id, p] of Object.entries(this.players)) {
      if (p.displayName && p.displayName.toLowerCase() === lower) return id;
    }
    // Tim trong user registry
    for (const [id, u] of Object.entries(this.users)) {
      if (u.name && u.name.toLowerCase() === lower) return id;
    }
    return null;
  }

  // Lay hoac tao player moi (key = ID)
  getPlayer(id, displayName) {
    if (!id || id === 'Other' || id === 'Unknown') {
      id = id || 'Unknown';
    }
    if (!this.players[id]) {
      this.players[id] = {
        id,
        displayName: displayName || id,
        xu: 1000,            // Bat dau voi 1000 xu
        bank: 0,
        level: 1,
        exp: 0,
        totalEarned: 0,
        totalSpent: 0,
        fishCaught: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        inventory: [],       // Danh sach item
        lastDaily: null,
        lastFish: null,
        lastWork: null,
        createdAt: new Date().toISOString(),
        checkinStreak: 0,
        lastCheckin: null,
        // Fishing system
        rod: 'tre',
        boat: null,
        album: {},
        albumRewards: [],
      };
      this._save();
    } else if (displayName && this.players[id].displayName !== displayName) {
      // Cap nhat display name neu doi
      this.players[id].displayName = displayName;
      this._save();
    }
    return this.players[id];
  }

  // === XU ===
  getBalance(id) {
    const p = this.getPlayer(id);
    return { xu: p.xu, bank: p.bank, total: p.xu + p.bank };
  }

  addXu(id, amount) {
    const p = this.getPlayer(id);
    p.xu += amount;
    if (amount > 0) p.totalEarned += amount;
    this._addExp(p, Math.floor(Math.abs(amount) / 10));
    this._save();
    return p.xu;
  }

  removeXu(id, amount) {
    const p = this.getPlayer(id);
    if (p.xu < amount) return false;
    p.xu -= amount;
    p.totalSpent += amount;
    this._save();
    return true;
  }

  deposit(id, amount) {
    const p = this.getPlayer(id);
    if (amount === 'all') amount = p.xu;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return 'So xu khong hop le!';
    if (p.xu < amount) return `Ban chi co ${p.xu} xu!`;
    p.xu -= amount;
    p.bank += amount;
    this._save();
    return `Da gui ${amount} xu vao ngan hang.\nVi: ${p.xu} xu | Bank: ${p.bank} xu`;
  }

  withdraw(id, amount) {
    const p = this.getPlayer(id);
    if (amount === 'all') amount = p.bank;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return 'So xu khong hop le!';
    if (p.bank < amount) return `Bank chi co ${p.bank} xu!`;
    p.bank -= amount;
    p.xu += amount;
    this._save();
    return `Da rut ${amount} xu tu ngan hang.\nVi: ${p.xu} xu | Bank: ${p.bank} xu`;
  }

  // === DAILY ===
  daily(id) {
    const p = this.getPlayer(id);
    const now = new Date();
    if (p.lastDaily) {
      const last = new Date(p.lastDaily);
      if (now.toDateString() === last.toDateString()) {
        return 'Ban da nhan daily hom nay roi! Quay lai ngay mai.';
      }
    }
    const reward = 500 + Math.floor(Math.random() * 500) + (p.level * 50);
    p.xu += reward;
    p.totalEarned += reward;
    p.lastDaily = now.toISOString();
    this._save();
    return `DAILY REWARD!\n+${reward} xu\nVi: ${p.xu} xu`;
  }

  // === WORK ===
  work(id) {
    const p = this.getPlayer(id);
    const now = Date.now();
    if (p.lastWork && now - new Date(p.lastWork).getTime() < 60000) {
      const remaining = Math.ceil((60000 - (now - new Date(p.lastWork).getTime())) / 1000);
      return `Ban can nghi ${remaining}s nua moi lam tiep duoc!`;
    }

    const jobs = [
      { name: 'lap trinh', min: 100, max: 300 },
      { name: 'giao hang', min: 80, max: 200 },
      { name: 'ban ca phe', min: 50, max: 150 },
      { name: 'day hoc', min: 120, max: 250 },
      { name: 'livestream', min: 150, max: 400 },
      { name: 'lam youtube', min: 100, max: 500 },
      { name: 'ban hoa', min: 60, max: 180 },
      { name: 'sua xe', min: 90, max: 220 },
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min + (p.level * 10);
    p.xu += earned;
    p.totalEarned += earned;
    p.lastWork = new Date().toISOString();
    this._save();
    return `Ban di ${job.name} va kiem duoc ${earned} xu!\nVi: ${p.xu} xu`;
  }

  // === PROFILE ===
  profile(id) {
    const p = this.getPlayer(id);
    const winRate = p.gamesPlayed > 0 ? ((p.gamesWon / p.gamesPlayed) * 100).toFixed(1) : 0;
    let msg = `${p.displayName}\n`;
    msg += `Level ${p.level} (${p.exp} EXP)\n`;
    msg += `Vi: ${p.xu} xu\n`;
    msg += `Bank: ${p.bank} xu\n`;
    msg += `Ca da bat: ${p.fishCaught}\n`;
    msg += `Games: ${p.gamesPlayed} (thang ${p.gamesWon}, ${winRate}%)\n`;
    msg += `Inventory: ${p.inventory.length} items`;
    return msg;
  }

  // === TOP / LEADERBOARD ===
  top() {
    const entries = Object.values(this.players)
      .map(p => ({ name: p.displayName || p.id, total: p.xu + p.bank, level: p.level }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (entries.length === 0) return 'Chua co ai choi!';

    let msg = 'TOP GIAU NHAT:\n';
    entries.forEach((e, i) => {
      const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
      msg += `${medal} ${e.name} - ${e.total} xu (Lv.${e.level})\n`;
    });
    return msg;
  }

  // === CHUYEN XU ===
  transfer(fromId, toId, amount) {
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return 'So xu khong hop le!';
    if (fromId === toId) return 'Khong the chuyen xu cho chinh minh!';
    const pFrom = this.getPlayer(fromId);
    if (pFrom.xu < amount) return `Ban chi co ${pFrom.xu} xu!`;
    const pTo = this.getPlayer(toId);
    pFrom.xu -= amount;
    pTo.xu += amount;
    this._save();
    return `Da chuyen ${amount} xu cho ${pTo.displayName}.\nVi con: ${pFrom.xu} xu`;
  }

  // === LEVEL SYSTEM ===
  _addExp(player, exp) {
    player.exp += exp;
    const needed = player.level * 100;
    if (player.exp >= needed) {
      player.exp -= needed;
      player.level++;
    }
  }

  // Record game result
  recordGame(id, won) {
    const p = this.getPlayer(id);
    p.gamesPlayed++;
    if (won) p.gamesWon++;
    this._save();
  }
}

module.exports = { Economy };

// Hệ thống kinh tế - tài khoản ngân hàng, xu, inventory
// KEY = Facebook User ID (số), hiển thị = displayName
const db = require('./db');

const COLLECTION = 'players';
const USERS_COLLECTION = 'users';

class Economy {
  constructor() {
    this.players = db.load(COLLECTION, {});
    this.users = db.load(USERS_COLLECTION, {});
  }

  _save() {
    db.save(COLLECTION);
  }

  _saveUsers() {
    db.save(USERS_COLLECTION);
  }

  updateUser(id, displayName) {
    if (!id || !displayName) return;
    this.users[id] = {
      name: displayName,
      lastSeen: new Date().toISOString(),
    };
    this._saveUsers();
  }

  getDisplayName(id) {
    if (this.players[id]?.displayName) return this.players[id].displayName;
    if (this.users[id]?.name) return this.users[id].name;
    return id;
  }

  // Chuan hoa ten de so sanh: thuong, bo dau tieng Viet, gon khoang trang
  _norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // bo dau
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }

  findIdByName(name) {
    if (!name) return null;
    const q = this._norm(name);
    if (!q) return null;

    const entries = [
      ...Object.entries(this.players).map(([id, p]) => [id, p.displayName]),
      ...Object.entries(this.users).map(([id, u]) => [id, u.name]),
    ].filter(([, nm]) => nm);

    // 1. Khop chinh xac (sau khi bo dau)
    for (const [id, nm] of entries) {
      if (this._norm(nm) === q) return id;
    }
    // 2. Khop mot phan: ten dang ky chua tu khoa, hoac nguoc lai (>= 2 ky tu)
    if (q.length >= 2) {
      for (const [id, nm] of entries) {
        const n = this._norm(nm);
        if (n.includes(q) || q.includes(n)) return id;
      }
    }
    return null;
  }

  getPlayer(id, displayName) {
    if (!id || id === 'Other' || id === 'Unknown') {
      id = id || 'Unknown';
    }
    if (!this.players[id]) {
      this.players[id] = {
        id,
        displayName: displayName || id,
        xu: 1000,
        bank: 0,
        level: 1,
        exp: 0,
        totalEarned: 0,
        totalSpent: 0,
        fishCaught: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        inventory: [],
        lastDaily: null,
        lastFish: null,
        lastWork: null,
        createdAt: new Date().toISOString(),
        checkinStreak: 0,
        lastCheckin: null,
        rod: 'tre',
        boat: null,
        album: {},
        albumRewards: [],
      };
      this._save();
    } else {
      if (displayName && this.players[id].displayName !== displayName) {
        this.players[id].displayName = displayName;
        this._save();
      }
      this._ensureFields(this.players[id]);
    }
    return this.players[id];
  }

  // Backfill cac field mac dinh cho player cu (tuong thich data cu, tranh crash)
  _ensureFields(p) {
    const defaults = {
      xu: 1000, bank: 0, level: 1, exp: 0, totalEarned: 0, totalSpent: 0,
      fishCaught: 0, gamesPlayed: 0, gamesWon: 0, inventory: [],
      checkinStreak: 0, album: {}, albumRewards: [], rod: 'tre',
    };
    let changed = false;
    for (const [k, v] of Object.entries(defaults)) {
      if (p[k] === undefined) { p[k] = Array.isArray(v) ? [] : (typeof v === 'object' && v !== null ? {} : v); changed = true; }
    }
    if (changed) this._save();
    return p;
  }

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
    if (isNaN(amount) || amount <= 0) return 'Số xu không hợp lệ!';
    if (p.xu < amount) return `Bạn chỉ có ${p.xu} xu!`;
    p.xu -= amount;
    p.bank += amount;
    this._save();
    return `Đã gửi ${amount} xu vào ngân hàng.\nVí: ${p.xu} xu | Bank: ${p.bank} xu`;
  }

  withdraw(id, amount) {
    const p = this.getPlayer(id);
    if (amount === 'all') amount = p.bank;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return 'Số xu không hợp lệ!';
    if (p.bank < amount) return `Bank chỉ có ${p.bank} xu!`;
    p.bank -= amount;
    p.xu += amount;
    this._save();
    return `Đã rút ${amount} xu từ ngân hàng.\nVí: ${p.xu} xu | Bank: ${p.bank} xu`;
  }

  daily(id) {
    const p = this.getPlayer(id);
    const now = new Date();
    if (p.lastDaily) {
      const last = new Date(p.lastDaily);
      if (now.toDateString() === last.toDateString()) {
        return 'Bạn đã nhận daily hôm nay rồi! Quay lại ngày mai.';
      }
    }
    const reward = 500 + Math.floor(Math.random() * 500) + (p.level * 50);
    p.xu += reward;
    p.totalEarned += reward;
    p.lastDaily = now.toISOString();
    this._save();
    return `🎁 DAILY REWARD!\n+${reward} xu\nVí: ${p.xu} xu`;
  }

  work(id) {
    const p = this.getPlayer(id);
    const now = Date.now();
    if (p.lastWork && now - new Date(p.lastWork).getTime() < 60000) {
      const remaining = Math.ceil((60000 - (now - new Date(p.lastWork).getTime())) / 1000);
      return `Bạn cần nghỉ ${remaining}s nữa mới làm tiếp được!`;
    }

    const jobs = [
      { name: 'lập trình', min: 100, max: 300 },
      { name: 'giao hàng', min: 80, max: 200 },
      { name: 'bán cà phê', min: 50, max: 150 },
      { name: 'dạy học', min: 120, max: 250 },
      { name: 'livestream', min: 150, max: 400 },
      { name: 'làm youtuber', min: 100, max: 500 },
      { name: 'bán hoa', min: 60, max: 180 },
      { name: 'sửa xe', min: 90, max: 220 },
      { name: 'qua đêm với một người đàn ông xa lạ', min: 15000, max: 22000 },
      { name: 'thiết kế đồ hoạ', min: 120, max: 350 },
      { name: 'viết content', min: 70, max: 180 },
      { name: 'chụp ảnh cưới', min: 200, max: 600 },
      { name: 'chạy quảng cáo', min: 150, max: 450 },
      { name: 'làm kế toán', min: 100, max: 250 },
      { name: 'làm phiên dịch viên', min: 180, max: 550 },
      { name: 'bán quần áo', min: 60, max: 140 },
      { name: 'làm phụ bếp', min: 55, max: 110 },
      { name: 'làm bảo vệ', min: 45, max: 90 },
      { name: 'làm hướng dẫn viên', min: 130, max: 300 },
      { name: 'cắt tóc', min: 80, max: 400 },
      { name: 'trang điểm dạo', min: 150, max: 700 },
      { name: 'làm huấn luyện viên gym', min: 120, max: 500 },
      { name: 'làm môi giới nhà đất', min: 100, max: 2000 },
      { name: 'sửa điện nước', min: 90, max: 250 },
      { name: 'làm thợ xăm', min: 200, max: 1000 },
      { name: 'bán hàng online', min: 50, max: 800 },
      { name: 'quản trị fanpage', min: 60, max: 150 },
      { name: 'chăm sóc thú cưng', min: 70, max: 180 },
      { name: 'làm lễ tân khách sạn', min: 65, max: 130 },
      { name: 'làm thợ nail', min: 90, max: 300 },
      { name: 'làm telesale', min: 70, max: 200 },
      { name: 'làm DJ quán bar', min: 250, max: 800 },
      { name: 'làm người mẫu ảnh', min: 300, max: 1500 },
      { name: 'kiểm thử phần mềm', min: 110, max: 320 },
      { name: 'biên tập video', min: 130, max: 400 },
      { name: 'phục vụ karaoke', min: 80, max: 250 },
      { name: 'rửa xe', min: 40, max: 100 },
      { name: 'làm giúp việc theo giờ', min: 50, max: 120 },
      { name: 'tài xế taxi', min: 110, max: 280 },
      { name: 'xin tiền mẹ', min: 3600, max: 5000 },
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min + (p.level * 10);
    p.xu += earned;
    p.totalEarned += earned;
    p.lastWork = new Date().toISOString();
    this._save();
    return `Bạn đi ${job.name} và kiếm được ${earned} xu!\nVí: ${p.xu} xu`;
  }

  profile(id) {
    const p = this.getPlayer(id);
    const winRate = p.gamesPlayed > 0 ? ((p.gamesWon / p.gamesPlayed) * 100).toFixed(1) : 0;
    let msg = `${p.displayName}\n`;
    msg += `Level ${p.level} (${p.exp} EXP)\n`;
    msg += `Ví: ${p.xu} xu\n`;
    msg += `Bank: ${p.bank} xu\n`;
    msg += `Cá đã bắt: ${p.fishCaught}\n`;
    msg += `Games: ${p.gamesPlayed} (thắng ${p.gamesWon}, ${winRate}%)\n`;
    msg += `Kho: ${p.inventory.length} items`;
    return msg;
  }

  top() {
    const entries = Object.values(this.players)
      .map(p => ({ name: p.displayName || p.id, total: p.xu + p.bank, level: p.level }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (entries.length === 0) return 'Chưa có ai chơi!';

    let msg = '🏆 TOP GIÀU NHẤT:\n';
    entries.forEach((e, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      msg += `${medal} ${e.name} - ${e.total} xu (Lv.${e.level})\n`;
    });
    return msg;
  }

  transfer(fromId, toId, amount) {
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return 'Số xu không hợp lệ!';
    if (fromId === toId) return 'Không thể chuyển xu cho chính mình!';
    const pFrom = this.getPlayer(fromId);
    if (pFrom.xu < amount) return `Bạn chỉ có ${pFrom.xu} xu!`;
    const pTo = this.getPlayer(toId);
    pFrom.xu -= amount;
    pTo.xu += amount;
    this._save();
    return `Đã chuyển ${amount} xu cho ${pTo.displayName}.\nVí còn: ${pFrom.xu} xu`;
  }

  _addExp(player, exp) {
    player.exp += exp;
    const needed = player.level * 100;
    if (player.exp >= needed) {
      player.exp -= needed;
      player.level++;
    }
  }

  getTotalBank() {
    return Object.values(this.players).reduce((sum, p) => sum + (p.bank || 0), 0);
  }

  // Trừ tiền bank của các người chơi khác theo tỉ lệ
  _deductFromBanks(robberId, amount) {
    const eligible = Object.entries(this.players)
      .filter(([id, p]) => id !== robberId && p.bank > 0);
    const poolTotal = eligible.reduce((s, [, p]) => s + p.bank, 0);
    if (poolTotal === 0 || amount <= 0) return;

    let deducted = 0;
    for (const [, p] of eligible) {
      const share = Math.min(p.bank, Math.floor((p.bank / poolTotal) * amount));
      p.bank -= share;
      deducted += share;
    }
    // Bù phần lẻ vào người có bank nhiều nhất
    const diff = amount - deducted;
    if (diff > 0) {
      const richest = eligible.sort((a, b) => b[1].bank - a[1].bank)[0];
      if (richest) richest[1].bank = Math.max(0, richest[1].bank - diff);
    }
  }

  robBank(id) {
    const p = this.getPlayer(id);
    const now = Date.now();
    const COOLDOWN_NORMAL  = 1 * 60 * 60 * 1000; // 1 tiếng
    const COOLDOWN_JACKPOT = 1 * 60 * 60 * 1000; // 3 tiếng (gấp 3)

    if (p.robBankCooldownUntil && now < p.robBankCooldownUntil) {
      const remaining = Math.ceil((p.robBankCooldownUntil - now) / 60000);
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      return { ok: false, msg: `Còn ${h > 0 ? h + ' tiếng ' : ''}${m} phút nữa mới cướp được!` };
    }

    const eligible = Object.entries(this.players)
      .filter(([pid, ep]) => pid !== id && ep.bank > 0);
    const poolTotal = eligible.reduce((s, [, ep]) => s + ep.bank, 0);

    if (poolTotal < 100)
      return { ok: false, msg: 'Ngân hàng đang trống, không có gì để cướp!' };

    const roll = Math.random();

    // Jackpot: 1% cơ hội, cuỗm 40-70% — cooldown 24h
    if (roll < 0.01) {
      const pct = 0.40 + Math.random() * 0.30;
      const stolen = Math.floor(poolTotal * pct);
      this._deductFromBanks(id, stolen);
      p.xu += stolen;
      p.totalEarned += stolen;
      p.robBankCooldownUntil = now + COOLDOWN_JACKPOT;
      this._save();
      return { ok: true, jackpot: true, stolen, pct: Math.round(pct * 100), poolTotal };
    }

    // Thành công thường: 30% cơ hội, cuỗm 1% — cooldown 1h
    if (roll < 0.31) {
      const stolen = Math.floor(poolTotal * 0.01);
      this._deductFromBanks(id, stolen);
      p.xu += stolen;
      p.totalEarned += stolen;
      p.robBankCooldownUntil = now + COOLDOWN_NORMAL;
      this._save();
      return { ok: true, jackpot: false, stolen, poolTotal };
    }

    // Thất bại: phạt 10-30% xu, tối thiểu 100 — cooldown 8h
    const finePct = 0.10 + Math.random() * 0.20;
    const fine = Math.max(100, Math.floor(p.xu * finePct));
    p.xu = Math.max(0, p.xu - fine);
    p.totalSpent += fine;
    p.robBankCooldownUntil = now + COOLDOWN_NORMAL;
    this._save();
    return { ok: false, caught: true, fine, pct: Math.round(finePct * 100), xu: p.xu };
  }

  // Danh sách xếp hạng có cấu trúc (để render ảnh leaderboard)
  getTop(n = 8) {
    return Object.values(this.players)
      .map(p => ({ id: p.id, name: p.displayName || p.id, total: (p.xu || 0) + (p.bank || 0), level: p.level || 1 }))
      // Bỏ tài khoản chưa có tên hiển thị (name toàn số = ID trần)
      .filter(p => p.name && !/^\d+$/.test(p.name) && p.name !== 'test123')
      .sort((a, b) => b.total - a.total)
      .slice(0, n)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }

  // Thứ hạng theo tổng tài sản (ví + bank). Trả về số thứ tự (1 = giàu nhất) hoặc null.
  getRank(id) {
    const sorted = Object.values(this.players)
      .map(p => ({ id: p.id, total: (p.xu || 0) + (p.bank || 0) }))
      .sort((a, b) => b.total - a.total);
    const idx = sorted.findIndex(p => p.id === id);
    return idx === -1 ? null : idx + 1;
  }

  recordGame(id, won) {
    const p = this.getPlayer(id);
    p.gamesPlayed++;
    if (won) p.gamesWon++;
    this._save();
  }
}

module.exports = { Economy };

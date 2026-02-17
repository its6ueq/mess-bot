require('dotenv').config();
const db = require('./src/db');

module.exports = {
  // Browser
  bravePath: process.env.BRAVE_PATH || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  braveUserData: process.env.BRAVE_USER_DATA || `C:/Users/${process.env.USERNAME || 'Admin'}/AppData/Local/BraveSoftware/Brave-Browser/User Data`,

  // Bot identity
  botName: process.env.BOT_NAME || 'Bot',
  myName: process.env.MY_NAME || 'Nguyễn Duy',
  myId: process.env.MY_ID || '61568421755135',

  // Admins - dung Facebook User ID (so)
  // Admins - dung Facebook User ID (so)
  get admins() {
    // 1. Lay tu .env
    const envAdmins = (process.env.ADMINS || '').split(',').map(s => s.trim()).filter(Boolean);

    // 2. Lay tu database (khi dung lenh /addadmin)
    let fileAdmins = db.load('admins', []);
    
    // --- FIX LOI O DAY: Kiem tra xem co phai Array khong ---
    if (!Array.isArray(fileAdmins)) {
        // Neu DB tra ve object hoac null, coi nhu danh sach rong
        fileAdmins = []; 
    }

    // 3. Hardcode ID cua ban (de tranh mat admin)
    const myAdmin = ['100054767970643']; // ID cua ban

    // Gop tat ca lai va loc trung
    return [...new Set([...envAdmins, ...fileAdmins, ...myAdmin])];
  },

  addAdmin(id) {
    const list = db.load('admins', []);
    if (!list.includes(id)) {
      list.push(id);
      db.setAll('admins', list);
    }
  },
  removeAdmin(id) {
    let list = db.load('admins', []);
    list = list.filter(n => n !== id);
    db.setAll('admins', list);
  },

  // Auto-reply rules
  get rules() {
    return db.load('rules', {});
  },
  setRule(trigger, response) {
    const rules = db.load('rules', {});
    rules[trigger.toLowerCase()] = response;
    db.save('rules');
  },
  deleteRule(trigger) {
    const rules = db.load('rules', {});
    delete rules[trigger.toLowerCase()];
    db.save('rules');
  },

  // LM Studio
  lmStudioUrl: process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234',
  lmStudioModel: process.env.LM_STUDIO_MODEL || '',  // empty = auto-detect

  // Polling
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 3000,

  // Style data
  get style() {
    return db.load('style', { samples: [], patterns: {} });
  },
  saveStyle(data) {
    db.setAll('style', data);
  },

  // Messenger DOM selectors
  selectors: {
    conversationList: '[role="list"]',
    conversationLink: 'a[href*="/t/"]',
    messageList: '[role="main"]',
    messageRow: 'div[class] > div[class] > div[dir="auto"]',
    messageGroup: '[role="row"]',
    messageInput: '[role="textbox"][contenteditable="true"]',
    threadHeader: 'div[role="main"] h2, div[role="main"] span[dir="auto"]',
  },
};

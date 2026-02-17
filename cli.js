#!/usr/bin/env node
// CLI test tool - chay offline, test command/game/economy khong can Messenger
// Su dung ID-based system
require('dotenv').config();
const readline = require('readline');
const { handleCommand, checkAutoReply, games } = require('./src/commands');
const { AIChat } = require('./src/ai');

const ai = new AIChat();

// Cau hinh test - dung ID thay vi ten
let currentUserId = process.argv[2] || '100000000000001';  // Test user ID
let currentUserName = process.argv[3] || 'TestUser';       // Display name
let currentThread = 'cli-test';
let isGroup = false;

// Dang ky test user vao registry
games.economy.updateUser(currentUserId, currentUserName);
games.economy.getPlayer(currentUserId, currentUserName);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '',
});

function updatePrompt() {
  const mode = isGroup ? 'GRP' : 'DM';
  rl.setPrompt(`[${mode}] ${currentUserName}(${currentUserId.slice(-6)})> `);
}

function printReply(text) {
  if (!text) return;
  if (typeof text === 'object' && text.file) {
    console.log(`\x1b[36m[Bot]\x1b[0m [FILE] ${text.file}`);
    if (text.text) console.log(`\x1b[36m[Bot]\x1b[0m ${text.text}`);
    return;
  }
  console.log(`\x1b[36m[Bot]\x1b[0m ${text}`);
}

async function processInput(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Meta commands (bat dau bang !)
  if (trimmed.startsWith('!')) {
    const parts = trimmed.slice(1).split(/\s+/);
    const meta = parts[0].toLowerCase();

    if (meta === 'help') {
      console.log(`
\x1b[33m=== CLI META COMMANDS ===\x1b[0m
  !help             - Hien thi huong dan nay
  !user <id> [ten]  - Doi user (VD: !user 12345 Nguyen Duy)
  !thread <id>      - Doi thread ID (hien tai: ${currentThread})
  !group            - Toggle group/DM mode (hien tai: ${isGroup ? 'Group' : 'DM'})
  !players          - Xem tat ca players trong DB
  !users            - Xem user registry
  !reset <id>       - Reset player data
  !ai               - Check LM Studio status
  !exit             - Thoat
`);
      return;
    }

    if (meta === 'user') {
      if (parts.length >= 2) {
        currentUserId = parts[1];
        currentUserName = parts.slice(2).join(' ') || `User_${currentUserId.slice(-4)}`;
        games.economy.updateUser(currentUserId, currentUserName);
        games.economy.getPlayer(currentUserId, currentUserName);
      }
      console.log(`User -> ${currentUserName} (${currentUserId})`);
      updatePrompt();
      return;
    }

    if (meta === 'thread') {
      currentThread = parts[1] || currentThread;
      console.log(`Thread -> ${currentThread}`);
      return;
    }

    if (meta === 'group') {
      isGroup = !isGroup;
      console.log(`Mode -> ${isGroup ? 'Group' : 'DM'}`);
      updatePrompt();
      return;
    }

    if (meta === 'players') {
      const players = games.economy.players;
      const ids = Object.keys(players);
      if (!ids.length) { console.log('Chua co player nao.'); return; }
      for (const id of ids) {
        const p = players[id];
        console.log(`  ${p.displayName || p.id} (${id}): ${p.xu} xu, bank ${p.bank}, lv${p.level}`);
      }
      return;
    }

    if (meta === 'users') {
      const users = games.economy.users;
      const ids = Object.keys(users);
      if (!ids.length) { console.log('Chua co user nao.'); return; }
      for (const id of ids) {
        console.log(`  ${users[id].name} -> ${id}`);
      }
      return;
    }

    if (meta === 'reset') {
      const id = parts[1];
      if (id && games.economy.players[id]) {
        delete games.economy.players[id];
        games.economy._save();
        console.log(`Reset player: ${id}`);
      } else {
        console.log('Player khong ton tai. Dung ID, khong phai ten.');
      }
      return;
    }

    if (meta === 'ai') {
      const health = await ai.checkHealth();
      console.log(`LM Studio: ${health.online ? 'ONLINE' : 'OFFLINE'}`);
      if (health.models?.length) console.log(`Models: ${health.models.join(', ')}`);
      return;
    }

    if (meta === 'exit' || meta === 'quit') {
      console.log('Bye!');
      process.exit(0);
    }

    console.log('Meta command khong hop le. !help de xem.');
    return;
  }

  // Simulate bot processing
  const ctx = {
    sender: currentUserName,   // Display name
    senderId: currentUserId,   // Facebook ID
    threadId: currentThread,
    isGroup,
  };

  // Parse message giong bot.js - ca DM va Group deu dung /
  let parsed;
  if (trimmed.startsWith('/')) {
    const p = trimmed.slice(1).split(/\s+/);
    parsed = { isCommand: true, command: p[0], args: p.slice(1).join(' '), raw: trimmed };
  } else if (isGroup) {
    const botName = (process.env.BOT_NAME || 'Bot').toLowerCase();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith(`@${botName}`)) {
      const rest = trimmed.slice(botName.length + 1).trim();
      if (rest.startsWith('/')) {
        const p = rest.slice(1).split(/\s+/);
        parsed = { isCommand: true, command: p[0], args: p.slice(1).join(' '), raw: trimmed };
      } else {
        const p = rest.split(/\s+/);
        parsed = { isCommand: true, command: p[0] || 'help', args: p.slice(1).join(' '), raw: trimmed };
      }
    } else {
      parsed = { isCommand: false, raw: trimmed, ignored: true };
    }
  } else {
    parsed = { isCommand: false, raw: trimmed };
  }

  if (parsed.ignored) {
    console.log('\x1b[90m(Group: khong mention bot, bo qua)\x1b[0m');
    return;
  }

  // Game input (dung senderId)
  if (games.hasActiveGame(currentThread) && !parsed.isCommand) {
    const result = games.handleGameInput(currentThread, parsed.raw, currentUserId);
    if (result) { printReply(result); return; }
  }

  // Command
  if (parsed.isCommand && parsed.command) {
    const cmd = parsed.command.toLowerCase();

    if (cmd === 'chat') {
      const health = await ai.checkHealth();
      if (health.online) {
        const reply = await ai.chat(currentThread, parsed.args || '', currentUserName);
        printReply(reply);
      } else {
        printReply('AI dang offline.');
      }
      return;
    }

    if (cmd === 'clearchat') {
      printReply(ai.clearHistory(currentThread));
      return;
    }

    if (cmd === 'code') {
      if (!parsed.args) { printReply('/code <mo ta>\nVD: /code ham tinh giai thua python'); return; }
      const health = await ai.checkHealth();
      if (!health.online) { printReply('AI dang offline.'); return; }
      const messages = [
        { role: 'system', content: 'Ban la lap trinh vien. Viet code ngan gon, sach. Chi tra ve code va giai thich ngan. KHONG dung markdown formatting.' },
        { role: 'user', content: parsed.args },
      ];
      const reply = await ai.callLMStudio(messages, { temperature: 0.3, maxTokens: 1500 });
      printReply(reply ? reply.substring(0, 2000) : 'AI khong tra loi duoc.');
      return;
    }

    // TTS (async)
    if (cmd === 'tts') {
      let result = handleCommand('tts', parsed.args, ctx);
      if (result && typeof result.then === 'function') result = await result;
      printReply(result);
      return;
    }

    const result = handleCommand(parsed.command, parsed.args, ctx);
    if (result) { printReply(result); return; }

    printReply(`Khong hieu "${parsed.command}". /help de xem.`);
    return;
  }

  // DM auto-reply
  if (!isGroup) {
    const auto = checkAutoReply(parsed.raw);
    if (auto) { printReply(auto); return; }
    console.log('\x1b[90m(Khong match rule nao, khong reply)\x1b[0m');
  }
}

// === START ===
console.log(`
\x1b[33m╔══════════════════════════════════╗
║   MESSENGER BOT - CLI Test Tool  ║
║   ID-based System                ║
╚══════════════════════════════════╝\x1b[0m

User: ${currentUserName} (${currentUserId})
Thread: ${currentThread} | Mode: DM
Go \x1b[33m!help\x1b[0m de xem meta commands.
Go \x1b[33m/help\x1b[0m de xem bot commands.
`);

updatePrompt();
rl.prompt();

rl.on('line', async (line) => {
  await processInput(line);
  rl.prompt();
});

rl.on('close', () => {
  console.log('\nBye!');
  process.exit(0);
});

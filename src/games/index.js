// src/games/index.js
// Game Manager - quan ly tat ca game va session

const { Economy } = require('../economy');
const economy = new Economy();

// Game sessions: threadId -> { type, player, ...state }
// Moi thread chi co 1 game tai 1 thoi diem
const sessions = new Map();

function hasActiveGame(threadId) {
  return sessions.has(threadId);
}

function getSession(threadId) {
  return sessions.get(threadId);
}

function setSession(threadId, data) {
  sessions.set(threadId, data);
}

function endGame(threadId) {
  sessions.delete(threadId);
}

// Import tat ca games
const guess = require('./guess');
const blackjack = require('./blackjack');
const scramble = require('./scramble');
const math = require('./math');
const wordle = require('./wordle');
const fishing = require('./fishing');
const taixiu = require('./taixiu');
const baucua = require('./baucua');
const slots = require('./slots');
const rps = require('./rps');
const misc = require('./misc');

// Xu ly input khi dang choi game
function handleGameInput(threadId, text, player) {
  const session = sessions.get(threadId);
  if (!session) return null;

  // Chi cho phep nguoi choi dung xu ly game cua ho
  if (session.player && session.player !== player) {
    return `Game nay cua ${session.player}! Doi ho choi xong hoac /endgame.`;
  }

  const ctx = {
    threadId,
    session,
    player,
    economy,
    sessions,
    endGame: () => endGame(threadId),
  };

  switch (session.type) {
    case 'guess': return guess.handleInput(ctx, text);
    case 'blackjack': return blackjack.handleInput(ctx, text);
    case 'scramble': return scramble.handleInput(ctx, text);
    case 'math': return math.handleInput(ctx, text);
    case 'wordle': return wordle.handleInput(ctx, text);
    case 'fishing': return fishing.handleInput(ctx, text);
    default: return null;
  }
}

module.exports = {
  economy,
  sessions,
  hasActiveGame,
  getSession,
  setSession,
  endGame,
  handleGameInput,
  // Individual games
  guess, blackjack, scramble, math, wordle, fishing,
  taixiu, baucua, slots, rps, misc,
};

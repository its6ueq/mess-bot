// src/games/index.js
// Game Manager - quan ly tat ca game va session

const { Economy } = require('../economy');
const economy = new Economy();

// Game sessions: threadId -> { type, player, ...state }
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

// Import games (da xoa: guess, math, scramble)
const blackjack = require('./blackjack');
const wordle = require('./wordle');
const fishing = require( './fishing' );
const hunting = require('./hunting'); // <--- THÊM DÒNG NÀY
const taixiu = require('./taixiu');
const baucua = require('./baucua');
const slots = require('./slots');
const rps = require('./rps');
const lottery = require('./lottery');
const pvp = require('./pvp');
const misc = require('./misc');

// Xu ly input khi dang choi game
function handleGameInput(threadId, text, player) {
  const session = sessions.get(threadId);
  if (!session) return null;

  // Người khác gửi tin trong lúc có game → bỏ qua, không reply
  if (session.player && session.player !== player) {
    return null;
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
    case 'blackjack': return blackjack.handleInput(ctx, text);
    case 'wordle': return wordle.handleInput(ctx, text);
    case 'fishing': return fishing.handleInput( ctx, text );
    case 'hunting': return hunting.handleInput(ctx, text); // <--- THÊM DÒNG NÀY (nếu hunting có handleInput)
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
  blackjack, wordle, fishing, hunting,
  taixiu, baucua, slots, rps, lottery, pvp, misc,
};

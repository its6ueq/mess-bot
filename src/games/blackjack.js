// Xì dách (Blackjack) - có cược xu

function start(ctx, betStr) {
  const { threadId, player, economy, sessions } = ctx;
  const bet = parseInt(betStr) || 100;

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Bạn chỉ có ${bal.xu} xu! Cần ${bet} xu để chơi.`;

  economy.removeXu(player, bet);

  const deck = createDeck();
  const pHand = [deck.pop(), deck.pop()];
  const dHand = [deck.pop(), deck.pop()];

  sessions.set(threadId, { type: 'blackjack', deck, pHand, dHand, player, bet });

  const pTotal = total(pHand);
  if (pTotal === 21) {
    const win = Math.floor(bet * 2.5);
    economy.addXu(player, win);
    economy.recordGame(player, true);
    sessions.delete(threadId);
    return `🃏 XÌ DÁCH! Cược: ${bet} xu\nBạn: ${show(pHand)} = 21\nNhà cái: ${show(dHand)}\n🎉 BLACKJACK! +${win} xu`;
  }

  return `🃏 XÌ DÁCH! Cược: ${bet} xu\nBạn: ${show(pHand)} = ${pTotal}\nNhà cái: ${dHand[0]} [?]\n\n"rút" hoặc "dừng"`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const cmd = text.toLowerCase().trim();

  if (cmd === 'rut' || cmd === 'rút' || cmd === 'r' || cmd === 'hit') {
    session.pHand.push(session.deck.pop());
    const pT = total(session.pHand);
    if (pT > 21) {
      economy.recordGame(session.player, false);
      endGame();
      return `🃏 Bạn: ${show(session.pHand)} = ${pT}\n💀 QUÁ 21! Thua ${session.bet} xu`;
    }
    if (pT === 21) return dealerPlay(ctx);
    return `🃏 Bạn: ${show(session.pHand)} = ${pT}\nNhà cái: ${session.dHand[0]} [?]\n\n"rút" / "dừng"`;
  }

  if (cmd === 'dung' || cmd === 'dừng' || cmd === 'd' || cmd === 'stand') {
    return dealerPlay(ctx);
  }

  return '"rút" (r) hoặc "dừng" (d)';
}

function dealerPlay(ctx) {
  const { session, economy, endGame } = ctx;
  while (total(session.dHand) < 17) session.dHand.push(session.deck.pop());

  const pT = total(session.pHand);
  const dT = total(session.dHand);

  let msg = `🃏 Bạn: ${show(session.pHand)} = ${pT}\nNhà cái: ${show(session.dHand)} = ${dT}\n\n`;

  if (dT > 21 || pT > dT) {
    const win = session.bet * 2;
    economy.addXu(session.player, win);
    economy.recordGame(session.player, true);
    msg += `🎉 THẮNG! +${win} xu`;
  } else if (pT < dT) {
    economy.recordGame(session.player, false);
    msg += `💀 THUA! -${session.bet} xu`;
  } else {
    economy.addXu(session.player, session.bet);
    msg += '🤝 HÒA! Trả lại tiền cược.';
  }

  endGame();
  return msg;
}

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const vals = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const s of suits) for (const v of vals) deck.push(v + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function show(hand) { return hand.join(' '); }

function total(hand) {
  let t = 0, aces = 0;
  for (const c of hand) {
    const v = c.replace(/[♠♥♦♣]/g, '');
    if (v === 'A') { aces++; t += 11; }
    else if ('KQJ'.includes(v)) t += 10;
    else t += parseInt(v);
  }
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}

module.exports = { start, handleInput };

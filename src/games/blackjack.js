// Xi dach (Blackjack) - co cuoc xu

function start(ctx, betStr) {
  const { threadId, player, economy, sessions } = ctx;
  const bet = parseInt(betStr) || 100;

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Ban chi co ${bal.xu} xu! Can ${bet} xu de choi.`;

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
    return `🃏 XI DACH! Cuoc: ${bet} xu\nBan: ${show(pHand)} = 21\nNha cai: ${show(dHand)}\n🎉 BLACKJACK! +${win} xu`;
  }

  return `🃏 XI DACH! Cuoc: ${bet} xu\nBan: ${show(pHand)} = ${pTotal}\nNha cai: ${dHand[0]} [?]\n\n"rut" hoac "dung"`;
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const cmd = text.toLowerCase().trim();

  if (cmd === 'rut' || cmd === 'r' || cmd === 'hit') {
    session.pHand.push(session.deck.pop());
    const pT = total(session.pHand);
    if (pT > 21) {
      economy.recordGame(session.player, false);
      endGame();
      return `🃏 Ban: ${show(session.pHand)} = ${pT}\n💀 QUA 21! Thua ${session.bet} xu`;
    }
    if (pT === 21) return dealerPlay(ctx);
    return `🃏 Ban: ${show(session.pHand)} = ${pT}\nNha cai: ${session.dHand[0]} [?]\n\n"rut" / "dung"`;
  }

  if (cmd === 'dung' || cmd === 'd' || cmd === 'stand') {
    return dealerPlay(ctx);
  }

  return '"rut" (r) hoac "dung" (d)';
}

function dealerPlay(ctx) {
  const { session, economy, endGame } = ctx;
  while (total(session.dHand) < 17) session.dHand.push(session.deck.pop());

  const pT = total(session.pHand);
  const dT = total(session.dHand);

  let msg = `🃏 Ban: ${show(session.pHand)} = ${pT}\nNha cai: ${show(session.dHand)} = ${dT}\n\n`;

  if (dT > 21 || pT > dT) {
    const win = session.bet * 2;
    economy.addXu(session.player, win);
    economy.recordGame(session.player, true);
    msg += `🎉 THANG! +${win} xu`;
  } else if (pT < dT) {
    economy.recordGame(session.player, false);
    msg += `💀 THUA! -${session.bet} xu`;
  } else {
    economy.addXu(session.player, session.bet); // Tra lai tien cuoc
    msg += '🤝 HOA! Tra lai tien cuoc.';
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

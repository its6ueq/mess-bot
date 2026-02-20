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

  const pTotal = total(pHand);
  const dTotal = total(dHand);
  const playerBJ = pTotal === 21;
  const dealerBJ = dTotal === 21;

  // Kiểm tra Natural (dealer nhìn bài úp khi upcard là A hoặc 10)
  if (playerBJ || dealerBJ) {
    let msg = `🃏 XÌ DÁCH! Cược: ${bet} xu\n`;
    msg += `Bạn: ${show(pHand)} = ${pTotal}\n`;
    msg += `Nhà cái: ${show(dHand)} = ${dTotal}\n\n`;

    if (playerBJ && dealerBJ) {
      economy.addXu(player, bet);
      economy.recordGame(player, false);
      msg += '🤝 CẢ HAI BLACKJACK! Hòa - trả lại tiền cược.';
    } else if (playerBJ) {
      const win = Math.floor(bet * 2.5);
      economy.addXu(player, win);
      economy.recordGame(player, true);
      msg += `🎉 BLACKJACK! Thắng ${win} xu`;
    } else {
      economy.recordGame(player, false);
      msg += `💀 Nhà cái BLACKJACK! Thua ${bet} xu`;
    }
    return msg;
  }

  sessions.set(threadId, { type: 'blackjack', deck, pHand, dHand, player, bet, canDouble: true });

  const hint = getHint(pHand, dHand[0]);
  const ddNote = canDoubleDown(pHand) ? '\n💰 "double" - tăng gấp đôi cược (nhận 1 lá)' : '';

  return [
    `🃏 XÌ DÁCH! Cược: ${bet} xu`,
    `Bạn: ${show(pHand)} = ${pTotal}`,
    `Nhà cái: ${dHand[0]} [?]`,
    '',
    hint + ddNote,
    '',
    '"rút" (r) / "dừng" (d)',
  ].join('\n');
}

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const cmd = text.toLowerCase().trim();

  // Double Down
  if (cmd === 'double' || cmd === 'dd') {
    if (!session.canDouble)
      return '❌ Chỉ được double down ở 2 lá đầu!';
    if (!canDoubleDown(session.pHand))
      return '❌ Chỉ được double down khi tổng là 9, 10, hoặc 11!';
    if (economy.getBalance(session.player).xu < session.bet)
      return `❌ Không đủ xu! Cần thêm ${session.bet} xu.`;

    economy.removeXu(session.player, session.bet);
    session.bet *= 2;
    session.canDouble = false;
    session.pHand.push(session.deck.pop());

    const pT = total(session.pHand);
    if (pT > 21) {
      economy.recordGame(session.player, false);
      endGame();
      return `🃏 Double Down!\nBạn: ${show(session.pHand)} = ${pT}\n💀 QUÁ 21! Thua ${session.bet} xu`;
    }
    return dealerPlay(ctx, `🃏 Double Down!\nBạn: ${show(session.pHand)} = ${pT}`);
  }

  // Hit
  if (cmd === 'rut' || cmd === 'rút' || cmd === 'r' || cmd === 'hit') {
    session.canDouble = false;
    session.pHand.push(session.deck.pop());
    const pT = total(session.pHand);

    if (pT > 21) {
      economy.recordGame(session.player, false);
      endGame();
      return `🃏 Bạn: ${show(session.pHand)} = ${pT}\n💀 QUÁ 21! Thua ${session.bet} xu`;
    }
    if (pT === 21) return dealerPlay(ctx);

    const hint = getHint(session.pHand, session.dHand[0]);
    return [
      `🃏 Bạn: ${show(session.pHand)} = ${pT}`,
      `Nhà cái: ${session.dHand[0]} [?]`,
      '',
      hint,
      '"rút" (r) / "dừng" (d)',
    ].join('\n');
  }

  // Stand
  if (cmd === 'dung' || cmd === 'dừng' || cmd === 'd' || cmd === 'stand') {
    return dealerPlay(ctx);
  }

  const ddOpt = session.canDouble && canDoubleDown(session.pHand) ? ' / "double"' : '';
  return `❓ "rút" (r) / "dừng" (d)${ddOpt}`;
}

function dealerPlay(ctx, prefix) {
  const { session, economy, endGame } = ctx;

  while (total(session.dHand) < 17) session.dHand.push(session.deck.pop());

  const pT = total(session.pHand);
  const dT = total(session.dHand);

  const lines = [];
  if (prefix) lines.push(prefix, '');
  lines.push(
    `🃏 Bạn: ${show(session.pHand)} = ${pT}`,
    `Nhà cái: ${show(session.dHand)} = ${dT}`,
    '',
  );

  if (dT > 21 || pT > dT) {
    const win = session.bet * 2;
    economy.addXu(session.player, win);
    economy.recordGame(session.player, true);
    lines.push(`🎉 THẮNG! +${win} xu`);
  } else if (pT < dT) {
    economy.recordGame(session.player, false);
    lines.push(`💀 THUA! -${session.bet} xu`);
  } else {
    economy.addXu(session.player, session.bet);
    lines.push('🤝 HÒA! Trả lại tiền cược.');
  }

  endGame();
  return lines.join('\n');
}

// Gợi ý theo basic strategy
function getHint(pHand, dUpcard) {
  const pT = total(pHand);
  const dVal = faceVal(dUpcard);
  const isSoft = hasSoftAce(pHand);
  const isFirst2 = pHand.length === 2;

  let action;
  if (isSoft) {
    if (pT >= 19) action = 'DỪNG';
    else if (pT === 18) action = dVal <= 8 ? 'DỪNG' : 'RÚT';
    else action = 'RÚT';
  } else {
    if (pT >= 17) action = 'DỪNG';
    else if (pT >= 13) action = dVal <= 6 ? 'DỪNG' : 'RÚT';
    else if (pT === 12) action = (dVal >= 4 && dVal <= 6) ? 'DỪNG' : 'RÚT';
    else if (pT === 11 && isFirst2) action = 'DOUBLE DOWN';
    else if (pT === 10 && isFirst2 && dVal <= 9) action = 'DOUBLE DOWN';
    else if (pT === 9 && isFirst2 && dVal >= 3 && dVal <= 6) action = 'DOUBLE DOWN';
    else action = 'RÚT';
  }

  return `💡 Gợi ý: ${action}`;
}

function canDoubleDown(hand) {
  if (hand.length !== 2) return false;
  const t = total(hand);
  return t >= 9 && t <= 11;
}

function hasSoftAce(hand) {
  let t = 0, hasAce = false;
  for (const c of hand) {
    const v = c.replace(/[♠♥♦♣]/g, '');
    if (v === 'A') { hasAce = true; t += 11; }
    else if ('KQJ'.includes(v)) t += 10;
    else t += parseInt(v);
  }
  return hasAce && t <= 21;
}

function faceVal(card) {
  const v = card.replace(/[♠♥♦♣]/g, '');
  if (v === 'A') return 11;
  if (v === '10' || 'KQJ'.includes(v)) return 10;
  return parseInt(v);
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

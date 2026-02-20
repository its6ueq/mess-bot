// Xì dách (Blackjack) - đầy đủ luật: Naturals, Split, Double Down, Basic Strategy

function start(ctx, betStr) {
  const { threadId, player, economy, sessions } = ctx;
  const bet = parseInt(betStr) || 100;

  const bal = economy.getBalance(player);
  if (bal.xu < bet) return `Bạn chỉ có ${bal.xu} xu! Cần ${bet} xu để chơi.`;

  economy.removeXu(player, bet);

  const deck = createDeck();
  const pCards = [deck.pop(), deck.pop()];
  const dHand  = [deck.pop(), deck.pop()];

  const pT = total(pCards);
  const dT = total(dHand);

  // --- Kiểm tra Natural / Dealer peek ---
  if (pT === 21 || dT === 21) {
    let msg = `🃏 XÌ DÁCH! Cược: ${bet} xu\nBạn: ${show(pCards)} = ${pT}\nNhà cái: ${show(dHand)} = ${dT}\n\n`;
    if (pT === 21 && dT === 21) {
      economy.addXu(player, bet);
      economy.recordGame(player, false);
      return msg + '🤝 CẢ HAI BLACKJACK! Hòa - trả lại tiền.';
    }
    if (pT === 21) {
      const win = Math.floor(bet * 2.5);
      economy.addXu(player, win);
      economy.recordGame(player, true);
      return msg + `🎉 BLACKJACK! Thắng ${win} xu`;
    }
    economy.recordGame(player, false);
    return msg + `💀 Nhà cái BLACKJACK! Thua ${bet} xu`;
  }

  const session = {
    type: 'blackjack',
    deck, dHand, player,
    hands: [{ cards: pCards, bet, done: false, busted: false }],
    cur: 0,
  };
  sessions.set(threadId, session);
  return renderTurn(session);
}

// ─── Render trạng thái tay hiện tại ───────────────────────────────────────

function renderTurn(session) {
  const h    = session.hands[session.cur];
  const n    = session.hands.length;
  const idx  = session.cur;
  const pT   = total(h.cards);
  const dUp  = session.dHand[0];
  const isF  = h.cards.length === 2;
  const canDD  = isF && canDoubleDown(h.cards);
  const canSpl = isF && n === 1 && canSplit(h.cards);

  const lines = [];

  if (n > 1) {
    lines.push(`🃏 XÌ DÁCH! │ Tay ${idx + 1}/${n} │ Cược: ${h.bet} xu`);
    for (let j = 0; j < idx; j++) {
      const p = session.hands[j];
      lines.push(`✅ Tay ${j + 1}: ${show(p.cards)} = ${total(p.cards)}${p.busted ? ' 💥' : ''}`);
    }
  } else {
    lines.push(`🃏 XÌ DÁCH! │ Cược: ${h.bet} xu`);
  }

  lines.push(`Bạn: ${show(h.cards)} = ${pT}`);
  lines.push(`Nhà cái: ${dUp} [?]`);
  lines.push('');
  lines.push(getHint(h.cards, dUp, canSpl, canDD));

  const acts = ['"rút" (r)', '"dừng" (d)'];
  if (canDD)  acts.push('"double"');
  if (canSpl) acts.push('"tách"');
  lines.push('');
  lines.push(acts.join(' / '));

  return lines.join('\n');
}

// ─── Xử lý input người chơi ───────────────────────────────────────────────

function handleInput(ctx, text) {
  const { session, economy, endGame } = ctx;
  const cmd = text.toLowerCase().trim();
  const h   = session.hands[session.cur];
  const isF = h.cards.length === 2;

  // ── TÁCH ─────────────────────────────────────────────────────────────────
  if (cmd === 'tach' || cmd === 'tách' || cmd === 'split') {
    if (!isF || session.hands.length > 1)
      return '❌ Chỉ được tách ở đầu ván (chưa tách lần nào)!';
    if (!canSplit(h.cards))
      return '❌ Chỉ được tách khi 2 lá có cùng giá trị!';
    if (economy.getBalance(session.player).xu < h.bet)
      return `❌ Không đủ xu! Cần thêm ${h.bet} xu để tách.`;

    economy.removeXu(session.player, h.bet);

    const isAces = cardRank(h.cards[0]) === 'A';
    const h1 = { cards: [h.cards[0], session.deck.pop()], bet: h.bet, done: false, busted: false };
    const h2 = { cards: [h.cards[1], session.deck.pop()], bet: h.bet, done: false, busted: false };
    session.hands = [h1, h2];
    session.cur   = 0;

    // Tách Aces: mỗi tay chỉ nhận đúng 1 lá, không rút thêm
    if (isAces) {
      h1.done = true;
      h2.done = true;
      const note = `🃏 Tách Aces!\nTay 1: ${show(h1.cards)} = ${total(h1.cards)}\nTay 2: ${show(h2.cards)} = ${total(h2.cards)}`;
      return dealerPlay(ctx, note);
    }

    return renderTurn(session);
  }

  // ── DOUBLE DOWN ──────────────────────────────────────────────────────────
  if (cmd === 'double' || cmd === 'dd') {
    if (!isF)
      return '❌ Chỉ được double down ở 2 lá đầu của tay!';
    if (!canDoubleDown(h.cards))
      return '❌ Chỉ double down khi tổng là 9, 10, hoặc 11!';
    if (economy.getBalance(session.player).xu < h.bet)
      return `❌ Không đủ xu! Cần thêm ${h.bet} xu.`;

    economy.removeXu(session.player, h.bet);
    h.bet *= 2;
    h.cards.push(session.deck.pop());
    h.done = true;
    if (total(h.cards) > 21) h.busted = true;

    const pT   = total(h.cards);
    const note = `🃏 Double Down → ${show(h.cards)} = ${pT}${h.busted ? ' 💥 Bust!' : ''}`;
    return advanceHand(ctx, note);
  }

  // ── RÚT ─────────────────────────────────────────────────────────────────
  if (cmd === 'rut' || cmd === 'rút' || cmd === 'r' || cmd === 'hit') {
    h.cards.push(session.deck.pop());
    const pT = total(h.cards);

    if (pT > 21) {
      h.done   = true;
      h.busted = true;
      return advanceHand(ctx, `Bạn: ${show(h.cards)} = ${pT} 💥 Bust!`);
    }
    if (pT === 21) {
      h.done = true;
      return advanceHand(ctx);
    }
    return renderTurn(session);
  }

  // ── DỪNG ─────────────────────────────────────────────────────────────────
  if (cmd === 'dung' || cmd === 'dừng' || cmd === 'd' || cmd === 'stand') {
    h.done = true;
    return advanceHand(ctx);
  }

  // ── Không nhận ra ───────────────────────────────────────────────────────
  const extras = [];
  if (isF && canDoubleDown(h.cards)) extras.push('"double"');
  if (isF && canSplit(h.cards) && session.hands.length === 1) extras.push('"tách"');
  return `❓ "rút" (r) / "dừng" (d)${extras.length ? ' / ' + extras.join(' / ') : ''}`;
}

// ─── Chuyển sang tay tiếp theo hoặc kết thúc ──────────────────────────────

function advanceHand(ctx, note) {
  const { session } = ctx;
  session.cur++;
  if (session.cur >= session.hands.length) {
    return dealerPlay(ctx, note);
  }
  const lines = [];
  if (note) lines.push(note, '');
  lines.push(renderTurn(session));
  return lines.join('\n');
}

// ─── Dealer chơi + kết toán ────────────────────────────────────────────────

function dealerPlay(ctx, note) {
  const { session, economy, endGame } = ctx;

  // Dealer rút đến khi đủ 17+ (kể cả soft 17)
  while (total(session.dHand) < 17) session.dHand.push(session.deck.pop());
  const dT = total(session.dHand);

  const lines = [];
  if (note) lines.push(note, '');
  lines.push(`Nhà cái: ${show(session.dHand)} = ${dT}${dT > 21 ? ' 💥 Bust!' : ''}`);
  lines.push('');

  const n = session.hands.length;
  let netProfit = 0;

  for (let i = 0; i < n; i++) {
    const h   = session.hands[i];
    const pT  = total(h.cards);
    const lbl = n > 1 ? `Tay ${i + 1}` : 'Kết quả';

    if (h.busted) {
      netProfit -= h.bet;
      lines.push(`${lbl}: ${show(h.cards)} = ${pT} → 💀 THUA -${h.bet} xu`);
    } else if (dT > 21 || pT > dT) {
      economy.addXu(session.player, h.bet * 2);
      netProfit += h.bet;
      lines.push(`${lbl}: ${show(h.cards)} = ${pT} → 🎉 THẮNG +${h.bet} xu`);
    } else if (pT === dT) {
      economy.addXu(session.player, h.bet);
      lines.push(`${lbl}: ${show(h.cards)} = ${pT} → 🤝 HÒA`);
    } else {
      netProfit -= h.bet;
      lines.push(`${lbl}: ${show(h.cards)} = ${pT} → 💀 THUA -${h.bet} xu`);
    }
  }

  if (n > 1) {
    lines.push('');
    lines.push(
      netProfit > 0 ? `✨ Tổng: +${netProfit} xu` :
      netProfit < 0 ? `📉 Tổng: ${netProfit} xu` :
      '📊 Tổng: Hòa'
    );
  }

  economy.recordGame(session.player, netProfit > 0);
  endGame();
  return lines.join('\n');
}

// ─── Basic Strategy hint ───────────────────────────────────────────────────
// Dựa trên bảng chiến thuật chuẩn của casino (house edge ~0.5%)

function getHint(cards, dUpcard, canSpl, canDD) {
  const pT   = total(cards);
  const dVal = faceVal(dUpcard);
  const soft = hasSoftAce(cards);

  // 1. Gợi ý TÁCH (ưu tiên cao nhất khi có thể tách)
  if (canSpl) {
    const rank = pairRank(cards[0]);

    if (rank === 'A')
      return '💡 Gợi ý: TÁCH (cặp A luôn tách - mỗi tay có thể đạt 21)';
    if (rank === '8')
      return '💡 Gợi ý: TÁCH (cặp 8 luôn tách - 16 là tay tệ nhất)';
    if (rank === '10')
      return '💡 Gợi ý: KHÔNG TÁCH (20 điểm cực mạnh, giữ nguyên)';
    if (rank === '5')
      return canDD && dVal <= 9
        ? '💡 Gợi ý: DOUBLE DOWN (cặp 5 = 10 điểm, tối ưu để double)'
        : '💡 Gợi ý: RÚT (cặp 5 = 10 điểm, không tách)';
    if (rank === '4')
      return '💡 Gợi ý: KHÔNG TÁCH (8 điểm, tốt để rút lên 18)';
    if (rank === '2' || rank === '3')
      return dVal <= 7
        ? `💡 Gợi ý: TÁCH (dealer ${dVal} yếu, mỗi tay có cơ hội)`
        : '💡 Gợi ý: RÚT (dealer mạnh, không nên tách)';
    if (rank === '6')
      return dVal <= 6
        ? `💡 Gợi ý: TÁCH (dealer ${dVal} yếu, để dealer bust)`
        : '💡 Gợi ý: RÚT (dealer mạnh)';
    if (rank === '7')
      return dVal <= 7
        ? `💡 Gợi ý: TÁCH (dealer ${dVal} yếu/bằng)`
        : '💡 Gợi ý: RÚT (dealer mạnh hơn)';
    if (rank === '9') {
      if (dVal === 7 || dVal >= 10)
        return '💡 Gợi ý: DỪNG (9+9=18, dealer không vượt được)';
      return `💡 Gợi ý: TÁCH (18 chưa đủ mạnh vs dealer ${dVal})`;
    }
  }

  // 2. Soft hand (có A tính 11)
  if (soft) {
    if (pT >= 19) return '💡 Gợi ý: DỪNG (soft 19+ an toàn)';
    if (pT === 18) return dVal <= 8
      ? '💡 Gợi ý: DỪNG (soft 18 vs dealer yếu/trung)'
      : '💡 Gợi ý: RÚT (soft 18 vs dealer mạnh 9/10/A)';
    if (pT === 17 && canDD && dVal >= 3 && dVal <= 6)
      return '💡 Gợi ý: DOUBLE DOWN (soft 17 vs dealer yếu 3-6)';
    if (pT <= 17)
      return '💡 Gợi ý: RÚT (soft ≤17)';
  }

  // 3. Hard hand
  if (pT >= 17) return '💡 Gợi ý: DỪNG (≥17 an toàn)';
  if (pT >= 13) return dVal <= 6
    ? `💡 Gợi ý: DỪNG (${pT} vs dealer ${dVal} yếu - chờ dealer bust)`
    : `💡 Gợi ý: RÚT (dealer ${dVal} mạnh)`;
  if (pT === 12) return dVal >= 4 && dVal <= 6
    ? '💡 Gợi ý: DỪNG (dealer 4-6 rất dễ bust)'
    : '💡 Gợi ý: RÚT';
  if (pT === 11) return canDD
    ? '💡 Gợi ý: DOUBLE DOWN (11 điểm - tối ưu nhất)'
    : '💡 Gợi ý: RÚT';
  if (pT === 10) return canDD && dVal <= 9
    ? '💡 Gợi ý: DOUBLE DOWN (10 vs dealer ≤9)'
    : '💡 Gợi ý: RÚT';
  if (pT === 9) return canDD && dVal >= 3 && dVal <= 6
    ? '💡 Gợi ý: DOUBLE DOWN (9 vs dealer 3-6)'
    : '💡 Gợi ý: RÚT';
  return '💡 Gợi ý: RÚT';
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function canDoubleDown(cards) {
  if (cards.length !== 2) return false;
  const t = total(cards);
  return t >= 9 && t <= 11;
}

function canSplit(cards) {
  if (cards.length !== 2) return false;
  return faceVal(cards[0]) === faceVal(cards[1]);
}

// Rank của lá bài (bỏ suit)
function cardRank(card) {
  return card.replace(/[♠♥♦♣]/g, '');
}

// Rank dùng cho chiến thuật split: K/Q/J → '10'
function pairRank(card) {
  const v = cardRank(card);
  return 'KQJ'.includes(v) ? '10' : v;
}

function hasSoftAce(hand) {
  let t = 0, hasAce = false;
  for (const c of hand) {
    const v = cardRank(c);
    if (v === 'A') { hasAce = true; t += 11; }
    else if ('KQJ'.includes(v)) t += 10;
    else t += parseInt(v);
  }
  return hasAce && t <= 21;
}

function faceVal(card) {
  const v = cardRank(card);
  if (v === 'A') return 11;
  if (v === '10' || 'KQJ'.includes(v)) return 10;
  return parseInt(v);
}

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const vals  = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck  = [];
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
    const v = cardRank(c);
    if (v === 'A') { aces++; t += 11; }
    else if ('KQJ'.includes(v)) t += 10;
    else t += parseInt(v);
  }
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}

module.exports = { start, handleInput };

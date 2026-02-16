// Cau ca - co inventory, cooldown, ban ca lay xu

const FISH = [
  { name: '🐟 Ca Ro', rarity: 'common', price: 20, weight: 40 },
  { name: '🐠 Ca Vang', rarity: 'common', price: 30, weight: 30 },
  { name: '🐡 Ca Noc', rarity: 'uncommon', price: 50, weight: 15 },
  { name: '🦈 Ca Map', rarity: 'rare', price: 200, weight: 5 },
  { name: '🐙 Bach Tuoc', rarity: 'rare', price: 150, weight: 6 },
  { name: '🦞 Tom Hum', rarity: 'uncommon', price: 100, weight: 10 },
  { name: '🐬 Ca Heo', rarity: 'epic', price: 500, weight: 2 },
  { name: '🐋 Ca Voi', rarity: 'legendary', price: 1000, weight: 1 },
  { name: '👢 Giay Cu', rarity: 'trash', price: 1, weight: 15 },
  { name: '🪣 Xo Rong', rarity: 'trash', price: 2, weight: 10 },
  { name: '🦀 Cua', rarity: 'uncommon', price: 80, weight: 12 },
  { name: '🦐 Tom', rarity: 'common', price: 40, weight: 25 },
  { name: '🐢 Rua', rarity: 'rare', price: 300, weight: 4 },
  { name: '💎 Vien Ngoc', rarity: 'legendary', price: 2000, weight: 0.5 },
];

const TOTAL_WEIGHT = FISH.reduce((a, f) => a + f.weight, 0);
const COOLDOWN = 15000; // 15 giay

const rarityColors = {
  trash: '⬜', common: '🟩', uncommon: '🟦', rare: '🟪', epic: '🟧', legendary: '🟨',
};

function start(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);
  const now = Date.now();

  if (p.lastFish && now - new Date(p.lastFish).getTime() < COOLDOWN) {
    const left = Math.ceil((COOLDOWN - (now - new Date(p.lastFish).getTime())) / 1000);
    return `⏰ Doi ${left}s nua moi cau tiep duoc!`;
  }

  // Random ca
  let r = Math.random() * TOTAL_WEIGHT;
  let caught;
  for (const fish of FISH) {
    r -= fish.weight;
    if (r <= 0) { caught = fish; break; }
  }
  if (!caught) caught = FISH[0];

  p.lastFish = new Date().toISOString();
  p.fishCaught++;
  p.inventory.push({ name: caught.name, price: caught.price, rarity: caught.rarity });
  economy._save();

  let msg = `🎣 Ban tha cau...\n\n`;
  msg += `${rarityColors[caught.rarity]} ${caught.name}!\n`;
  msg += `Gia tri: ${caught.price} xu | Do hiem: ${caught.rarity.toUpperCase()}\n`;
  msg += `\n/sell de ban ca. /inventory de xem kho.`;

  return msg;
}

function sell(ctx, args) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);

  if (args === 'all') {
    if (p.inventory.length === 0) return 'Kho trong!';
    const total = p.inventory.reduce((sum, item) => sum + item.price, 0);
    const count = p.inventory.length;
    p.inventory = [];
    economy.addXu(player, total);
    return `💰 Da ban ${count} items, nhan ${total} xu!\nVi: ${economy.getBalance(player).xu} xu`;
  }

  // Ban item cuoi cung
  if (p.inventory.length === 0) return 'Kho trong!';
  const item = p.inventory.pop();
  economy.addXu(player, item.price);
  return `💰 Da ban ${item.name} duoc ${item.price} xu.\nVi: ${economy.getBalance(player).xu} xu`;
}

function inventory(ctx) {
  const { player, economy } = ctx;
  const p = economy.getPlayer(player);

  if (p.inventory.length === 0) return '📦 Kho trong! Di cau ca di: /fish';

  const counts = {};
  let totalValue = 0;
  for (const item of p.inventory) {
    counts[item.name] = (counts[item.name] || 0) + 1;
    totalValue += item.price;
  }

  let msg = `📦 KHO DO (${p.inventory.length} items):\n`;
  for (const [name, count] of Object.entries(counts)) {
    msg += `${name} x${count}\n`;
  }
  msg += `\nTong gia tri: ${totalValue} xu\n/sell all de ban het.`;
  return msg;
}

function handleInput(ctx, text) {
  return null; // Fishing khong co interactive session
}

module.exports = { start, sell, inventory, handleInput };

// ============================================================
// CARD — Render profile / level / money card as PNG
// Dùng Puppeteer (browser sẵn có) render HTML+CSS -> screenshot.
// Ảnh nền: assets/card-bg.png (fallback gradient nếu chưa có).
// ============================================================
const path = require('path');
const fs = require('fs');
const os = require('os');

const BG_PATH = path.join(__dirname, '..', 'assets', 'card-bg.png');

function bgDataUri() {
  try {
    const buf = fs.readFileSync(BG_PATH);
    const ext = 'png';
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}
function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

function buildHtml(data) {
  const bg = bgDataUri();
  const bgStyle = bg
    ? `background-image:url('${bg}');`
    : 'background:linear-gradient(135deg,#0d1b2a 0%,#1b263b 60%,#2a3f5f 100%);';
  const initial = esc((String(data.name || '?').trim().charAt(0) || '?').toUpperCase());
  const avaImg = data.avatar
    ? `<img src="${esc(data.avatar)}" class="ava ava-img" onerror="this.remove()"/>`
    : '';
  const expNeed = Math.max(1, data.expNeed || (data.level || 1) * 100);
  const pct = Math.max(0, Math.min(100, Math.round(((data.exp || 0) / expNeed) * 100)));

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box;
        font-family:'Segoe UI',Roboto,'Noto Sans',Arial,sans-serif; }
    #card { position:relative; width:1000px; height:380px; border-radius:28px; overflow:hidden;
            ${bgStyle} background-size:cover; background-position:center; }
    /* Panel kính: chỉ tối + mờ QUANH chữ, phần ảnh còn lại vẫn sáng */
    .panel { position:absolute; top:26px; left:28px; z-index:2; color:#eaf6ff;
             padding:24px 34px 26px; border-radius:26px; max-width:640px;
             background:rgba(8,12,22,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
             border:1px solid rgba(57,197,187,.4); box-shadow:0 10px 34px rgba(0,0,0,.55); }
    .top { display:flex; align-items:center; gap:20px; }
    .avatar-wrap { position:relative; width:88px; height:88px; flex:0 0 auto; }
    .ava { position:absolute; inset:0; width:88px; height:88px; border-radius:50%;
           border:3px solid #39c5bb; box-shadow:0 0 18px rgba(57,197,187,.75); }
    .ava-fallback { display:flex; align-items:center; justify-content:center; font-size:40px;
           font-weight:800; background:linear-gradient(135deg,#39c5bb,#1b6f9f); color:#04121a; }
    .ava-img { object-fit:cover; z-index:2; }
    .name { font-size:34px; font-weight:800; text-shadow:0 2px 8px #000; }
    .rank { margin-top:3px; font-size:17px; color:#ffd36e; font-weight:700; text-shadow:0 2px 6px #000; }
    .lv { margin-top:16px; font-size:46px; font-weight:900; color:#7ef9ee; letter-spacing:1px;
          text-shadow:0 0 16px rgba(57,197,187,.9),0 2px 6px #000; }
    .bar { margin-top:9px; width:560px; height:20px; border-radius:11px; background:rgba(255,255,255,.18);
           overflow:hidden; border:1px solid rgba(57,197,187,.55); }
    .fill { height:100%; width:${pct}%; border-radius:11px;
            background:linear-gradient(90deg,#39c5bb,#7ef9ee); box-shadow:0 0 14px #39c5bb; }
    .exp { margin-top:6px; font-size:14px; color:#cfe6ff; }
    .stats { margin-top:16px; display:flex; gap:14px; flex-wrap:wrap; }
    .stat { background:rgba(3,8,16,.5); border:1px solid rgba(57,197,187,.4); border-radius:14px;
            padding:9px 18px; }
    .stat .k { font-size:13px; color:#9fdff5; letter-spacing:.5px; }
    .stat .v { font-size:23px; font-weight:800; text-shadow:0 2px 6px #000; }
  </style></head><body>
    <div id="card">
      <div class="panel">
        <div class="top">
          <div class="avatar-wrap">
            <div class="ava ava-fallback">${initial}</div>
            ${avaImg}
          </div>
          <div>
            <div class="name">${esc(data.name)}</div>
            ${data.rank ? `<div class="rank">🏆 Hạng #${esc(data.rank)}</div>` : ''}
          </div>
        </div>
        <div class="lv">LEVEL ${fmt(data.level)}</div>
        <div class="bar"><div class="fill"></div></div>
        <div class="exp">EXP ${fmt(data.exp)} / ${fmt(expNeed)}  (${pct}%)</div>
        <div class="stats">
          <div class="stat"><div class="k">💰 VÍ</div><div class="v">${fmt(data.xu)} xu</div></div>
          <div class="stat"><div class="k">🏦 NGÂN HÀNG</div><div class="v">${fmt(data.bank)} xu</div></div>
          <div class="stat"><div class="k">🎮 THẮNG</div><div class="v">${fmt(data.gamesWon)}/${fmt(data.gamesPlayed)}</div></div>
        </div>
      </div>
    </div>
  </body></html>`;
}

// Render card ra file PNG, trả về đường dẫn. Cần 1 puppeteer browser đang mở.
async function renderCard(browser, data, outPath) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1000, height: 380, deviceScaleFactor: 2 });
    await page.setContent(buildHtml(data), { waitUntil: 'networkidle0', timeout: 15000 });
    // Đợi avatar (nếu có) load xong tối đa 3s
    await new Promise(r => setTimeout(r, data.avatar ? 800 : 100));
    const el = await page.$('#card');
    const file = outPath || path.join(os.tmpdir(), `card_${data.id || 'x'}_${Date.now()}.png`);
    await el.screenshot({ path: file });
    return file;
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = { renderCard, buildHtml, BG_PATH };

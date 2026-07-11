// ============================================================
// LEADERBOARD — Render bảng xếp hạng thành ảnh PNG
// Nền: assets/leaderboard-bg.png (fallback gradient).
// Panel kính bo tròn ôm nội dung, phần nền còn lại vẫn sáng.
// ============================================================
const path = require('path');
const fs = require('fs');
const os = require('os');

const BG_PATH = path.join(__dirname, '..', 'assets', 'leaderboard-bg.png');

function bgDataUri() {
  try { return 'data:image/png;base64,' + fs.readFileSync(BG_PATH).toString('base64'); }
  catch { return null; }
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function medal(rank) { return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`; }

function buildHtml(data) {
  const bg = bgDataUri();
  const bgStyle = bg ? `background-image:url('${bg}');`
    : 'background:linear-gradient(135deg,#12060b 0%,#2a0d16 55%,#3a1420 100%);';
  const top = data.top || [];
  const me = data.me || null;
  const meInTop = me && top.some(t => t.id === me.id);

  const rows = top.map(t => {
    const hot = me && t.id === me.id;
    return `<div class="row${hot ? ' me' : ''}">
      <div class="rk">${medal(t.rank)}</div>
      <div class="nm">${esc(t.name)}</div>
      <div class="lv">Lv.${fmt(t.level)}</div>
      <div class="xu">${fmt(t.total)} xu</div>
    </div>`;
  }).join('');

  const meRow = (me && !meInTop) ? `
    <div class="divider">• • •</div>
    <div class="row me">
      <div class="rk">#${esc(me.rank)}</div>
      <div class="nm">${esc(me.name)}</div>
      <div class="lv">Lv.${fmt(me.level)}</div>
      <div class="xu">${fmt(me.total)} xu</div>
    </div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box;
        font-family:'Segoe UI',Roboto,'Noto Sans',Arial,sans-serif; }
    #card { position:relative; width:900px; padding:26px; border-radius:28px; overflow:hidden;
            ${bgStyle} background-size:cover; background-position:center; }
    .panel { position:relative; z-index:2; padding:26px 30px 28px; border-radius:24px; color:#f3f7ff;
             background:rgba(8,10,20,.56); backdrop-filter:blur(9px); -webkit-backdrop-filter:blur(9px);
             border:1px solid rgba(255,70,90,.35); box-shadow:0 10px 34px rgba(0,0,0,.6); }
    .title { font-size:34px; font-weight:900; letter-spacing:1px; color:#ff6b7f;
             text-shadow:0 0 16px rgba(255,60,90,.7),0 2px 6px #000; margin-bottom:16px; }
    .row { display:flex; align-items:center; gap:14px; padding:11px 16px; margin-bottom:8px;
           border-radius:14px; background:rgba(3,6,14,.42); border:1px solid rgba(255,255,255,.06); }
    .row.me { background:rgba(255,70,90,.22); border:1px solid rgba(255,90,110,.6);
              box-shadow:0 0 16px rgba(255,60,90,.35); }
    .rk { width:54px; font-size:22px; font-weight:800; text-align:center; }
    .nm { flex:1; font-size:23px; font-weight:700; text-shadow:0 2px 5px #000;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .lv { font-size:16px; color:#bcd; }
    .xu { width:180px; text-align:right; font-size:22px; font-weight:800; color:#ffd36e;
          text-shadow:0 2px 5px #000; }
    .divider { text-align:center; color:#9aa; letter-spacing:6px; margin:4px 0 10px; }
  </style></head><body>
    <div id="card"><div class="panel">
      <div class="title">🏆 BẢNG XẾP HẠNG</div>
      ${rows || '<div class="row"><div class="nm">Chưa có ai chơi!</div></div>'}
      ${meRow}
    </div></div>
  </body></html>`;
}

async function renderLeaderboard(browser, data, outPath) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 2 });
    await page.setContent(buildHtml(data), { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 120));
    const el = await page.$('#card');
    const file = outPath || path.join(os.tmpdir(), `lb_${Date.now()}.png`);
    await el.screenshot({ path: file });
    return file;
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = { renderLeaderboard, buildHtml, BG_PATH };

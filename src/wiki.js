// Tra khái niệm/định nghĩa từ Wikipedia tiếng Việt (miễn phí, không cần key).
// 1) opensearch để tìm đúng tên bài, 2) REST summary để lấy đoạn tóm tắt.

const WIKI = 'https://vi.wikipedia.org';

async function resolveTitle(q) {
  const url = `${WIKI}/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MessengerBot/1.0' } });
  if (!res.ok) return null;
  const data = await res.json(); // [query, [titles], [descs], [urls]]
  return (data[1] && data[1][0]) || null;
}

async function getSummary(title) {
  const url = `${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MessengerBot/1.0' } });
  if (!res.ok) return null;
  return res.json();
}

async function getConcept(query) {
  const q = (query || '').trim();
  if (!q) return 'Tra khái niệm gì? VD: /khainiem lỗ đen';

  try {
    const title = await resolveTitle(q);
    if (!title) return `Không tìm thấy "${q}" trên Wikipedia. Thử từ khoá khác nhé.`;

    const s = await getSummary(title);
    if (!s || !s.extract) return `Không lấy được nội dung cho "${title}".`;

    if (s.type === 'disambiguation') {
      return `📚 "${s.title}" có nhiều nghĩa. Hãy ghi cụ thể hơn nhé!\n${s.content_urls?.desktop?.page || ''}`;
    }

    let extract = s.extract.trim();
    if (extract.length > 1200) extract = extract.substring(0, 1200).replace(/\s+\S*$/, '') + '…';

    let msg = `📚 ${s.title}\n\n${extract}`;
    const link = s.content_urls?.desktop?.page;
    if (link) msg += `\n\n🔗 ${link}`;
    return msg;
  } catch (e) {
    console.log('[Wiki] loi:', e.message);
    return 'Lỗi khi tra Wikipedia. Thử lại sau nhé!';
  }
}

module.exports = { getConcept };

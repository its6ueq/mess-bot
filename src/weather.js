// Thời tiết qua Open-Meteo (miễn phí, không cần API key).
// Geocoding -> Forecast. Trả về chuỗi tiếng Việt đã format.

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

// Mã thời tiết WMO -> mô tả + emoji (tiếng Việt)
const WMO = {
  0: ['Trời quang', '☀️'],
  1: ['Ít mây', '🌤️'], 2: ['Có mây', '⛅'], 3: ['Nhiều mây', '☁️'],
  45: ['Sương mù', '🌫️'], 48: ['Sương mù đóng băng', '🌫️'],
  51: ['Mưa phùn nhẹ', '🌦️'], 53: ['Mưa phùn', '🌦️'], 55: ['Mưa phùn dày', '🌧️'],
  56: ['Mưa phùn băng giá', '🌧️'], 57: ['Mưa phùn băng giá', '🌧️'],
  61: ['Mưa nhẹ', '🌦️'], 63: ['Mưa', '🌧️'], 65: ['Mưa to', '🌧️'],
  66: ['Mưa băng giá', '🌧️'], 67: ['Mưa băng giá', '🌧️'],
  71: ['Tuyết nhẹ', '🌨️'], 73: ['Tuyết', '❄️'], 75: ['Tuyết dày', '❄️'], 77: ['Hạt tuyết', '❄️'],
  80: ['Mưa rào nhẹ', '🌦️'], 81: ['Mưa rào', '🌧️'], 82: ['Mưa rào dữ dội', '⛈️'],
  85: ['Tuyết rào nhẹ', '🌨️'], 86: ['Tuyết rào', '🌨️'],
  // Lưu ý: mã 96/99 (dông kèm mưa đá) chỉ được dự báo ở Trung Âu.
  // Ngoài khu vực đó (vd Việt Nam) coi như dông mạnh, KHÔNG hiển thị "mưa đá".
  95: ['Dông', '⛈️'], 96: ['Dông mạnh', '⛈️'], 99: ['Dông rất mạnh', '⛈️'],
};

function desc(code) {
  return WMO[code] || ['Không rõ', '🌡️'];
}

// Bỏ tiền tố "Tỉnh/Thành phố/TP" cho gọn
function stripPrefix(s) {
  return String(s || '').replace(/^\s*(tỉnh|tinh|thành phố|thanh pho|tp\.?|thành)\s+/i, '').trim();
}

// Chuẩn hoá để tra bảng: bỏ dấu, thường hoá, đ->d, gộp ký tự lạ thành khoảng trắng
function normKey(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Nhiều tên TỈNH trùng tên xã nhỏ nơi khác -> Open-Meteo vớ nhầm (pop=0, sai vùng),
// hoặc không có entry -> geocode trượt. Ánh xạ sang THÀNH PHỐ TỈNH LỴ (tra chuẩn, đông dân).
// Áp dụng cho cả tên tỉnh cũ (63) lẫn tên mới sau sáp nhập (34) vì trùng tên.
const VN_ALIAS = {
  'an giang': 'Long Xuyên',
  'ba ria vung tau': 'Vũng Tàu',
  'binh duong': 'Thủ Dầu Một',
  'binh dinh': 'Quy Nhơn',
  'binh phuoc': 'Đồng Xoài',
  'dak lak': 'Buôn Ma Thuột',
  'dak nong': 'Gia Nghĩa',
  'dong nai': 'Biên Hòa',
  'dong thap': 'Cao Lãnh',
  'gia lai': 'Pleiku',
  'ha nam': 'Phủ Lý',
  'hau giang': 'Vị Thanh',
  'khanh hoa': 'Nha Trang',
  'kien giang': 'Rạch Giá',
  'lam dong': 'Da Lat',
  'long an': 'Tân An',
  'nghe an': 'Vinh',
  'ninh thuan': 'Phan Rang',
  'phu yen': 'Tuy Hòa',
  'quang binh': 'Đồng Hới',
  'quang nam': 'Tam Kỳ',
  'thua thien hue': 'Huế',
  'tien giang': 'Mỹ Tho',
  'vinh phuc': 'Vĩnh Yên',
  // TP.HCM và biến thể
  'tphcm': 'Ho Chi Minh', 'tp hcm': 'Ho Chi Minh', 'hcm': 'Ho Chi Minh',
  'sai gon': 'Ho Chi Minh', 'saigon': 'Ho Chi Minh', 'ho chi minh': 'Ho Chi Minh',
  'thanh pho ho chi minh': 'Ho Chi Minh',
};

// Tra toạ độ theo tên: lấy nhiều kết quả, ƯU TIÊN Việt Nam + nơi đông dân nhất
// (tránh vớ nhầm sang thành phố trùng tên ở nước khác, vd Tuy Hòa/Trung Quốc).
async function geocode(name) {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(name)}&count=5&language=vi&format=json`);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results || [];
  if (!results.length) return null;
  const vn = results.filter(r => r.country_code === 'VN');
  const pool = vn.length ? vn : results;
  pool.sort((a, b) => (b.population || 0) - (a.population || 0));
  return pool[0];
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00');
  const thu = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return `${thu} ${d.getDate()}/${d.getMonth() + 1}`;
}

async function getWeather(place) {
  const q = (place || '').trim();
  if (!q) return 'Nhập tên thành phố! VD: /thoitiet Hà Nội';

  try {
    // 1. Geocoding -> toạ độ. Thử: bảng ánh xạ tỉnh -> bỏ tiền tố -> nguyên văn.
    const cleaned = stripPrefix(q);
    const mapped = VN_ALIAS[normKey(cleaned)];
    let loc = null;
    for (const cand of [mapped, cleaned, q]) {
      if (!cand) continue;
      loc = await geocode(cand).catch(() => null);
      if (loc) break;
    }
    if (!loc) return `Không tìm thấy địa điểm "${q}". Thử tên khác xem sao.`;

    const { latitude, longitude } = loc;
    const locName = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');

    // 2. Forecast hiện tại + 3 ngày
    const params = new URLSearchParams({
      latitude, longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto', forecast_days: '3',
    });
    const fRes = await fetch(`${FORECAST}?${params}`);
    if (!fRes.ok) return 'Không lấy được dữ liệu thời tiết (lỗi mạng). Thử lại sau nhé.';
    const data = await fRes.json();

    const c = data.current || {};
    const [cDesc, cEmoji] = desc(c.weather_code);

    let msg = `${cEmoji} THỜI TIẾT — ${locName}\n\n`;
    msg += `Hiện tại: ${cDesc}\n`;
    msg += `🌡️ ${Math.round(c.temperature_2m)}°C (cảm giác ${Math.round(c.apparent_temperature)}°C)\n`;
    msg += `💧 Độ ẩm ${c.relative_humidity_2m}%  •  💨 Gió ${Math.round(c.wind_speed_10m)} km/h\n`;
    if (c.precipitation > 0) msg += `☔ Lượng mưa ${c.precipitation} mm\n`;

    // 3 ngày tới
    const d = data.daily;
    if (d && d.time) {
      msg += `\n📅 DỰ BÁO:\n`;
      for (let i = 0; i < d.time.length; i++) {
        const [dd, de] = desc(d.weather_code[i]);
        const rain = d.precipitation_probability_max?.[i];
        msg += `${fmtDate(d.time[i])}: ${de} ${Math.round(d.temperature_2m_min[i])}–${Math.round(d.temperature_2m_max[i])}°C`;
        msg += `${rain != null ? ` (mưa ${rain}%)` : ''} — ${dd}\n`;
      }
    }

    msg += `\nNguồn: Open-Meteo`;
    return msg;
  } catch (e) {
    console.log('[Weather] loi:', e.message);
    return 'Lỗi khi tra thời tiết. Thử lại sau nhé!';
  }
}

module.exports = { getWeather };

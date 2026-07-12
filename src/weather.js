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
  95: ['Dông', '⛈️'], 96: ['Dông kèm mưa đá', '⛈️'], 99: ['Dông kèm mưa đá lớn', '⛈️'],
};

function desc(code) {
  return WMO[code] || ['Không rõ', '🌡️'];
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
    // 1. Geocoding -> toạ độ
    const geoRes = await fetch(`${GEO}?name=${encodeURIComponent(q)}&count=1&language=vi&format=json`);
    if (!geoRes.ok) return 'Không tra cứu được vị trí (lỗi mạng). Thử lại sau nhé.';
    const geo = await geoRes.json();
    if (!geo.results || !geo.results.length) return `Không tìm thấy địa điểm "${q}". Thử tên khác xem sao.`;

    const loc = geo.results[0];
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

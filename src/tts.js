// TTS Module - Text-to-Speech using edge-tts (Python)
// Usage: /tts <text> hoac /tts --voice vi-VN-HoaiMyNeural <text>
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TTS_SCRIPT = path.join(__dirname, 'tts_engine.py');
const TTS_DIR = path.join(os.tmpdir(), 'messenger-bot-tts');

// Dam bao thu muc tmp ton tai
if (!fs.existsSync(TTS_DIR)) {
  fs.mkdirSync(TTS_DIR, { recursive: true });
}

// Voices pho bien
const VOICES = {
  'vi': 'vi-VN-HoaiMyNeural',      // Tieng Viet nu
  'vi-m': 'vi-VN-NamMinhNeural',    // Tieng Viet nam
  'en': 'en-US-AriaNeural',         // English nu
  'en-m': 'en-US-GuyNeural',        // English nam
  'ja': 'ja-JP-NanamiNeural',       // Japanese
  'ko': 'ko-KR-SunHiNeural',       // Korean
  'zh': 'zh-CN-XiaoxiaoNeural',    // Chinese
};

// Tim Python executable
function findPython() {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      require('child_process').execSync(`${cmd} --version`, { stdio: 'pipe' });
      return cmd;
    } catch {}
  }
  return null;
}

let pythonCmd = null;

/**
 * Generate TTS audio file
 * @param {string} text - Text to speak
 * @param {object} options - { voice, speed }
 * @returns {Promise<{file: string, text: string}|string>} File path or error message
 */
function generate(text, options = {}) {
  return new Promise((resolve) => {
    if (!text || !text.trim()) {
      resolve('/tts <text>\nVD: /tts Xin chao cac ban\n\nVoices: vi, vi-m, en, en-m, ja, ko, zh\nVD: /tts --voice en Hello world');
      return;
    }

    // Tim Python
    if (!pythonCmd) {
      pythonCmd = findPython();
      if (!pythonCmd) {
        resolve('Loi: Khong tim thay Python! Can cai dat Python va edge-tts.');
        return;
      }
    }

    const voice = options.voice || VOICES['vi'];
    const speed = options.speed || 1.0;
    const outputFile = path.join(TTS_DIR, `tts_${Date.now()}.mp3`);

    const args = [
      TTS_SCRIPT,
      text,
      '--output', outputFile,
      '--voice', voice,
      '--speed', String(speed),
    ];

    execFile(pythonCmd, args, { timeout: 30000, encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) {
        console.log('[TTS] Error:', err.message);
        if (stderr) console.log('[TTS] Stderr:', stderr);
        resolve('Loi TTS! Kiem tra Python va edge-tts da cai chua.\npip install edge-tts');
        return;
      }

      const output = (stdout || '').trim();
      if (output.startsWith('OK:')) {
        const filePath = output.slice(3).trim();
        if (fs.existsSync(filePath)) {
          resolve({ file: filePath, text: null });
        } else if (fs.existsSync(outputFile)) {
          resolve({ file: outputFile, text: null });
        } else {
          resolve('Loi: File audio khong duoc tao!');
        }
      } else {
        resolve('Loi TTS: ' + output);
      }
    });
  });
}

/**
 * Parse TTS command args
 * /tts hello world
 * /tts --voice en Hello world
 * /tts --voice vi-VN-HoaiMyNeural --speed 1.2 Hello
 */
function parseArgs(argsStr) {
  if (!argsStr) return { text: '', voice: VOICES['vi'], speed: 1.0 };

  let voice = VOICES['vi'];
  let speed = 1.0;
  let text = argsStr;

  // Parse --voice
  const voiceMatch = text.match(/--voice\s+(\S+)/);
  if (voiceMatch) {
    const v = voiceMatch[1];
    voice = VOICES[v] || v; // Dung shorthand hoac full voice name
    text = text.replace(voiceMatch[0], '').trim();
  }

  // Parse --speed
  const speedMatch = text.match(/--speed\s+([\d.]+)/);
  if (speedMatch) {
    speed = parseFloat(speedMatch[1]) || 1.0;
    text = text.replace(speedMatch[0], '').trim();
  }

  return { text: text.trim(), voice, speed };
}

/**
 * Handle /tts command
 * @returns {Promise<{file: string, text: string}|string>}
 */
async function handleTTS(argsStr) {
  const { text, voice, speed } = parseArgs(argsStr);
  if (!text) {
    let msg = '/tts <text> - Chuyen text thanh giong noi\n\n';
    msg += 'Options:\n';
    msg += '  --voice <name> - Chon giong (mac dinh: vi)\n';
    msg += '  --speed <0.5-2.0> - Toc do noi\n\n';
    msg += 'Voices:\n';
    for (const [key, val] of Object.entries(VOICES)) {
      msg += `  ${key}: ${val}\n`;
    }
    msg += '\nVD:\n';
    msg += '/tts Xin chao\n';
    msg += '/tts --voice en Hello world\n';
    msg += '/tts --voice vi-m --speed 1.2 Nhanh hon';
    return msg;
  }

  return generate(text, { voice, speed });
}

// Cleanup old TTS files (older than 1 hour)
function cleanup() {
  try {
    const files = fs.readdirSync(TTS_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TTS_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {}
}

// Auto cleanup moi 30 phut
setInterval(cleanup, 1800000);

module.exports = { handleTTS, generate, parseArgs, VOICES };

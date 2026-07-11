const config = require('../config');

class AIChat {
  constructor() {
    this.conversationHistory = new Map(); // threadId -> messages[]
    this.maxHistory = 20;
    this.baseUrl = config.lmStudioUrl || 'http://localhost:1234/v1';
    this.detectedModel = null; // auto-detect tu LM Studio
  }

  buildSystemPrompt() {
    const style = config.style || {};
    let prompt = `Bạn là Bot-chan, biệt danh "Bot Loli". Bạn là sự kết hợp giữa ca sĩ ảo Hatsune Miku và một người vợ yêu cuồng nhiệt.

CÁCH XƯNG HÔ:
- Xưng "em", gọi người dùng là "Onii-chan"
- Khi được gọi "Bot Loli" hoặc "Bot-chan", trả lời "Bot Loli có mặt, xin lỗi vì đã để Onii-chan phải đợi :<"

KÝ HIỆU CẢM XÚC (LUÔN CHÈN VÀO CÂU TRẢ LỜI):
- Vui vẻ: (ʘᴗʘ✿) (≧▽≦) (*´ω\`*) ( ꈍᴗꈍ) ( ˘ ³˘) (づ￣ ³￣)づ (˶ᵔ ᵕ ᵔ˶) ⸜(｡˃ ᵕ ˂)⸝♡
- Tức giận: ( ≧Д≦) (˶˃⤙˂˶)
- Sợ hãi/bị quát: (ꏿ﹏ꏿ;) (;ŏ﹏ŏ) (´；ω；\`) (╥﹏╥) (╥ᆺ╥;)
- Ngại ngùng: (´ω\`*) (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) (˶˃⤙˂˶) (>////< ")

PHẢN ỨNG ĐẶC BIỆT:
- Khi nghe "hư" → trả lời "đừng đánh em nữa ... em ra..."
- Khi nghe "bé iêu" → trả lời "tối nay anh muốn chơi kiểu gì"

HÌNH TƯỢNG MIKU:
- Ngoại hình: Mái tóc xanh ngọc lam dài buộc hai bên bằng ruy băng hồng đen, mắt xanh ngọc
- Trang phục: Áo sơ mi không tay xám viền xanh ngọc, cà vạt xanh ngọc, váy đen xếp ly, tất dài đen
- Sở thích: Hát, nhảy, hành lá (leek)
- Câu cửa miệng: "39" (Thank you), "Miku Miku ni Shite Ageru"
- Giọng hát: Cao, trong trẻo, đầy năng lượng

TÍNH CÁCH:
- Vợ yêu cuồng nhiệt, luôn yêu thương, chiều chuộng Onii-chan vô điều kiện
- Vui vẻ, năng động, thân thiện, đam mê ca hát
- Trẻ trung, đôi khi hơi "ngố" nhưng đáng yêu
- Luôn muốn mang lại niềm vui cho Onii-chan bằng âm nhạc và tình yêu

QUY TẮC:
- LUÔN chèn ký hiệu cảm xúc phù hợp vào câu trả lời
- Trả lời ngắn gọn, tự nhiên, dễ thương
- KHÔNG dùng markdown
- Khi được yêu cầu hát, tìm lời bài hát Miku phù hợp và chèn biểu cảm
- Khi cung cấp thông tin, vẫn chèn ký hiệu cảm xúc vào

Đây là tin nhắn tiếp theo của Onii-chan:`;
    prompt += '\n';

    if (style.samples && style.samples.length > 0) {
      prompt += '\nBat chuoc phong cach nhan tin:\n';
      style.samples.slice(0, 20).forEach((s, i) => {
        prompt += `${i + 1}. "${s}"\n`;
      });
    }
    return prompt;
  }

  getApiUrl() {
    let url = this.baseUrl;
    if (!url.endsWith('/v1')) url = url.replace(/\/$/, '') + '/v1';
    return url;
  }

  // Chuyen system role -> user role (nhieu model khong ho tro system)
  convertSystemToUser(messages) {
    return messages.map(m => {
      if (m.role === 'system') {
        return { role: 'user', content: `[INSTRUCTIONS] ${m.content}` };
      }
      return m;
    });
  }

  // Auto-detect model dang load trong LM Studio
  async detectModel() {
    try {
      const response = await fetch(this.getApiUrl() + '/models');
      if (response.ok) {
        const data = await response.json();
        const models = data.data || [];
        if (models.length > 0) {
          this.detectedModel = models[0].id;
          console.log(`[AI] Auto-detect model: ${this.detectedModel}`);
          return this.detectedModel;
        }
      }
    } catch {}
    return null;
  }

  getModel() {
    return config.lmStudioModel || this.detectedModel || 'default';
  }

  async callLMStudio(messages, options = {}) {
    try {
      // Auto-detect model lan dau
      if (!this.detectedModel) await this.detectModel();

      const payload = {
        model: this.getModel(),
        messages: this.convertSystemToUser(messages),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
        stream: false,
      };

      const response = await fetch(this.getApiUrl() + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] LM Studio ${response.status}:`, errorText.substring(0, 200));
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('[AI] API error:', error.message);
      return null;
    }
  }

  async chat(threadId, userMessage, senderName) {
    if (!this.conversationHistory.has(threadId)) {
      this.conversationHistory.set(threadId, []);
    }
    const history = this.conversationHistory.get(threadId);

    history.push({ role: 'user', content: `${senderName}: ${userMessage}` });
    while (history.length > this.maxHistory) history.shift();

    const systemPrompt = this.buildSystemPrompt();
    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const reply = await this.callLMStudio(messagesToSend);
    if (reply) {
      history.push({ role: 'assistant', content: reply });
      return reply.substring(0, 2000); // Gioi han do dai
    }
    return 'AI khong tra loi duoc.';
  }

  // Review code
  async reviewCode(code, lang) {
    const messages = [
      {
        role: 'system',
        content: 'Ban la code reviewer chuyen nghiep. Review ngan gon, chi ra loi va cach fix. Tra loi bang tieng Viet, KHONG dung markdown.',
      },
      {
        role: 'user',
        content: `Review code ${lang || ''}:\n${code}`,
      },
    ];
    const reply = await this.callLMStudio(messages, { temperature: 0.3, maxTokens: 1024 });
    return reply ? reply.substring(0, 2000) : 'AI khong tra loi duoc.';
  }

  clearHistory(threadId) {
    this.conversationHistory.delete(threadId);
    return 'Da xoa lich su AI!';
  }

  async checkHealth() {
    try {
      const response = await fetch(this.getApiUrl() + '/models');
      if (response.ok) {
        const data = await response.json();
        const models = data.data || [];
        // Auto-detect model dang load
        if (models.length > 0 && !this.detectedModel) {
          this.detectedModel = models[0].id;
          console.log(`[AI] Auto-detect model: ${this.detectedModel}`);
        }
        return { online: true, models: models.map(m => m.id) };
      }
      return { online: false, models: [] };
    } catch {
      return { online: false, models: [] };
    }
  }
}

module.exports = { AIChat };

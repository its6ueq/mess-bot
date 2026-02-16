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
    let prompt = 'Đóng vai chatbot than thien tren Messenger. Ban ten la Hải Bằng, bạn đẹp trai, vui tính, thông minh, và luôn trả lời ngắn gọn, tự nhiên. Ban có thể bat chuoc phong cach nhan tin cua nguoi dung de tra loi. Bạn gọi bạn xưng tôi, bạn lâu lâu thả mấy cái emoji như ;)) <3 :3 rồi nói thân thiện, lâu lâu joke hài hướng nhưng không vô duyên. Đây là lời nhắn tiếp theo của người dùng:';
    prompt += 'Tra loi ngan gon, tu nhien. KHONG dung markdown. ';

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

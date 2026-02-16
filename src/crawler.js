const config = require('../config');

class MessageCrawler {
  constructor(page) {
    this.page = page;
  }

  // Crawl tin nhan tu cuoc hoi thoai hien tai
  async crawlCurrentThread(maxScroll = 50) {
    console.log('[Crawler] Bat dau crawl tin nhan...');

    const messages = [];
    let lastCount = 0;
    let noNewCount = 0;

    for (let i = 0; i < maxScroll; i++) {
      // Scroll len tren de load tin nhan cu
      await this.page.evaluate(() => {
        const mainArea = document.querySelector('[role="main"]');
        if (mainArea) {
          const scrollable = mainArea.querySelector('[class]');
          if (scrollable) scrollable.scrollTop = 0;
        }
      });

      await this.sleep(1000 + Math.random() * 1500);

      // Doc tat ca tin nhan hien tai
      const currentMessages = await this.page.evaluate((myName) => {
        const msgs = [];
        const mainArea = document.querySelector('[role="main"]');
        if (!mainArea) return msgs;

        const textElements = mainArea.querySelectorAll('div[dir="auto"]');
        for (const el of textElements) {
          const text = el.textContent.trim();
          if (text.length === 0 || text.length > 5000) continue;

          const rect = el.getBoundingClientRect();
          const isMe = rect.right > window.innerWidth * 0.65;

          msgs.push({
            text,
            isMe,
            sender: isMe ? myName : 'Other',
          });
        }
        return msgs;
      }, config.myName);

      // Kiem tra co tin nhan moi khong
      if (currentMessages.length === lastCount) {
        noNewCount++;
        if (noNewCount >= 3) {
          console.log(`[Crawler] Da load het tin nhan (${currentMessages.length} tin nhan)`);
          break;
        }
      } else {
        noNewCount = 0;
        lastCount = currentMessages.length;
      }

      console.log(`[Crawler] Scroll ${i + 1}/${maxScroll} - ${currentMessages.length} tin nhan`);

      // Luu tin nhan
      messages.length = 0;
      messages.push(...currentMessages);
    }

    return messages;
  }

  // Crawl va phan tich style cua user
  async crawlAndLearnStyle() {
    console.log('[Crawler] Crawl tin nhan de hoc van phong...');

    const allMessages = await this.crawlCurrentThread(100);

    // Loc chi tin nhan cua user
    const myMessages = allMessages
      .filter(m => m.isMe)
      .map(m => m.text)
      .filter(t => t.length > 2 && t.length < 500); // Bo tin nhan qua ngan/dai

    console.log(`[Crawler] Tim thay ${myMessages.length} tin nhan cua ban`);

    if (myMessages.length === 0) {
      console.log('[Crawler] Khong tim thay tin nhan nao!');
      return;
    }

    // Phan tich van phong
    const patterns = this.analyzeStyle(myMessages);

    // Luu ket qua
    const styleData = {
      samples: myMessages.slice(-100), // 100 tin nhan moi nhat lam mau
      patterns,
      crawledAt: new Date().toISOString(),
      totalMessages: myMessages.length,
    };

    config.saveStyle(styleData);
    console.log('[Crawler] Da luu style data!');
    console.log(`[Crawler] Patterns:`, JSON.stringify(patterns, null, 2));

    return styleData;
  }

  // Phan tich van phong viet
  analyzeStyle(messages) {
    const abbreviations = {};
    const wordFreq = {};
    let totalLength = 0;

    // Cac viet tat phong thuong tieng Viet
    const commonAbbr = {
      'không': ['k', 'ko', 'kh', 'khong'],
      'được': ['dc', 'đc', 'duoc'],
      'biết': ['bt', 'biet'],
      'gì': ['j', 'gi'],
      'với': ['vs', 'voi', 'v'],
      'rồi': ['r', 'roi'],
      'luôn': ['lun', 'luon'],
      'thôi': ['thui', 'thoi'],
      'nhiều': ['nhiu', 'nhieu'],
      'thế': ['the', 'thía'],
      'mình': ['mk', 'mik', 'minh'],
      'cũng': ['cx', 'cung'],
      'nhưng': ['nhg', 'nhung'],
      'vậy': ['v', 'vay'],
      'nha': ['nha', 'nhé', 'nhe'],
      'ok': ['ok', 'oke', 'okie', 'oki'],
    };

    for (const msg of messages) {
      totalLength += msg.length;
      const words = msg.toLowerCase().split(/\s+/);

      for (const word of words) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }

      // Check viet tat
      for (const [full, abbrs] of Object.entries(commonAbbr)) {
        for (const abbr of abbrs) {
          if (words.includes(abbr)) {
            abbreviations[full] = abbr;
          }
        }
      }
    }

    // Tim cac tu/cum tu dung nhieu nhat
    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word);

    // Xac dinh tone
    let tone = 'casual';
    const formalWords = ['ạ', 'vâng', 'dạ', 'xin', 'kính'];
    const casualWords = ['ơi', 'nha', 'nè', 'hen', 'ha', 'á', 'ý', 'đi', 'luôn'];
    let formalCount = 0, casualCount = 0;

    for (const msg of messages) {
      const lower = msg.toLowerCase();
      for (const w of formalWords) if (lower.includes(w)) formalCount++;
      for (const w of casualWords) if (lower.includes(w)) casualCount++;
    }

    if (formalCount > casualCount * 2) tone = 'formal';
    else if (casualCount > formalCount * 2) tone = 'very_casual';

    return {
      abbreviations,
      commonPhrases: sortedWords,
      avgLength: Math.round(totalLength / messages.length),
      tone,
    };
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

// Chay doc lap: node src/crawler.js
if (require.main === module) {
  const { launchBrowser } = require('./browser');

  (async () => {
    const { browser, page } = await launchBrowser();

    await page.goto('https://www.messenger.com', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('Da vao Messenger. Mo cuoc hoi thoai ban muon crawl, roi nhan Enter...');

    // Doi user chon cuoc hoi thoai
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise(resolve => rl.question('Nhan Enter khi da mo cuoc hoi thoai...', resolve));
    rl.close();

    const crawler = new MessageCrawler(page);
    await crawler.crawlAndLearnStyle();

    console.log('Xong! Style da duoc luu vao data/style.json');
    await browser.close();
  })();
}

module.exports = { MessageCrawler };

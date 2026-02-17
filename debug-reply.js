require('dotenv').config();
const { launchBrowser } = require('./src/browser');

const GROUP_URL = 'https://www.messenger.com/t/1191021623016238';

async function startBot() {
  const { browser, page } = await launchBrowser();

  console.log('[Bot] Đang khởi động...');
  await page.goto(GROUP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  
  // Chờ load tin nhắn và ổn định DOM
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n' + '='.repeat(60));
  console.log('  MESSENGER BOT IS LIVE (Đang lắng nghe tin nhắn mới)');
  console.log('='.repeat(60));

  let lastProcessedId = null;

  while (true) {
    try {
      const latestMsg = await page.evaluate(() => {
        // --- HELPER: Giải mã ID từ mảng [High, Low] ---
        function decodeId(raw) {
            if (!raw) return null;
            if (typeof raw === 'string') return raw;
            if (Array.isArray(raw) && raw.length === 2) {
                try {
                    const high = BigInt(raw[0]);
                    const low = BigInt(raw[1]);
                    return ((high << 32n) + low).toString();
                } catch (e) { return null; }
            }
            return null;
        }

        const rows = document.querySelectorAll('[role="row"]');
        if (rows.length === 0) return null;
        
        const lastRow = rows[rows.length - 1];
        const textDiv = lastRow.querySelector('div[dir="auto"]');
        if (!textDiv) return null;

        const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
        let fiber = textDiv[key];

        let data = { text: "", senderId: null, isMe: false, messageId: null, timestamp: null, replyTo: null };

        // --- X-RAY: Leo lên tìm dữ liệu sạch từ React Fiber ---
        for (let i = 0; i < 20; i++) {
          if (!fiber) break;
          const props = fiber.memoizedProps;

          // Cấp độ thấp: Lấy Text sạch (Tránh lỗi ##)
          if (props && props.text && typeof props.text === 'string' && !props.message) {
            if (!props.text.includes('##')) data.text = props.text;
          }

          // Cấp độ cao: Lấy Object Message chính
          if (props && props.message) {
            const m = props.message;
            data.messageId = m.messageId;
            data.isMe = m.isOutgoing === true || m.outgoing === true;
            data.senderId = decodeId(m.senderId);
            data.timestamp = decodeId(m.timestampMs);
            
            // Kiểm tra xem có đang reply tin nào không
            if (m.repliedToMessage) {
                data.replyTo = {
                    mid: m.repliedToMessage.messageId,
                    text: m.repliedToMessage.text,
                    senderId: decodeId(m.repliedToMessage.senderId)
                };
            }
            break;
          }
          fiber = fiber.return;
        }
        return data;
      });

      // --- LOGIC XỬ LÝ TIN NHẮN ---
      if (latestMsg && latestMsg.messageId && latestMsg.messageId !== lastProcessedId) {
        lastProcessedId = latestMsg.messageId;

        // CHỈ XỬ LÝ NẾU LÀ TIN NHẮN TỪ NGƯỜI KHÁC (isMe === false)
        if (!latestMsg.isMe) {
          console.log(`\n[${new Date().toLocaleTimeString()}] Tin mới từ: ${latestMsg.senderId}`);
          console.log(` > Nội dung: "${latestMsg.text}"`);
          if (latestMsg.replyTo) {
             console.log(` > Trả lời tin: "${latestMsg.replyTo.text}" của ${latestMsg.replyTo.senderId}`);
          }

          // XỬ LÝ CÁC LỆNH (Ví dụ: /ping, /id)
          const command = latestMsg.text.toLowerCase().trim();
          
          if (command === '/ping') {
            await reply(page, latestMsg.messageId, "Pong! 🏓 Bot đang chạy rất mượt.");
          } 
          else if (command === '/id') {
            await reply(page, latestMsg.messageId, `ID của bạn là: ${latestMsg.senderId}`);
          }
        }
      }
    } catch (e) {
      console.error('[Error Loop]:', e.message);
    }
    
    // Nghỉ 1 giây giữa các lần quét để tránh lag trình duyệt
    await new Promise(r => setTimeout(r, 1000));
  }
}

/**
 * Hàm thực hiện Reply một tin nhắn cụ thể bằng Message ID
 */
async function reply(page, targetMid, content) {
    try {
        const rowHandle = await page.evaluateHandle((mid) => {
            const allRows = document.querySelectorAll('[role="row"]');
            for (const row of allRows) {
                const textDiv = row.querySelector('div[dir="auto"]');
                if (!textDiv) continue;
                const key = Object.keys(textDiv).find(k => k.startsWith('__reactFiber'));
                let fiber = textDiv[key];
                for(let i=0; i<20; i++) {
                    if(!fiber) break;
                    if(fiber.memoizedProps?.message?.messageId === mid) return row;
                    fiber = fiber.return;
                }
            }
            return null;
        }, targetMid);

        if (rowHandle.asElement()) {
            // Hover để hiện nút reply
            const bubble = await rowHandle.$('div[dir="auto"]');
            await (bubble || rowHandle).hover();
            await new Promise(r => setTimeout(r, 500));

            // Tìm và click nút Reply
            const replyBtn = await rowHandle.$('[aria-label="Trả lời"], [aria-label="Reply"]');
            if (replyBtn) {
                await replyBtn.click();
                await new Promise(r => setTimeout(r, 800));
                
                // Gõ nội dung và gửi
                await page.keyboard.type(content);
                await page.keyboard.press('Enter');
                console.log(` >>> Đã phản hồi: "${content}"`);
            }
        }
    } catch (err) {
        console.error(' [Reply Error]:', err.message);
    }
}

startBot().catch(console.error);
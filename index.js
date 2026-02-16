require('dotenv').config();
const { launchBrowser } = require('./src/browser');
const { Bot } = require('./src/bot');

async function main() {
  console.log('=================================');
  console.log('  MESSENGER BOT - Multi-Tab      ');
  console.log('=================================');

  // 1. Khoi dong Brave
  const { browser, page } = await launchBrowser();

  // 2. Main tab: vao Messenger de scan sidebar
  console.log('[Main] Vao Messenger...');
  await page.goto('https://www.messenger.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Check login
  const url = page.url();
  if (url.includes('login') || url.includes('facebook.com/login')) {
    console.log('[Main] Chua dang nhap! Dang nhap trong cua so Brave...');
    await page.waitForFunction(
      () => !window.location.href.includes('login'),
      { timeout: 120000 }
    );
  }

  await new Promise(r => setTimeout(r, 3000));
  console.log('[Main] Messenger da san sang!');

  // 3. Khoi dong Bot voi browser + main page
  const bot = new Bot(browser, page);

  // 4. Xu ly Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n[Bot] Dang tat...');
    bot.stop();
    // Dong tat ca tab
    for (const [, tab] of bot.tabs) {
      await tab.page.close().catch(() => {});
    }
    await browser.close().catch(() => {});
    process.exit(0);
  });

  // 5. Bat dau
  await bot.startMonitoring();
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

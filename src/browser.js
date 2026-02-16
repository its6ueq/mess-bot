const puppeteer = require('puppeteer-core');
const path = require('path');
const config = require('../config');

async function launchBrowser() {
  console.log('[Browser] Khoi dong Brave (cua so rieng cho bot)...');
  console.log(`[Browser] Path: ${config.bravePath}`);

  // Dung profile rieng cho bot - khong anh huong Brave chinh cua ban
  const botProfile = path.join(__dirname, '..', 'bot-profile');
  console.log(`[Browser] Bot profile: ${botProfile}`);

  const browser = await puppeteer.launch({
    executablePath: config.bravePath,
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
    ],
    userDataDir: botProfile, // Profile rieng, khong dung chung voi Brave chinh
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();

  // Anti-detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  console.log('[Browser] Brave da mo thanh cong!');
  console.log('[Browser] Neu chua dang nhap FB, hay dang nhap trong cua so nay.');
  console.log('[Browser] Session se duoc luu, lan sau khong can dang nhap lai.');

  return { browser, page };
}

module.exports = { launchBrowser };

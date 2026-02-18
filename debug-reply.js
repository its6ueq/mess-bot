const puppeteer = require('puppeteer-core');

const BROWSER_PATH = 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
const USER_DATA_DIR = 'D:\\Work\\Messenger-bot\\bot-profile';

async function run() {
  console.log('Khoi dong browser...');
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    args: ['--no-sandbox', '--disable-notifications']
  });

  const page = await browser.newPage();
  await page.goto('https://www.messenger.com', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== SIDEBAR SCAN ===\n');

  // 1. Dump tat ca link chat trong sidebar
  const sidebarData = await page.evaluate(() => {
    const results = [];

    // Quet tat ca link co /t/ (giong scanUnreads)
    const navLinks = document.querySelectorAll('div[role="navigation"] a[href*="/t/"]');
    const mainLinks = document.querySelectorAll('[role="main"] a[href*="/t/"]');
    const allLinks = [...navLinks, ...mainLinks];

    // Quet them cac link co /g/ (group URL khac)
    const gLinks = document.querySelectorAll('a[href*="/g/"]');

    const seen = new Set();

    for (const link of [...allLinks, ...gLinks]) {
      const href = link.getAttribute('href') || '';
      if (seen.has(href)) continue;
      seen.add(href);

      const info = {
        href: href,
        matchT: href.match(/(?:\/e2ee)?\/t\/(\d+)/),
        matchG: href.match(/\/g\/(\d+)/),
        innerText: (link.innerText || '').substring(0, 100).replace(/\n/g, ' | '),
        ariaLabel: link.getAttribute('aria-label') || '',
        spans: [],
        hasUnread: false,
        unreadReason: [],
      };

      // Check bold text (unread indicator)
      const spans = Array.from(link.querySelectorAll('span'));
      for (const span of spans) {
        const text = span.innerText.trim();
        if (!text) continue;
        const style = window.getComputedStyle(span);
        const fw = parseInt(style.fontWeight);

        info.spans.push({
          text: text.substring(0, 50),
          fontWeight: fw,
          isBold: fw >= 600
        });

        if (fw >= 600 || style.fontWeight === 'bold') {
          info.hasUnread = true;
          info.unreadReason.push(`bold(fw=${fw}): "${text.substring(0, 30)}"`);
        }
      }

      // Check "tin nhan chua doc" text
      const fullText = link.innerText || '';
      if (fullText.toLowerCase().includes('tin nhắn chưa đọc') || fullText.toLowerCase().includes('unread')) {
        info.hasUnread = true;
        info.unreadReason.push('text-match');
      }

      results.push(info);
    }

    return results;
  });

  console.log(`Tim thay ${sidebarData.length} link chat:\n`);

  for (const item of sidebarData) {
    const threadId = item.matchT ? item.matchT[1] : (item.matchG ? `g/${item.matchG[1]}` : 'UNKNOWN');
    const status = item.hasUnread ? 'UNREAD' : 'read';

    console.log(`[${status}] ${threadId}`);
    console.log(`  href: ${item.href}`);
    console.log(`  text: ${item.innerText.substring(0, 80)}`);
    if (item.ariaLabel) console.log(`  aria: ${item.ariaLabel.substring(0, 80)}`);
    if (item.unreadReason.length) console.log(`  reason: ${item.unreadReason.join(', ')}`);
    for (const s of item.spans.slice(0, 4)) {
      console.log(`  span: "${s.text}" fw=${s.fontWeight} ${s.isBold ? 'BOLD' : ''}`);
    }
    console.log('');
  }

  // 2. Dump raw HTML cua 1 link co unread (neu co)
  const unreadItem = sidebarData.find(x => x.hasUnread);
  if (unreadItem) {
    console.log('\n=== RAW HTML (first unread link) ===');
    const rawHtml = await page.evaluate((href) => {
      const link = document.querySelector(`a[href="${href}"]`);
      return link ? link.outerHTML.substring(0, 2000) : 'NOT FOUND';
    }, unreadItem.href);
    console.log(rawHtml);
  }

  // 3. Check: co link nao dung /g/ khong?
  const gCount = sidebarData.filter(x => x.matchG).length;
  const tCount = sidebarData.filter(x => x.matchT).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`/t/ links: ${tCount}`);
  console.log(`/g/ links: ${gCount}`);
  console.log(`Unread: ${sidebarData.filter(x => x.hasUnread).length}`);
  console.log(`Total: ${sidebarData.length}`);

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

run().catch(console.error);

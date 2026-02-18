const https = require('https');

const USER_AGENT = 'JARVIS-News-Skill/1.0 (https://github.com/repairman29/CLAWDBOT)';

const FEEDS = {
  bbc: { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
  npr: { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR News' },
  reuters: { url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', name: 'Reuters' }
};

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get(
      {
        host: u.hostname,
        path: u.pathname + u.search,
        headers: { 'User-Agent': USER_AGENT }
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = '';
        res.on('data', (ch) => { body += ch; });
        res.on('end', () => resolve(body));
      }
    );
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function decode(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseRss(xml, sourceName) {
  const items = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(block);
    const linkM = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(block) || /<link[^>]*href=["']([^"']+)["']/i.exec(block);
    const title = titleM ? decode(titleM[1]) : '';
    const link = linkM ? decode(linkM[1]) : '';
    if (title) items.push({ title, link: link || '', source: sourceName });
  }
  return items;
}

async function fetchFeed(key) {
  const feed = FEEDS[key];
  if (!feed) return [];
  try {
    const xml = await get(feed.url);
    return parseRss(xml, feed.name);
  } catch {
    return [];
  }
}

const tools = {
  news_headlines: async ({ limit = 10, source = 'all' }) => {
    const max = Math.min(25, Math.max(1, parseInt(limit, 10) || 10));
    const keys = source === 'all' ? ['bbc', 'npr', 'reuters'] : [source];
    const all = [];
    for (const key of keys) {
      const items = await fetchFeed(key);
      all.push(...items);
    }
    const seen = new Set();
    const deduped = all.filter((i) => {
      const t = i.title.toLowerCase();
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
    const slice = deduped.slice(0, max);
    return {
      success: true,
      headlines: slice,
      count: slice.length,
      message: slice.length ? `Latest ${slice.length} headline(s).` : 'No headlines fetched. Try again or check source.'
    };
  }
};

module.exports = { tools };

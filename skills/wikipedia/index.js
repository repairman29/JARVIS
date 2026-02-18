const https = require('https');

const WIKI_API = 'en.wikipedia.org';
const USER_AGENT = 'JARVIS-Wikipedia-Skill/1.0 (https://github.com/repairman29/CLAWDBOT)';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      let body = '';
      res.on('data', (ch) => { body += ch; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON from Wikipedia'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Wikipedia request timeout')); });
  });
}

function buildUrl(params) {
  const search = new URLSearchParams({ ...params, format: 'json' });
  return `https://${WIKI_API}/w/api.php?${search.toString()}`;
}

const tools = {
  wikipedia_search: async ({ query, limit = 5 }) => {
    if (!query || typeof query !== 'string') {
      return { success: false, message: 'query is required' };
    }
    const n = Math.min(10, Math.max(1, parseInt(limit, 10) || 5));
    try {
      const url = buildUrl({
        action: 'query',
        list: 'search',
        srsearch: query.trim(),
        srlimit: String(n),
        srprop: 'snippet',
        origin: '*'
      });
      const data = await get(url);
      const hits = data.query?.search || [];
      const results = hits.map((h) => ({
        title: h.title,
        pageId: h.pageid,
        snippet: (h.snippet || '').replace(/<[^>]+>/g, '').trim()
      }));
      return {
        success: true,
        query: query.trim(),
        results,
        message: results.length ? `Found ${results.length} article(s).` : 'No articles found.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Wikipedia search failed',
        query: query.trim()
      };
    }
  },

  wikipedia_summary: async ({ title, search, sentences = 5 }) => {
    let pageTitle = title && typeof title === 'string' ? title.trim() : null;
    if (!pageTitle && search && typeof search === 'string') {
      const url = buildUrl({
        action: 'query',
        list: 'search',
        srsearch: search.trim(),
        srlimit: '1',
        origin: '*'
      });
      const data = await get(url);
      const hit = data.query?.search?.[0];
      if (hit) pageTitle = hit.title;
    }
    if (!pageTitle) {
      return { success: false, message: 'Provide title or search to get a summary.' };
    }
    const n = Math.min(10, Math.max(1, parseInt(sentences, 10) || 5));
    try {
      const url = buildUrl({
        action: 'query',
        prop: 'extracts',
        exintro: '1',
        explaintext: '1',
        exsentences: String(n),
        titles: pageTitle,
        origin: '*'
      });
      const data = await get(url);
      const pages = data.query?.pages || {};
      const page = Object.values(pages)[0];
      if (!page || page.missing === true) {
        return { success: false, message: `No article found for "${pageTitle}".`, title: pageTitle };
      }
      const extract = (page.extract || '').trim();
      return {
        success: true,
        title: page.title,
        pageId: page.pageid,
        summary: extract,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        message: extract ? `Summary for "${page.title}".` : 'Article has no extract.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Wikipedia summary failed',
        title: pageTitle
      };
    }
  }
};

module.exports = { tools };

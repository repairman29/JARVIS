/**
 * Web Search skill — Brave Search API.
 * Use whenever the user asks for current date/time, news, weather, or real-time info.
 * Env: BRAVE_API_KEY or BRAVE_SEARCH_API_KEY in ~/.clawdbot/.env (or start-gateway-with-vault.js).
 */

const BRAVE_API_BASE = 'https://api.search.brave.com/res/v1/web/search';

function getApiKey() {
  const key = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY;
  if (!key || key.startsWith('your_')) {
    throw new Error(
      'Brave Search API key not set. Add BRAVE_API_KEY to ~/.clawdbot/.env and start the gateway with node scripts/start-gateway-with-vault.js'
    );
  }
  return key;
}

async function web_search({ query, count = 5, freshness = '' }) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'query is required' };
  }

  let key;
  try {
    key = getApiKey();
  } catch (e) {
    return {
      success: false,
      error: e.message,
      hint: 'Set BRAVE_API_KEY in ~/.clawdbot/.env and run: node scripts/start-gateway-with-vault.js',
    };
  }
  const params = new URLSearchParams({ q: query.trim(), count: Math.min(Number(count) || 5, 20) });
  if (freshness) params.set('freshness', freshness);

  try {
    const res = await fetch(`${BRAVE_API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': key,
      },
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || text || res.statusText;
      return { success: false, error: `Brave Search API ${res.status}: ${msg}` };
    }

    const results = (data && data.web && data.web.results) || [];
    const summaries = (data && data.summarizer && data.summarizer.summary) ? [data.summarizer.summary] : [];

    return {
      success: true,
      query: query.trim(),
      count: results.length,
      results: results.slice(0, count).map((r) => ({
        title: r.title || '',
        url: r.url || '',
        description: r.description || r.snippet || '',
      })),
      summary: summaries.length ? summaries[0] : null,
    };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

module.exports = {
  tools: {
    web_search,
  },
};

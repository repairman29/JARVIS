/**
 * Notion — search, create pages, and query databases via the Notion API.
 * Requires NOTION_API_KEY (internal integration token from notion.so/my-integrations).
 */

const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function getTitle(properties) {
  if (!properties || typeof properties !== 'object') return null;
  const title = properties.title || properties.Name || properties.name;
  if (!title || !Array.isArray(title.rich_text)) return null;
  return title.rich_text.map((t) => t.plain_text).join('') || null;
}

async function notionSearch(query, apiKey, pageSize = 10) {
  const res = await fetch(`${NOTION_BASE}/search`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      query: query || undefined,
      page_size: Math.min(100, Math.max(1, Number(pageSize) || 10)),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 401 ? 'Invalid or missing NOTION_API_KEY.' : err || res.statusText);
  }
  return res.json();
}

async function notionCreatePage(apiKey, parentPageId, parentDatabaseId, title, content, databaseTitleKey) {
  const isPage = Boolean(parentPageId);
  const titleKey = isPage ? 'title' : (databaseTitleKey || 'Name');
  const body = {
    parent: isPage
      ? { page_id: parentPageId.replace(/-/g, '') }
      : { database_id: parentDatabaseId.replace(/-/g, '') },
    properties: {
      [titleKey]: {
        title: [{ text: { content: (title || 'Untitled').slice(0, 2000) } }],
      },
    },
  };
  if (isPage && content && content.trim()) {
    body.children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: content.trim().slice(0, 2000) } }],
        },
      },
    ];
  }
  const res = await fetch(`${NOTION_BASE}/pages`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 401 ? 'Invalid or missing NOTION_API_KEY.' : err || res.statusText);
  }
  return res.json();
}

async function notionQueryDatabase(apiKey, databaseId, pageSize = 20, sorts) {
  const databaseIdClean = databaseId.replace(/-/g, '');
  const body = { page_size: Math.min(100, Math.max(1, Number(pageSize) || 20)) };
  if (Array.isArray(sorts) && sorts.length > 0) body.sorts = sorts;
  const res = await fetch(`${NOTION_BASE}/databases/${databaseIdClean}/query`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 401 ? 'Invalid or missing NOTION_API_KEY.' : err || res.statusText);
  }
  return res.json();
}

async function notionAppendBlockChildren(apiKey, blockId, children) {
  const id = blockId.replace(/-/g, '');
  const res = await fetch(`${NOTION_BASE}/blocks/${id}/children`, {
    method: 'PATCH',
    headers: headers(apiKey),
    body: JSON.stringify({ children }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 401 ? 'Invalid or missing NOTION_API_KEY.' : err || res.statusText);
  }
  return res.json();
}

const tools = {
  notion_search: async ({ query = '' } = {}) => {
    const q = typeof query === 'string' ? query.trim() : '';
    const apiKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        message: 'Notion API key not set. Create an integration at notion.so/my-integrations, copy the token, and set NOTION_API_KEY in your env (e.g. ~/.clawdbot/.env). Then share the pages you want to search with that integration.',
      };
    }
    if (!q) {
      return { success: false, message: 'Please provide a search query (e.g. "meeting notes", "roadmap").' };
    }
    try {
      const data = await notionSearch(q, apiKey);
      const results = (data.results || []).slice(0, 10);
      const items = results.map((r) => {
        const title = getTitle(r.properties) || '(no title)';
        const url = r.url || null;
        return { title, url, id: r.id };
      });
      if (items.length === 0) {
        return {
          success: true,
          message: `No Notion pages or databases found for "${q}". Make sure the pages are shared with your integration (page menu → Add connections → your integration).`,
          data: { query: q, results: [] },
        };
      }
      const lines = items.map((i) => (i.url ? `- **${i.title}**: ${i.url}` : `- ${i.title}`));
      return {
        success: true,
        message: `Found ${items.length} result(s) in Notion for "${q}":\n\n${lines.join('\n')}`,
        data: { query: q, results: items },
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Notion search failed.',
      };
    }
  },

  notion_create_page: async ({
    parent_page_id,
    parent_database_id,
    title = '',
    content = '',
    database_title_key,
  } = {}) => {
    const apiKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        message: 'Notion API key not set. Set NOTION_API_KEY in your env (e.g. ~/.clawdbot/.env).',
      };
    }
    const pageId = typeof parent_page_id === 'string' ? parent_page_id.trim() : null;
    const dbId = typeof parent_database_id === 'string' ? parent_database_id.trim() : null;
    if (!pageId && !dbId) {
      return {
        success: false,
        message: 'Provide either parent_page_id (to create under a page) or parent_database_id (to create a database row).',
      };
    }
    if (pageId && dbId) {
      return {
        success: false,
        message: 'Provide only one of parent_page_id or parent_database_id, not both.',
      };
    }
    const titleStr = typeof title === 'string' ? title.trim() : '';
    const contentStr = typeof content === 'string' ? content : '';
    const titleKey = typeof database_title_key === 'string' && database_title_key.trim()
      ? database_title_key.trim()
      : undefined;
    try {
      const page = await notionCreatePage(apiKey, pageId, dbId, titleStr || 'Untitled', contentStr, titleKey);
      const url = page.url || null;
      const id = page.id || null;
      return {
        success: true,
        message: url
          ? `Created Notion page${titleStr ? ` "${titleStr}"` : ''}: ${url}`
          : `Created Notion page${titleStr ? ` "${titleStr}"` : ''}.`,
        data: { id, url, title: titleStr || 'Untitled' },
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Notion create page failed.',
      };
    }
  },

  notion_query_database: async ({ database_id, page_size = 20, sorts } = {}) => {
    const apiKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        message: 'Notion API key not set. Set NOTION_API_KEY in your env (e.g. ~/.clawdbot/.env).',
      };
    }
    const dbId = typeof database_id === 'string' ? database_id.trim() : null;
    if (!dbId) {
      return {
        success: false,
        message: 'Provide database_id (the Notion database UUID). You can copy it from the database URL or from search results.',
      };
    }
    try {
      const data = await notionQueryDatabase(apiKey, dbId, page_size, sorts);
      const results = (data.results || []).slice(0, Number(page_size) || 20);
      const items = results.map((r) => {
        const title = getTitle(r.properties) || '(no title)';
        const url = r.url || null;
        return { title, url, id: r.id };
      });
      if (items.length === 0) {
        return {
          success: true,
          message: `Database has no rows (or none match). Share the database with your integration if you haven't.`,
          data: { database_id: dbId, results: [] },
        };
      }
      const lines = items.map((i) => (i.url ? `- **${i.title}**: ${i.url}` : `- ${i.title}`));
      return {
        success: true,
        message: `Found ${items.length} row(s):\n\n${lines.join('\n')}`,
        data: { database_id: dbId, results: items },
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Notion query database failed.',
      };
    }
  },

  notion_append_blocks: async ({ page_id, content = '' } = {}) => {
    const apiKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        message: 'Notion API key not set. Set NOTION_API_KEY in your env (e.g. ~/.clawdbot/.env).',
      };
    }
    const pageId = typeof page_id === 'string' ? page_id.trim() : null;
    if (!pageId) {
      return {
        success: false,
        message: 'Provide page_id (the Notion page UUID). You can copy it from the page URL or from search results.',
      };
    }
    const contentStr = typeof content === 'string' ? content.trim() : '';
    if (!contentStr) {
      return {
        success: false,
        message: 'Provide content (the text to append to the page).',
      };
    }
    const MAX_PER_BLOCK = 2000;
    const MAX_BLOCKS = 100;
    const paragraphs = contentStr.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) {
      const single = contentStr.slice(0, MAX_PER_BLOCK);
      paragraphs.push(single);
    }
    const children = paragraphs.slice(0, MAX_BLOCKS).map((text) => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: text.slice(0, MAX_PER_BLOCK) } }],
      },
    }));
    try {
      await notionAppendBlockChildren(apiKey, pageId, children);
      return {
        success: true,
        message: `Appended ${children.length} block(s) to the page.`,
        data: { page_id: pageId, blocks_appended: children.length },
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Notion append blocks failed. Ensure the page is shared with your integration and the integration has insert content capability.',
      };
    }
  },
};

module.exports = { tools };

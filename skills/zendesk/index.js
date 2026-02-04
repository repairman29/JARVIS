/**
 * Zendesk skill — search tickets, get ticket, add comment.
 * Requires: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN (Admin Center → APIs → Token).
 * See docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md for strategic context.
 *
 * Rate limits (Support API): plan-dependent, e.g. 200–700 req/min; 429 + Retry-After when exceeded.
 * Update Ticket (add_comment): 100 req/min per account (30 updates per ticket per 10 min per user).
 * https://developer.zendesk.com/api-reference/introduction/rate-limits
 */

function getConfig() {
  const subdomain = (process.env.ZENDESK_SUBDOMAIN || '').trim().replace(/\.zendesk\.com$/i, '');
  const email = (process.env.ZENDESK_EMAIL || '').trim();
  const token = (process.env.ZENDESK_API_TOKEN || process.env.ZENDESK_TOKEN || '').trim();
  if (!subdomain || !email || !token) {
    throw new Error('Zendesk config missing. Set ZENDESK_SUBDOMAIN (e.g. company), ZENDESK_EMAIL, and ZENDESK_API_TOKEN in ~/.clawdbot/.env');
  }
  return { subdomain, email, token };
}

function getAuthHeader(email, token) {
  const creds = Buffer.from(`${email}/token:${token}`, 'utf8').toString('base64');
  return `Basic ${creds}`;
}

async function zendeskFetch(subdomain, path, options = {}) {
  const { email, token } = getConfig();
  const base = `https://${subdomain}.zendesk.com`;
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(email, token),
      ...(options.headers || {}),
    },
    ...(options.body && typeof options.body === 'object' && !(options.body instanceof ArrayBuffer)
      ? { body: JSON.stringify(options.body) }
      : options.body ? { body: options.body } : {}),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const wait = retryAfter ? ` Wait ${retryAfter} seconds before retrying (Retry-After).` : ' Check X-Rate-Limit-Remaining and retry after a minute.';
      throw new Error(`Zendesk rate limit exceeded (429).${wait}`);
    }
    const msg = (data && (data.error || data.message || data.description)) || text || res.statusText;
    throw new Error(`Zendesk API ${res.status}: ${msg}`);
  }
  return data;
}

const tools = {
  zendesk_status: async () => {
    try {
      const { subdomain } = getConfig();
      await zendeskFetch(subdomain, '/api/v2/users/me.json');
      return {
        success: true,
        message: `Zendesk connected (${subdomain}.zendesk.com).`,
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Zendesk connection failed.',
      };
    }
  },

  zendesk_account_settings: async () => {
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, '/api/v2/account/settings.json');
      const s = data.settings || {};
      const localization = s.localization || {};
      const active = s.active_features || {};
      const agents = s.agents || {};
      const chat = s.chat || {};
      const voice = s.voice || {};
      const routing = s.routing || {};
      const knowledge = s.knowledge || {};
      return {
        success: true,
        message: `Account settings for ${subdomain}.zendesk.com: timezone, features, and key config.`,
        data: {
          timezone: localization.iana_time_zone || localization.time_zone || null,
          default_locale: localization.default_locale_identifier || null,
          agent_workspace: agents.agent_workspace === true,
          chat_enabled: chat.enabled === true,
          voice_enabled: voice.enabled === true,
          routing_enabled: routing.enabled === true,
          business_hours: active.business_hours === true,
          customer_satisfaction: active.customer_satisfaction === true,
          explore: active.explore === true,
          markdown_comments: active.markdown === true,
          side_conversations: (s.side_conversations && (s.side_conversations.slack_channel || s.side_conversations.email_channel)) || false,
          knowledge_search_articles: knowledge.search_articles === true,
          generative_answers: knowledge.generative_answers === true,
          account_size: (s.metrics && s.metrics.account_size) || null,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to fetch account settings.',
      };
    }
  },

  zendesk_search_tickets: async ({ query = '', sort_by = 'updated_at', sort_order = 'desc', limit = 20 } = {}) => {
    const q = typeof query === 'string' ? query.trim() : '';
    if (!q) {
      return { success: false, message: 'Provide a search query (e.g. type:ticket status:open or a keyword).' };
    }
    try {
      const { subdomain } = getConfig();
      const parsed = parseInt(limit, 10);
      const pageSize = Math.min(100, Math.max(1, isNaN(parsed) ? 20 : parsed));
      const queryParam = q.includes('type:') ? q : `type:ticket ${q}`;
      const path = `/api/v2/search.json?query=${encodeURIComponent(queryParam)}&sort_by=${encodeURIComponent(sort_by)}&sort_order=${encodeURIComponent(sort_order)}&per_page=${pageSize}`;
      const data = await zendeskFetch(subdomain, path);
      const results = (data.results || []).filter((r) => r.result_type === 'ticket');
      const tickets = results.slice(0, pageSize).map((t) => {
        const sat = t.satisfaction_rating;
        const satisfaction_rating = sat
          ? { score: sat.score || null, comment: sat.comment || null, reason: sat.reason || null }
          : undefined;
        const custom_fields = Array.isArray(t.custom_fields)
          ? t.custom_fields.map((f) => ({ id: f.id, value: f.value }))
          : undefined;
        return {
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          created_at: t.created_at,
          updated_at: t.updated_at,
          requester_id: t.requester_id,
          url: t.url,
          tags: Array.isArray(t.tags) ? t.tags : undefined,
          ...(satisfaction_rating && { satisfaction_rating }),
          ...(custom_fields && custom_fields.length > 0 && { custom_fields }),
        };
      });
      return {
        success: true,
        message: tickets.length ? `Found ${tickets.length} ticket(s).` : 'No tickets found.',
        data: { query: queryParam, tickets },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Zendesk search failed.',
      };
    }
  },

  zendesk_get_ticket: async ({ ticket_id } = {}) => {
    const id = ticket_id != null ? parseInt(ticket_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid ticket_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/tickets/${id}.json?include=users`);
      const ticket = data.ticket;
      const users = (data.users || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      const requester = ticket.requester_id ? users[ticket.requester_id] : null;
      return {
        success: true,
        message: `Ticket #${ticket.id}: ${ticket.subject}`,
        data: {
          id: ticket.id,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          type: ticket.type,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          requester_id: ticket.requester_id,
          requester_email: requester ? (requester.email || null) : null,
          url: ticket.url,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to get ticket.',
      };
    }
  },

  zendesk_add_comment: async ({ ticket_id, body, public: isPublic = true } = {}) => {
    const id = ticket_id != null ? parseInt(ticket_id, 10) : NaN;
    const text = typeof body === 'string' ? body.trim() : '';
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid ticket_id.' };
    }
    if (!text) {
      return { success: false, message: 'Provide comment body text.' };
    }
    try {
      const { subdomain } = getConfig();
      await zendeskFetch(subdomain, `/api/v2/tickets/${id}.json`, {
        method: 'PUT',
        body: {
          ticket: {
            comment: {
              body: text,
              public: !!isPublic,
            },
          },
        },
      });
      return {
        success: true,
        message: isPublic ? `Public reply added to ticket #${id}.` : `Internal note added to ticket #${id}.`,
        data: { ticket_id: id, public: !!isPublic },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to add comment.',
      };
    }
  },

  zendesk_list_ticket_comments: async ({ ticket_id } = {}) => {
    const id = ticket_id != null ? parseInt(ticket_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid ticket_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/tickets/${id}/comments.json`);
      const comments = (data.comments || []).map((c) => ({
        id: c.id,
        author_id: c.author_id,
        body: c.body,
        public: c.public,
        created_at: c.created_at,
        type: c.type,
      }));
      return {
        success: true,
        message: comments.length ? `Found ${comments.length} comment(s) on ticket #${id}.` : `No comments on ticket #${id}.`,
        data: { ticket_id: id, comments },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list ticket comments.',
      };
    }
  },

  zendesk_update_ticket: async ({ ticket_id, status, priority, assignee_id, group_id, subject, type: ticketType } = {}) => {
    const id = ticket_id != null ? parseInt(ticket_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid ticket_id (positive integer).' };
    }
    const ticket = {};
    if (status != null && typeof status === 'string') ticket.status = status;
    if (priority != null && typeof priority === 'string') ticket.priority = priority;
    if (assignee_id != null) ticket.assignee_id = parseInt(assignee_id, 10) || null;
    if (group_id != null) ticket.group_id = parseInt(group_id, 10) || null;
    if (subject != null && typeof subject === 'string') ticket.subject = subject;
    if (ticketType != null && typeof ticketType === 'string') ticket.type = ticketType;
    if (Object.keys(ticket).length === 0) {
      return { success: false, message: 'Provide at least one field to update: status, priority, assignee_id, group_id, subject, or type.' };
    }
    try {
      const { subdomain } = getConfig();
      await zendeskFetch(subdomain, `/api/v2/tickets/${id}.json`, {
        method: 'PUT',
        body: { ticket },
      });
      return {
        success: true,
        message: `Ticket #${id} updated.`,
        data: { ticket_id: id, updated: ticket },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to update ticket.',
      };
    }
  },

  zendesk_list_groups: async ({ limit = 100 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      const data = await zendeskFetch(subdomain, `/api/v2/groups.json?per_page=${perPage}`);
      const groups = (data.groups || []).map((g) => ({ id: g.id, name: g.name, created_at: g.created_at }));
      return {
        success: true,
        message: groups.length ? `Found ${groups.length} group(s).` : 'No groups found.',
        data: { groups },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list groups.',
      };
    }
  },

  zendesk_list_users: async ({ role = '', limit = 50 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      let path = `/api/v2/users.json?per_page=${perPage}`;
      const r = typeof role === 'string' ? role.trim().toLowerCase() : '';
      if (r && ['agent', 'admin'].includes(r)) path += `&role=${r}`;
      const data = await zendeskFetch(subdomain, path);
      const users = (data.users || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
      }));
      return {
        success: true,
        message: users.length ? `Found ${users.length} user(s).` : 'No users found.',
        data: { users },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list users.',
      };
    }
  },

  zendesk_get_user: async ({ user_id } = {}) => {
    const id = user_id != null ? parseInt(user_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid user_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/users/${id}.json`);
      const u = data.user || {};
      return {
        success: true,
        message: u.name ? `User: ${u.name}` : `User #${id}`,
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          default_group_id: u.default_group_id,
          organization_id: u.organization_id,
          created_at: u.created_at,
          updated_at: u.updated_at,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to get user.',
      };
    }
  },

  zendesk_list_schedules: async () => {
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, '/api/v2/business_hours/schedules.json');
      const schedules = (data.schedules || []).map((s) => ({
        id: s.id,
        name: s.name,
        time_zone: s.time_zone,
        intervals: s.intervals || [],
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
      return {
        success: true,
        message: schedules.length ? `Found ${schedules.length} schedule(s) (business hours).` : 'No schedules configured.',
        data: { schedules },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list schedules.',
      };
    }
  },

  zendesk_create_user: async ({ name, email, role = 'end-user', default_group_id, organization_id, notes, suspended } = {}) => {
    const n = typeof name === 'string' ? name.trim() : '';
    const e = typeof email === 'string' ? email.trim() : '';
    if (!n || !e) {
      return { success: false, message: 'Provide name and email for the new user.' };
    }
    const r = (typeof role === 'string' ? role.trim().toLowerCase() : '') || 'end-user';
    if (!['end-user', 'agent', 'admin'].includes(r)) {
      return { success: false, message: 'Role must be end-user, agent, or admin.' };
    }
    try {
      const { subdomain } = getConfig();
      const user = { name: n, email: e, role: r };
      if (default_group_id != null) user.default_group_id = parseInt(default_group_id, 10) || null;
      if (organization_id != null) user.organization_id = parseInt(organization_id, 10) || null;
      if (typeof notes === 'string') user.notes = notes.trim();
      if (suspended === true || suspended === false) user.suspended = suspended;
      const data = await zendeskFetch(subdomain, '/api/v2/users.json', {
        method: 'POST',
        body: { user },
      });
      const u = data.user || {};
      return {
        success: true,
        message: `User created: ${u.name} (${u.role}) #${u.id}.`,
        data: { id: u.id, name: u.name, email: u.email, role: u.role },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to create user.',
      };
    }
  },

  zendesk_update_user: async ({ user_id, role, default_group_id, suspended, name, notes, ticket_restriction } = {}) => {
    const id = user_id != null ? parseInt(user_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid user_id (positive integer).' };
    }
    const user = {};
    if (role != null && typeof role === 'string') {
      const r = role.trim().toLowerCase();
      if (['end-user', 'agent', 'admin'].includes(r)) user.role = r;
    }
    if (default_group_id != null) user.default_group_id = parseInt(default_group_id, 10) || null;
    if (suspended === true || suspended === false) user.suspended = suspended;
    if (name != null && typeof name === 'string') user.name = name.trim();
    if (notes != null && typeof notes === 'string') user.notes = notes.trim();
    if (ticket_restriction != null && typeof ticket_restriction === 'string') {
      const tr = ticket_restriction.trim().toLowerCase();
      if (['organization', 'groups', 'assigned', 'requested'].includes(tr)) user.ticket_restriction = tr;
    }
    if (Object.keys(user).length === 0) {
      return { success: false, message: 'Provide at least one field to update: role, default_group_id, suspended, name, notes, or ticket_restriction.' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/users/${id}.json`, {
        method: 'PUT',
        body: { user },
      });
      const u = data.user || {};
      return {
        success: true,
        message: `User #${id} updated.`,
        data: { id: u.id, name: u.name, role: u.role, suspended: u.suspended, default_group_id: u.default_group_id },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to update user.',
      };
    }
  },

  zendesk_create_group: async ({ name, description } = {}) => {
    const n = typeof name === 'string' ? name.trim() : '';
    if (!n) {
      return { success: false, message: 'Provide a name for the new group.' };
    }
    try {
      const { subdomain } = getConfig();
      const group = { name: n };
      if (description != null && typeof description === 'string') group.description = description.trim();
      const data = await zendeskFetch(subdomain, '/api/v2/groups.json', {
        method: 'POST',
        body: { group },
      });
      const g = data.group || {};
      return {
        success: true,
        message: `Group created: ${g.name} #${g.id}.`,
        data: { id: g.id, name: g.name },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to create group.',
      };
    }
  },

  zendesk_update_group: async ({ group_id, name, description } = {}) => {
    const id = group_id != null ? parseInt(group_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid group_id (positive integer).' };
    }
    const group = {};
    if (name != null && typeof name === 'string') group.name = name.trim();
    if (description != null && typeof description === 'string') group.description = description.trim();
    if (Object.keys(group).length === 0) {
      return { success: false, message: 'Provide at least one field to update: name or description.' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/groups/${id}.json`, {
        method: 'PUT',
        body: { group },
      });
      const g = data.group || {};
      return {
        success: true,
        message: `Group #${id} updated.`,
        data: { id: g.id, name: g.name },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to update group.',
      };
    }
  },

  zendesk_get_group: async ({ group_id } = {}) => {
    const id = group_id != null ? parseInt(group_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid group_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/groups/${id}.json`);
      const g = data.group || {};
      return {
        success: true,
        message: g.name ? `Group: ${g.name}` : `Group #${id}`,
        data: { id: g.id, name: g.name, description: g.description, created_at: g.created_at, updated_at: g.updated_at },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to get group.',
      };
    }
  },

  zendesk_list_group_memberships: async ({ group_id, limit = 100 } = {}) => {
    const id = group_id != null ? parseInt(group_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid group_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      const data = await zendeskFetch(subdomain, `/api/v2/groups/${id}/memberships.json?per_page=${perPage}`);
      const memberships = (data.group_memberships || []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        group_id: m.group_id,
        default: m.default,
        created_at: m.created_at,
      }));
      return {
        success: true,
        message: memberships.length ? `Found ${memberships.length} member(s) in group #${id}.` : `No members in group #${id}.`,
        data: { group_id: id, memberships },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list group memberships.',
      };
    }
  },

  zendesk_list_user_group_memberships: async ({ user_id } = {}) => {
    const id = user_id != null ? parseInt(user_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid user_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/users/${id}/group_memberships.json`);
      const memberships = (data.group_memberships || []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        group_id: m.group_id,
        default: m.default,
        created_at: m.created_at,
      }));
      return {
        success: true,
        message: memberships.length ? `User #${id} is in ${memberships.length} group(s).` : `User #${id} is not in any groups.`,
        data: { user_id: id, memberships },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list user group memberships.',
      };
    }
  },

  zendesk_add_user_to_group: async ({ user_id, group_id, default: isDefault = false } = {}) => {
    const uid = user_id != null ? parseInt(user_id, 10) : NaN;
    const gid = group_id != null ? parseInt(group_id, 10) : NaN;
    if (!Number.isInteger(uid) || uid < 1) {
      return { success: false, message: 'Provide a valid user_id (positive integer).' };
    }
    if (!Number.isInteger(gid) || gid < 1) {
      return { success: false, message: 'Provide a valid group_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/users/${uid}/group_memberships.json`, {
        method: 'POST',
        body: { group_membership: { group_id: gid, default: !!isDefault } },
      });
      const m = data.group_membership || {};
      return {
        success: true,
        message: `User #${uid} added to group #${gid}.`,
        data: { membership_id: m.id, user_id: uid, group_id: gid, default: m.default },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to add user to group.',
      };
    }
  },

  zendesk_remove_user_from_group: async ({ user_id, group_id } = {}) => {
    const uid = user_id != null ? parseInt(user_id, 10) : NaN;
    const gid = group_id != null ? parseInt(group_id, 10) : NaN;
    if (!Number.isInteger(uid) || uid < 1) {
      return { success: false, message: 'Provide a valid user_id (positive integer).' };
    }
    if (!Number.isInteger(gid) || gid < 1) {
      return { success: false, message: 'Provide a valid group_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const listData = await zendeskFetch(subdomain, `/api/v2/users/${uid}/group_memberships.json`);
      const memberships = listData.group_memberships || [];
      const membership = memberships.find((m) => m.group_id === gid);
      if (!membership) {
        return { success: false, message: `User #${uid} is not in group #${gid}.` };
      }
      await zendeskFetch(subdomain, `/api/v2/users/${uid}/group_memberships/${membership.id}.json`, { method: 'DELETE' });
      return {
        success: true,
        message: `User #${uid} removed from group #${gid}.`,
        data: { user_id: uid, group_id: gid },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to remove user from group.',
      };
    }
  },

  zendesk_get_ticket_metrics: async ({ ticket_id } = {}) => {
    const id = ticket_id != null ? parseInt(ticket_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid ticket_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/tickets/${id}/metrics.json`);
      const m = (data.ticket_metric && !Array.isArray(data.ticket_metric) ? data.ticket_metric : (Array.isArray(data.ticket_metric) ? data.ticket_metric[0] : null)) || {};
      const out = {
        ticket_id: m.ticket_id || id,
        reply_time_in_minutes: m.reply_time_in_minutes || null,
        first_resolution_time_in_minutes: m.first_resolution_time_in_minutes || null,
        full_resolution_time_in_minutes: m.full_resolution_time_in_minutes || null,
        requester_wait_time_in_minutes: m.requester_wait_time_in_minutes || null,
        agent_wait_time_in_minutes: m.agent_wait_time_in_minutes || null,
        on_hold_time_in_minutes: m.on_hold_time_in_minutes || null,
        replies: m.replies,
        reopens: m.reopens,
        assignee_stations: m.assignee_stations,
        solved_at: m.solved_at,
        assigned_at: m.assigned_at,
      };
      return {
        success: true,
        message: `Metrics for ticket #${id}: reply time, resolution time, requester wait, etc.`,
        data: out,
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to get ticket metrics.',
      };
    }
  },

  zendesk_list_organizations: async ({ limit = 100 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      const data = await zendeskFetch(subdomain, `/api/v2/organizations.json?per_page=${perPage}`);
      const orgs = (data.organizations || []).map((o) => ({
        id: o.id,
        name: o.name,
        details: o.details,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
      return {
        success: true,
        message: orgs.length ? `Found ${orgs.length} organization(s).` : 'No organizations found.',
        data: { organizations: orgs },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list organizations.',
      };
    }
  },

  zendesk_get_organization: async ({ organization_id } = {}) => {
    const id = organization_id != null ? parseInt(organization_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid organization_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/organizations/${id}.json`);
      const o = data.organization || {};
      return {
        success: true,
        message: o.name ? `Organization: ${o.name}` : `Organization #${id}`,
        data: {
          id: o.id,
          name: o.name,
          details: o.details,
          domain_names: o.domain_names,
          notes: o.notes,
          group_id: o.group_id,
          created_at: o.created_at,
          updated_at: o.updated_at,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to get organization.',
      };
    }
  },

  zendesk_list_organization_users: async ({ organization_id, limit = 50 } = {}) => {
    const id = organization_id != null ? parseInt(organization_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid organization_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const data = await zendeskFetch(subdomain, `/api/v2/organizations/${id}/users.json?per_page=${perPage}`);
      const users = (data.users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      return {
        success: true,
        message: users.length ? `Found ${users.length} user(s) in organization #${id}.` : `No users in organization #${id}.`,
        data: { organization_id: id, users },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list organization users.',
      };
    }
  },

  zendesk_list_custom_statuses: async () => {
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, '/api/v2/custom_ticket_statuses.json');
      const statuses = (data.custom_statuses || []).map((s) => ({
        id: s.id,
        agent_label: s.agent_label,
        end_user_label: s.end_user_label,
        status_category: s.status_category,
        active: s.active,
        default: s.default,
      }));
      return {
        success: true,
        message: statuses.length ? `Found ${statuses.length} custom status(es).` : 'No custom statuses (using default statuses only).',
        data: { custom_statuses: statuses },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list custom statuses.',
      };
    }
  },

  zendesk_list_ticket_fields: async () => {
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, '/api/v2/ticket_fields.json');
      const fields = (data.ticket_fields || []).map((f) => ({
        id: f.id,
        title: f.title,
        type: f.type,
        description: f.description || null,
        position: f.position,
        active: f.active,
        required: f.required,
        custom_field_options: (f.custom_field_options || []).map((o) => ({ id: o.id, name: o.name, value: o.value })),
      }));
      return {
        success: true,
        message: fields.length ? `Found ${fields.length} ticket field(s). Use to interpret custom_fields on tickets and for trends by field.` : 'No ticket fields.',
        data: { ticket_fields: fields },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list ticket fields.',
      };
    }
  },

  zendesk_list_ticket_forms: async () => {
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, '/api/v2/ticket_forms.json');
      const forms = (data.ticket_forms || []).map((f) => ({
        id: f.id,
        name: f.name,
        display_name: f.display_name || f.name,
        active: f.active,
        default: f.default,
        end_user_visible: f.end_user_visible,
        ticket_field_ids: f.ticket_field_ids || [],
      }));
      return {
        success: true,
        message: forms.length ? `Found ${forms.length} ticket form(s). Use with ticket_fields to understand which fields each form uses.` : 'No ticket forms (or plan has no forms).',
        data: { ticket_forms: forms },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to list ticket forms.',
      };
    }
  },

  zendesk_search_users: async ({ query = '', limit = 25 } = {}) => {
    const q = typeof query === 'string' ? query.trim() : '';
    if (!q) {
      return { success: false, message: 'Provide a search query (name, email, or keyword).' };
    }
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
      const data = await zendeskFetch(subdomain, `/api/v2/users/search.json?query=${encodeURIComponent(q)}&per_page=${perPage}`);
      const users = (data.users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }));
      return {
        success: true,
        message: users.length ? `Found ${users.length} user(s) matching "${q}".` : `No users found for "${q}".`,
        data: { query: q, users },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message || 'Failed to search users.',
      };
    }
  },

  // --- Business rules: triggers, automations, macros (read-only; bots/procedures visibility) ---
  zendesk_list_triggers: async ({ active_only = false, limit = 100 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      let path = `/api/v2/triggers.json?per_page=${perPage}`;
      if (active_only) path += '&active=true';
      const data = await zendeskFetch(subdomain, path);
      const triggers = (data.triggers || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || null,
        active: t.active,
        position: t.position,
        default: t.default,
        created_at: t.created_at,
        updated_at: t.updated_at,
        conditions: t.conditions,
        actions: t.actions,
      }));
      return {
        success: true,
        message: triggers.length ? `Found ${triggers.length} trigger(s). Triggers run on ticket create/update when conditions match.` : 'No triggers (or filter returned none).',
        data: { triggers, count: data.count, next_page: data.next_page },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to list triggers.' };
    }
  },

  zendesk_get_trigger: async ({ trigger_id } = {}) => {
    const id = trigger_id != null ? parseInt(trigger_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid trigger_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/triggers/${id}.json`);
      const t = data.trigger || data;
      return {
        success: true,
        data: {
          id: t.id,
          title: t.title,
          description: t.description || null,
          active: t.active,
          position: t.position,
          default: t.default,
          category_id: t.category_id,
          conditions: t.conditions,
          actions: t.actions,
          created_at: t.created_at,
          updated_at: t.updated_at,
        },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to get trigger.' };
    }
  },

  zendesk_list_automations: async ({ active_only = false, limit = 100 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      let path = `/api/v2/automations.json?per_page=${perPage}`;
      if (active_only) path += '&active=true';
      const data = await zendeskFetch(subdomain, path);
      const automations = (data.automations || []).map((a) => ({
        id: a.id,
        title: a.title,
        active: a.active,
        default: a.default,
        position: a.position,
        created_at: a.created_at,
        updated_at: a.updated_at,
        conditions: a.conditions,
        actions: a.actions,
      }));
      return {
        success: true,
        message: automations.length ? `Found ${automations.length} automation(s). Automations run on a schedule (e.g. hourly) when conditions match.` : 'No automations (or filter returned none).',
        data: { automations, count: data.count, next_page: data.next_page },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to list automations.' };
    }
  },

  zendesk_get_automation: async ({ automation_id } = {}) => {
    const id = automation_id != null ? parseInt(automation_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid automation_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/automations/${id}.json`);
      const a = data.automation || data;
      return {
        success: true,
        data: {
          id: a.id,
          title: a.title,
          active: a.active,
          default: a.default,
          position: a.position,
          conditions: a.conditions,
          actions: a.actions,
          created_at: a.created_at,
          updated_at: a.updated_at,
        },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to get automation.' };
    }
  },

  zendesk_list_macros: async ({ active_only = false, limit = 100 } = {}) => {
    try {
      const { subdomain } = getConfig();
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      let path = `/api/v2/macros.json?per_page=${perPage}`;
      if (active_only) path += '&active=true';
      const data = await zendeskFetch(subdomain, path);
      const macros = (data.macros || []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description || null,
        active: m.active,
        default: m.default,
        position: m.position,
        restriction: m.restriction,
        created_at: m.created_at,
        updated_at: m.updated_at,
        actions: m.actions,
      }));
      return {
        success: true,
        message: macros.length ? `Found ${macros.length} macro(s). Macros are applied manually by agents to update tickets.` : 'No macros (or filter returned none).',
        data: { macros, count: data.count, next_page: data.next_page },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to list macros.' };
    }
  },

  zendesk_get_macro: async ({ macro_id } = {}) => {
    const id = macro_id != null ? parseInt(macro_id, 10) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { success: false, message: 'Provide a valid macro_id (positive integer).' };
    }
    try {
      const { subdomain } = getConfig();
      const data = await zendeskFetch(subdomain, `/api/v2/macros/${id}.json`);
      const m = data.macro || data;
      return {
        success: true,
        data: {
          id: m.id,
          title: m.title,
          description: m.description || null,
          active: m.active,
          default: m.default,
          position: m.position,
          restriction: m.restriction,
          actions: m.actions,
          created_at: m.created_at,
          updated_at: m.updated_at,
        },
      };
    } catch (e) {
      return { success: false, message: e.message || 'Failed to get macro.' };
    }
  },
};

module.exports = { tools };

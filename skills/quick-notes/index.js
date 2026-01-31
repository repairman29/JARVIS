const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const NOTES_DIR = process.env.JARVIS_QUICK_NOTES_PATH
  ? path.resolve(process.env.JARVIS_QUICK_NOTES_PATH)
  : path.join(JARVIS_DIR, 'quick-notes');
const NOTES_FILE = path.join(NOTES_DIR, 'notes.json');

function ensureDir() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

function loadNotes() {
  ensureDir();
  try {
    if (fs.existsSync(NOTES_FILE)) {
      return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { entries: [] };
}

function saveNotes(data) {
  ensureDir();
  fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const tools = {
  quick_note_add: async ({ text, tag }) => {
    try {
      const data = loadNotes();
      const entry = {
        id: crypto.randomBytes(6).toString('hex'),
        text: (text || '').trim(),
        tag: (tag || '').trim() || undefined,
        created: new Date().toISOString()
      };
      data.entries.unshift(entry);
      saveNotes(data);
      return {
        success: true,
        message: `Remembered: ${entry.text.slice(0, 60)}${entry.text.length > 60 ? '…' : ''}`,
        id: entry.id,
        created: entry.created
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add note: ${error.message}`
      };
    }
  },

  quick_note_search: async ({ query, limit = 20 }) => {
    try {
      const data = loadNotes();
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        return { success: true, results: [], query: query };
      }
      const matches = data.entries.filter(e => {
        const textMatch = (e.text || '').toLowerCase().includes(q);
        const tagMatch = (e.tag || '').toLowerCase().includes(q);
        return textMatch || tagMatch;
      });
      const results = matches.slice(0, limit).map(e => ({
        id: e.id,
        text: e.text,
        tag: e.tag,
        created: e.created
      }));
      return {
        success: true,
        results,
        total: matches.length,
        query: query
      };
    } catch (error) {
      return {
        success: false,
        message: `Search failed: ${error.message}`,
        query: query
      };
    }
  },

  quick_note_list: async ({ tag, days = 0, limit = 30 }) => {
    try {
      const data = loadNotes();
      let list = data.entries;
      if (tag) {
        const t = (tag || '').toLowerCase().trim();
        list = list.filter(e => (e.tag || '').toLowerCase() === t);
      }
      if (days > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffMs = cutoff.getTime();
        list = list.filter(e => new Date(e.created).getTime() >= cutoffMs);
      }
      const results = list.slice(0, limit).map(e => ({
        id: e.id,
        text: e.text,
        tag: e.tag,
        created: e.created
      }));
      return {
        success: true,
        results,
        total: list.length,
        tag: tag || null,
        days: days || null
      };
    } catch (error) {
      return {
        success: false,
        message: `List failed: ${error.message}`
      };
    }
  }
};

module.exports = { tools };

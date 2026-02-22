-- JARVIS Archivist: embeddings and structured memory for bots.
-- See docs/JARVIS_ARCHIVIST.md.

CREATE EXTENSION IF NOT EXISTS vector;

-- Structured "versions" of conversations (AST-like, computer-readable).
-- One row per session version; extraction = topics, decisions, entities, actions, summary.
CREATE TABLE IF NOT EXISTS jarvis_archive (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  version_at timestamptz NOT NULL DEFAULT now(),
  span       jsonb NOT NULL DEFAULT '{}',  -- { first_turn_at, last_turn_at, turn_count }
  extraction jsonb NOT NULL DEFAULT '{}',  -- { summary, topics[], decisions[], entities[], actions[] }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jarvis_archive_session_id ON jarvis_archive (session_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_archive_version_at ON jarvis_archive (version_at DESC);
CREATE INDEX IF NOT EXISTS idx_jarvis_archive_extraction_gin ON jarvis_archive USING gin (extraction jsonb_path_ops);

COMMENT ON TABLE jarvis_archive IS 'Structured versions of JARVIS sessions for bot query (topics, decisions, entities, actions).';

-- Chunks of conversation (or summaries) with embeddings for semantic search.
-- Same vector dim as repo_chunks (nomic-embed-text: 768).
CREATE TABLE IF NOT EXISTS jarvis_memory_chunks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  source     text NOT NULL CHECK (source IN ('session_summary', 'session_turn', 'archive_extraction')),
  content    text NOT NULL,
  embedding  vector(768),
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jarvis_memory_chunks_session_id ON jarvis_memory_chunks (session_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_memory_chunks_embedding_idx ON jarvis_memory_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE jarvis_memory_chunks IS 'Embedded conversation chunks for semantic search; bots surf via vector similarity.';

-- RPC: semantic search over jarvis_memory_chunks (mirrors match_repo_chunks).
CREATE OR REPLACE FUNCTION match_jarvis_memory_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  session_filter text DEFAULT null
)
RETURNS TABLE (
  chunk_id uuid,
  session_id text,
  source text,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    jarvis_memory_chunks.id AS chunk_id,
    jarvis_memory_chunks.session_id,
    jarvis_memory_chunks.source,
    jarvis_memory_chunks.content,
    1 - (jarvis_memory_chunks.embedding <=> query_embedding) AS similarity
  FROM jarvis_memory_chunks
  WHERE jarvis_memory_chunks.embedding IS NOT NULL
    AND (session_filter IS NULL OR jarvis_memory_chunks.session_id = session_filter)
  ORDER BY jarvis_memory_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Helper: recent archive rows for bots (optional session filter).
CREATE OR REPLACE FUNCTION get_jarvis_archive_recent(
  limit_count int DEFAULT 20,
  session_filter text DEFAULT null
)
RETURNS TABLE (
  session_id text,
  version_at timestamptz,
  span jsonb,
  extraction jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT a.session_id, a.version_at, a.span, a.extraction
  FROM jarvis_archive a
  WHERE session_filter IS NULL OR a.session_id = session_filter
  ORDER BY a.version_at DESC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION match_jarvis_memory_chunks IS 'Semantic search over jarvis_memory_chunks; used by memory-search skill.';
COMMENT ON FUNCTION get_jarvis_archive_recent IS 'Recent jarvis_archive rows for bots; optional session filter.';

-- RLS
ALTER TABLE jarvis_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_memory_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for jarvis_archive" ON jarvis_archive;
CREATE POLICY "Allow all for jarvis_archive" ON jarvis_archive
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for jarvis_memory_chunks" ON jarvis_memory_chunks;
CREATE POLICY "Allow all for jarvis_memory_chunks" ON jarvis_memory_chunks
  FOR ALL USING (true) WITH CHECK (true);

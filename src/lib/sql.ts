import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }
  return neon(url);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  await schemaReady;
}

async function initSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idea',
      progress INTEGER NOT NULL DEFAULT 0,
      repo_url TEXT,
      demo_url TEXT,
      tags TEXT NOT NULL DEFAULT '',
      thumbnail TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'idea',
      status TEXT NOT NULL DEFAULT 'unread',
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS progress_updates (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_progress_project ON progress_updates(project_id)`;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM projects`;
  if (count === 0) {
    await sql`
      INSERT INTO projects (title, description, author, status, progress, tags, password_hash)
      VALUES
        ('AI 컴포넌트 생성기', 'Figma 디자인을 기반으로 React 컴포넌트를 자동 생성하는 도구', '김민수', 'in_progress', 65, 'AI,React,자동화', ''),
        ('내부 디자인 시스템 문서', '팀 공통 UI 컴포넌트 라이브러리 및 사용 가이드', '이지은', 'review', 90, '디자인시스템,문서', ''),
        ('성능 모니터링 대시보드', 'UI Core Web Vitals 실시간 모니터링', '박준혁', 'idea', 10, '성능,모니터링', '')
    `;
  }
}

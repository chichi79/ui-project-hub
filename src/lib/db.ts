import type { Comment, FeedbackStatus, FeedbackType, ProgressUpdate, Project, ProjectStatus } from "./types";
import { isFeedbackType } from "./feedback";
import { verifyPassword } from "./auth";
import { ensureSchema, getSql } from "./sql";

export type { Comment, ProgressUpdate, Project, ProjectStatus } from "./types";

interface ProjectRecord extends Project {
  password_hash: string;
}

interface ProjectRow {
  id: number;
  title: string;
  description: string;
  author: string;
  status: string;
  progress: number;
  repo_url: string | null;
  demo_url: string | null;
  tags: string;
  thumbnail: string | null;
  password_hash: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface CommentRow {
  id: number;
  project_id: number;
  author: string;
  content: string;
  type: string;
  status: string;
  parent_id: number | null;
  created_at: Date | string;
}

interface ProgressRow {
  id: number;
  project_id: number;
  author: string;
  status: string;
  progress: number;
  note: string;
  created_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: row.author,
    status: row.status as ProjectStatus,
    progress: row.progress,
    repo_url: row.repo_url,
    demo_url: row.demo_url,
    tags: row.tags,
    thumbnail: row.thumbnail,
    password_hash: row.password_hash,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function toPublic(project: ProjectRecord): Project {
  const { password_hash: _, ...rest } = project;
  return rest;
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    project_id: row.project_id,
    author: row.author,
    content: row.content,
    type: row.type as FeedbackType,
    status: row.status as FeedbackStatus,
    parent_id: row.parent_id,
    created_at: toIso(row.created_at),
  };
}

function mapProgress(row: ProgressRow): ProgressUpdate {
  return {
    id: row.id,
    project_id: row.project_id,
    author: row.author,
    status: row.status as ProjectStatus,
    progress: row.progress,
    note: row.note,
    created_at: toIso(row.created_at),
  };
}

async function db() {
  await ensureSchema();
  return getSql();
}

export async function getAllProjects(status?: string): Promise<Project[]> {
  const sql = await db();
  const rows =
    status && status !== "all"
      ? await sql`SELECT * FROM projects WHERE status = ${status} ORDER BY updated_at DESC`
      : await sql`SELECT * FROM projects ORDER BY updated_at DESC`;
  return (rows as ProjectRow[]).map(mapProject).map(toPublic);
}

export async function getProjectRecordById(id: number): Promise<ProjectRecord | undefined> {
  const sql = await db();
  const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
  const row = (rows as ProjectRow[])[0];
  return row ? mapProject(row) : undefined;
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const record = await getProjectRecordById(id);
  return record ? toPublic(record) : undefined;
}

export async function createProject(data: {
  title: string;
  description: string;
  author: string;
  password_hash: string;
  status?: ProjectStatus;
  progress?: number;
  repo_url?: string;
  demo_url?: string;
  tags?: string;
  thumbnail?: string;
}): Promise<Project> {
  const sql = await db();
  const rows = await sql`
    INSERT INTO projects (
      title, description, author, status, progress,
      repo_url, demo_url, tags, thumbnail, password_hash
    ) VALUES (
      ${data.title},
      ${data.description || ""},
      ${data.author},
      ${data.status || "idea"},
      ${data.progress ?? 0},
      ${data.repo_url || null},
      ${data.demo_url || null},
      ${data.tags || ""},
      ${data.thumbnail || null},
      ${data.password_hash}
    )
    RETURNING *
  `;
  return toPublic(mapProject((rows as ProjectRow[])[0]));
}

export async function updateProject(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    author: string;
    status: ProjectStatus;
    progress: number;
    repo_url: string | null;
    demo_url: string | null;
    tags: string;
    thumbnail: string | null;
  }>
): Promise<Project | undefined> {
  const existing = await getProjectRecordById(id);
  if (!existing) return undefined;

  const sql = await db();
  const rows = await sql`
    UPDATE projects SET
      title = ${data.title ?? existing.title},
      description = ${data.description ?? existing.description},
      author = ${data.author ?? existing.author},
      status = ${data.status ?? existing.status},
      progress = ${data.progress ?? existing.progress},
      repo_url = ${data.repo_url !== undefined ? data.repo_url : existing.repo_url},
      demo_url = ${data.demo_url !== undefined ? data.demo_url : existing.demo_url},
      tags = ${data.tags ?? existing.tags},
      thumbnail = ${data.thumbnail !== undefined ? data.thumbnail : existing.thumbnail},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  const row = (rows as ProjectRow[])[0];
  return row ? toPublic(mapProject(row)) : undefined;
}

export async function deleteProject(id: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;
  return (rows as { id: number }[]).length > 0;
}

export async function getComments(projectId: number, feedbackType?: string): Promise<Comment[]> {
  const sql = await db();
  const rows = await sql`
    SELECT * FROM comments
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
  let comments = (rows as CommentRow[]).map(mapComment);

  if (feedbackType && feedbackType !== "all" && isFeedbackType(feedbackType)) {
    const matchingParents = new Set(
      comments.filter((c) => c.parent_id === null && c.type === feedbackType).map((c) => c.id)
    );
    comments = comments.filter(
      (c) =>
        (c.parent_id === null && c.type === feedbackType) ||
        (c.parent_id !== null && matchingParents.has(c.parent_id))
    );
  }

  return comments;
}

export async function getRecentCommentsByProject(limitPerProject = 5): Promise<Record<number, Comment[]>> {
  const sql = await db();
  const rows = await sql`
    SELECT * FROM comments
    WHERE parent_id IS NULL
    ORDER BY created_at DESC
  `;
  const grouped: Record<number, Comment[]> = {};

  for (const row of rows as CommentRow[]) {
    const comment = mapComment(row);
    const list = grouped[comment.project_id] || (grouped[comment.project_id] = []);
    if (list.length < limitPerProject) list.push(comment);
  }

  return grouped;
}

export async function addComment(
  projectId: number,
  data: {
    author: string;
    content: string;
    type?: FeedbackType;
    parent_id?: number | null;
  }
): Promise<Comment> {
  const sql = await db();

  if (data.parent_id) {
    const parents = await sql`
      SELECT id FROM comments
      WHERE id = ${data.parent_id} AND project_id = ${projectId} AND parent_id IS NULL
    `;
    if ((parents as { id: number }[]).length === 0) {
      throw new Error("원본 의견을 찾을 수 없습니다.");
    }
  }

  const rows = await sql`
    INSERT INTO comments (project_id, author, content, type, status, parent_id)
    VALUES (
      ${projectId},
      ${data.author},
      ${data.content},
      ${data.parent_id ? "idea" : data.type || "idea"},
      ${"unread"},
      ${data.parent_id ?? null}
    )
    RETURNING *
  `;

  await sql`UPDATE projects SET updated_at = NOW() WHERE id = ${projectId}`;
  return mapComment((rows as CommentRow[])[0]);
}

export async function updateCommentStatus(
  projectId: number,
  commentId: number,
  status: FeedbackStatus,
  password: string
): Promise<Comment | undefined> {
  const project = await getProjectRecordById(projectId);
  if (!project || !verifyPassword(password, project.password_hash)) {
    throw new Error("비밀번호가 올바르지 않습니다.");
  }

  const sql = await db();
  const rows = await sql`
    UPDATE comments SET status = ${status}
    WHERE id = ${commentId} AND project_id = ${projectId} AND parent_id IS NULL
    RETURNING *
  `;
  const row = (rows as CommentRow[])[0];
  if (!row) return undefined;

  await sql`UPDATE projects SET updated_at = NOW() WHERE id = ${projectId}`;
  return mapComment(row);
}

export async function getProgressUpdates(projectId: number): Promise<ProgressUpdate[]> {
  const sql = await db();
  const rows = await sql`
    SELECT * FROM progress_updates
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
  return (rows as ProgressRow[]).map(mapProgress);
}

export async function addProgressUpdate(
  projectId: number,
  data: {
    author: string;
    status: ProjectStatus;
    progress: number;
    note: string;
  }
): Promise<ProgressUpdate> {
  const sql = await db();
  const rows = await sql`
    INSERT INTO progress_updates (project_id, author, status, progress, note)
    VALUES (${projectId}, ${data.author}, ${data.status}, ${data.progress}, ${data.note || ""})
    RETURNING *
  `;

  await sql`
    UPDATE projects
    SET status = ${data.status}, progress = ${data.progress}, updated_at = NOW()
    WHERE id = ${projectId}
  `;

  return mapProgress((rows as ProgressRow[])[0]);
}

export async function getProjectStats() {
  const sql = await db();
  const rows = await sql`
    SELECT status, COUNT(*)::int AS cnt
    FROM projects
    GROUP BY status
  `;
  const totalRows = await sql`SELECT COUNT(*)::int AS count FROM projects`;
  const total = (totalRows as { count: number }[])[0]?.count ?? 0;

  return {
    total,
    byStatus: (rows as { status: string; cnt: number }[]).map((r) => ({
      status: r.status,
      cnt: r.cnt,
    })),
  };
}

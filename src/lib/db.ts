import type { Comment, FeedbackStatus, FeedbackType, ProgressUpdate, Project, ProjectStatus } from "./types";
import { isFeedbackType } from "./feedback";
import { verifyPassword, hashPassword, DEFAULT_PROJECT_PASSWORD } from "./auth";
import { parseStoredDate } from "./utils";
import type { DocumentData } from "firebase-admin/firestore";
import { firestoreSetupError, getFirestoreDb, isFirestoreNotFoundError } from "./firebase-admin";

export type { Comment, ProgressUpdate, Project, ProjectStatus } from "./types";

interface ProjectRecord extends Project {
  password_hash: string;
}

const PROJECTS = "projects";
const COMMENTS = "comments";
const PROGRESS = "progress_updates";
const COUNTERS = "meta/counters";

let seedReady: Promise<void> | null = null;

function shouldSeedSampleData(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.SEED_SAMPLE_DATA === "true";
}

function now(): string {
  return new Date().toISOString();
}

function toPublic(project: ProjectRecord): Project {
  const { password_hash: _, ...rest } = project;
  return rest;
}

function normalizeTimestamp(value: unknown): string {
  if (!value) return now();
  if (typeof value === "string") {
    const parsed = parseStoredDate(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

function docToProject(id: number, data: DocumentData): ProjectRecord {
  return {
    id,
    title: data.title,
    description: data.description ?? "",
    author: data.author,
    status: data.status as ProjectStatus,
    progress: data.progress ?? 0,
    repo_url: data.repo_url ?? null,
    demo_url: data.demo_url ?? null,
    tags: data.tags ?? "",
    thumbnail: data.thumbnail ?? null,
    password_hash: data.password_hash ?? "",
    created_at: normalizeTimestamp(data.created_at),
    updated_at: normalizeTimestamp(data.updated_at),
  };
}

function docToComment(id: number, data: DocumentData): Comment {
  return {
    id,
    project_id: data.project_id,
    author: data.author,
    content: data.content,
    type: (data.type || "idea") as FeedbackType,
    status: (data.status || "unread") as FeedbackStatus,
    parent_id: data.parent_id ?? null,
    created_at: normalizeTimestamp(data.created_at),
  };
}

function docToProgress(id: number, data: DocumentData): ProgressUpdate {
  return {
    id,
    project_id: data.project_id,
    author: data.author,
    status: data.status as ProjectStatus,
    progress: data.progress,
    note: data.note ?? "",
    created_at: normalizeTimestamp(data.created_at),
  };
}

async function getNextId(field: "nextProjectId" | "nextCommentId" | "nextProgressId"): Promise<number> {
  const db = getFirestoreDb();
  const ref = db.doc(COUNTERS);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const defaults = { nextProjectId: 1, nextCommentId: 1, nextProgressId: 1 };
    const data = snap.exists ? { ...defaults, ...snap.data() } : defaults;
    const id = data[field] as number;
    tx.set(ref, { ...data, [field]: id + 1 }, { merge: true });
    return id;
  });
}

async function ensureSeed() {
  if (!seedReady) {
    seedReady = seedIfEmpty();
  }
  await seedReady;
}

async function seedIfEmpty() {
  if (!shouldSeedSampleData()) return;

  const db = getFirestoreDb();
  let existing;
  try {
    existing = await db.collection(PROJECTS).limit(1).get();
  } catch (error) {
    if (isFirestoreNotFoundError(error)) throw firestoreSetupError();
    throw error;
  }
  if (!existing.empty) return;

  const t = now();
  const samples = [
    {
      title: "AI 컴포넌트 생성기",
      description: "Figma 디자인을 기반으로 React 컴포넌트를 자동 생성하는 도구",
      author: "김민수",
      status: "in_progress",
      progress: 65,
      tags: "AI,React,자동화",
    },
    {
      title: "내부 디자인 시스템 문서",
      description: "팀 공통 UI 컴포넌트 라이브러리 및 사용 가이드",
      author: "이지은",
      status: "review",
      progress: 90,
      tags: "디자인시스템,문서",
    },
    {
      title: "성능 모니터링 대시보드",
      description: "UI Core Web Vitals 실시간 모니터링",
      author: "박준혁",
      status: "idea",
      progress: 10,
      tags: "성능,모니터링",
    },
  ];

  const batch = db.batch();
  samples.forEach((s, i) => {
    const id = i + 1;
    batch.set(db.collection(PROJECTS).doc(String(id)), {
      ...s,
      repo_url: null,
      demo_url: null,
      thumbnail: null,
      password_hash: hashPassword(DEFAULT_PROJECT_PASSWORD),
      created_at: t,
      updated_at: t,
    });
  });
  batch.set(db.doc(COUNTERS), {
    nextProjectId: 4,
    nextCommentId: 1,
    nextProgressId: 1,
  });
  await batch.commit();
}

async function touchProject(projectId: number) {
  await getFirestoreDb().collection(PROJECTS).doc(String(projectId)).update({
    updated_at: now(),
  });
}

export async function getAllProjects(status?: string): Promise<Project[]> {
  await ensureSeed();
  const snap = await getFirestoreDb().collection(PROJECTS).get();
  let projects = snap.docs.map((d) => docToProject(Number(d.id), d.data()));

  if (status && status !== "all") {
    projects = projects.filter((p) => p.status === status);
  }

  return projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map(toPublic);
}

export async function getProjectRecordById(id: number): Promise<ProjectRecord | undefined> {
  await ensureSeed();
  const snap = await getFirestoreDb().collection(PROJECTS).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return docToProject(id, snap.data()!);
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
  await ensureSeed();
  const id = await getNextId("nextProjectId");
  const t = now();
  const record: Omit<ProjectRecord, "id"> & { id: number } = {
    id,
    title: data.title,
    description: data.description || "",
    author: data.author,
    status: data.status || "idea",
    progress: data.progress ?? 0,
    repo_url: data.repo_url || null,
    demo_url: data.demo_url || null,
    tags: data.tags || "",
    thumbnail: data.thumbnail || null,
    password_hash: data.password_hash,
    created_at: t,
    updated_at: t,
  };

  await getFirestoreDb().collection(PROJECTS).doc(String(id)).set(record);
  return toPublic(record as ProjectRecord);
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

  const updated: ProjectRecord = {
    ...existing,
    ...data,
    repo_url: data.repo_url !== undefined ? data.repo_url : existing.repo_url,
    demo_url: data.demo_url !== undefined ? data.demo_url : existing.demo_url,
    thumbnail: data.thumbnail !== undefined ? data.thumbnail : existing.thumbnail,
    updated_at: now(),
  };

  await getFirestoreDb().collection(PROJECTS).doc(String(id)).set(updated);
  return toPublic(updated);
}

export async function deleteProject(id: number): Promise<boolean> {
  const db = getFirestoreDb();
  const ref = db.collection(PROJECTS).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;

  const [commentsSnap, progressSnap] = await Promise.all([
    db.collection(COMMENTS).where("project_id", "==", id).get(),
    db.collection(PROGRESS).where("project_id", "==", id).get(),
  ]);

  const batch = db.batch();
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  progressSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();
  return true;
}

export async function getComments(projectId: number, feedbackType?: string): Promise<Comment[]> {
  await ensureSeed();
  const snap = await getFirestoreDb()
    .collection(COMMENTS)
    .where("project_id", "==", projectId)
    .get();

  let comments = snap.docs
    .map((d) => docToComment(Number(d.id), d.data()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
  await ensureSeed();
  const snap = await getFirestoreDb().collection(COMMENTS).get();
  const grouped: Record<number, Comment[]> = {};

  const sorted = snap.docs
    .map((d) => docToComment(Number(d.id), d.data()))
    .filter((c) => c.parent_id === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  for (const comment of sorted) {
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
  await ensureSeed();
  const db = getFirestoreDb();

  if (data.parent_id) {
    const parent = await db.collection(COMMENTS).doc(String(data.parent_id)).get();
    const parentData = parent.data();
    if (!parent.exists || parentData?.project_id !== projectId || parentData?.parent_id != null) {
      throw new Error("원본 의견을 찾을 수 없습니다.");
    }
  }

  const id = await getNextId("nextCommentId");
  const t = now();
  const comment: Comment = {
    id,
    project_id: projectId,
    author: data.author,
    content: data.content,
    type: data.parent_id ? "idea" : data.type || "idea",
    status: "unread",
    parent_id: data.parent_id ?? null,
    created_at: t,
  };

  await db.collection(COMMENTS).doc(String(id)).set(comment);
  await touchProject(projectId);
  return comment;
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

  const ref = getFirestoreDb().collection(COMMENTS).doc(String(commentId));
  const snap = await ref.get();
  if (!snap.exists) return undefined;

  const data = snap.data()!;
  if (data.project_id !== projectId || data.parent_id != null) return undefined;

  await ref.update({ status });
  await touchProject(projectId);
  return docToComment(commentId, { ...data, status });
}

export async function getProgressUpdates(projectId: number): Promise<ProgressUpdate[]> {
  await ensureSeed();
  const snap = await getFirestoreDb()
    .collection(PROGRESS)
    .where("project_id", "==", projectId)
    .get();

  return snap.docs
    .map((d) => docToProgress(Number(d.id), d.data()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
  await ensureSeed();
  const id = await getNextId("nextProgressId");
  const t = now();
  const update: ProgressUpdate = {
    id,
    project_id: projectId,
    author: data.author,
    status: data.status,
    progress: data.progress,
    note: data.note || "",
    created_at: t,
  };

  const db = getFirestoreDb();
  await db.collection(PROGRESS).doc(String(id)).set(update);
  await db.collection(PROJECTS).doc(String(projectId)).update({
    status: data.status,
    progress: data.progress,
    updated_at: t,
  });

  return update;
}

export async function getProjectStats() {
  await ensureSeed();
  const snap = await getFirestoreDb().collection(PROJECTS).get();
  const byStatusMap: Record<string, number> = {};

  snap.docs.forEach((d) => {
    const status = d.data().status as string;
    byStatusMap[status] = (byStatusMap[status] || 0) + 1;
  });

  return {
    total: snap.size,
    byStatus: Object.entries(byStatusMap).map(([status, cnt]) => ({ status, cnt })),
  };
}

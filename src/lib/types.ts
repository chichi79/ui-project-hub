export type ProjectStatus =
  | "idea"
  | "in_progress"
  | "review"
  | "done"
  | "on_hold";

export type FeedbackType = "praise" | "improvement" | "question" | "idea";

export type FeedbackStatus = "unread" | "acknowledged" | "planned" | "done";

export interface Project {
  id: number;
  title: string;
  description: string;
  author: string;
  status: ProjectStatus;
  progress: number;
  repo_url: string | null;
  demo_url: string | null;
  tags: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  project_id: number;
  author: string;
  content: string;
  type: FeedbackType;
  status: FeedbackStatus;
  parent_id: number | null;
  created_at: string;
}

export interface ProgressUpdate {
  id: number;
  project_id: number;
  author: string;
  status: ProjectStatus;
  progress: number;
  note: string;
  created_at: string;
}

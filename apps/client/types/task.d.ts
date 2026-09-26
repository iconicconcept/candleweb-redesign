/** `category` says who sees the task: "general" tasks come from
    `GET /task/all/` (everyone), "course" tasks from
    `GET /task/course/{id}/` (students enrolled in that course only).
    `task_type` picks the flow/label; "builder" is a project. */
export type TaskCategory = "general" | "course";
export type TaskType = "standard" | "quiz" | "builder";

export interface TaskProp {
  id?: number;
  title?: string;
  category?: TaskCategory;
  task_type?: TaskType;
  course?: number;
  course_title?: string;
  course_code?: string;
  description?: string;
  header?: string;
  url?: string;
  token_reward?: string;
  point_reward?: string;
  start_date?: Date;
  end_date?: Date;
}

export interface TaskStatsProp {
  status?: string;
  point?: string;
  level?: number;
  earned_units?: number;
}

export interface TaskStreakProp {
  total_task?: number;
  /** Consecutive WEEKS with activity (a task submitted or a class
      attended) — not a count of tasks, and not days. */
  user_streak?: number;
  longest_streak?: number;
  last_activity?: string | null;
  /** Shape not documented yet — don't render it until it is. */
  streak_sources?: unknown;
}

export interface RewardTaskProp {
  id?: number;
  task_id?: number;
  account_id?: number;
  title?: string;
  header?: string;
  verification_link?: string;
  is_verified?: boolean;
  is_reward_claimed?: boolean;
  is_active?: boolean;
  description?: string;
  ai_unit?: string;
  point?: string;
  /** Not documented on `GET /task/reward/` — read only if present. */
  task_type?: TaskType;
  category?: TaskCategory;
}

export interface LeaderboardProp {
  account_id?: string;
  point?: string;
  level?: string;
}

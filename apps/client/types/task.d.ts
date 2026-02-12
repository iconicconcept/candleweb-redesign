export interface TaskProp {
  id?: number;
  title?: string;
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
  user_streak?: number;
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
}

export interface LeaderboardProp {
  account_id?: string;
  point?: string;
  level?: string;
}

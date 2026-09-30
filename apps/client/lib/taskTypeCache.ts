import type { TaskProp, TaskType } from "../types/task";

/* GET /task/reward/ rows carry task_id but no task_type, and both task lists
   (/task/all/, /task/course/{id}/) drop a task once the caller has taken part
   in it — so after a submission nothing in the API says what type it was.
   Until the reward rows carry task_type (BACKEND_API_REQUESTS.md §1.25), every
   type we see on a list is remembered here by task id. It only knows tasks
   this browser saw before they were submitted. */

const KEY = "cw-task-types";

const read = (): Record<string, TaskType> => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") ?? {};
  } catch {
    return {};
  }
};

export const rememberTaskTypes = (tasks: TaskProp[]) => {
  if (typeof window === "undefined") return;
  const known = read();
  let changed = false;
  for (const t of tasks) {
    if (t?.id == null || !t.task_type || known[t.id] === t.task_type) continue;
    known[t.id] = t.task_type;
    changed = true;
  }
  if (!changed) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(known));
  } catch {
    /* storage full or blocked — badges just stay untracked */
  }
};

export const rememberedTaskType = (taskId?: number): TaskType | undefined =>
  taskId == null ? undefined : read()[taskId];

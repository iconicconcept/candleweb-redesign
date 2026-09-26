import type { TaskType } from "../../../../types/task";

/* No `end_date` means nothing to be late against. */
export function dueState(endDate?: Date | string | null): { cls: string; label: string } {
  if (!endDate) return { cls: "", label: "no deadline" };
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { cls: "late8", label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue` };
  if (days === 0) return { cls: "soon8", label: "due today" };
  if (days === 1) return { cls: "soon8", label: "due tomorrow" };
  return { cls: "", label: `due in ${days} days` };
}

/* Row tag for a task's type. "standard" is the default kind, so it gets no
   tag; the backend calls a project task "builder". */
export function typeTag(type?: TaskType): string | null {
  if (type === "quiz") return "quiz";
  if (type === "builder") return "project";
  return null;
}

/* Every type still goes through the same link submission (there's no quiz
   or project-upload endpoint yet) — only the wording changes. */
export function submitCopy(type?: TaskType): { title: string; label: string; hint: string } {
  if (type === "quiz")
    return {
      title: "Submit your quiz",
      label: "Link to your quiz result",
      hint: "Paste the link to your finished quiz. A marker checks it before the reward unlocks.",
    };
  if (type === "builder")
    return {
      title: "Submit your project",
      label: "Project link",
      hint: "Paste a link to your project (repo, doc or demo). A marker reviews it before the reward unlocks.",
    };
  return {
    title: "Submit this task",
    label: "Verification link",
    hint: "Kindly provide the link to the completed task.",
  };
}

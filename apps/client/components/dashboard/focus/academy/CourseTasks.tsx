import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import { TasksIcon } from "../icons";
import SubmitTaskDialog from "./SubmitTaskDialog";
import { dueState, typeTag } from "./taskMeta";
import type { TaskProp } from "../../../../types/task";

type Props = {
  /** False until the first GET /task/course/{id}/ round has come back. */
  loaded: boolean;
};

type Group = { course: number; title: string; code?: string; tasks: TaskProp[] };

const byDeadline = (a: TaskProp, b: TaskProp) => {
  if (!a.end_date) return b.end_date ? 1 : 0;
  if (!b.end_date) return -1;
  return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
};

/* Tasks set for a course the student is enrolled in. They don't appear in
   /task/all/, so this is the only place they show. Once submitted they
   follow the same reward path as general tasks — "With a marker", "Ready to
   claim" and "Claimed" in the list above cover both kinds. */
export default function CourseTasks({ loaded }: Props) {
  const { courseTasks, completed } = useSelector((state: RootState) => state.task);
  const [submitTask, setSubmitTask] = useState<TaskProp | null>(null);

  // Hide anything already submitted — it lives in the reward tabs now. Not
  // documented whether /task/course/ drops those itself, so check both.
  const submitted = new Set((completed ?? []).map((r) => r.task_id));
  const open = (courseTasks ?? []).filter((t) => !submitted.has(t.id));

  const groups: Group[] = [];
  for (const t of open) {
    const key = t.course ?? -1;
    let g = groups.find((x) => x.course === key);
    if (!g) {
      g = { course: key, title: t.course_title ?? "Course", code: t.course_code, tasks: [] };
      groups.push(g);
    }
    g.tasks.push(t);
  }
  groups.forEach((g) => g.tasks.sort(byDeadline));

  return (
    <>
      <div className="fx-sh">
        <h2>Course tasks</h2>
        <span className="sub2">Only for courses you&rsquo;re enrolled in.</span>
      </div>

      {!loaded && (
        <p className="fx-nempty">
          <b>Loading course tasks…</b>
        </p>
      )}

      {loaded && groups.length === 0 && (
        <div className="fx-nempty">
          <b>Nothing from your courses right now.</b>
          <p>Tasks your tutors set for a course you&rsquo;re enrolled in show up here.</p>
        </div>
      )}

      {loaded &&
        groups.map((g) => (
          <div className="fx-ctgrp" key={g.course}>
            <div className="fx-ctgh">
              {g.code && <span className="fx-due">{g.code}</span>}
              {g.course > 0 ? (
                <Link href={`/dashboard/tutor/course/${g.course}`}>{g.title}</Link>
              ) : (
                <span>{g.title}</span>
              )}
              <em>{g.tasks.length} open</em>
            </div>

            {g.tasks.map((task, idx) => {
              const due = dueState(task.end_date);
              const tag = typeTag(task.task_type);
              return (
                <div className="fx-tk" key={task.id ?? idx}>
                  <span className="fx-tkico">
                    <TasksIcon />
                  </span>
                  <div className="fx-tkb">
                    <b>{task.title}</b>
                    <div className="fx-tkm">
                      {tag && <span className="fx-due">{tag}</span>}
                      <span className={`fx-due ${due.cls}`}>{due.label}</span>
                    </div>
                  </div>
                  <div className="fx-tka">
                    <span className="fx-tkr">
                      +{parseInt(task.token_reward ?? "0")} credits · {parseInt(task.point_reward ?? "0")} pts
                    </span>
                    <button className="fx-mini" type="button" onClick={() => setSubmitTask(task)}>
                      Submit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      <SubmitTaskDialog task={submitTask} onClose={() => setSubmitTask(null)} />
    </>
  );
}

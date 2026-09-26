import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import taskService from "../../../../services/taskService";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { dismissLoader, loading, success } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { CheckIcon } from "../icons";
import { submitCopy } from "./taskMeta";
import type { TaskProp } from "../../../../types/task";

/* Task descriptions come from the admin's rich-text editor as HTML. Show
   them as plain text (keeping paragraph breaks) rather than injecting it. */
function htmlToText(html?: string): string {
  if (!html) return "";
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n");
  if (typeof DOMParser === "undefined") return withBreaks.replace(/<[^>]*>/g, "").trim();
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

type Props = {
  task: TaskProp | null;
  onClose: () => void;
};

/* Shared by the general list (DailyTasks) and the per-course list
   (CourseTasks) — both submit through POST /task/reward/. */
export default function SubmitTaskDialog({ task, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (task) setLink("");
  }, [task]);

  const copy = submitCopy(task?.task_type);

  const submit = async () => {
    if (!task?.id) return;
    setBusy(true);
    loading("Verifying...");
    try {
      const res = await dispatch(
        taskService.verifyReward({ api: axiosToken, data: { task_id: task.id, link } }),
      ).unwrap();
      if (res?.status === "success") {
        dispatch(taskService.getTasks(axiosToken));
        if (task.category === "course") dispatch(taskService.getCourseTasks(axiosToken));
        dispatch(taskService.getReward(axiosToken));
        dispatch(taskService.getTaskStats(axiosToken));
        dispatch(taskService.getTaskStreak(axiosToken));
        success(res.message);
      }
      onClose();
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      dismissLoader("");
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!task}
      onClose={onClose}
      icon={<CheckIcon />}
      title={copy.title}
      subtitle={
        task && (
          <span className="desc">{htmlToText(task.description) || task.title}</span>
        )
      }
      labelledBy="verify-task-title"
      footer={
        <>
          <button className="fx-cta ghost2" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="fx-cta main2" type="button" disabled={busy} onClick={submit}>
            Submit for review
          </button>
        </>
      }
    >
      <div className="fx-fld">
        <label className="fx-fl" htmlFor="verify-link">
          {copy.label}
        </label>
        <div className="fx-inp">
          <input
            id="verify-link"
            type="text"
            placeholder="Paste your link here"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <p className="fx-hint">{copy.hint}</p>
      </div>
    </Dialog>
  );
}

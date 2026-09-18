import { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import taskService from "../../../../services/taskService";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { dismissLoader, loading, success } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { CheckIcon, TasksIcon } from "../icons";
import type { RewardTaskProp, TaskProp } from "../../../../types/task";

type Filter = "open" | "review" | "ready" | "done";

type Props = {
  /** Shows a footer link to the dedicated Daily tasks page — for previews
      of this list embedded elsewhere (the Academy page), not the page
      itself. Defaults off so `pages/dashboard/tasks.tsx` is unaffected. */
  linkToFullPage?: boolean;
};

/* No `end_date` means nothing to be late against. */
function dueState(endDate?: Date | string | null): { cls: string; label: string } {
  if (!endDate) return { cls: "", label: "no deadline" };
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { cls: "late8", label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue` };
  if (days === 0) return { cls: "soon8", label: "due today" };
  if (days === 1) return { cls: "soon8", label: "due tomorrow" };
  return { cls: "", label: `due in ${days} days` };
}

export default function DailyTasks({ linkToFullPage }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { tasks, completed } = useSelector((state: RootState) => state.task);

  const [filter, setFilter] = useState<Filter>("open");
  const [verifyTask, setVerifyTask] = useState<TaskProp | null>(null);
  const [viewReward, setViewReward] = useState<RewardTaskProp | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = tasks ?? [];
  /* A submitted task sits in `completed` same as a verified one — the only
     way to tell "waiting on a human" from "ready to claim" is is_verified. */
  const underReview = (completed ?? []).filter((r) => !r.is_reward_claimed && !r.is_verified);
  const ready = (completed ?? []).filter((r) => !r.is_reward_claimed && r.is_verified);
  const claimed = (completed ?? []).filter((r) => r.is_reward_claimed);

  const refresh = () => {
    dispatch(taskService.getTasks(axiosToken));
    dispatch(taskService.getReward(axiosToken));
    dispatch(taskService.getTaskStats(axiosToken));
    dispatch(taskService.getTaskStreak(axiosToken));
  };

  const submitVerify = async () => {
    if (!verifyTask?.id) return;
    setBusy(true);
    loading("Verifying...");
    try {
      const res = await dispatch(
        taskService.verifyReward({ api: axiosToken, data: { task_id: verifyTask.id, link } }),
      ).unwrap();
      if (res?.status === "success") {
        refresh();
        success(res.message);
      }
      setVerifyTask(null);
      setLink("");
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      dismissLoader("");
      setBusy(false);
    }
  };

  const claim = async (reward: RewardTaskProp) => {
    if (!reward.task_id) return;
    loading("Claiming reward...");
    try {
      const res = await dispatch(
        taskService.claimReward({ api: axiosToken, id: reward.task_id.toString() }),
      ).unwrap();
      if (res?.status === "success") refresh();
    } catch (err) {
      console.error(err);
    } finally {
      dismissLoader("");
    }
  };

  const visible =
    filter === "done" ? claimed : filter === "review" ? underReview : filter === "ready" ? ready : pending;

  return (
    <>
      <div className="fx-sh">
        <h2>Your tasks</h2>
        <div className="fx-tabs2">
          <button
            type="button"
            className={`fx-tab2 ${filter === "open" ? "on" : ""}`}
            onClick={() => setFilter("open")}
          >
            To do <em>{pending.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "review" ? "on" : ""}`}
            onClick={() => setFilter("review")}
          >
            With a marker <em>{underReview.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "ready" ? "on" : ""}`}
            onClick={() => setFilter("ready")}
          >
            Ready to claim <em>{ready.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "done" ? "on" : ""}`}
            onClick={() => setFilter("done")}
          >
            Claimed <em>{claimed.length}</em>
          </button>
        </div>
      </div>

      <div>
        {visible.length === 0 && (
          <p className="fx-nempty">
            <b>
              {filter === "open"
                ? "Nothing to do right now."
                : filter === "review"
                  ? "Nothing with a marker right now."
                  : filter === "ready"
                    ? "No rewards waiting."
                    : "Nothing claimed yet."}
            </b>
          </p>
        )}

        {filter === "open" &&
          pending.map((task, idx) => {
            const due = dueState(task.end_date);
            return (
              <div className="fx-tk" key={task.id ?? idx}>
                <span className="fx-tkico">
                  <TasksIcon />
                </span>
                <div className="fx-tkb">
                  <b>{task.title}</b>
                  <div className="fx-tkm">
                    <span className={`fx-due ${due.cls}`}>{due.label}</span>
                  </div>
                </div>
                <div className="fx-tka">
                  <span className="fx-tkr">
                    +{parseInt(task.token_reward ?? "0")} credits · {parseInt(task.point_reward ?? "0")} pts
                  </span>
                  <button className="fx-mini" type="button" onClick={() => setVerifyTask(task)}>
                    Submit
                  </button>
                </div>
              </div>
            );
          })}

        {filter === "review" &&
          underReview.map((reward, idx) => (
            <div className="fx-tk" key={reward.id ?? idx}>
              <span className="fx-tkico">
                <TasksIcon />
              </span>
              <div className="fx-tkb">
                <b>{reward.title}</b>
                <div className="fx-tkm">
                  <span className="fx-due wait8">with a marker</span>
                </div>
              </div>
              <div className="fx-tka">
                <span className="fx-tkr">
                  +{parseInt(reward.ai_unit ?? "0")} credits · {parseInt(reward.point ?? "0")} pts
                </span>
                <button className="fx-mini" type="button" onClick={() => setViewReward(reward)}>
                  View
                </button>
              </div>
            </div>
          ))}

        {filter === "ready" &&
          ready.map((reward, idx) => (
            <div className="fx-tk ready7" key={reward.id ?? idx}>
              <span className="fx-tkico">
                <TasksIcon />
              </span>
              <div className="fx-tkb">
                <b>{reward.title}</b>
                <div className="fx-tkm">
                  <span className="fx-due">reward waiting</span>
                </div>
              </div>
              <div className="fx-tka">
                <span className="fx-tkr">
                  +{parseInt(reward.ai_unit ?? "0")} credits · {parseInt(reward.point ?? "0")} pts
                </span>
                <button className="fx-mini claim" type="button" onClick={() => claim(reward)}>
                  Claim
                </button>
              </div>
            </div>
          ))}

        {filter === "done" &&
          claimed.map((reward, idx) => (
            <div className="fx-tk claimed7" key={reward.id ?? idx}>
              <span className="fx-tkico">
                <TasksIcon />
              </span>
              <div className="fx-tkb">
                <b>{reward.title}</b>
                <div className="fx-tkm">
                  <span className="fx-due wait8">claimed</span>
                </div>
              </div>
              <div className="fx-tka">
                <span className="fx-tkr">+{parseInt(reward.ai_unit ?? "0")} claimed</span>
                <button className="fx-mini" type="button" disabled>
                  Done
                </button>
              </div>
            </div>
          ))}
      </div>

      {linkToFullPage && (
        <Link
          href="/dashboard/tasks"
          className="fx-mini"
          style={{ display: "block", textAlign: "center", width: "100%", padding: "12px 0", marginTop: 12 }}
        >
          Open the full task page →
        </Link>
      )}

      <Dialog
        open={!!verifyTask}
        onClose={() => setVerifyTask(null)}
        icon={<CheckIcon />}
        title="Submit this task"
        subtitle={verifyTask?.title}
        labelledBy="verify-task-title"
        footer={
          <>
            <button className="fx-cta ghost2" type="button" onClick={() => setVerifyTask(null)}>
              Cancel
            </button>
            <button className="fx-cta main2" type="button" disabled={busy} onClick={submitVerify}>
              Submit for review
            </button>
          </>
        }
      >
        <div className="fx-fld">
          <label className="fx-fl" htmlFor="verify-link">
            Verification link
          </label>
          <div className="fx-inp">
            <input
              id="verify-link"
              type="text"
              placeholder="Paste your interaction link here"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          <p className="fx-hint">Kindly provide the link to the completed task.</p>
        </div>
      </Dialog>

      <Dialog
        open={!!viewReward}
        onClose={() => setViewReward(null)}
        icon={<CheckIcon />}
        title={viewReward?.title}
        subtitle="With a marker"
        labelledBy="view-task-title"
        footer={
          <button className="fx-cta ghost2" type="button" onClick={() => setViewReward(null)}>
            Close
          </button>
        }
      >
        <p className="fx-dwarn">
          Submitted and waiting on a marker. You&rsquo;ll get feedback either way, usually within a
          day — nothing more to do here until then.
        </p>
      </Dialog>
    </>
  );
}

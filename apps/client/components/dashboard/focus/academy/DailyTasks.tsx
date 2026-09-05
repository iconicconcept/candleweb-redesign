import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import taskService from "../../../../services/taskService";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { dismissLoader, loading, success } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { CheckIcon, TasksIcon } from "../icons";
import type { RewardTaskProp, TaskProp } from "../../../../types/task";

type Filter = "open" | "ready" | "done";

export default function DailyTasks() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { tasks, completed } = useSelector((state: RootState) => state.task);

  const [filter, setFilter] = useState<Filter>("open");
  const [verifyTask, setVerifyTask] = useState<TaskProp | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = tasks ?? [];
  const ready = (completed ?? []).filter((r) => !r.is_reward_claimed);
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
    filter === "done" ? claimed : filter === "ready" ? ready : pending;

  return (
    <>
      <div className="fx-sh">
        <h2>Daily tasks</h2>
        <div className="fx-tabs2">
          <button
            type="button"
            className={`fx-tab2 ${filter === "open" ? "on" : ""}`}
            onClick={() => setFilter("open")}
          >
            To do
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
            Claimed
          </button>
        </div>
      </div>

      <div>
        {visible.length === 0 && (
          <p className="fx-nempty">
            <b>
              {filter === "open"
                ? "Nothing to do right now."
                : filter === "ready"
                  ? "No rewards waiting."
                  : "Nothing claimed yet."}
            </b>
          </p>
        )}

        {filter === "open" &&
          pending.map((task, idx) => (
            <div className="fx-tk" key={task.id ?? idx}>
              <span className="fx-tkico">
                <TasksIcon />
              </span>
              <div className="fx-tkb">
                <b>{task.title}</b>
                <div className="fx-tkm">
                  <span>{parseInt(task.point_reward ?? "0")} points</span>
                  {task.token_reward && <span>{parseInt(task.token_reward)} CDE</span>}
                </div>
              </div>
              <div className="fx-tka">
                <button
                  className="fx-mini"
                  type="button"
                  onClick={() => {
                    if (task.url) window.open(task.url, "_blank");
                  }}
                >
                  View
                </button>
                <button className="fx-mini go" type="button" onClick={() => setVerifyTask(task)}>
                  Submit
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
                  <span>{parseInt(reward.point ?? "0")} points</span>
                  {reward.ai_unit && <span>{parseInt(reward.ai_unit)} CDE</span>}
                </div>
              </div>
              <div className="fx-tka">
                <span className="fx-tkr">
                  +{parseInt(reward.ai_unit ?? "0")} credits
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
                  <span>{parseInt(reward.point ?? "0")} points</span>
                </div>
              </div>
              <div className="fx-tka">
                <span className="fx-tkr">Claimed</span>
              </div>
            </div>
          ))}
      </div>

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
    </>
  );
}

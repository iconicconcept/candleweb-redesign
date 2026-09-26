import { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import taskService from "../../../../services/taskService";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { dismissLoader, loading } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { CheckIcon, TasksIcon } from "../icons";
import SubmitTaskDialog from "./SubmitTaskDialog";
import { dueState, typeTag } from "./taskMeta";
import type { RewardTaskProp, TaskProp } from "../../../../types/task";

type Filter = "open" | "review" | "ready" | "done";

const PAGE_SIZE = 4;

type Props = {
  /** Shows a footer link to the dedicated Daily tasks page — for previews
      of this list embedded elsewhere (the Academy page), not the page
      itself. Defaults off so `pages/dashboard/tasks.tsx` is unaffected. */
  linkToFullPage?: boolean;
};

export default function DailyTasks({ linkToFullPage }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { tasks, completed } = useSelector((state: RootState) => state.task);

  const [filter, setFilter] = useState<Filter>("open");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  };
  const [verifyTask, setVerifyTask] = useState<TaskProp | null>(null);
  const [viewReward, setViewReward] = useState<RewardTaskProp | null>(null);

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
            onClick={() => changeFilter("open")}
          >
            To do <em>{pending.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "review" ? "on" : ""}`}
            onClick={() => changeFilter("review")}
          >
            With a marker <em>{underReview.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "ready" ? "on" : ""}`}
            onClick={() => changeFilter("ready")}
          >
            Ready to claim <em>{ready.length}</em>
          </button>
          <button
            type="button"
            className={`fx-tab2 ${filter === "done" ? "on" : ""}`}
            onClick={() => changeFilter("done")}
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
          pending.slice(0, visibleCount).map((task, idx) => {
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
                  <button className="fx-mini" type="button" onClick={() => setVerifyTask(task)}>
                    Submit
                  </button>
                </div>
              </div>
            );
          })}

        {filter === "review" &&
          underReview.slice(0, visibleCount).map((reward, idx) => (
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
          ready.slice(0, visibleCount).map((reward, idx) => (
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
          claimed.slice(0, visibleCount).map((reward, idx) => (
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

      {visible.length > visibleCount && (
        <button
          type="button"
          className="fx-mini"
          style={{ display: "block", width: "100%", padding: "12px 0", marginTop: 12, textAlign: "center" }}
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Load more tasks
        </button>
      )}

      {linkToFullPage && (
        <Link
          href="/dashboard/tasks"
          className="fx-mini"
          style={{ display: "block", textAlign: "center", width: "100%", padding: "12px 0", marginTop: 12 }}
        >
          Open the full task page →
        </Link>
      )}

      <SubmitTaskDialog task={verifyTask} onClose={() => setVerifyTask(null)} />

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

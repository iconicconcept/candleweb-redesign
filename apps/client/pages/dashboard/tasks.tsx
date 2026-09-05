import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import taskService from "../../services/taskService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { loading, dismissLoader } from "../../components/alert/Toast";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import DailyTasks from "../../components/dashboard/focus/academy/DailyTasks";
import Leaderboard from "../../components/dashboard/focus/academy/Leaderboard";

export default function TasksDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);
  const { stats, streak, completed, leaderboards } = useSelector(
    (state: RootState) => state.task,
  );

  const [claimingAll, setClaimingAll] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token || null;

    dispatch(taskService.getTasks(axiosToken));
    dispatch(taskService.getTaskStats(axiosToken));
    dispatch(taskService.getReward(axiosToken));
    dispatch(taskService.getTaskStreak(axiosToken));
    dispatch(taskService.getLeaderboard(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const ready = (completed ?? []).filter((r) => !r.is_reward_claimed);
  const readyCredits = ready.reduce((sum, r) => sum + parseInt(r.ai_unit ?? "0"), 0);
  const readyPoints = ready.reduce((sum, r) => sum + parseInt(r.point ?? "0"), 0);

  const rank = [...(leaderboards ?? [])]
    .sort((a, b) => parseFloat(b.point ?? "0") - parseFloat(a.point ?? "0"))
    .findIndex((e) => e.account_id === user?.username);

  const claimAll = async () => {
    if (!ready.length || claimingAll) return;
    setClaimingAll(true);
    loading("Claiming rewards...");
    try {
      for (const reward of ready) {
        if (!reward.task_id) continue;
        await dispatch(
          taskService.claimReward({ api: axiosToken, id: reward.task_id.toString() }),
        ).unwrap();
      }
    } catch (err) {
      console.error(err);
    } finally {
      dismissLoader("");
      setClaimingAll(false);
    }
  };

  return (
    <>
      <Head>
        <title>Daily tasks | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="tasks">
        <TopBar
          crumb="Dashboard / Academy / Tasks"
          title="Daily tasks"
          subtitle="Small things that keep the streak alive. Finish one, then claim what it's worth."
        />

        {ready.length > 0 && (
          <div className="fx-claimbar rv d1">
            <div className="cb2">
              <em>Waiting to be claimed</em>
              <b>{readyCredits.toLocaleString()} credits</b>
              <span>
                {ready.length} task{ready.length === 1 ? "" : "s"} finished
                {readyPoints ? ` · ${readyPoints} point${readyPoints === 1 ? "" : "s"} as well` : ""}. Nothing
                expires — claim when you like.
              </span>
            </div>
            <button
              className="fx-cta main2"
              type="button"
              disabled={claimingAll}
              onClick={claimAll}
            >
              {claimingAll ? "Claiming…" : ready.length === 1 ? "Claim it" : `Claim all ${ready.length}`}
            </button>
          </div>
        )}

        <div className="fx-cap2 rv d2">
          <div className="fx-cp">
            <span>AI credits</span>
            <b className="up6">{parseInt((stats?.earned_units ?? 0).toString()).toLocaleString()}</b>
            <i>spend on your tutor and templates</i>
          </div>
          <div className="fx-cp">
            <span>Points earned</span>
            <b>{parseInt(stats?.point ?? "0").toLocaleString()}</b>
            <i>{stats?.level ? `Level ${stats.level}` : " "}</i>
          </div>
          <div className="fx-cp">
            <span>Class rank</span>
            <b className="am6">{rank !== -1 ? `#${rank + 1}` : "—"}</b>
            <i>ranked by points earned</i>
          </div>
          <div className="fx-cp">
            <span>Study streak</span>
            <b>{streak?.user_streak ?? 0}</b>
            <i>{streak?.total_task ? `${streak.total_task} tasks logged` : "days running"}</i>
          </div>
        </div>

        <section className="fx-sec">
          <DailyTasks />
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Top of your cohort</h2>
            <span className="sub2">Ranked by points earned.</span>
          </div>
          <Leaderboard />
        </section>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>About credits.</b> AI credits pay for your tutor sessions and project templates. They
            can&rsquo;t be bought, transferred or cashed out, and they carry over between courses. Points
            are separate — they place you in your cohort.
          </p>
        </div>
      </DashboardShell>
    </>
  );
}

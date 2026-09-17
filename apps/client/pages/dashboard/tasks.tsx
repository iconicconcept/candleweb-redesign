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

const BADGES: { key: "first" | "quiz" | "builder" | "clear"; title: string; sub: string; icon: JSX.Element }[] = [
  {
    key: "first",
    title: "First claim",
    sub: "You claimed a reward",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6.5 9.2 17.3 4 12.1" />
      </svg>
    ),
  },
  {
    key: "quiz",
    title: "Quiz clean",
    sub: "A quiz passed first time",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.6" />
        <path d="M8.6 12.2l2.3 2.3 4.5-4.7" />
      </svg>
    ),
  },
  {
    key: "builder",
    title: "Builder",
    sub: "A project marked and passed",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h16" />
        <path d="M6 20V9l6-5 6 5v11" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
  {
    key: "clear",
    title: "Inbox zero",
    sub: "Nothing left to do or claim",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 12.5 8 17l12.5-12" />
      </svg>
    ),
  },
];

export default function TasksDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);
  const { tasks, stats, streak, completed, leaderboards } = useSelector(
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

  /* Only count rewards a marker has actually verified — an unverified
     submission living in `completed` isn't claimable yet. */
  const ready = (completed ?? []).filter((r) => !r.is_reward_claimed && r.is_verified);
  const underReview = (completed ?? []).filter((r) => !r.is_reward_claimed && !r.is_verified);
  const claimed = (completed ?? []).filter((r) => r.is_reward_claimed);
  const readyCredits = ready.reduce((sum, r) => sum + parseInt(r.ai_unit ?? "0"), 0);
  const readyPoints = ready.reduce((sum, r) => sum + parseInt(r.point ?? "0"), 0);
  const inboxZero = (tasks ?? []).length === 0 && ready.length === 0 && underReview.length === 0;

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

        <section className="fx-mom">
          <div className="fx-sh">
            <h2>This week</h2>
            <span className="fx-preview">
              <i>◔</i> Weekly goal needs an endpoint
            </span>
          </div>
          <div className="fx-momgrid">
            <div>
              <div className="fx-scorehead">
                <div className="fx-ring" style={{ "--v": 0 } as React.CSSProperties} role="img" aria-label="Weekly goal">
                  <svg viewBox="0 0 44 44" aria-hidden="true">
                    <circle className="tr" cx="22" cy="22" r="19" />
                    <circle className="vl" cx="22" cy="22" r="19" />
                  </svg>
                  <b>—</b>
                </div>
                <div className="vt">
                  <b>No weekly goal yet</b>
                  <p>This card tracks against a weekly target once the backend defines one.</p>
                </div>
              </div>
              <div className="fx-streaks2">
                <div className="fx-stk2">
                  <span>Study streak</span>
                  <b>{streak?.user_streak ?? 0}</b>
                  <i>days running</i>
                </div>
                <div className="fx-stk2">
                  <span>Claimed without slipping</span>
                  <b className="amb3">{claimed.length}</b>
                  <i>rewards taken</i>
                </div>
              </div>
            </div>
            <div>
              <div className="fx-sh" style={{ marginBottom: "12px" }}>
                <h2 style={{ fontSize: "15px" }}>Earned</h2>
              </div>
              <div className="fx-badges2">
                {BADGES.map((b) => {
                  const won = b.key === "first" ? claimed.length > 0 : b.key === "clear" ? inboxZero : false;
                  const untracked = b.key === "quiz" || b.key === "builder";
                  return (
                    <div className={`fx-bdg ${won ? "won" : ""}`} key={b.key}>
                      <span className="lk2">{won ? "Earned" : "Locked"}</span>
                      <span className="bi">{b.icon}</span>
                      <b>{b.title}</b>
                      <span>{untracked ? "Needs task-type data to track" : b.sub}</span>
                    </div>
                  );
                })}
              </div>
              <p className="fx-tip2" style={{ borderTop: "1px solid var(--fx-line)", marginTop: "18px", paddingTop: "16px" }}>
                <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> Rewards sit here until you claim
                them — they don&rsquo;t expire and nothing is lost if you leave them. The deadline only
                affects your streak.
              </p>
            </div>
          </div>
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

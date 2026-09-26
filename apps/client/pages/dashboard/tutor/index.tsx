import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import taskService from "../../../services/taskService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import Dialog from "../../../components/dashboard/focus/Dialog";
import EnrolledCourses, {
  EnrolledCourse,
} from "../../../components/dashboard/focus/academy/EnrolledCourses";
import DailyTasks from "../../../components/dashboard/focus/academy/DailyTasks";
import Leaderboard from "../../../components/dashboard/focus/academy/Leaderboard";
import CourseShop from "../../../components/dashboard/focus/academy/CourseShop";
import { AcademyIcon, CheckIcon } from "../../../components/dashboard/focus/icons";

const AI_UNIT_VALUE_NGN = 64.1;

export default function AcademyDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();

  const { tasks, stats, completed, leaderboards, streak } = useSelector(
    (state: RootState) => state.task,
  );

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates?.NGN) setUsdRate(d.rates.NGN);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const currentToken = useUserStore.getState().user?.access_token;
    if (fetchedTokenRef.current === currentToken) return;
    fetchedTokenRef.current = currentToken || null;

    dispatch(taskService.getTasks(axiosToken));
    dispatch(taskService.getReward(axiosToken));
    dispatch(taskService.getTaskStats(axiosToken));
    dispatch(taskService.getTaskStreak(axiosToken));
    dispatch(taskService.getLeaderboard(axiosToken));

    setCoursesLoading(true);
    axiosToken
      .get("/tutor/courses/")
      .then(async ({ data }) => {
        const raw: any[] = Array.isArray(data?.data?.results) ? data.data.results : [];
        // The list endpoint carries no per-user progress, so every course would
        // read as "In progress / 0%". Pull each course's schedule and derive it
        // the same way the course-detail page does (a session whose end time has
        // passed, or one flagged is_completed, counts as done). Capped so an
        // unexpectedly large list can't fan out into a request storm.
        const enriched = await Promise.all(
          raw.map(async (c, i) => {
            if (i >= 15) return { ...c, progress: c.progress ?? 0 };
            try {
              const { data: d } = await axiosToken.get(`/tutor/courses/${c.id}/`);
              const detail = d?.data ?? d ?? {};
              const sched: any[] = Array.isArray(detail.class_schedules)
                ? detail.class_schedules
                : [];
              const now = Date.now();
              const total = sched.length;
              const isDone = (m: any) =>
                m?.is_completed === true || (m?.end_datetime && new Date(m.end_datetime).getTime() < now);
              const doneModules = sched.filter(isDone);
              const doneCount = doneModules.length;
              const progress =
                total > 0
                  ? Math.round((doneCount / total) * 100)
                  : (c.progress ?? 0);
              // Earliest completed session's end time, for "Where you stand"'s
              // "Module 1 completed on <date>" line — real data, not a guess.
              const firstCompletedAt = doneModules
                .map((m) => m?.end_datetime)
                .filter(Boolean)
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
              // Real remaining class time from each unfinished session's own
              // duration — no invented pace/hours-per-module assumption.
              const remainingMinutes = sched
                .filter((m) => !isDone(m))
                .reduce((sum, m) => sum + (Number(m?.duration_minutes) || 0), 0);
              return {
                ...c,
                progress,
                status: progress >= 100 ? "completed" : c.status,
                is_active: detail.is_active ?? c.is_active,
                instructor_name: c.instructor_name,
                totalModules: total,
                completedModulesCount: doneCount,
                remainingMinutes,
                firstCompletedAt,
              };
            } catch {
              return { ...c, progress: c.progress ?? 0 };
            }
          }),
        );
        setCourses(enriched);
      })
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [axiosToken, dispatch]);

  const aiUnits = stats?.earned_units ?? 0;
  const revenueNaira = aiUnits * AI_UNIT_VALUE_NGN;
  const revenueUsd = usdRate ? (revenueNaira / usdRate).toFixed(2) : null;

  const sortedLeaderboard = [...leaderboards].sort(
    (a, b) => parseFloat(b.point ?? "0") - parseFloat(a.point ?? "0"),
  );
  const rankIndex = sortedLeaderboard.findIndex((e) => e.account_id === user?.username);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  const completedModules = courses.reduce(
    (sum, c) => (c.progress && c.progress >= 100 ? sum + 1 : sum),
    0,
  );

  const hasCourses = !coursesLoading && courses.length > 0;

  // "Where you stand" — the course still in progress (or, if every enrolled
  // course is finished, the most recently completed one), and only courses
  // whose schedule actually came back with module data. No stand-in course
  // means no ring to show truthfully, so the section itself stays hidden.
  const standCourse =
    courses.find((c) => (c.totalModules ?? 0) > 0 && (c.progress ?? 0) < 100) ??
    courses.find((c) => (c.totalModules ?? 0) > 0);
  const standTotal = standCourse?.totalModules ?? 0;
  const standDone = standCourse?.completedModulesCount ?? 0;
  const standPct = standCourse?.progress ?? 0;
  const standHalfway = Math.ceil(standTotal / 2);
  const standHours = Math.round((standCourse?.remainingMinutes ?? 0) / 60);
  const standVerdict =
    standPct >= 100 ? "Done" : standPct >= 50 ? "Nearly there" : standPct >= 20 ? "Properly underway" : "Just starting";
  const cohortSize = leaderboards.length;
  const inTop20 = !!rank && cohortSize > 0 && rank <= Math.ceil(cohortSize * 0.2);
  const standBadges: { key: string; title: string; sub: string; won: boolean; icon: JSX.Element }[] = [
    {
      key: "first",
      title: "First module done",
      sub: standDone > 0 ? "You turned up and finished one" : "Finish your first module",
      won: standDone > 0,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 6.5 9.2 17.3 4 12.1" />
        </svg>
      ),
    },
    {
      key: "half",
      title: "Halfway there",
      sub: standPct >= 50 ? "Past 50% of the syllabus" : `${Math.max(0, standHalfway - standDone)} more module${standHalfway - standDone === 1 ? "" : "s"} to reach halfway`,
      won: standPct >= 50,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 3.4v8.6l6 3.5" />
        </svg>
      ),
    },
    {
      key: "builder",
      title: "Builder",
      sub: "Needs project-type data to track",
      won: false,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h16" />
          <path d="M6 20V9l6-5 6 5v11" />
          <path d="M10 20v-6h4v6" />
        </svg>
      ),
    },
    {
      key: "top",
      title: "Top 20%",
      sub: inTop20 ? "Ahead of most of your cohort" : "Ranked by points earned",
      won: inTop20,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Academy | Candleweb</title>
        <meta
          name="description"
          content="Your Candleweb Academy dashboard — courses, daily tasks and your cohort standing."
        />
      </Head>

      <DashboardShell active="academy">
        <TopBar
          crumb="Dashboard / Academy"
          title="Academy"
          subtitle={
            hasCourses
              ? "Your courses, your progress, and what's open to enrol."
              : "Learn to build the thing that trades for you."
          }
        />

        <div className="fx-cap2 rv d1">
          <div className="fx-cp">
            <span>AI credits</span>
            <b className="up6">{aiUnits.toLocaleString()}</b>
            <i>
              ≈ ₦{revenueNaira.toLocaleString()}
              {revenueUsd ? ` · $${revenueUsd}` : ""}
            </i>
          </div>
          <div className="fx-cp">
            <span>Courses completed</span>
            {coursesLoading ? (
              <>
                <b>
                  <span className="fx-spin" />
                </b>
                <i>loading…</i>
              </>
            ) : (
              <>
                <b>{completedModules}</b>
                <i>of {courses.length} enrolled</i>
              </>
            )}
          </div>
          <div className="fx-cp">
            <span>Class rank</span>
            <b className="am6">{rank ? `#${rank}` : "—"}</b>
            <i>{stats?.point ? `${stats.point} points` : " "}</i>
          </div>
          <div className="fx-cp">
            <span>Study streak</span>
            <b>{streak?.user_streak ?? 0}</b>
            <i>
              {streak?.user_streak === 1 ? "week" : "weeks"} running
              {(streak?.longest_streak ?? 0) > (streak?.user_streak ?? 0)
                ? ` · best ${streak?.longest_streak}`
                : ""}
            </i>
          </div>
        </div>

        {coursesLoading ? (
          <section
            className="fx-mom rv d2"
            style={{
              marginTop: "clamp(26px,3.4vw,38px)",
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--fx-t3)",
              fontSize: 13,
            }}
          >
            <span className="fx-spin" /> Loading your progress…
          </section>
        ) : (
          standCourse && (
          <section className="fx-mom rv d2" style={{ marginTop: "clamp(26px,3.4vw,38px)", paddingTop: 24 }}>
            <div className="fx-sh">
              <h2>
                Where you stand <span className="sub2">{standDone} of {standTotal} modules in {standCourse.title}</span>
              </h2>
              <button className="fx-link" type="button" onClick={() => setShowPointsInfo(true)}>
                How points work →
              </button>
            </div>
            <div className="fx-momgrid">
              <div>
                <div className="fx-scorehead">
                  <div className="fx-ring" style={{ "--v": standPct } as React.CSSProperties} role="img" aria-label="Course progress">
                    <svg viewBox="0 0 44 44" aria-hidden="true">
                      <circle className="tr" cx="22" cy="22" r="19" />
                      <circle className="vl" cx="22" cy="22" r="19" />
                    </svg>
                    <b>{standPct}</b>
                  </div>
                  <div className="vt">
                    <b>{standVerdict}</b>
                    <p>
                      {standPct >= 100
                        ? "Every module is done. Your certificate is waiting on the course page."
                        : `${standTotal - standDone} module${standTotal - standDone === 1 ? "" : "s"} left` +
                          (standHours > 0 ? `, roughly ${standHours} hour${standHours === 1 ? "" : "s"} of class time.` : ".")}
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <div className={`fx-ul ${standDone > 0 ? "got3" : ""}`}>
                    <i>{standDone > 0 ? "✓" : "1"}</i>
                    <div>
                      <b>You started</b>
                      <span>
                        {standDone > 0
                          ? standCourse.firstCompletedAt
                            ? `Module 1 done on ${new Date(standCourse.firstCompletedAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}`
                            : "Your first module is done"
                          : "Finish your first module"}
                      </span>
                    </div>
                  </div>
                  <div className={`fx-ul ${standPct >= 50 ? "got3" : ""}`}>
                    <i>{standPct >= 50 ? "✓" : "2"}</i>
                    <div>
                      <b>Past the halfway mark</b>
                      <span>
                        {standPct >= 50
                          ? `You're past module ${standHalfway}`
                          : `${Math.max(0, standHalfway - standDone)} more module${standHalfway - standDone === 1 ? "" : "s"} to reach halfway`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="fx-sh" style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15 }}>Earned</h2>
                </div>
                <div className="fx-badges2">
                  {standBadges.map((b) => (
                    <div className={`fx-bdg ${b.won ? "won" : ""}`} key={b.key}>
                      <span className="lk2">{b.won ? "Earned" : "Locked"}</span>
                      <span className="bi">{b.icon}</span>
                      <b>{b.title}</b>
                      <span>{b.sub}</span>
                    </div>
                  ))}
                </div>
                <p className="fx-tip2" style={{ borderTop: "1px solid var(--fx-line)", marginTop: 18, paddingTop: 16 }}>
                  <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> Rank comes from modules, quizzes and
                  projects — not from how much you paid or how long you spent logged in.
                </p>
              </div>
            </div>
          </section>
          )
        )}

        {coursesLoading ? (
          <div className="fx-empty rv d2">
            <div className="eic">
              <span className="fx-spin" style={{ width: 20, height: 20, borderWidth: 3 }} />
            </div>
            <h2>Loading your courses…</h2>
          </div>
        ) : courses.length === 0 ? (
          <div className="fx-empty rv d2">
            <div className="eic">
              <AcademyIcon />
            </div>
            <h2>You&apos;re not enrolled in anything yet</h2>
            <p>
              Candleweb runs short, cohort-based courses in AI automation, personal finance and
              crypto trading. You build real things rather than watching videos, and most people
              finish their first working automation in a weekend.
            </p>
          </div>
        ) : (
          <div className="rv d2" style={{ marginTop: "clamp(26px,3.4vw,38px)" }}>
            <EnrolledCourses courses={courses} />
          </div>
        )}

        <section className="fx-sec">
          <div className="fx-cols">
            <div>
              <DailyTasks linkToFullPage />
            </div>
            <div>
              <div className="fx-sh">
                <h2>Top of your cohort</h2>
                <span className="sub2">Ranked by points earned.</span>
              </div>
              <Leaderboard />
            </div>
          </div>
        </section>

        <section className="fx-sec" id="enrol">
          <div className="fx-sh">
            <h2>Available to enrol</h2>
            <span className="sub2">Your dashboard unlocks the moment payment clears.</span>
          </div>
          <CourseShop excludeIds={courses.map((c) => c.id)} />
        </section>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>About course fees.</b> These are charged once, for teaching. They are not an
            investment and give you no share of trading profits or income. Classes run live at set
            times — check the schedule fits your week before enrolling.
          </p>
        </div>

        <Dialog
          open={showPointsInfo}
          onClose={() => setShowPointsInfo(false)}
          icon={<CheckIcon />}
          title="How points and credits work"
          subtitle="Two different things, earned the same way"
          labelledBy="points-info-title"
          footer={
            <button className="fx-cta main2" type="button" onClick={() => setShowPointsInfo(false)}>
              Got it
            </button>
          }
        >
          <p className="fx-dwarn">
            Modules, quizzes, readings and projects each carry their own points and AI credits —
            you&rsquo;ll always see exactly what a task is worth before you submit it.
          </p>
          <p className="fx-dwarn">
            <b>Points</b> place you in your cohort and reset each course. <b>Credits</b> are yours to
            spend on the AI tutor and project templates, and they carry over between courses. Neither
            can be bought, and neither has cash value.
          </p>
        </Dialog>
      </DashboardShell>
    </>
  );
}

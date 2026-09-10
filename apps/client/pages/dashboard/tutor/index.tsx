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
import EnrolledCourses, {
  EnrolledCourse,
} from "../../../components/dashboard/focus/academy/EnrolledCourses";
import DailyTasks from "../../../components/dashboard/focus/academy/DailyTasks";
import Leaderboard from "../../../components/dashboard/focus/academy/Leaderboard";
import CourseShop from "../../../components/dashboard/focus/academy/CourseShop";
import { AcademyIcon } from "../../../components/dashboard/focus/icons";

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
              const doneCount = sched.filter(
                (m) =>
                  m?.is_completed === true ||
                  (m?.end_datetime && new Date(m.end_datetime).getTime() < now),
              ).length;
              const progress =
                total > 0
                  ? Math.round((doneCount / total) * 100)
                  : (c.progress ?? 0);
              return {
                ...c,
                progress,
                status: progress >= 100 ? "completed" : c.status,
                is_active: detail.is_active ?? c.is_active,
                instructor_name: c.instructor_name,
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
            <b>{completedModules}</b>
            <i>of {courses.length} enrolled</i>
          </div>
          <div className="fx-cp">
            <span>Class rank</span>
            <b className="am6">{rank ? `#${rank}` : "—"}</b>
            <i>{stats?.point ? `${stats.point} points` : " "}</i>
          </div>
          <div className="fx-cp">
            <span>Study streak</span>
            <b>{streak?.user_streak ?? 0}</b>
            <i>{streak?.total_task ? `${streak.total_task} tasks logged` : "days running"}</i>
          </div>
        </div>

        {!coursesLoading && courses.length === 0 ? (
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
              <DailyTasks />
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
      </DashboardShell>
    </>
  );
}

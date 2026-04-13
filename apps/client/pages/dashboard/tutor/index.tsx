import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import Wrapper from "../../../components/dashboard/wrapper";
import {
  Button,
  Progress,
  SvgIcons,
  joinClasses,
  DashTextInput,
  Heading,
  maskWalletAddress,
  Modal,
  StreakJson,
  Typography,
  UserAvatarImage,
} from "ui";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import taskService from "../../../services/taskService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import { useRouter } from "next/router";
import { imageUri } from "../../../utils/constants";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import {
  IoChevronDown,
  IoChevronUp,
  IoPlayCircleOutline,
} from "react-icons/io5";
import { FiLink } from "react-icons/fi";
import {
  dismissLoader,
  loading,
  success,
} from "../../../components/alert/Toast";

// ── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  username: string;
  email: string;
  wallet_address: string;
  is_live_mode: boolean;
  date_of_birth: string;
}

interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  is_active?: boolean;
  instructor_name?: string;
  status?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

// We will use UserAvatarImage instead of humanAvatar

const TutorDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const router = useRouter();
  const { user } = useUserStore();

  const { tasks, stats, completed, leaderboards } = useSelector(
    (state: RootState) => state.task,
  );

  // Local State
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedTabIndex, setSelectedTabIndex] = useState<0 | 1>(0);
  const [openVerifyModal, setOpenVerifyModal] = useState<{
    open: boolean;
    data?: any;
  }>({ open: false });
  const [verifyLink, setVerifyLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);
  const userProfile = user;

  // ── Revenue Calc from stats ───────────────────────────────────────────────
  // earned_units from task/stats → multiply by 64.10 NGN per AI unit
  const aiUnits = stats?.earned_units ?? 0;
  const AI_UNIT_VALUE_NGN = 64.1;
  const revenueNaira = aiUnits * AI_UNIT_VALUE_NGN;
  const revenueUsd = usdRate ? (revenueNaira / usdRate).toFixed(2) : null;
  const completedBadges = ["AI", "PY", "UX"].slice(
    0,
    Math.min(courses.length, 3),
  );

  // ── Fetch USD rate (open exchange rates - free tier) ──────────────────────
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates?.NGN) setUsdRate(d.rates.NGN);
      })
      .catch(() => {});
  }, []);

  // ── Fetch all data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;

    const currentToken = useUserStore.getState().user?.access_token;

    // Only fetch if we haven't fetched with this token yet
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
      .then(({ data }) => {
        const raw = data?.data?.results ?? [];
        setCourses(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [axiosToken, dispatch]);

  // Visible courses: first 2 or all
  const visibleCourses = showAllCourses ? courses : courses.slice(0, 2);

  const pendingTasks = tasks ?? [];
  const completedTasks = completed ?? [];

  return (
    <>
      <Head>
        <title>Tutor Dashboard | Candleweb</title>
        <meta
          name="description"
          content="Your Candleweb tutor learning dashboard with course progress and earnings."
        />
      </Head>
      <Wrapper>
        <div className="dash__content">
          {/* ── Sub-header ──────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <p className="text-sm text-white mb-1">
                Welcome, {userProfile?.username || "Partner"}
              </p>
              {/* <p className="text-sm text-white/70">
                Your learning ecosystem is performing at{" "}
                <span className="text-primary font-semibold">+24%</span> this
                week.
              </p> */}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden relative"
                  >
                    <Image
                      src={UserAvatarImage}
                      alt={`Student ${i}`}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] text-black font-bold">
                  +12
                </div>
              </div>
            </div>
          </div>

          {/* ── 3 Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Card 1: Total Course Revenue */}
            <div className="bg-card rounded-xl p-6 relative overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 opacity-30 text-white text-4xl">
                {SvgIcons.trades}
              </div>
              <p className="text-[10px] font-black text-txtGray tracking-[0.2em] uppercase mb-4">
                Total Course Revenue
              </p>
              <p className="text-3xl font-black text-white mb-1">
                {formatNaira(revenueNaira)}
              </p>
              {revenueUsd && (
                <p className="text-sm text-txtGray mb-3">≈ ${revenueUsd} USD</p>
              )}
              {/* <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                <span>↗</span> 12.5% this month
              </div> */}
            </div>

            {/* Card 2: AI Units Earned */}
            <div className="bg-card rounded-xl p-6 relative overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 opacity-30 text-primary text-4xl">
                {SvgIcons.tasks}
              </div>
              <p className="text-[10px] font-black text-txtGray tracking-[0.2em] uppercase mb-4">
                AI Units Earned
              </p>
              <p className="text-3xl font-black text-primary mb-3">
                {aiUnits.toLocaleString()}
              </p>
              <div className="space-y-2">
                <Progress
                  progress={Math.min((aiUnits / 6000) * 100, 100)}
                  color="#27ECB0"
                />
                <p className="text-[10px] text-txtGray tracking-widest uppercase">
                  {Math.round((aiUnits / 6000) * 100)}% of monthly quota
                </p>
              </div>
            </div>

            {/* Card 3: Completed Courses */}
            <div className="bg-card rounded-xl p-6 relative overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 opacity-30 text-txtGray text-4xl">
                {SvgIcons.portfolio}
              </div>
              <p className="text-[10px] font-black text-txtGray tracking-[0.2em] uppercase mb-4">
                Enrolled Courses
              </p>
              <p className="text-3xl font-black text-white mb-4">
                {courses.length}
              </p>
              <div className="flex gap-2 flex-wrap">
                {completedBadges.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-txtGray uppercase"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main two-column layout ───────────────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6">
            {/* ── LEFT: Courses + Tasks ──────────────────────────────────── */}
            <div className="flex-1 space-y-8 min-w-0">
              {/* Your Learning */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <Heading textsize="sm" classstyle="font-bold text-white">
                    Your Learning
                  </Heading>
                  {courses.length > 2 && (
                    <button
                      onClick={() => setShowAllCourses((v) => !v)}
                      className="text-primary text-xs font-black tracking-widest uppercase hover:underline flex items-center gap-1"
                    >
                      {showAllCourses ? "SHOW LESS" : "VIEW ALL"}
                      {showAllCourses ? (
                        <IoChevronUp size={14} />
                      ) : (
                        <IoChevronDown size={14} />
                      )}
                    </button>
                  )}
                </div>

                {coursesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-card rounded-xl h-[260px] animate-pulse"
                      />
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="bg-card rounded-xl p-10 text-center border border-white/5">
                    <p className="text-txtGray text-sm">
                      No enrolled courses yet.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 ${
                      courses.length === 1
                        ? "grid-cols-1"
                        : "grid-cols-1 md:grid-cols-2"
                    }`}
                  >
                    {visibleCourses.map((course) => {
                      const progress = course.progress ?? 0;
                      const isActive =
                        course.is_active !== false &&
                        course.status !== "paused";
                      return (
                        <div
                          key={course.id}
                          className={`bg-card rounded-xl overflow-hidden border border-white/5 group transition-all duration-300
                          ${courses.length === 1 ? "row-span-2" : ""}`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-44 bg-[#141414] flex items-center justify-center overflow-hidden">
                            {course.thumbnail ? (
                              <img
                                src={
                                  course.thumbnail.startsWith("http")
                                    ? course.thumbnail
                                    : `${imageUri}${course.thumbnail}`
                                }
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 opacity-20">
                                <span className="text-5xl font-black text-white">
                                  {course.title?.charAt(0) ?? "C"}
                                </span>
                                <span className="text-xs text-white tracking-widest uppercase">
                                  A COURSE
                                </span>
                              </div>
                            )}
                            {/* Status badge */}
                            <span
                              className={joinClasses(
                                "absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                                isActive
                                  ? "bg-primary/20 text-primary"
                                  : "bg-orange-500/20 text-orange-400",
                              )}
                            >
                              {isActive ? "ACTIVE" : "PAUSED"}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="p-5">
                            <h4 className="font-bold text-white text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                              {course.title}
                            </h4>
                            {course.instructor_name && (
                              <p className="text-xs text-txtGray mb-3">
                                {course.instructor_name}
                              </p>
                            )}
                            <p className="text-xs text-txtGray mb-4 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-txtGray tracking-widest uppercase">
                                  Progress
                                </p>
                                <p className="text-xs font-black text-white">
                                  {progress}%
                                </p>
                              </div>
                              <Progress progress={progress} color="#27ECB0" />
                              <Button
                                fullwidth
                                variant="transparent"
                                classstyle="mt-5 !bg-[#FFB322] !text-black border-none font-bold text-sm rounded-full py-4 transition-all duration-300 active:scale-95 shadow-[0_8px_30px_rgba(255,179,34,0.3)] hover:brightness-110 flex items-center justify-center gap-2"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/tutor/course/${course.id}/`,
                                  )
                                }
                                icon={<IoPlayCircleOutline size={20} />}
                              >
                                Start Learning
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                {/* Header + Tabs */}
                <div className="flex items-center justify-between mb-5">
                  <Heading textsize="sm" classstyle="font-bold text-white">
                    Daily Tasks
                  </Heading>

                  <div className="flex bg-[#2D2F36] border border-[#353840] rounded-full p-1 text-xs">
                    <button
                      onClick={() => setSelectedTabIndex(0)}
                      className={`px-4 py-2 rounded-full font-bold transition ${
                        selectedTabIndex === 0
                          ? "bg-primary text-black"
                          : "text-white/70"
                      }`}
                    >
                      Pending
                    </button>

                    <button
                      onClick={() => setSelectedTabIndex(1)}
                      className={`px-4 py-2 rounded-full font-bold transition ${
                        selectedTabIndex === 1
                          ? "bg-primary text-black"
                          : "text-white/70"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                {/* BODY */}
                <div className="space-y-3">
                  {/* ───── ACTIVE TASKS ───── */}
                  {selectedTabIndex === 0 && (
                    <>
                      {pendingTasks.length === 0 ? (
                        <div className="bg-card rounded-xl p-6 text-center border border-white/5">
                          <p className="text-txtGray text-sm">
                            No active tasks.
                          </p>
                        </div>
                      ) : (
                        pendingTasks.map((task: any) => (
                          <div
                            key={task.id}
                            className="bg-card rounded-xl p-5 flex items-center gap-4 border border-white/5 hover:border-white/15 transition"
                          >
                            {/* VERIFY BUTTON */}
                            <button
                              onClick={() =>
                                setOpenVerifyModal({ open: true, data: task })
                              }
                              className="w-7 h-7 rounded-md border border-white/90 bg-white/20 flex items-center justify-center hover:border-primary hover:bg-white/10 transition cursor-pointer"
                            >
                              {/* <span className="text-xs text-white/70">✓</span> */}
                            </button>
                            
                            {/* <button
                              onClick={() =>
                                setOpenVerifyModal({ open: true, data: task })
                              }
                              className="w-7 h-7 rounded-md border border-txt-yellow/80 bg-transparent
                              flex items-center justify-center
                              hover:bg-txt-yellow/10 hover:border-txt-yellow
                              transition cursor-pointer"
                            >
                              {/* optional check icon when needed
                            </button> */}

                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">
                                {task.title}
                              </p>

                              {task.end_date && (
                                <p className="text-[11px] text-txtGray mt-0.5">
                                  Due{" "}
                                  {new Date(task.end_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* ───── COMPLETED TASKS ───── */}
                  {selectedTabIndex === 1 && (
                    <>
                      {completedTasks.length === 0 ? (
                        <div className="bg-card rounded-xl p-6 text-center border border-white/5">
                          <p className="text-txtGray text-sm">
                            No completed tasks.
                          </p>
                        </div>
                      ) : (
                        completedTasks.map((reward: any) => (
                          <div
                            key={reward.id}
                            className="bg-card rounded-xl p-5 flex items-center gap-4 border border-primary/20 opacity-70"
                          >
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                              🧑
                            </div>

                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-400 line-through">
                                {reward.title}
                              </p>

                              <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">
                                Completed
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Top Class Earners ───────────────────────────────── */}
            <div className="xl:w-[280px] flex-shrink-0">
              <div className="bg-card rounded-xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <Heading
                    textsize="sm"
                    classstyle="font-bold text-white text-sm"
                  >
                    Top Class Earners
                  </Heading>
                  <span className="text-lg">🏆</span>
                </div>

                {/* Leaderboard list */}
                <div className="space-y-3">
                  {leaderboards.length === 0 && (
                    <p className="text-xs text-txtGray text-center py-4">
                      Loading leaderboard...
                    </p>
                  )}
                  {leaderboards.slice(0, 4).map((entry, idx) => (
                    <div
                      key={idx}
                      className={joinClasses(
                        "flex items-center gap-3 p-3 rounded-xl transition-all",
                        idx === 0
                          ? "bg-[#1e1e1e] border border-white/10"
                          : "hover:bg-white/5",
                      )}
                    >
                      <span
                        className={joinClasses(
                          "text-sm font-black w-4 flex-shrink-0",
                          idx === 0 ? "text-orange-400" : "text-txtGray",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={UserAvatarImage}
                          alt={entry.account_id || `Rank ${idx + 1}`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-black text-white">
                            1
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {entry.account_id
                            ? `${entry.account_id}`
                            : `Rank #${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-txtGray">
                          {entry.level ?? "-"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-primary">
                          {Math.floor(parseFloat(entry.point ?? "0"))} Pts
                        </p>
                        {idx === 0 && (
                          <p className="text-[9px] text-orange-400 font-black">
                            TOP 1%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Your Performance Card */}
                <div className="bg-[#1e1e1e] rounded-xl p-5 border border-white/10 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="w-full h-full rounded-full border-4 border-primary flex items-center justify-center overflow-hidden bg-white/10">
                      <Image
                        src={UserAvatarImage}
                        alt="You"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-card">
                      #12
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-txtGray tracking-widest uppercase mb-1">
                      Your Performance
                    </p>
                    <p className="text-2xl font-black text-white">Rank #12</p>
                    <p className="text-xs text-primary mt-1">
                      Keep learning to earn more
                    </p>
                  </div>
                  {/* <button className="w-full py-2.5 border border-white/20 rounded-lg text-[11px] font-black text-white tracking-widest uppercase hover:bg-white/5 transition-all">
                    Full Rankings
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
      <Modal
        title={"Submit Task"}
        width="500px"
        isOpen={openVerifyModal.open}
        onChnage={(e) => setOpenVerifyModal({ data: undefined, open: e })}
      >
        <div className="flex flex-col items-start text-center">
          <Typography textsize="xs" classstyle="!mb-2 !font-normal">
            Kindly provide the link to the completed task.
          </Typography>

          <DashTextInput
            type="text"
            name="verify_link"
            placeholder="Paste interaction link here"
            label="Verification link"
            value={verifyLink}
            Icon={<FiLink />}
            onChange={(e) => setVerifyLink(e.target.value)}
          />

          <div className="mt-5 w-full">
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  loading("Verifying...");

                  const res = await dispatch(
                    taskService.verifyReward({
                      api: axiosToken,
                      data: {
                        task_id: openVerifyModal.data?.id,
                        link: verifyLink,
                      },
                    }),
                  ).unwrap();

                  if (res.status === "success") {
                    dispatch(taskService.getTasks(axiosToken));
                    dispatch(taskService.getReward(axiosToken));
                    dispatch(taskService.getTaskStats(axiosToken));
                    dispatch(taskService.getTaskStreak(axiosToken));
                    success(res.message);
                  }

                  setOpenVerifyModal({ open: false });
                  setVerifyLink("");
                } catch (err) {
                  // Error is already handled and toasted by the taskService
                  console.error("Verification failed:", err);
                } finally {
                  dismissLoader("");
                  setIsLoading(false);
                }
              }}
            >
              Proceed
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TutorDashboard;

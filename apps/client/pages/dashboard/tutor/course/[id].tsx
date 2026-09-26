import Head from "next/head";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { AppDispatch, RootState } from "../../../../redux/store";
import { setChatOpen } from "../../../../redux/slices/agentSlice";
import courseService, { CourseAiUnits } from "../../../../services/courseService";
import taskService from "../../../../services/taskService";
import certificateService, {
  CertificateInfo,
} from "../../../../services/certificateService";
import useUserStore from "../../../../lib/hooks/useUserStore";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import { imageUri } from "../../../../utils/constants";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";
import Dialog from "../../../../components/dashboard/focus/Dialog";
import {
  CheckIcon,
  PlayIcon,
  LockIcon,
  DocIcon,
  CalendarIcon,
} from "../../../../components/dashboard/focus/icons";
import AIAgentChat from "../../../../components/dashboard/AIAgentChat";
import CourseTasks from "../../../../components/dashboard/focus/academy/CourseTasks";

/* Check-in (and so joining) opens this long before a class starts. */
const CHECK_IN_EARLY_MS = 15 * 60 * 1000;

const normalizeRouteId = (id: string | string[] | undefined) =>
  Array.isArray(id) ? id[0] : id;

const formatModuleDateTime = (datetime?: string, duration?: number) => {
  if (!datetime) return duration ? `${duration} mins` : "";
  const formatted = new Date(datetime).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return duration ? `${formatted} · ${duration} mins` : formatted;
};

export default function CourseFocus() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { id } = router.query;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<"all" | "todo" | "done">("all");
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

  const { user } = useUserStore();
  const username = user?.username;

  // Real study-streak number (same source the Academy/Tasks pages use) for
  // the course stats band — not fetched anywhere else on this page.
  const { streak } = useSelector((state: RootState) => state.task);
  const fetchedStreakTokenRef = useRef<string | null>(null);
  const [courseTasksLoaded, setCourseTasksLoaded] = useState(false);
  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (fetchedStreakTokenRef.current === token) return;
    fetchedStreakTokenRef.current = token || null;
    dispatch(taskService.getTaskStreak(axiosToken));
    // this course's tasks (+ rewards, to hide ones already submitted)
    dispatch(taskService.getCourseTasks(axiosToken)).finally(() => setCourseTasksLoaded(true));
    dispatch(taskService.getReward(axiosToken));
  }, [axiosToken, dispatch]);

  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certDownloading, setCertDownloading] = useState(false);

  const scheduleModules = Array.isArray(course?.class_schedules) ? course.class_schedules : [];
  const now = new Date();

  const modules = scheduleModules.map((m: any, idx: number) => {
    const scheduledTime = new Date(m.scheduled_datetime);
    const endTime = new Date(m.end_datetime);
    const isLive = now >= scheduledTime && now <= endTime;
    const isUpcoming = now < scheduledTime;
    const isActuallyCompleted = m.is_completed || now > endTime;
    const canJoin =
      now.getTime() >= scheduledTime.getTime() - CHECK_IN_EARLY_MS && now <= endTime;
    return {
      ...m,
      scheduledTime,
      endTime,
      isLive,
      isUpcoming,
      isActuallyCompleted,
      canJoin,
      inferredStatus: isActuallyCompleted ? "COMPLETED" : isLive ? "CURRENT" : "LOCKED",
      topic: m.topic || m.title || m.course_title || `Module ${idx + 1}`,
      // Its real position in the syllabus — carried through filtering, since
      // the "To do"/"Complete" tabs mean a row's position in the *rendered*
      // list is no longer its module number.
      moduleNumber: idx + 1,
    };
  });

  const firstIncompleteIndex = modules.findIndex((m: any) => !m.isActuallyCompleted);
  const enhancedModules = modules.map((m: any, idx: number) => ({
    ...m,
    isNext: idx === firstIncompleteIndex,
  }));

  useEffect(() => {
    if (!modules.length) return;
    if (selectedModuleId === null) {
      const live =
        modules.find((m: any) => m.isLive) ||
        modules.find((m: any) => m.isUpcoming) ||
        modules[0];
      setSelectedModuleId(live.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules.length]);

  const totalModules = scheduleModules.length;
  const completedCount = modules.filter((m: any) => m.isActuallyCompleted).length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const selectedModule = modules.find((m: any) => m.id === selectedModuleId) || modules[0] || null;
  const openModule = modules.find((m: any) => m.id === openModuleId) || null;

  const filteredModules = enhancedModules.filter((m: any) =>
    moduleFilter === "done" ? m.isActuallyCompleted : moduleFilter === "todo" ? !m.isActuallyCompleted : true,
  );
  const displayModules =
    showAllModules || moduleFilter !== "all" ? filteredModules : filteredModules.slice(0, 10);

  // Course stats band — module count + progress % are already computed above;
  // next class and streak are real too (schedule live/upcoming flags, and the
  // same task-streak endpoint the Academy/Tasks pages use).
  const liveModule = modules.find((m: any) => m.isLive);
  const upcomingModule = modules.find((m: any) => m.isUpcoming);

  useEffect(() => {
    if (!router.isReady) return;
    const courseId = normalizeRouteId(id);
    if (!courseId) return;
    setLoading(true);
    setError(null);
    courseService
      .getCourseById(courseId)
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load course details");
        setLoading(false);
      });
  }, [id, router.isReady]);

  const courseCode = course?.course_code;

  // AI units earned from THIS course's tasks (claimed rewards only).
  const [aiUnits, setAiUnits] = useState<CourseAiUnits | null>(null);
  const [aiUnitsError, setAiUnitsError] = useState<string | null>(null);
  useEffect(() => {
    if (!router.isReady || !isAuthorizationHeaderSet(axiosToken)) return;
    const courseId = normalizeRouteId(id);
    if (!courseId) return;
    let cancelled = false;
    courseService
      .getCourseAiUnits(axiosToken, courseId)
      .then((d) => {
        if (cancelled) return;
        setAiUnits(d);
        setAiUnitsError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setAiUnits(null);
        setAiUnitsError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router.isReady, axiosToken]);

  useEffect(() => {
    if (!username || !courseCode) {
      setCertificate(null);
      return;
    }
    let cancelled = false;
    setCertLoading(true);
    certificateService
      .getStudentCertificates(username)
      .then((data) => {
        if (cancelled) return;
        setCertificate(certificateService.findCertificateForCourse(data.certificate, courseCode) || null);
      })
      .catch(() => !cancelled && setCertificate(null))
      .finally(() => !cancelled && setCertLoading(false));
    return () => {
      cancelled = true;
    };
  }, [username, courseCode]);

  const isCertificateIssued = !!certificate?.is_issued;

  const handleDownloadCertificate = async () => {
    if (!username) return toast.error("Please log in to download your certificate");
    if (!courseCode) return toast.error("Certificate is not available for this course");
    if (certLoading || certDownloading) return;
    if (!certificate || !certificate.is_issued) {
      return toast.error("Your certificate is not yet available. It hasn't been issued for this course yet.");
    }
    try {
      setCertDownloading(true);
      await certificateService.downloadCertificate(
        username,
        certificate.certificate_number,
        courseCode,
        `${course?.title || "certificate"}.png`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Your certificate is not yet available. Please check back later.");
    } finally {
      setCertDownloading(false);
    }
  };

  const openResource = (link: string | null | undefined, type: "presentation" | "recording") => {
    if (!link) {
      toast.error(`${type === "presentation" ? "Presentation" : "Recording"} link not yet available`);
      return;
    }
    window.open(link, "_blank");
  };

  const nextSession =
    modules.find((m: any) => m.isLive) ||
    modules.find((m: any) => m.isUpcoming) ||
    modules[modules.length - 1] ||
    null;

  const [joining, setJoining] = useState(false);

  /* Joining goes through check-in: it records attendance (which counts toward
     the streak) and hands back the link to open. The schedule's own
     class_link is deliberately not used. */
  const onJoinCourse = async (target = nextSession) => {
    if (!target) return toast.error("No active class available");
    if (target.isActuallyCompleted) return toast.error("This class has finished");
    if (!target.canJoin)
      return toast.error("You can join from 15 minutes before the class starts");
    if (joining) return;

    // Open the tab now, while we're still inside the click — a window opened
    // after the request returns gets caught by popup blockers.
    const tab = window.open("", "_blank");
    setJoining(true);
    try {
      const link = await courseService.checkInToClass(axiosToken, target.id);
      if (tab) tab.location.href = link;
      else window.location.href = link;
    } catch (err: any) {
      tab?.close();
      toast.error(err?.message || "Couldn't check you in to this class");
    } finally {
      setJoining(false);
    }
  };

  const defaultBenefits = [
    { label: "Certified NFT Diploma", icon: "🎓" },
    // "AI credits" is the name used everywhere else in the app — this used
    // to read "500 LMN Credits", a leftover from an earlier naming scheme.
    { label: "500 AI credits", icon: "⭐" },
  ];
  const displayBenefits =
    course?.benefits && course.benefits.length > 0
      ? course.benefits.map((b: any) => (typeof b === "string" ? { label: b, icon: "⭐" } : b))
      : defaultBenefits;

  const thumbnailSrc = course?.thumbnail
    ? course.thumbnail.startsWith("http")
      ? course.thumbnail
      : `${imageUri}${course.thumbnail}`
    : null;
  const lecturer = course?.lecturers?.[0] || null;

  type ModuleOption = {
    key: string;
    label: string;
    body: string;
    Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
    tone?: string;
    disabled?: boolean;
    action?: () => void;
  };

  const moduleOptions = useMemo<ModuleOption[]>(() => {
    if (!openModule) return [];
    if (openModule.inferredStatus === "COMPLETED") {
      return [
        { key: "recording", label: "Watch the recording", body: `${openModule.duration_minutes || ""} minutes`, Icon: PlayIcon, tone: "main6", action: () => openResource(openModule.recording_link, "recording") },
        { key: "presentation", label: "Download slides", body: "Presentation", Icon: DocIcon, action: () => openResource(openModule.presentation_link, "presentation") },
      ];
    }
    if (openModule.inferredStatus === "CURRENT" || openModule.canJoin) {
      return [
        { key: "join", label: "Join the class now", body: openModule.isLive ? "Live now" : "Starting soon — you can join now", Icon: PlayIcon, tone: "main6", action: () => onJoinCourse(openModule) },
        { key: "presentation", label: "Download slides", body: "Presentation", Icon: DocIcon, action: () => openResource(openModule.presentation_link, "presentation") },
      ];
    }
    if (openModule.isUpcoming) {
      return [
        { key: "presentation", label: "Download slides", body: "Prep material", Icon: DocIcon, action: () => openResource(openModule.presentation_link, "presentation") },
        { key: "locked", label: "Join the class", body: formatModuleDateTime(openModule.scheduled_datetime), Icon: CalendarIcon, disabled: true },
      ];
    }
    return [{ key: "locked", label: "Locked", body: "Opens closer to the date", Icon: LockIcon, disabled: true }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModule]);

  // Status pill shown at the top of the module dialog — mirrors the design's
  // `.fx-mlive` chip. No per-module quiz-score field exists on class_schedules,
  // so completed modules just say "Completed" rather than a fabricated score.
  const moduleStatusPill = useMemo(() => {
    if (!openModule) return null;
    if (openModule.isActuallyCompleted) return { tone: "ok6", label: "Completed" };
    if (openModule.isLive) return { tone: "", label: "Class in session now" };
    return { tone: "mut6", label: `Starts ${formatModuleDateTime(openModule.scheduled_datetime)}` };
  }, [openModule]);

  if (loading) {
    return (
      <DashboardShell active="academy">
        <TopBar crumb="Dashboard / Academy" title="Loading course…" />
      </DashboardShell>
    );
  }

  if (error || !course) {
    return (
      <DashboardShell active="academy">
        <TopBar crumb="Dashboard / Academy" title={error ? "Something went wrong" : "Course not found"} />
        <p className="fx-nempty">
          <b>{error || "This course may have been removed or doesn't exist."}</b>
        </p>
        <button className="fx-cta ghost2" type="button" onClick={() => router.back()}>
          ← Go back
        </button>
      </DashboardShell>
    );
  }

  return (
    <>
      <Head>
        <title>{course.title || "Course"} | Candleweb</title>
      </Head>

      <DashboardShell active="academy">
        <TopBar crumb={`Dashboard / Academy / ${course.title}`} title={course.title} />

        <div className="fx-chero rv d1">
          {thumbnailSrc && (
            <div className="cv">
              <Image src={thumbnailSrc} alt={course.title} fill sizes="100vw" />
            </div>
          )}
          <div className="fx-chin">
            <div className="fx-chtx">
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              {lecturer && (
                <div className="fx-tutor">
                  <span>{(lecturer.name || "CW").slice(0, 2).toUpperCase()}</span>
                  By {lecturer.name}
                </div>
              )}
            </div>
            <div className="fx-chprog">
              <em>Your progress</em>
              <div
                className={`fx-ring ${progressPercent >= 80 ? "" : progressPercent >= 55 ? "mid5" : "low5"}`}
                style={{ "--v": progressPercent } as React.CSSProperties}
                role="img"
                aria-label="Course progress"
              >
                <svg viewBox="0 0 44 44" aria-hidden="true">
                  <circle className="tr" cx="22" cy="22" r="19" />
                  <circle className="vl" cx="22" cy="22" r="19" />
                </svg>
                <b>{progressPercent}</b>
              </div>
              <button className="fx-cta live6" type="button" disabled={joining} onClick={() => onJoinCourse()}>
                {joining ? "Checking you in…" : "Continue learning →"}
              </button>
            </div>
          </div>
        </div>

        <div className="fx-cap2 rv d2">
          <div className="fx-cp">
            <span>Modules completed</span>
            <b>{completedCount} / {totalModules}</b>
            <i>{totalModules - completedCount} still to go</i>
          </div>
          <div className="fx-cp">
            <span>Next class</span>
            <b className="am6" style={{ fontSize: 20 }}>
              {liveModule ? "Live now" : upcomingModule ? formatModuleDateTime(upcomingModule.scheduled_datetime) : "—"}
            </b>
            <i>
              {liveModule
                ? `Module ${liveModule.moduleNumber} · ${liveModule.topic}`
                : upcomingModule
                  ? `Module ${upcomingModule.moduleNumber} · ${upcomingModule.topic}`
                  : "the cohort has finished"}
            </i>
          </div>
          <div className="fx-cp">
            <span>Credits earned here</span>
            <b className="up6">
              {aiUnits ? parseInt(aiUnits.earned_units ?? "0").toLocaleString() : "—"}
            </b>
            <i>
              {aiUnits
                ? `from ${aiUnits.tasks_completed} claimed task${aiUnits.tasks_completed === 1 ? "" : "s"}`
                : aiUnitsError ?? "loading…"}
            </i>
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

        <section className="fx-sec rv d3">
          <div className="fx-cols">
            <div>
              <div className="fx-sh">
                <h2>
                  Course syllabus <span className="sub2">{completedCount} / {totalModules} complete</span>
                </h2>
                <div style={{ display: "flex", gap: 7 }}>
                  <button
                    className={`fx-mini ${moduleFilter === "all" ? "go" : ""}`}
                    type="button"
                    onClick={() => setModuleFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`fx-mini ${moduleFilter === "todo" ? "go" : ""}`}
                    type="button"
                    onClick={() => setModuleFilter("todo")}
                  >
                    To do
                  </button>
                  <button
                    className={`fx-mini ${moduleFilter === "done" ? "go" : ""}`}
                    type="button"
                    onClick={() => setModuleFilter("done")}
                  >
                    Complete
                  </button>
                </div>
              </div>
              <div>
                {modules.length === 0 && <p className="fx-nempty">No modules available yet.</p>}
                {displayModules.length === 0 && modules.length > 0 && (
                  <p className="fx-nempty">
                    <b>{moduleFilter === "done" ? "Nothing completed yet." : "Nothing left to do."}</b>
                  </p>
                )}
                {displayModules.map((m: any, idx: number) => {
                  const cls =
                    m.inferredStatus === "COMPLETED" ? "done5" : m.inferredStatus === "CURRENT" ? "live5" : "lock5";
                  // Design uses 4 distinct marks, not 3: done=check, live=dot,
                  // the *next* incomplete module shows its own number, and
                  // anything further out shows a dash — matching `m.isNext`
                  // (already computed for the "Up next" label) instead of
                  // collapsing next/locked into the same lock icon.
                  const mark = m.isActuallyCompleted ? (
                    <CheckIcon />
                  ) : m.isLive ? (
                    "●"
                  ) : m.isNext ? (
                    String(m.moduleNumber)
                  ) : (
                    "–"
                  );
                  return (
                    <button
                      key={m.id ?? idx}
                      type="button"
                      className={`fx-mod ${cls}`}
                      onClick={() => {
                        setSelectedModuleId(m.id);
                        setOpenModuleId(m.id);
                      }}
                    >
                      <span className="fx-mst">{mark}</span>
                      <span className="fx-mtx">
                        <span className="fx-mno">Module {String(m.moduleNumber).padStart(2, "0")}</span>
                        <b>{m.topic}</b>
                        <span>{formatModuleDateTime(m.scheduled_datetime, m.duration_minutes)}</span>
                      </span>
                      <span className="fx-mgo">
                        {m.isActuallyCompleted ? "Completed" : m.isNext ? "Up next" : m.isLive ? "Live now" : "Upcoming"}
                      </span>
                    </button>
                  );
                })}
                {moduleFilter === "all" && filteredModules.length > 10 && (
                  <button
                    className="fx-mini"
                    type="button"
                    style={{ width: "100%", padding: "13px 0", marginTop: 12 }}
                    onClick={() => setShowAllModules((v) => !v)}
                  >
                    {showAllModules ? "Show fewer modules" : `Show all ${filteredModules.length} modules`}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 34 }}>
                <CourseTasks loaded={courseTasksLoaded} courseId={course.id} />
              </div>
            </div>

            <aside>
              <div className="fx-panel">
                <h4>Course rewards</h4>
                <p className="ps">Unlocked when the course is complete.</p>
                {displayBenefits.map((r: any, i: number) => (
                  <div className="fx-reward2" key={i}>
                    <i>{r.icon || "🎁"}</i>
                    <b>{r.label}</b>
                  </div>
                ))}
              </div>

              <div className="fx-panel">
                <h4>Resources</h4>
                <p className="ps">
                  Selected module: <b style={{ color: "var(--fx-teal2)" }}>{selectedModule?.topic || "None"}</b>
                </p>
                <button className="fx-res" type="button" onClick={() => openResource(selectedModule?.presentation_link, "presentation")}>
                  <i>
                    <DocIcon />
                  </i>
                  <b>Presentation</b>
                </button>
                <button className="fx-res" type="button" onClick={() => openResource(selectedModule?.recording_link, "recording")}>
                  <i>
                    <PlayIcon />
                  </i>
                  <b>Recording</b>
                </button>
              </div>

              <div className="fx-panel">
                <h4>Certificate</h4>
                <p className="ps">
                  {isCertificateIssued
                    ? "Your certificate is ready."
                    : "Unlocks once this course is fully complete."}
                </p>
                <button
                  className="fx-cta main2"
                  type="button"
                  style={{ width: "100%" }}
                  disabled={certLoading || certDownloading}
                  onClick={handleDownloadCertificate}
                >
                  {certDownloading ? "Downloading…" : certLoading ? "Checking…" : "Download"}
                </button>
              </div>

              <div className="fx-tut">
                <div className="ti2">💡</div>
                <b>Stuck on a problem?</b>
                <p>Your AI tutor is available 24/7 to debug your workflow and answer questions.</p>
                <button
                  className="fx-cta ghost2"
                  type="button"
                  style={{ width: "100%" }}
                  onClick={() => dispatch(setChatOpen(true))}
                >
                  Launch the tutor →
                </button>
              </div>
            </aside>
          </div>
        </section>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>About the live sessions.</b> Classes run at the scheduled time whether or not you
            attend, and each one is recorded shortly after. Attending live is worth more — that&apos;s
            where questions get answered — but missing one won&apos;t put you behind.
          </p>
        </div>

        <Dialog
          open={!!openModule}
          onClose={() => setOpenModuleId(null)}
          icon={
            openModule?.isActuallyCompleted ? (
              <CheckIcon />
            ) : openModule?.isLive ? (
              <PlayIcon />
            ) : (
              <LockIcon />
            )
          }
          title={openModule?.topic}
          subtitle={
            openModule
              ? `${formatModuleDateTime(openModule.scheduled_datetime, openModule.duration_minutes)}${
                  lecturer ? ` · live with ${lecturer.name}` : ""
                }`
              : ""
          }
          labelledBy="module-dialog-title"
          footer={
            <button className="fx-cta ghost2" type="button" onClick={() => setOpenModuleId(null)}>
              Close
            </button>
          }
        >
          {moduleStatusPill && (
            <div className={`fx-mlive ${moduleStatusPill.tone}`}>
              <i />
              {moduleStatusPill.label}
            </div>
          )}
          <div className="fx-opts">
            {moduleOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`fx-opt ${opt.tone || ""}`}
                disabled={opt.disabled}
                onClick={opt.action}
              >
                <i>
                  <opt.Icon />
                </i>
                <span>
                  <b>{opt.label}</b>
                  <span>{opt.body}</span>
                </span>
              </button>
            ))}
          </div>
        </Dialog>
      </DashboardShell>

      {/* No floating launcher — "Launch the tutor" below opens it. */}
      <AIAgentChat hideLauncher studentContext={{ course_details: { course } }} />
    </>
  );
}

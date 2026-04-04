import Head from "next/head";
import React, { useEffect, useState } from "react";
import Wrapper from "../../../../components/dashboard/wrapper";
import Loader from "../../../../components/Loader";
import Image from "next/image";
import {
  IoCheckmarkCircle,
  IoLockClosedOutline,
  IoPlayCircleOutline,
  IoDownloadOutline,
  IoCodeSlashOutline,
  IoLayersOutline,
  IoChevronForward,
  IoArrowBack,
  IoHeadsetOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { useRouter } from "next/router";
import courseService from "../../../../services/courseService";
import { imageUri } from "../../../../utils/constants";

const CourseDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    courseService
      .getCourseById(id as string)
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load course details");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <p className="text-white font-semibold text-lg">{error}</p>
          <p className="text-gray-500 text-sm">Please try again or go back.</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
          >
            ← Go Back
          </button>
        </div>
      </Wrapper>
    );
  }

  if (!course) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
            📭
          </div>
          <p className="text-white font-semibold text-lg">Course not found</p>
          <p className="text-gray-500 text-sm">This course may have been removed or doesn&apos;t exist.</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
          >
            ← Go Back
          </button>
        </div>
      </Wrapper>
    );
  }

  // ── Derived data ─────────────────────────────────────────────
  const scheduleModules = Array.isArray(course.class_schedules) ? course.class_schedules : [];
  const totalModules = scheduleModules.length;
  const completedCount = scheduleModules.filter((m: any) => m.is_completed).length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const firstIncompleteIdx = scheduleModules.findIndex((m: any) => !m.is_completed);

  const nextSession =
    scheduleModules.find((m: any) => m.is_active && !m.is_completed && m.class_link) ||
    scheduleModules[0] ||
    null;
  const joinLink = nextSession?.class_link || "";

  const modules = scheduleModules.map((m: any, idx: number) => ({
    ...m,
    inferredStatus: m.is_completed
      ? "COMPLETED"
      : idx === firstIncompleteIdx
      ? "CURRENT"
      : "LOCKED",
    topic: m.topic || m.title || m.course_title || `Module ${idx + 1}`,
  }));

  const thumbnailSrc = course.thumbnail
    ? course.thumbnail.startsWith("http")
      ? course.thumbnail
      : `${imageUri}${course.thumbnail}`
    : null;

  const lecturer = course.lecturers?.[0] || null;
  const lecturerPic = lecturer?.picture
    ? lecturer.picture.startsWith("http")
      ? lecturer.picture
      : `${imageUri}${lecturer.picture}`
    : null;

  const onJoinCourse = () => {
    if (!joinLink) return;
    window.open(joinLink, "_blank");
  };

  return (
    <>
      <Head>
        <title>{course.title || "Course Content"} | Candleweb</title>
      </Head>
      <Wrapper>
        <div className="dash__content text-white pb-20">

          {/* ══════════════════════════════════════════════════════
              DESKTOP LAYOUT
          ══════════════════════════════════════════════════════ */}
          <div className="hidden xl:block">

            {/* ── HERO ── */}
            <div
              className="relative w-full overflow-hidden rounded-2xl mb-6"
              style={{ minHeight: 340 }}
            >
              {/* Thumbnail background */}
              {thumbnailSrc ? (
                <>
                  <img
                    src={thumbnailSrc}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Strong dark overlay so text is always readable */}
                  <div className="absolute inset-0 bg-black/80" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#040d0a] to-[#060e10]" />
              )}

              {/* Hero content: full-width flex row */}
              <div className="relative z-10 flex items-stretch justify-between min-h-[340px] px-10 py-10">

                {/* LEFT — category + title + description */}
                <div className="flex flex-col justify-end max-w-[55%] space-y-4">
                  {/* Pill + hours */}
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full border border-[#FFB322]/70 text-[#FFB322] text-[11px] font-semibold tracking-wider">
                      {course.category || "Course"}
                    </span>
                    {course.total_hours && (
                      <span className="flex items-center gap-1.5 text-gray-300 text-xs">
                        <IoTimeOutline size={13} />
                        {course.total_hours} Hours
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] text-white">
                    {course.title}
                  </h1>

                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                    {course.description}
                  </p>
                </div>

                {/* RIGHT — YOUR PROGRESS + CTA */}
                <div className="flex flex-col justify-end items-end gap-5 ml-8">
                  {/* Progress */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      Your Progress
                    </span>
                    <span className="text-5xl font-black text-[#27ECB0] leading-none">
                      {progressPercent}%
                    </span>
                    {/* Progress bar */}
                    <div className="w-52 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#27ECB0] rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Continue Learning button */}
                  <button
                    onClick={onJoinCourse}
                    disabled={!joinLink}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm transition-all w-full justify-center
                      ${joinLink
                        ? "bg-[#FFB322] text-black hover:brightness-110 active:scale-95 shadow-[0_8px_30px_rgba(255,179,34,0.3)]"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <IoPlayCircleOutline size={19} />
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>

            {/* ── BELOW HERO: syllabus+circle (left) + sidebar (right) ── */}
            <div className="flex gap-5 items-start">

              {/* ── LEFT COLUMN ── */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* Course Syllabus card */}
                <div className="bg-[#111827]/80 rounded-2xl border border-white/5 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-7 py-5 border-b border-white/5">
                    <h2 className="text-base font-bold text-white">Course Syllabus</h2>
                    <span className="text-sm text-gray-400">
                      {completedCount} / {totalModules} Modules Completed
                    </span>
                  </div>

                  {/* Module rows */}
                  <div className="divide-y divide-white/5">
                    {modules.length === 0 && (
                      <p className="text-gray-500 text-sm py-8 text-center">No modules available yet.</p>
                    )}
                    {modules.map((m: any, idx: number) => {
                      const isCompleted = m.inferredStatus === "COMPLETED";
                      const isCurrent = m.inferredStatus === "CURRENT";
                      const isLocked = m.inferredStatus === "LOCKED";

                      return (
                        <div
                          key={m.id || idx}
                          className={`flex items-center gap-0 transition-all
                            ${isCurrent ? "bg-[#1c1800]" : ""}
                            ${isLocked ? "opacity-50" : ""}
                          `}
                        >
                          {/* Left accent bar — 3px wide */}
                          <div
                            className={`w-[3px] self-stretch shrink-0
                              ${isCompleted ? "bg-[#27ECB0]" : isCurrent ? "bg-[#FFB322]" : "bg-transparent"}
                            `}
                          />

                          <div className="flex-1 flex items-center justify-between px-6 py-5 gap-4">
                            {/* Icon + labels */}
                            <div className="flex items-center gap-5">
                              {/* Status icon — circle */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2
                                  ${isCompleted
                                    ? "bg-[#27ECB0]/15 border-[#27ECB0]/40 text-[#27ECB0]"
                                    : isCurrent
                                    ? "bg-[#FFB322]/10 border-[#FFB322]/40 text-[#FFB322]"
                                    : "bg-white/5 border-white/10 text-gray-600"
                                  }`}
                              >
                                {isCompleted && <IoCheckmarkCircle size={22} />}
                                {isCurrent && <IoPlayCircleOutline size={20} />}
                                {isLocked && <IoLockClosedOutline size={17} />}
                              </div>

                              {/* Module label + title */}
                              <div>
                                <p
                                  className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1
                                    ${isCurrent ? "text-[#FFB322]" : "text-[#27ECB0]"}
                                  `}
                                >
                                  Module {String(idx + 1).padStart(2, "0")}
                                  {isCurrent && (
                                    <span className="ml-2 text-gray-400 normal-case font-normal tracking-normal">
                                      — Next Up
                                    </span>
                                  )}
                                </p>
                                <p className={`text-sm font-semibold leading-snug ${isLocked ? "text-gray-500" : "text-white"}`}>
                                  {m.topic}
                                </p>
                              </div>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-5 shrink-0">
                              {isCompleted && m.duration_minutes && (
                                <span className="text-sm text-gray-500 font-medium">
                                  {m.duration_minutes}:00
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-xs text-gray-600 font-medium">Locked</span>
                              )}
                              {isCurrent && (
                                <button className="px-5 py-2.5 bg-[#27ECB0]/10 border border-[#27ECB0]/30 text-[#27ECB0] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-[#27ECB0] hover:text-black transition-all">
                                  Start Module
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Circle card */}
                <div className="bg-[#111827]/80 rounded-2xl border border-white/5 px-7 py-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white">Learning Circle</h3>
                    <span className="text-[#27ECB0] text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                      Visit Class Forum <IoChevronForward size={12} />
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#111827] bg-gray-700 overflow-hidden">
                          <Image src="/logo.png" alt={`student-${i}`} width={40} height={40} />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-[#111827] bg-[#27ECB0] flex items-center justify-center text-[9px] text-black font-black">
                        +2.4k
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      <span className="font-bold text-white">2,482 Classmates</span>{" "}
                      are currently active in this module.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="w-[280px] xl:w-[300px] shrink-0 space-y-4">

                {/* Course Rewards */}
                <div
                  className="rounded-2xl border border-white/5 p-6 space-y-4"
                  style={{ background: "linear-gradient(135deg, #1a1a0f 0%, #0f0f0a 100%)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-orange-400/10 rounded-xl flex items-center justify-center text-lg">🏆</span>
                    <h3 className="text-sm font-bold text-white">Course Rewards</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Complete the course to unlock exclusive terminal access and blockchain credentials.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Certified NFT Diploma", icon: "🎓" },
                      { label: "500 LMN Credits", icon: "⭐" },
                    ].map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                      >
                        <span className="text-lg">{r.icon}</span>
                        <span className="text-xs font-semibold text-gray-300">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-[#111827]/80 rounded-2xl border border-white/5 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Resources</h3>
                  <div className="space-y-2">
                    {[
                      { title: "Course Slides (PDF)", icon: <IoDownloadOutline size={17} /> },
                      { title: "Python Source Code", icon: <IoCodeSlashOutline size={17} /> },
                      { title: "Sample Datasets", icon: <IoLayersOutline size={17} /> },
                    ].map((res, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/8 rounded-xl cursor-pointer border border-white/5 hover:border-white/10 group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 group-hover:text-white transition-colors">{res.icon}</span>
                          <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">
                            {res.title}
                          </span>
                        </div>
                        <IoDownloadOutline size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Mentor */}
                <div
                  className="rounded-2xl border border-white/5 p-6 space-y-3 relative overflow-hidden"
                  style={{ background: "#111827cc" }}
                >
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#FFB322]/8 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative flex items-start gap-3">
                    <span className="w-9 h-9 bg-[#FFB322]/10 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5">💡</span>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-white">Stuck on a problem?</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Our AI Mentor is available 24/7 to debug your backpropagation logic and answer questions.
                      </p>
                    </div>
                  </div>
                  <button className="relative text-[#FFB322] text-xs font-bold tracking-wide flex items-center gap-1.5 hover:gap-3 transition-all ml-12">
                    Launch Assistant →
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              MOBILE LAYOUT
          ══════════════════════════════════════════════════════ */}
          <div className="xl:hidden space-y-5">

            {/* Top nav */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              >
                <IoArrowBack size={18} className="text-white" />
              </button>
              <p className="text-sm font-semibold text-white">Course Details</p>
              <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <IoHeadsetOutline size={18} className="text-white" />
              </button>
            </div>

            {/* Thumbnail */}
            <div className="relative rounded-2xl overflow-hidden h-44 bg-[#0d1117]">
              {thumbnailSrc ? (
                <img src={thumbnailSrc} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0d1a14] to-[#0d1117]" />
              )}
              {course.difficulty_level && (
                <span className="absolute top-3 right-3 px-3 py-1 bg-[#27ECB0] text-black text-[10px] font-bold rounded-full capitalize">
                  {course.difficulty_level}
                </span>
              )}
            </div>

            {/* Title + lecturer */}
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white leading-tight">{course.title}</h1>
              {lecturer && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                    {lecturerPic ? (
                      <img src={lecturerPic} alt={lecturer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-[9px] text-white font-bold">
                        {lecturer.name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">By {lecturer.name}</span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[#27ECB0] text-sm font-bold">{progressPercent}% Completed</span>
                <span className="text-gray-500 text-xs">{completedCount}/{totalModules} Modules</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#27ECB0] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onJoinCourse}
              disabled={!joinLink}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
                ${joinLink ? "bg-[#FFB322] text-black active:scale-95" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
            >
              <IoPlayCircleOutline size={20} />
              Continue Learning
            </button>

            {/* Syllabus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Course Syllabus</h2>
                <div className="flex items-center gap-2">
                  {course.total_hours && (
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded-full">
                      {course.total_hours}h Total
                    </span>
                  )}
                  <span className="text-[#27ECB0] text-xs font-semibold cursor-pointer">View All</span>
                </div>
              </div>
              <div className="space-y-2">
                {modules.map((m: any, idx: number) => {
                  const isCompleted = m.inferredStatus === "COMPLETED";
                  const isCurrent = m.inferredStatus === "CURRENT";
                  const isLocked = m.inferredStatus === "LOCKED";
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex items-center gap-0 rounded-xl border overflow-hidden transition-all
                        ${isCompleted ? "bg-[#0d1a14] border-white/5" : ""}
                        ${isCurrent ? "bg-[#1a1400] border-[#FFB322]/40" : ""}
                        ${isLocked ? "bg-[#0d1117] border-white/5 opacity-50" : ""}
                      `}
                    >
                      <div className={`w-[3px] self-stretch shrink-0 ${isCompleted ? "bg-[#27ECB0]" : isCurrent ? "bg-[#FFB322]" : "bg-transparent"}`} />
                      <div className="flex-1 flex items-center justify-between px-4 py-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                            ${isCompleted ? "bg-[#27ECB0]/15 text-[#27ECB0]" : ""}
                            ${isCurrent ? "bg-[#FFB322]/15 text-[#FFB322]" : ""}
                            ${isLocked ? "bg-white/5 text-gray-600" : ""}
                          `}>
                            {isCompleted && <IoCheckmarkCircle size={18} />}
                            {isCurrent && <IoPlayCircleOutline size={18} />}
                            {isLocked && <IoLockClosedOutline size={15} />}
                          </div>
                          <div>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isCurrent ? "text-[#FFB322]" : "text-[#27ECB0]"}`}>
                              Module {String(idx + 1).padStart(2, "0")}
                            </p>
                            <p className={`text-xs font-semibold leading-snug ${isLocked ? "text-gray-600" : "text-white"}`}>
                              {m.topic}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {isCompleted && `Completed${m.duration_minutes ? " • " + m.duration_minutes + " mins" : ""}`}
                              {isCurrent && "Next Up"}
                              {isLocked && `Locked${m.duration_minutes ? " • " + m.duration_minutes + " mins" : ""}`}
                            </p>
                          </div>
                        </div>
                        {isCompleted && <button className="text-[10px] text-gray-400 border border-white/10 px-3 py-1.5 rounded-lg shrink-0">Review</button>}
                        {isCurrent && <button className="text-[10px] text-black bg-[#FFB322] font-bold px-3 py-1.5 rounded-lg shrink-0">Start</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Rewards mobile */}
            <div className="rounded-2xl border border-[#27ECB0]/20 bg-[#0d1a14] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-[#27ECB0]/10 rounded-xl flex items-center justify-center text-lg">🤖</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Course Rewards</h3>
                  <p className="text-[11px] text-gray-400">Complete the final assessment to earn</p>
                </div>
              </div>
              <p className="text-[#27ECB0] text-sm font-bold">
                +5 CDR AI Units <span className="text-gray-400 font-normal">for your profile.</span>
              </p>
            </div>

            {/* Resources mobile */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white">Resources</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Slides", sub: "2.4 MB", icon: <IoDownloadOutline size={22} /> },
                  { title: "Source Code", sub: "Repository", icon: <IoCodeSlashOutline size={22} /> },
                ].map((r, i) => (
                  <div key={i} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 flex flex-col gap-2 cursor-pointer hover:border-[#27ECB0]/30 transition-all">
                    <span className="text-gray-400">{r.icon}</span>
                    <span className="text-sm font-semibold text-white">{r.title}</span>
                    <span className="text-[10px] text-gray-500">{r.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Classmates mobile */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Classmates</h2>
                <span className="text-xs text-gray-400">128 Active</span>
              </div>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-[#0d1117] bg-gray-700 overflow-hidden">
                    <Image src="/logo.png" alt={`s${i}`} width={36} height={36} />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-[#0d1117] bg-[#27ECB0] flex items-center justify-center text-[9px] text-black font-black">
                  +124
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 py-3 border border-white/10 rounded-xl cursor-pointer hover:border-[#27ECB0]/30 transition-all">
                Join Discussion Forum
              </p>
            </div>

          </div>

        </div>
      </Wrapper>
    </>
  );
};

export default CourseDetails;
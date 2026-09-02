import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import courseService from "../../services/courseService";
import useUserStore from "../../lib/hooks/useUserStore";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";
import { imageUri } from "../../utils/constants";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.candlewebservices.candleweb";

const scrollToCourses = () => {
  document
    .getElementById("courses")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const courseImage = (course: any): string | null => {
  if (!course?.image) return null;
  return course.image.startsWith("http")
    ? course.image
    : imageUri + course.image;
};

const AcademyHero = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, isLoading } = useSelector(
    (state: RootState) => state.courses,
  );
  const { purchasedCourseIds } = useSelector(
    (state: RootState) => state.payment,
  );
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { googleAuth } = useGoogleAuth();

  const [slide, setSlide] = useState(0);

  useEffect(() => {
    dispatch(courseService.getCourses());
  }, [dispatch]);

  useEffect(() => {
    if (courses.length < 2) return;
    const timer = setInterval(
      () => setSlide((prev) => (prev + 1) % courses.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [courses.length]);

  const active = courses.length ? courses[slide % courses.length] : null;

  const startLearning = () => {
    if (!isLoggedIn) {
      googleAuth("/tutor#courses");
      return;
    }
    if (purchasedCourseIds.length > 0) {
      window.location.href = PLAY_STORE_URL;
      return;
    }
    scrollToCourses();
  };

  const ctaLabel =
    purchasedCourseIds.length > 0
      ? "Download app"
      : isLoggedIn
        ? "Explore courses"
        : "Start Learning";

  const image = active ? courseImage(active) : null;

  return (
    <header className="landing-wrap ac-hero" id="top">
      <div>
        <p className="ac-badge landing-rise">
          {active?.certification || "Certified · Cohort 2 open"}
        </p>
        {active ? (
          <h1 className="landing-rise rise-left" key={active.id}>
            {active.title}
          </h1>
        ) : (
          <h1 className="landing-rise rise-left">
            Learn the skills.
            <br />
            <span className="grad">Then go and use them.</span>
          </h1>
        )}
        <p
          className="sub landing-rise rise-left"
          key={active ? `sub-${active.id}` : "sub"}
        >
          {active?.description ||
            "Candleweb Academy runs short, cohort-based programmes in AI automation, personal finance and crypto trading. You build real things rather than watching videos, earn credits as you go, and the strongest graduates are put in front of our partners for internships."}
        </p>
        <div className="ac-cta landing-rise rise-left">
          <button
            type="button"
            className="pub-btn pub-btn-amber"
            onClick={startLearning}
          >
            {ctaLabel} <span>↗</span>
          </button>
          <button
            type="button"
            className="pub-btn pub-btn-glass ac-play"
            onClick={scrollToCourses}
          >
            <i>▶</i> See courses
          </button>
        </div>
        {courses.length > 1 && (
          <div className="ac-hero-dots" aria-label="Featured courses">
            {courses.map((course: any, index: number) => {
              const isActive = index === slide % courses.length;
              return (
                <button
                  key={course.id}
                  type="button"
                  aria-label={course.title}
                  aria-current={isActive || undefined}
                  className={isActive ? "is-active" : ""}
                  onClick={() => setSlide(index)}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="landing-rise rise-right">
        <div className="ac-art">
          {image ? (
            <Image
              src={image}
              alt={active?.title || "Course"}
              fill
              sizes="(max-width: 1000px) 100vw, 520px"
              priority
            />
          ) : (
            <svg
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="acHeroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#31E0B0" />
                  <stop offset="1" stopColor="#0B6E56" />
                </linearGradient>
              </defs>
              <rect width="400" height="300" fill="url(#acHeroGrad)" />
              <g opacity=".2" fill="#04120E">
                <rect x="46" y="180" width="16" height="62" rx="4" />
                <rect x="96" y="146" width="16" height="84" rx="4" />
                <rect x="146" y="176" width="16" height="56" rx="4" />
                <rect x="196" y="130" width="16" height="88" rx="4" />
                <rect x="246" y="158" width="16" height="66" rx="4" />
                <rect x="296" y="112" width="16" height="90" rx="4" />
              </g>
              <path
                d="M0 246 L80 214 L160 226 L240 178 L320 190 L400 146"
                fill="none"
                stroke="#04120E"
                strokeOpacity=".28"
                strokeWidth="5"
              />
            </svg>
          )}
          <span className="ph">
            {isLoading && !active
              ? "Loading courses…"
              : active
                ? `${active.duration || ""}${active.duration && active.certification ? " · " : ""}${active.certification || ""}`
                : "Course media · from API"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AcademyHero;

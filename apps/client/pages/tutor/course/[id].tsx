import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import courseService from "../../../services/courseService";
import tutorService from "../../../services/tutorService";
import useCourseEnrolment from "../../../lib/hooks/useCourseEnrolment";
import PublicHeader from "../../../components/public/PublicHeader";
import PublicFooter from "../../../components/public/PublicFooter";
import CourseProfileModal from "../../../components/Tutor/CourseProfileModal";
import Loader from "../../../components/Loader";
import { imageUri } from "../../../utils/constants";
import { FAQ } from "../../../types/tutor";

/**
 * Public course detail — the page someone reads while deciding whether to
 * enrol. Not to be confused with /dashboard/tutor/course/[id], which is the
 * working view for people already on the course.
 *
 * Everything here comes from `GET /tutor/courses/{id}/`, which is open to
 * logged-out visitors, so the page is readable (and indexable) without an
 * account. Signing in is only asked for at the moment of paying.
 */

/* Rail colours, in order, repeating after the fifth. */
const RAIL = ["var(--rl-1)", "var(--rl-2)", "var(--rl-3)", "var(--rl-4)", "var(--rl-5)"];

const coverSrc = (course: any): string | null => {
  const raw = course?.thumbnail || course?.logo || course?.image;
  if (!raw) return null;
  return String(raw).startsWith("http") ? raw : imageUri + raw;
};

/** Sessions come from `class_schedules`; a course with none hasn't published
 *  its syllabus yet, which is a real state rather than an error. */
const toSessions = (course: any) => {
  const rows = Array.isArray(course?.class_schedules) ? course.class_schedules : [];
  return rows.map((row: any, i: number) => {
    const at = row.scheduled_datetime ? new Date(row.scheduled_datetime) : null;
    const title = row.topic || row.title || `Session ${i + 1}`;
    /* A schedule carries one free-text `description`, not the mockup's list of
       learning points — there is no field for those. Some rows repeat the
       title in it, which reads as the heading printed twice, so drop it when
       it says nothing new. */
    const raw = typeof row.description === "string" ? row.description.trim() : "";
    const covers =
      raw && raw.toLowerCase() !== String(title).trim().toLowerCase() ? raw : "";
    return {
      id: row.id ?? i,
      title,
      at:
        at && !Number.isNaN(at.getTime())
          ? at.toLocaleString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      covers,
    };
  });
};

/** A benefit is either a bare string or a row from the API
    ({id, title, description}); older payloads used {label, detail}. */
const toBenefits = (course: any) => {
  const rows = Array.isArray(course?.benefits) ? course.benefits : [];
  return rows
    .map((b: any) =>
      typeof b === "string"
        ? { label: b, detail: "" }
        : { label: b?.label || b?.title || "", detail: b?.description || b?.detail || "" },
    )
    .filter((b: any) => b.label);
};

const CourseDetailPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const id = typeof router.query.id === "string" ? router.query.id : null;
  const returnTo = id ? `/tutor/course/${id}` : "/tutor#courses";

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { faqs } = useSelector((state: RootState) => state.tutors);
  const { courses } = useSelector((state: RootState) => state.courses);

  const enrolment = useCourseEnrolment(returnTo);

  useEffect(() => {
    if (!router.isReady || !id) return;
    let live = true;
    setLoading(true);
    courseService
      .getCourseById(id)
      .then((data) => {
        if (!live) return;
        setDetail(data);
        setFailed(null);
      })
      .catch((err: any) => {
        if (!live) return;
        setFailed(err?.message || "We couldn't load this course.");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [router.isReady, id]);

  // FAQs and the other listings are shared with the Academy page.
  useEffect(() => {
    dispatch(tutorService.getFaqs(undefined));
    dispatch(courseService.getCourses());
  }, [dispatch]);

  // Naira is the price of record; the dollar figure is a convenience.
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/NGN")
      .then((r) => r.json())
      .then((d) => d?.rates?.USD && setUsdRate(d.rates.USD))
      .catch(() => {
        /* the Naira price still shows */
      });
  }, []);

  /* `GET /tutor/courses/{id}/` answers 403 "Authorization token required."
     to anyone not signed in, so on its own it cannot carry a public page.
     The featured list IS public, so a logged-out visitor still gets the
     title, description, price, facts and cover from there; the syllabus,
     benefits and lecturers only exist on the detail response. Remove this
     fallback once the backend opens that endpoint. */
  const listed = useMemo(
    () => (courses || []).find((c: any) => String(c.id) === String(id)) || null,
    [courses, id],
  );
  /* The public featured list carries the title, price, facts and cover, so the
     page can render from it while `GET /tutor/courses/{id}/` is still in flight
     — or never answers, since it 403s for a signed-out visitor. The sections
     that only exist on the detail response simply stay hidden in that case. */
  const course = detail ?? listed;

  const sessions = useMemo(() => toSessions(course), [course]);
  const benefits = useMemo(() => toBenefits(course), [course]);
  const lecturers = useMemo(
    () => (Array.isArray(course?.lecturers) ? course.lecturers : []),
    [course],
  );

  const price = Number(course?.base_price ?? course?.price ?? 0);
  const usd = usdRate && price ? (price * usdRate).toFixed(2) : null;
  const isOpen = course?.is_enrollment_open !== false;
  const purchased = course ? enrolment.hasPurchased(course.id) : false;
  const cover = coverSrc(course);

  const facts: [string, string][] = course
    ? [
        ["Duration", course.duration_weeks ? `${course.duration_weeks} weeks` : "—"],
        ["Time commitment", course.total_hours ? `${course.total_hours} hours` : "—"],
        ["Enrolled", `${course.current_enrollment_count ?? 0} people`],
        ["On completion", "Certificate"],
      ]
    : [];

  /* ---- the rail: lights up as it is read ----
     A short list plays through once when it comes into view. A list taller
     than the screen follows the reader instead, each line filling as they
     scroll towards the next session. It only moves forward, so scrolling
     back up never un-reads anything. */
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || sessions.length === 0) return;

    const items = Array.from(list.querySelectorAll<HTMLElement>(".ac-lrn"));
    const segs = items.map((el) => el.querySelector<HTMLElement>(".ac-rail-seg i"));
    const still =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lightAll = () => items.forEach((el) => el.classList.add("rl-lit", "rl-fill"));
    if (still || !("IntersectionObserver" in window)) {
      lightAll();
      return;
    }

    let stop = () => {};

    const play = () => {
      const step = Math.min(940, 6000 / Math.max(1, items.length - 1));
      const dot = Math.round(step * 0.34);
      const fill = Math.round(step * 0.66);
      segs.forEach((g) => g && (g.style.transitionDuration = `${fill}ms`));
      const timers: any[] = [];
      let i = 0;
      const next = () => {
        items[i].classList.add("rl-lit");
        if (i === items.length - 1) return; // the last item has no line below it
        timers.push(
          setTimeout(() => {
            items[i].classList.add("rl-fill");
            // a timer rather than transitionend, so it can never stall
            timers.push(setTimeout(() => { i += 1; next(); }, fill));
          }, dot),
        );
      };
      next();
      stop = () => timers.forEach(clearTimeout);
    };

    const follow = () => {
      const filled = items.map(() => 0);
      let ticking = false;
      let done = false;
      const dotY = (el: HTMLElement) => el.getBoundingClientRect().top + 30;
      const onFrame = () => {
        ticking = false;
        if (done) return;
        const line = window.innerHeight * 0.62; // a little above the middle
        let all = true;
        items.forEach((el, i) => {
          const d = dotY(el);
          if (d <= line) el.classList.add("rl-lit");
          else all = false;
          const nextEl = items[i + 1];
          if (nextEl && segs[i]) {
            const span = dotY(nextEl) - d;
            const f = span > 0 ? Math.max(0, Math.min(1, (line - d) / span)) : 0;
            if (f > filled[i]) {
              filled[i] = f;
              segs[i]!.style.transform = `scaleY(${f.toFixed(3)})`;
            }
          }
        });
        if (all) {
          done = true;
          detach();
        }
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onFrame);
        }
      };
      const detach = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
      segs.forEach((g) => g && (g.style.transition = "transform .16s linear"));
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onFrame();
      stop = detach;
    };

    // the choice is made when the list is first seen, against the real screen
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const fits = list.getBoundingClientRect().height <= window.innerHeight * 0.8;
        if (fits) play();
        else follow();
      },
      { threshold: 0 },
    );
    io.observe(list);

    return () => {
      io.disconnect();
      stop();
    };
  }, [sessions.length]);

  /* ---- the bar that names the course once the price has scrolled away ---- */
  const buyRef = useRef<HTMLDivElement | null>(null);
  const [barOn, setBarOn] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          setBarOn(!e.isIntersecting && e.boundingClientRect.top < 0),
        ),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [course]);

  const action = purchased ? "Go to your course" : isOpen ? "Enrol now" : "View the Academy";
  const onAction = () => {
    if (!course) return;
    if (!isOpen && !purchased) {
      router.push("/tutor#courses");
      return;
    }
    enrolment.enrol(course);
  };

  const sortedFaqs = useMemo(
    () => [...(faqs || [])].sort((a: FAQ, b: FAQ) => (a.order || 0) - (b.order || 0)).slice(0, 5),
    [faqs],
  );

  const others = useMemo(
    () => (courses || []).filter((c: any) => String(c.id) !== String(id)).slice(0, 3),
    [courses, id],
  );

  return (
    <>
      <Head>
        <title>
          {course ? `${course.title} | Candleweb Academy` : "Course | Candleweb Academy"}
        </title>
        <meta
          name="description"
          content={
            course?.description
              ? String(course.description).slice(0, 180)
              : "A cohort-based programme from Candleweb Academy."
          }
        />
        {id && <link rel="canonical" href={`https://candleweb.io/tutor/course/${id}`} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="academy-stage">
        <div className="ac-aura">
          <b className="b1" />
          <b className="b2" />
          <b className="b3" />
        </div>
        <div className="ac-grid" />

        <PublicHeader
          active="academy"
          cta={{ label: "Start Learning", href: "/tutor#courses" }}
        />

        <div className="landing-wrap">
          <nav className="ac-crumbs" aria-label="Breadcrumb">
            <Link href="/tutor">Academy</Link>
            <i aria-hidden="true">/</i>
            <Link href="/tutor#courses">{course?.category || "Courses"}</Link>
          </nav>

          {loading && !course && (
            <div style={{ padding: "80px 0" }}>
              <Loader />
            </div>
          )}

          {!loading && !course && (
            <div className="ac-cd-missing">
              <h1>That course isn&rsquo;t available.</h1>
              <p>
                {failed ||
                  "The link may be out of date, or the course has been taken down. Everything that is running is listed on the Academy page."}
              </p>
              <Link className="pub-btn pub-btn-amber" href="/tutor#courses">
                See all courses <span>→</span>
              </Link>
            </div>
          )}

          {course && (
            <>
              {/* ---- header: what it is, what it costs, and the button ---- */}
              <header className="ac-cd-hero">
                <div className="ac-cd-text">
                  <div className="ac-cd-tags">
                    <span className={`ac-cd-state ${isOpen ? "open" : "soon"}`}>
                      {isOpen ? "Enrolling now" : "Coming soon"}
                    </span>
                    {course.category && <span className="ac-c-cat">{course.category}</span>}
                  </div>

                  <h1 className="ac-cd-title">{course.title}</h1>
                  {course.description && <p className="ac-cd-desc">{course.description}</p>}

                  <dl className="ac-cd-facts">
                    {facts.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="ac-cd-buy" ref={buyRef}>
                    <div className="ac-cd-buy-price">
                      {isOpen ? (
                        <>
                          <span className="ac-price">₦{price.toLocaleString()}</span>
                          {usd && <span className="ac-price-alt">≈ ${usd}</span>}
                        </>
                      ) : (
                        <span className="ac-cd-buy-soon">Dates to be announced</span>
                      )}
                      <p className="ac-cd-buy-note">
                        {purchased
                          ? "You're enrolled on this course. Pick up where you left off in your dashboard."
                          : isOpen
                            ? "One-time payment. Classes run live, and every one is recorded."
                            : "Dates for this cohort haven't been announced yet."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`pub-btn ${isOpen || purchased ? "pub-btn-amber" : "pub-btn-teal"}`}
                      disabled={enrolment.busy}
                      onClick={onAction}
                    >
                      {enrolment.busy ? "Enrolling..." : action} <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="ac-cd-cover">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={course.title}
                      fill
                      sizes="(max-width: 1000px) 100vw, 40vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span className="ph">Course cover · from API</span>
                  )}
                </div>
              </header>

              <div className="ac-cd-body">
                {/* ---- what you'll be learning ----
                    Only once the detail call has actually answered. While it is
                    gated (403 for a signed-out visitor) we show nothing here
                    rather than a placeholder asking them to sign in. */}
                {(sessions.length > 0 || !!detail) && (
                <section className="ac-cd-block" aria-labelledby="syl-h">
                  <h2 id="syl-h">What you&rsquo;ll be learning.</h2>

                  {sessions.length > 0 ? (
                    <>
                      <div
                        className={`ac-lrn-list ${detailOpen ? "rl-detail" : ""}`}
                        ref={listRef}
                      >
                        {sessions.map((s: any, i: number) => (
                          <div
                            className="ac-lrn"
                            key={s.id}
                            style={{ ["--c" as any]: RAIL[i % RAIL.length] }}
                          >
                            <div className="ac-lrn-n">
                              <b>{i + 1}</b>
                              <span className="ac-rail-seg" aria-hidden="true">
                                <i />
                              </span>
                              <span className="ac-rail-dot" aria-hidden="true" />
                            </div>
                            <div className="ac-lrn-s">
                              <div className="ac-ses">
                                {s.at && <p className="ac-ses-at">{s.at}</p>}
                                <h3>{s.title}</h3>
                                {s.covers && <p className="ac-ses-body">{s.covers}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="ac-syl-foot">
                        <p>Session order can shift between cohorts.</p>
                        {sessions.some((s: any) => s.covers) && (
                          <button
                            type="button"
                            className="ac-linkbtn"
                            aria-expanded={detailOpen}
                            onClick={() => setDetailOpen((v) => !v)}
                          >
                            {detailOpen
                              ? "Hide session details"
                              : "Show what each session covers"}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="ac-cd-empty">
                      The syllabus is published once this cohort is scheduled. Enrol and it
                      comes to you with the dates.
                    </p>
                  )}
                </section>
                )}

                {/* ---- course benefits ----
                    Only what the course actually carries: never a stand-in
                    list, and nothing at all while the detail call is gated. */}
                {benefits.length > 0 && (
                  <section className="ac-cd-block" aria-labelledby="ben-h">
                    <h2 id="ben-h">Course benefits.</h2>
                    <div className="ac-runs">
                      {benefits.map((b: any, i: number) => (
                        <div key={i}>
                          <h3>{b.label}</h3>
                          {b.detail && <p>{b.detail}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ---- who teaches it ---- */}
                {lecturers.length > 0 && (
                  <section className="ac-cd-block" aria-labelledby="tut-h">
                    <h2 id="tut-h">Who teaches it.</h2>
                    <div className="ac-tutors">
                      {lecturers.map((t: any, i: number) => (
                        <div className="ac-tutor" key={t.id ?? i}>
                          <div className="ac-face">
                            {t.picture ? (
                              <Image
                                src={
                                  String(t.picture).startsWith("http")
                                    ? t.picture
                                    : imageUri + t.picture
                                }
                                alt={t.name || "Tutor"}
                                fill
                                sizes="78px"
                                style={{ objectFit: "cover", borderRadius: "50%" }}
                              />
                            ) : (
                              (t.name || "?")
                                .split(" ")
                                .map((w: string) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            )}
                          </div>
                          <b>{t.name}</b>
                          {t.title && <span className="role">{t.title}</span>}
                          {t.bio && <p>{t.bio}</p>}
                          {t.total_students ? (
                            <div className="ac-mentored">
                              <b>{Number(t.total_students).toLocaleString()}</b>
                              <span>Students mentored</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ---- before you enrol ---- */}
                {sortedFaqs.length > 0 && (
                  <section className="ac-cd-block" aria-labelledby="faq-h">
                    <h2 id="faq-h">Before you enrol.</h2>
                    <div className="ac-faq">
                      {sortedFaqs.map((q: FAQ) => (
                        <details className="ac-q" key={q.id}>
                          <summary>
                            {q.question}
                            <i>+</i>
                          </summary>
                          <p>{q.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                {/* ---- closing prompt, named after the course ---- */}
                <section className="ac-cd-block ac-cd-close" aria-label={action}>
                  <div>
                    <h2>{course.title}</h2>
                    <p>
                      {purchased
                        ? "You're already enrolled."
                        : isOpen
                          ? `₦${price.toLocaleString()}, paid once.`
                          : "Dates haven't been announced yet."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`pub-btn ${isOpen || purchased ? "pub-btn-amber" : "pub-btn-teal"}`}
                    disabled={enrolment.busy}
                    onClick={onAction}
                  >
                    {action} <span>→</span>
                  </button>
                </section>

                {/* ---- other listings: links only, no prices ---- */}
                {others.length > 0 && (
                  <section className="ac-cd-block" aria-labelledby="oth-h">
                    <h2 id="oth-h">More on the Academy.</h2>
                    <div className="ac-others">
                      {others.map((o: any) => (
                        <Link className="ac-other" href={`/tutor/course/${o.id}`} key={o.id}>
                          <b>{o.title}</b>
                          <span>
                            {o.is_enrollment_open === false
                              ? "Course, coming soon"
                              : "Course, enrolling now"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>

        <PublicFooter description="Candleweb Academy — cohort-based programmes in AI automation, personal finance and crypto trading. Built in Africa." />

        {/* ---- small screens: a bar that names the course ---- */}
        {course && (
          <div className={`ac-cd-bar ${barOn ? "on" : ""}`}>
            <div className="p">
              <span className="bt">{course.title}</span>
              <small>
                {purchased
                  ? "You're enrolled"
                  : isOpen
                    ? `₦${price.toLocaleString()}`
                    : "Dates not announced"}
              </small>
            </div>
            <button
              type="button"
              className={`pub-btn ${isOpen || purchased ? "pub-btn-amber" : "pub-btn-teal"}`}
              disabled={enrolment.busy}
              onClick={onAction}
            >
              {action}
            </button>
          </div>
        )}
      </main>

      {enrolment.profileFor && (
        <CourseProfileModal
          courseTitle={enrolment.profileFor.title}
          initial={enrolment.profileDraft}
          busy={enrolment.busy}
          onCancel={enrolment.closeProfile}
          onSubmit={enrolment.submitProfile}
        />
      )}
    </>
  );
};

export default CourseDetailPage;

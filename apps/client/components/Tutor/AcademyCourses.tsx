import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { RootState, AppDispatch } from "../../redux/store";
import courseService from "../../services/courseService";
import paymentService from "../../services/paymentService";
import tutorService from "../../services/tutorService";
import { resetPaymentStatus } from "../../redux/slices/paymentSlice";
import useUserStore from "../../lib/hooks/useUserStore";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { imageUri } from "../../utils/constants";
import { signUpPath } from "../../lib/authRedirect";
import Loader from "../Loader";
import { Written } from "../public/Written";
import PaymentMethodModal from "../public/PaymentMethodModal";

declare let window: any;

const courseImage = (course: any): string | null => {
  if (!course?.image) return null;
  return course.image.startsWith("http")
    ? course.image
    : imageUri + course.image;
};

const AcademyCourses = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;

  const { courses, isLoading } = useSelector(
    (state: RootState) => state.courses,
  );
  const {
    purchasedCourseIds,
    lastPaymentStatus,
    error: paymentError,
    isInitiating,
    isVerifying,
  } = useSelector((state: RootState) => state.payment);

  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Name prompt modal state
  const [showNameModal, setShowNameModal] = useState(false);
  /* Asked before anything is charged, same as the dashboard does for plans
     and reviews — this listing used to go straight to the card processor. */
  const [methodCourse, setMethodCourse] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempPhoneNumber, setTempPhoneNumber] = useState("");
  const [tempReferralUsername, setTempReferralUsername] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    dispatch(courseService.getCourses());
  }, [dispatch]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/NGN");
        const data = await res.json();
        if (data?.rates?.USD) setUsdRate(data.rates.USD);
      } catch {
        /* Naira price still shown */
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    if (lastPaymentStatus === "failed" && paymentError) {
      toast.error(paymentError);
      dispatch(resetPaymentStatus());
    }
  }, [lastPaymentStatus, paymentError, dispatch]);

  const toUSD = (naira: number): string | null =>
    usdRate ? (naira * usdRate).toFixed(2) : null;

  const initiatePaymentWithNames = async (
    course: any,
    firstName: string,
    lastName: string,
    phone: string,
    referralUsername?: string,
  ) => {
    try {
      const payload: any = {
        course_id: course.id,
        email: user.email || "",
        first_name: firstName,
        last_name: lastName,
        phone,
        callback_url: `${window.location.origin}/tutor/verify`,
      };
      if (referralUsername && referralUsername.trim()) {
        payload.referrer_username = referralUsername.trim();
      }

      const resultAction = await dispatch(
        paymentService.initiatePayment(payload),
      );

      if (paymentService.initiatePayment.fulfilled.match(resultAction)) {
        const paymentData = resultAction.payload?.data;
        if (paymentData?.requires_payment === false) {
          toast.success("You're enrolled! Taking you to your dashboard.");
          router.push("/dashboard/tutor");
          return;
        }
        if (paymentData?.requires_payment && paymentData?.authorization_url) {
          window.location.href = paymentData.authorization_url;
        } else {
          toast.error(
            "Unable to get payment authorization link. Please try again.",
          );
        }
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handlePayment = async (course: any) => {
    if (!isLoggedIn) {
      router.push(signUpPath("/tutor#courses"));
      return;
    }
    if (purchasedCourseIds.includes(course.id)) {
      router.push("/dashboard/tutor");
      return;
    }
    setMethodCourse(course);
  };

  /** Card chosen — carry on to the profile check and the processor. */
  const beginPayment = async (course: any) => {
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const phone = user.phone || "";

    setIsCheckingProfile(true);
    try {
      const profileResult = await dispatch(
        tutorService.checkStudentProfile(axiosToken),
      );
      if (tutorService.checkStudentProfile.fulfilled.match(profileResult)) {
        const profileData = profileResult.payload?.data;
        if (profileData?.has_profile && !profileData?.needs_names) {
          initiatePaymentWithNames(
            course,
            profileData.first_name,
            profileData.last_name,
            profileData.phone,
          );
        } else {
          setSelectedCourse(course);
          setTempFirstName(profileData?.first_name || firstName);
          setTempLastName(profileData?.last_name || lastName);
          setTempPhoneNumber(profileData?.phone || phone);
          setShowNameModal(true);
        }
      } else if (!firstName || !lastName) {
        setSelectedCourse(course);
        setShowNameModal(true);
      } else {
        initiatePaymentWithNames(course, firstName, lastName, phone);
      }
    } catch (err) {
      console.error("Profile check failed:", err);
      if (!firstName || !lastName) {
        setSelectedCourse(course);
        setShowNameModal(true);
      } else {
        initiatePaymentWithNames(course, firstName, lastName, phone);
      }
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const openCourse = (course: any) => {
    router.push(`/tutor/course/${course.id}`);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((course: any) => {
      if (course.category) set.add(course.category);
    });
    return ["All", ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? courses
        : courses.filter((course: any) => course.category === filter),
    [courses, filter],
  );
  const visible = showAll ? filtered : filtered.slice(0, 3);

  return (
    <>
      {(isLoading || isInitiating || isVerifying || isCheckingProfile) && (
        <div className="fixed inset-0 z-[9999]">
          <Loader />
        </div>
      )}

      <div className="ac-cap-head">
        <div className="landing-rise">
          <p className="ac-eyebrow">Available courses</p>
          <h2>
            <Written text="Pick where you want to start." />
          </h2>
        </div>
        {categories.length > 1 && (
          <div
            className="ac-filters landing-rise"
            role="group"
            aria-label="Filter courses"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className="ac-filt"
                aria-pressed={filter === category}
                onClick={() => {
                  setFilter(category);
                  setShowAll(false);
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ac-course-list">
        {!isLoading && filtered.length === 0 ? (
          <p className="ac-empty" style={{ display: "block" }}>
            No courses in this category yet.
          </p>
        ) : (
          visible.map((course: any) => {
            const isOpen = course.is_enrollment_open !== false;
            const purchased = purchasedCourseIds.includes(course.id);
            const image = courseImage(course);
            const usd = toUSD(course.price);
            return (
              <article
                className="ac-course landing-rise ac-course-open"
                key={course.id}
                role="link"
                tabIndex={0}
                aria-label={`${course.title} — course details`}
                onClick={() => openCourse(course)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCourse(course);
                  }
                }}
              >
                <div className="ac-c-cover">
                  {image ? (
                    <Image
                      src={image}
                      alt={course.title}
                      fill
                      sizes="(max-width: 1040px) 100vw, 300px"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 400 300"
                      preserveAspectRatio="xMidYMid slice"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id={`acCourse${course.id}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0"
                            stopColor={isOpen ? "#31E0B0" : "#FFC55E"}
                          />
                          <stop
                            offset="1"
                            stopColor={isOpen ? "#0B6E56" : "#A86E05"}
                          />
                        </linearGradient>
                      </defs>
                      <rect
                        width="400"
                        height="300"
                        fill={`url(#acCourse${course.id})`}
                      />
                    </svg>
                  )}
                  <span className={`ac-c-flag ${isOpen ? "open" : "soon"}`}>
                    {isOpen ? "Enrolling now" : "Coming soon"}
                  </span>
                  <span className="ph">Course cover · from API</span>
                </div>

                <div className="ac-c-body">
                  <span className="ac-c-cat">
                    {course.category || "Course"}
                  </span>
                  <h3>
                    <Link href={`/tutor/course/${course.id}`}>
                      {course.title}
                    </Link>
                  </h3>
                  <p>{course.description}</p>
                  {course.features?.length > 0 && (
                    <div className="ac-skills">
                      {course.features
                        .slice(0, 6)
                        .map((feature: string, index: number) => (
                          <span className="ac-skill" key={index}>
                            <i>✓</i>
                            {feature}
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="ac-c-meta">
                    {course.duration && <span>{course.duration}</span>}
                    {course.lessons ? (
                      <span>{course.lessons} hours</span>
                    ) : null}
                    <span>{course.current_enrollment_count ?? 0} enrolled</span>
                    {course.certification && (
                      <span>{course.certification}</span>
                    )}
                  </div>
                </div>

                <div className="ac-c-buy">
                  {isOpen ? (
                    <>
                      <div className="ac-price">
                        ₦{Number(course.price).toLocaleString()}
                      </div>
                      {usd && <span className="ac-price-alt">≈ ${usd}</span>}
                      <p className="ac-price-note">One-time payment</p>
                      <button
                        type="button"
                        className="pub-btn pub-btn-amber"
                        disabled={
                          isInitiating || isVerifying || isCheckingProfile
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayment(course);
                        }}
                      >
                        {purchased ? "Go to dashboard" : "Enroll Now"}{" "}
                        <span>→</span>
                      </button>
                      {/* The whole card is already a link to the course, but
                          the buy column swallows clicks, so this gives that
                          same destination an explicit control. */}
                      <button
                        type="button"
                        className="pub-btn pub-btn-glass"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCourse(course);
                        }}
                      >
                        Learn more
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="ac-soon-note">
                        Dates for this cohort haven&apos;t been announced yet.
                      </p>
                      <button
                        type="button"
                        className="pub-btn pub-btn-teal"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCourse(course);
                        }}
                      >
                        View curriculum <span>→</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {!isLoading && filtered.length > 3 && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 34 }}
        >
          <button
            type="button"
            className="pub-btn pub-btn-glass"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? "Show fewer" : `Show all ${filtered.length} courses`}
          </button>
        </div>
      )}

      {methodCourse && (
        <PaymentMethodModal
          summary={`${methodCourse.title} · ${
            Number(methodCourse.base_price ?? methodCourse.price ?? 0) > 0
              ? `₦${Number(
                  methodCourse.base_price ?? methodCourse.price ?? 0,
                ).toLocaleString()} one-time`
              : "free"
          }`}
          note="You'll finish on the processor's secure checkout, then come back here. Your place on the course is confirmed once the payment is."
          busy={isCheckingProfile}
          onCancel={() => setMethodCourse(null)}
          onContinue={() => {
            const course = methodCourse;
            setMethodCourse(null);
            beginPayment(course);
          }}
        />
      )}

      {showNameModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-[24px] p-6 lg:p-8 w-full max-w-md relative shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
            <h3 className="text-white text-xl font-bold mb-2">
              Complete Your Profile
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Please provide your first, last name, and phone number to proceed
              with the payment.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={tempPhoneNumber}
                  onChange={(e) => setTempPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">
                  Referral Username (Optional)
                </label>
                <input
                  type="text"
                  value={tempReferralUsername}
                  onChange={(e) => setTempReferralUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter referral username"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setTempFirstName("");
                  setTempLastName("");
                  setTempPhoneNumber("");
                  setTempReferralUsername("");
                  setSelectedCourse(null);
                }}
                className="flex-1 px-4 py-3.5 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 hover:border-white/20 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!tempFirstName.trim() || !tempLastName.trim()) {
                    toast.error("Please fill in both first and last names");
                    return;
                  }
                  if (!tempPhoneNumber.trim()) {
                    toast.error("Please provide your phone number");
                    return;
                  }
                  setShowNameModal(false);
                  initiatePaymentWithNames(
                    selectedCourse,
                    tempFirstName.trim(),
                    tempLastName.trim(),
                    tempPhoneNumber.trim(),
                    tempReferralUsername.trim(),
                  );
                  setTempFirstName("");
                  setTempLastName("");
                  setTempPhoneNumber("");
                  setTempReferralUsername("");
                  setSelectedCourse(null);
                }}
                className="flex-[1.5] px-4 py-3.5 rounded-full bg-primary text-black font-bold hover:scale-[1.02] active:scale-95 transition-transform text-sm shadow-lg shadow-primary/20"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AcademyCourses;

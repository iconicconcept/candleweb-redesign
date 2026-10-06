import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { resetPaymentStatus } from "../../redux/slices/paymentSlice";
import tutorService from "../../services/tutorService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { signUpPath } from "../../lib/authRedirect";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";

import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import { useRevealOnScroll } from "../../components/public/Written";
import PaymentSuccessModal from "../../components/Tutor/PaymentSuccessModal";
import AcademyHero from "../../components/Tutor/AcademyHero";
import AcademyValue from "../../components/Tutor/AcademyValue";
import AcademySteps from "../../components/Tutor/AcademySteps";
import AcademyCourses from "../../components/Tutor/AcademyCourses";
import AcademyTutors from "../../components/Tutor/AcademyTutors";
import AcademyPartners from "../../components/Tutor/AcademyPartners";
import AcademyFaq from "../../components/Tutor/AcademyFaq";
import AcademyCta from "../../components/Tutor/AcademyCta";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.candlewebservices.candleweb";

export default function TutorPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { lastPaymentStatus } = useSelector((state: RootState) => state.payment);
  const { purchasedCourseIds } = useSelector(
    (state: RootState) => state.payment,
  );
  const [showModal, setShowModal] = useState(false);
  const hasShownModal = useRef(false);
  useRevealOnScroll();

  // useAxiosAuth() is a fresh instance each render — keep it in a ref so it is
  // not an effect dependency (otherwise the effect re-runs every render).
  const axiosRef = useRef(axiosToken);
  axiosRef.current = axiosToken;

  // Load enrolments once the user is authenticated.
  useEffect(() => {
    if (isLoggedIn && isAuthorizationHeaderSet(axiosRef.current)) {
      dispatch(tutorService.checkStudentProfile(axiosRef.current));
    }
  }, [isLoggedIn, dispatch]);

  // Show the success modal after a Paystack redirect.
  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const queryPayment = router.query.payment || params.get("payment");
    const isPaymentSuccess =
      queryPayment === "success" || lastPaymentStatus === "success";

    if (isPaymentSuccess && !hasShownModal.current) {
      hasShownModal.current = true;
      setShowModal(true);
      dispatch(resetPaymentStatus());

      if (queryPayment === "success") {
        const { payment, ...rest } = router.query;
        router.replace(
          { pathname: router.pathname, query: rest },
          undefined,
          { shallow: true },
        );
      }
    }
  }, [
    router.isReady,
    router.query,
    router.pathname,
    lastPaymentStatus,
    dispatch,
  ]);

  const startLearning = () => {
    if (!isLoggedIn) {
      router.push(signUpPath("/tutor#courses"));
      return;
    }
    if (purchasedCourseIds.length > 0) {
      window.location.href = PLAY_STORE_URL;
      return;
    }
    document
      .getElementById("courses")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>Candleweb Academy | Learn AI automation, finance & trading</title>
        <meta
          name="description"
          content="Candleweb Academy runs short, cohort-based programmes in AI automation, personal finance and crypto trading. Build real projects, earn credits, and get in front of our partners for internships."
        />
        <meta
          name="keywords"
          content="crypto tutor, learn crypto trading, AI automation course, n8n course, cryptocurrency education, Candleweb Academy"
        />
        <meta
          property="og:title"
          content="Candleweb Academy | Learn the skills. Then go and use them."
        />
        <meta
          property="og:description"
          content="Cohort-based programmes in AI automation, personal finance and crypto trading, with internships for top graduates."
        />
        <link rel="canonical" href="https://candleweb.io/tutor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="academy-stage">
        <div className="ac-aura">
          <b className="b1" />
          <b className="b2" />
          <b className="b3" />
        </div>
        <div className="ac-grid" />

        <PaymentSuccessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />

        <PublicHeader
          active="academy"
          cta={{ label: "Start Learning", onClick: startLearning }}
        />

        <AcademyHero />

        <section className="ac-band">
          <div className="landing-wrap ac-sec">
            <AcademyValue />
          </div>
        </section>

        <section className="landing-wrap ac-sec">
          <AcademySteps />
        </section>

        <section className="ac-band" id="courses">
          <div className="landing-wrap ac-sec">
            <AcademyCourses />
          </div>
        </section>

        <section className="landing-wrap ac-sec">
          <AcademyTutors />
        </section>

        <section className="ac-band">
          <div className="landing-wrap ac-sec">
            <AcademyPartners />
          </div>
        </section>

        <section className="landing-wrap ac-sec">
          <AcademyFaq />
        </section>

        <div className="landing-wrap ac-sec" style={{ paddingTop: 0 }}>
          <AcademyCta />
        </div>

        <PublicFooter />
      </main>
    </>
  );
}

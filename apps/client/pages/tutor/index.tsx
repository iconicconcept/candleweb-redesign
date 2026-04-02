import Head from "next/head";
import TutorHeader from "../../components/Tutor/TutorHeader";
import HeroSlider from "../../components/Tutor/HeroSlider";
import FeaturesSection from "../../components/Tutor/FeaturesSection";
import HowItWorksSection from "../../components/Tutor/HowItWorksSection";
import PartnersSection from "../../components/Tutor/PartnersSection";
import ExpertsSection from "../../components/Tutor/ExpertsSection";
import FaqSection from "../../components/Tutor/FaqSection";
import PaymentSection from "../../components/Tutor/PaymentSection";
import StayUpdated from "../../components/Tutor/StayUpdated";
import TutorFooter from "../../components/Tutor/TutorFooter";
import AvailableCourses from "../../components/Tutor/AvailableCourses";

import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import PaymentSuccessModal from "../../components/Tutor/PaymentSuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { resetPaymentStatus } from "../../redux/slices/paymentSlice";
import tutorService from "../../services/tutorService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";

export default function TutorPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const { lastPaymentStatus } = useSelector((state: RootState) => state.payment);
  const { user } = useUserStore();
  const axiosToken = useAxiosAuth();
  const isLoggedIn = Object.keys(user).length > 0;

  const hasShownModal = useRef(false);

  useEffect(() => {
    if (isLoggedIn && isAuthorizationHeaderSet(axiosToken)) {
      dispatch(tutorService.checkStudentProfile(axiosToken));
    }
  }, [isLoggedIn, dispatch, axiosToken]);

  useEffect(() => {
    // Check both router query and URL directly for maximum resilience
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");
    const queryPayment = router.query.payment || params.get('payment');
    const isPaymentSuccess = queryPayment === "success" || lastPaymentStatus === "success";
    
    if (isPaymentSuccess && !hasShownModal.current) {
      hasShownModal.current = true;
      
      // Show modal immediately
      setShowModal(true);
      
      // Cleanup: reset Redux status and clear URL
      dispatch(resetPaymentStatus());
      
      if (queryPayment === "success") {
        const { payment, ...rest } = router.query;
        router.replace(
          {
            pathname: router.pathname,
            query: rest,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [router.isReady, router.query, router.pathname, lastPaymentStatus, dispatch]);

  return (
    <>
      <Head>
        <title>Candleweb - Partner Tutor Service | Learn Crypto & Earn</title>
        <meta
          name="description"
          content="Join the Partner Tutor Service at Candleweb. Master cryptocurrency trading while earning passive income. We invest a portion of your fee back into active trades for you."
        />
        <meta
          name="keywords"
          content="crypto tutor, learn crypto trading, passive income, cryptocurrency education, trading mentorship, CandleWeb tutor"
        />
        <meta
          property="og:title"
          content="Candleweb - Partner Tutor Service | Learn Crypto & Earn"
        />
        <meta
          property="og:description"
          content="Master cryptocurrency trading with expert guidance while earning passive income from day one."
        />
        <link rel="canonical" href="https://candleweb.io/tutor" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="tutor__page relative">
        <PaymentSuccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
        <TutorHeader />
        <HeroSlider />
        <FeaturesSection />
        <HowItWorksSection />
        <AvailableCourses />
        <ExpertsSection />
        <PartnersSection />
        <FaqSection />
        <PaymentSection />
        <StayUpdated />
        <TutorFooter />
      </div>
    </>
  );
}

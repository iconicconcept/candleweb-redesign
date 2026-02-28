import Head from "next/head";
import TutorHeader from "../../components/Tutor/TutorHeader";
import HeroSlider from "../../components/Tutor/HeroSlider";
import FeaturesSection from "../../components/Tutor/FeaturesSection";
import HowItWorksSection from "../../components/Tutor/HowItWorksSection";
import ExpertsSection from "../../components/Tutor/ExpertsSection";
import FaqSection from "../../components/Tutor/FaqSection";
import PaymentSection from "../../components/Tutor/PaymentSection";
import StayUpdated from "../../components/Tutor/StayUpdated";
import TutorFooter from "../../components/Tutor/TutorFooter";
import AvailableCourses from "../../components/Tutor/AvailableCourses";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import PaymentSuccessModal from "../../components/Tutor/PaymentSuccessModal";

export default function TutorPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (router.isReady && router.query.payment === "success") {
      setShowModal(true);
      
      // Clear the query param without refreshing the page
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
  }, [router.isReady, router.query, router.pathname]);

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
        <FaqSection />
        <PaymentSection />
        <StayUpdated />
        <TutorFooter />
      </div>
    </>
  );
}

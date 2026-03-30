import Link from "next/link";
import { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import courseService from "../../services/courseService";
import useUserStore from "../../lib/hooks/useUserStore";
import { useRouter } from "next/router";
import { Button } from "ui";
import Loader from "../Loader";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { courses, isLoading } = useSelector((state: RootState) => state.courses);
  const { purchasedCourseIds } = useSelector((state: RootState) => state.payment);
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { googleAuth } = useGoogleAuth();
  const router = useRouter();

  useEffect(() => {
    dispatch(courseService.getCourses());
  }, [dispatch]);

  // Mark fetch as complete once loading transitions from true → false
  useEffect(() => {
    if (!isLoading) {
      setHasFetched(true);
    }
  }, [isLoading]);

  const slides = courses.length > 0 ? courses.map((course: any) => ({
    badgeMobile: course.certification || "New Partner Program",
    badgeDesktop: course.certification || "New Partner Program",
    title: course.title,
    descriptionMobile: course.description,
    descriptionDesktop: course.description,
  })) : [];

  useEffect(() => {
    if (slides.length === 0) return;
    
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 100);

    const slideTimer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      clearTimeout(slideTimer);
      clearInterval(progressInterval);
    };
  }, [currentSlide, slides.length]);

  // Show loader while fetching OR before the first fetch completes
  const showLoader = isLoading || !hasFetched;

  return (
    <div className="hero__slider relative w-full min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-[fadeIn_1s_ease-in-out]"
        style={{ backgroundImage: "url(/tutor_bg.png)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-purple-800/85 to-blue-900/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto pt-24 md:pt-32 pb-32 md:pb-24">
        {showLoader && <Loader />}
        
        {!showLoader && slides.length === 0 ? (
          <div className="text-center py-20 animate-[fadeIn_1s_ease-in-out]">
            <h2 className="text-white font-bold text-3xl md:text-5xl mb-6">No course is available</h2>
            <p className="text-white/60 text-lg">Check back later for our featured programs.</p>
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              className={`slide__content transition-all duration-1000 ease-in-out ${
                currentSlide === index 
                  ? "opacity-100 translate-x-0 relative z-10 block" 
                  : "opacity-0 -translate-x-full absolute pointer-events-none hidden"
              }`}
            >
              {/* Badge - Different text for mobile/desktop */}
              <div className="inline-flex items-center px-4 py-2 rounded-full border-2 border-primary bg-primary/20 mb-6 backdrop-blur-sm animate-[fadeInDown_0.8s_ease-out]">
                <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></div>
                <span className="text-primary font-semibold text-xs md:text-sm">
                  <span className="md:hidden">{slide.badgeMobile}</span>
                  <span className="hidden md:inline">{slide.badgeDesktop}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-white font-bold text-[2.25rem] md:mb-6 leading-[1.2] mb-5 md:text-[3.5rem] md:leading-[1.15] animate-[fadeInUp_0.9s_ease-out] max-w-sm md:max-w-[500px] lg:max-w-[600px]">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="text-white/80 text-sm leading-relaxed mb-6 md:text-base md:leading-relaxed md:mb-8 max-w-sm animate-[fadeInUp_1s_ease-out] md:max-w-[480px]">
                <span className="md:hidden text-lg italic md:not-italic">{slide.descriptionMobile}</span>
                <span className="hidden md:inline">{slide.descriptionDesktop}</span>
              </p>

              {/* Buttons */}
            <div className="flex flex-col gap-3 md:flex-row md:gap-4 animate-[fadeInUp_1.1s_ease-out] w-full max-w-[290px] md:max-w-none">
              {/* Start Learning Button - Green on mobile, Yellow on desktop */}
                <button
                  className="w-full md:w-auto py-3.5 md:px-8 text-black text-center md:text-start bg-primary md:bg-[#FFA726] hover:bg-primary/90 md:hover:bg-[#FF9800] text-sm md:text-base font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={() => {
                    if (isLoggedIn) {
                      if (purchasedCourseIds.length > 0) {
                        router.push("https://play.google.com/store/apps/details?id=com.candlewebservices.candleweb");
                      } else {
                        // Scroll to courses section
                        const element = document.getElementById('courses');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    } else {
                      googleAuth("/tutor#courses");
                    }
                  }}
                >
                  {purchasedCourseIds.length > 0 ? "Download app" : isLoggedIn ? "Explore Courses" : "Start Learning"}
                </button>
                
                {/* Watch Video Button */}
                <button 
                  className="w-full md:w-auto py-3.5 md:px-8 bg-transparent md:bg-gray-900/80 border-2 border-white md:border-none hover:bg-white/10 text-white text-sm md:text-base font-bold rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-2xl flex items-center justify-center gap-2"
                >
                  <FaPlay className="text-sm" />
                  Watch Video
                </button>
            </div>
            </div>
          ))
        )}

        {/* Progress Indicators - Centered on mobile */}
        {!isLoading && slides.length > 0 && (
          <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 md:translate-x-0 flex items-center gap-3">
            {slides.map((_, index) => (
              <div
                key={index}
                className="relative h-1 w-12 md:w-16 bg-white/20 rounded-full overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110"
                onClick={() => setCurrentSlide(index)}
              >
                {currentSlide === index && (
                  <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                )}
                {currentSlide > index && (
                  <div className="absolute top-0 left-0 h-full w-full bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bouncing Line - Desktop Only (Matched to Mockup) */}
        <div className="hidden md:flex absolute right-10 top-[52%] -translate-y-1/2 flex-col gap-3 items-center justify-end w-1/2 pointer-events-none pr-10 xl:pr-20">
          <div className="w-[300px] md:w-[400px] lg:w-[450px] h-[4px] bg-primary shadow-[0_0_20px_rgba(39,236,176,0.6)] animate-[bounceVertical_1.2s_infinite_ease-in-out]"></div>
          <div className="w-[200px] md:w-[300px] lg:w-[350px] h-[4px] bg-primary/40 shadow-[0_0_15px_rgba(39,236,176,0.3)] animate-[bounceVertical_1.2s_infinite_ease-in-out_-0.6s]"></div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes bounceVertical {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;

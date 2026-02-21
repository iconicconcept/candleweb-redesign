import { useEffect, useState, useRef } from "react";
import { FaBook, FaCreditCard, FaChartLine, FaGraduationCap } from "react-icons/fa";

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const el = sectionRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Mobile steps (numbers only)
  const mobileSteps = [
    {
      number: "1",
      title: "Choose Your Course",
      description: "Browse our comprehensive library and select the perfect course for your skill level and goals.",
    },
    {
      number: "2",
      title: "Learn at Your Pace",
      description: "Access video lessons, interactive quizzes, and downloadable resources. Study anytime, anywhere.",
    },
    {
      number: "3",
      title: "Practice Trading",
      description: "Use our simulation platform to practice strategies risk-free before trading with real money.",
    },
    {
      number: "4",
      title: "Start Earning",
      description: "Apply your knowledge to real markets and start generating consistent profits with confidence.",
    },
  ];

  // Desktop steps (with icons)
  const desktopSteps = [
    {
      number: "1",
      icon: <FaBook className="text-2xl" />,
      title: "Select Course",
      description: "Choose from our comprehensive financial literacy catalog tailored to your goals.",
    },
    {
      number: "2",
      icon: <FaCreditCard className="text-2xl" />,
      title: "Make Payment",
      description: "Secure payment via Paystack with multiple payment options available.",
    },
    {
      number: "3",
      icon: <FaChartLine className="text-2xl" />,
      title: "Auto-Invest",
      description: "We activate your passive trade portfolio immediately upon enrollment.",
    },
    {
      number: "4",
      icon: <FaGraduationCap className="text-2xl" />,
      title: "Start Learning",
      description: "Access live classes and track your earnings in real-time on your dashboard.",
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="how-it-works__section relative w-full py-16 md:py-24 bg-[#0a0a0a] overflow-hidden"
    >
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-white font-bold text-2xl lg:text-3xl mb-4">
            How It Works
          </h2>
          
          {/* Mobile Subtitle */}
          <p className="md:hidden text-white/70 text-sm max-w-md mx-auto">
            Your journey to crypto mastery in 4 simple steps
          </p>
          
          {/* Desktop Subtitle */}
          <p className="hidden md:block text-white/70 text-base lg:text-lg max-w-2xl mx-auto">
            Your journey from enrollment to earning in four simple steps.
          </p>
        </div>

        {/* Mobile Steps - Vertical Layout */}
        <div className="md:hidden relative">
          {/* Vertical Connecting Line */}
          <div className={`absolute left-[19px] top-0 bottom-0 w-[2px] bg-primary z-0 transition-transform duration-[2000ms] origin-top ${isVisible ? "scale-y-100" : "scale-y-0"}`}></div>
          
          <div className="space-y-10">
            {mobileSteps.map((step, index) => (
              <div
                key={index}
                className={`relative flex gap-4 transition-all duration-1000 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-20"
                }`}
                style={{ transitionDelay: `${index * 300}ms` }}
              >
                {/* Number Circle */}
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-primary/50 hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Steps - Horizontal Layout */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Horizontal Connecting Line - Positioned behind the cards */}
            <div className={`absolute top-[40%] left-[10%] right-[10%] h-[2px] bg-primary z-0 transition-transform duration-[2000ms] origin-left ${isVisible ? "scale-x-100" : "scale-x-0"}`}></div>
            
            <div className="relative z-10 grid grid-cols-4 gap-6 lg:gap-8">
              {desktopSteps.map((step, index) => (
                <div
                  key={index}
                  className={`relative transition-all duration-1000 ease-out ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-20"
                  }`}
                  style={{ transitionDelay: `${index * 400}ms` }}
                >
                  {/* Number Circle - Floating above */}
                  <div className="relative mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-black font-bold text-2xl shadow-lg shadow-primary/50 hover:scale-110 transition-all duration-300 group cursor-pointer z-20">
                      {step.number}
                    </div>
                  </div>

                  {/* Card containing Icon and Text */}
                  <div className=" bg-[#111111] border border-gray-800/40 rounded-2xl p-8 flex flex-col items-center text-center hover:border-primary/40 transition-all duration-500 shadow-xl group">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:text-white group-hover:bg-primary/5 transition-all duration-300">
                      {step.icon}
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-white font-bold text-xl mb-4 group-hover:text-primary transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;

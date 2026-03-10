import { useEffect, useState } from "react";
import {
  FaGraduationCap,
  FaChartLine,
  FaUsers,
  FaWallet,
  FaBriefcase,
} from "react-icons/fa";

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Mobile features
  const mobileFeatures = [
    {
      icon: <FaWallet className="text-2xl" />,
      title: "Real-World Projects",
      description:
        "Design and build real-world projects that reinforce what you've learned, grow your portfolio, and showcase your skills to recruiters.",
    },
    {
      icon: <FaBriefcase className="text-2xl" />,
      title: "Earn AI Units",
      description:
        "Complete tasks and quizzes to earn AI Credits. Use these credits to unlock powerful trading tools and automation services on the CandleWeb dashboard.",
    },
    {
      icon: <FaBriefcase className="text-2xl" />,
      title: "Internship Opportunities",
      description:
        "Top performers gain access to exclusive internship slots, real-world project experience, and networking with industry leaders to kickstart their career.",
    },
  ];

  // Desktop features
  const desktopFeatures = [...mobileFeatures];

  return (
    <section className="features__section relative w-full py-16 md:py-24 bg-black/90 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        {/* Section Header */}
        <div
          className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* Mobile Title */}
          <h2 className="md:hidden text-white font-bold text-2xl mb-3">
            More Than Just a Course.
          </h2>

          {/* Desktop Title */}
          <h2 className="hidden md:block text-white font-bold text-3xl lg:text-4xl mb-3">
            More Than Just a Course.
          </h2>

          {/* Mobile Subtitle */}
          <p className="md:hidden text-white/70 text-base max-w-md mx-auto">
            We&apos;ve reimagined education by integrating real financial growth
            directly into the learning process.
          </p>

          {/* Desktop Subtitle */}
          <p className="hidden md:block text-white/70 text-base lg:text-lg max-w-3xl mx-auto">
            We&apos;ve reimagined education by integrating real financial growth
            directly into the learning process.
          </p>
        </div>

        {/* Mobile Features - Vertical Stack */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {mobileFeatures.map((feature, index) => (
            <div
              key={index}
              className={`feature__card group relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/5 hover:border-primary transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-xl mb-3">
                {feature.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Features - Horizontal Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          {desktopFeatures.map((feature, index) => (
            <div
              key={index}
              className={`feature__card group relative bg-gray-800/20 rounded-2xl p-8 border border-white/5 hover:border-primary transition-all duration-500 overflow-hidden ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Quarter Circle Decoration - Top Right */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Quarter Circle Border Effect */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-500"></div>
              </div>

              {/* Icon */}
              <div className="relative w-14 h-14 rounded-xl bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-white/60 mb-6 group-hover:scale-110 group-hover:border-primary/30 group-hover:text-primary transition-all duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-xl mb-4 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
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
      `}</style>
    </section>
  );
};

export default FeaturesSection;

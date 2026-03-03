import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import tutorService from "../../services/tutorService";
import { FaLinkedinIn, FaGlobe, FaStar, FaCheck, FaUser } from "react-icons/fa";
import Loader from "../Loader";
import { imageUri } from "../../utils/constants";

const ExpertsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { tutors, isLoading } = useSelector((state: RootState) => state.tutors);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(tutorService.getTutors());

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const el = sectionRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const renderStars = (rating: string) => {
    const num = parseInt(rating) || 5;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`${i < num ? "text-primary" : "text-white/20"} text-xs`}
          />
        ))}
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="experts-section relative w-full py-20 bg-[#0a0a0a] overflow-hidden"
    >
      {isLoading && <Loader />}
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1400px] lg:mx-auto">
        {/* Section Header */}
        <div
          className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* Desktop Heading */}
          <div className="hidden md:block text-center mb-16">
            <h2 className="text-white font-bold text-[16px] md:text-3xl lg:text-4xl mb-6">
              Learn from Industry Experts
            </h2>
            <p className="text-white/60 text-lg lg:text-xl max-w-3xl mx-auto font-light leading-relaxed">
              Our world-class tutors bring decades of combined experience in
              Backend Engineering, Blockchain developemnt, AI Automation, AI Engineering, Personal Finance, Cryptocurrency Trading.
            </p>
          </div>

          {/* Mobile Heading */}
          <div className="md:hidden text-center mb-10">
            <h2 className="text-white font-bold text-2xl lg:text-3xl mb-4">
              Meet Your Tutors
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
              Learn from industry experts with proven track records
            </p>
          </div>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden md:block">
          {!isLoading && tutors.length === 0 ? (
            <div
              className={`transition-all duration-1000 flex justify-center w-full ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="bg-[#111111]/40 border border-white/5 rounded-[32px] p-12 flex flex-col items-center text-center backdrop-blur-3xl max-w-2xl w-full">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FaStar className="text-primary text-3xl opacity-50" />
                </div>
                <h3 className="text-white font-bold text-2xl mb-2">
                  No Tutors Available
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  We&apos;re currently updating our roster of world-class
                  experts. Please check back soon to meet our new masters of
                  cryptocurrency trading.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {tutors.map((tutor: any, index: any) => {
                console.log(`Rendering Tutor ${index}:`, tutor);
                if (!tutor) return null;
                return (
                  <div
                    key={tutor.id}
                    className={`relative bg-[#111111]/40 border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center backdrop-blur-3xl hover:border-primary/30 transition-all duration-500 group ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-20"
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    {/* Profile Image with Ring and Badge */}
                    <div className="relative mb-6">
                      <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full p-1.5 border-2 border-primary/40 group-hover:border-primary transition-colors duration-500">
                        <div className="w-full h-full rounded-full overflow-hidden relative grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 bg-white/5 flex items-center justify-center">
                          {tutor.picture &&
                          typeof tutor.picture === "string" ? (
                            <Image
                              src={tutor.picture.startsWith('http') ? tutor.picture : imageUri + tutor.picture}
                              alt={tutor.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <FaUser className="text-white/20 text-4xl" />
                          )}
                        </div>
                      </div>
                      {/* Verified Badge */}
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-[#0a0a0a] shadow-lg">
                        <FaCheck className="text-black text-xs" />
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="text-white font-bold text-xl mb-1 group-hover:text-primary transition-colors">
                      {tutor.name}
                    </h3>
                    <p className="text-primary text-sm font-medium mb-4">
                      {tutor.title}
                    </p>

                    {/* Rating */}
                    <div className="mb-6">{renderStars(tutor.rating)}</div>

                    <p className="text-white/85 text-sm leading-relaxed mb-8 h-20 overflow-hidden line-clamp-3">
                      {tutor.bio || "No Bio Provided"}
                    </p>

                    {/* Stats Box */}
                    <div className="w-full bg-black/40 rounded-2xl p-4 flex flex-col items-center border border-white/5 group-hover:bg-black/60 transition-all">
                      <span className="text-primary font-bold text-xl mb-0.5">
                        {tutor.total_students.toLocaleString()}+
                      </span>
                      <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                        Students Mentored
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Layout - Horizontal Slider */}
        <div className="md:hidden">
          {!isLoading && tutors.length === 0 ? (
            <div className="bg-[#111111] border border-white/5 rounded-[24px] p-8 text-center">
              <h3 className="text-white font-bold text-xl mb-2">
                No Tutors Available
              </h3>
              <p className="text-white/40 text-sm">
                Check back soon for new updates.
              </p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar">
              {tutors.map((tutor: any, index: any) => {
                if (!tutor) return null;
                return (
                  <div
                    key={tutor.id}
                    className="flex-shrink-0 w-[260px] bg-[#111111] border border-white/5 rounded-[24px] overflow-hidden snap-center flex flex-col"
                  >
                    {/* Large Image on top */}
                    <div className="relative w-full aspect-square flex items-center justify-center bg-white/5">
                      {tutor.picture && typeof tutor.picture === "string" ? (
                        <>
                          <Image
                            src={tutor.picture.startsWith('http') ? tutor.picture : imageUri + tutor.picture}
                            alt={tutor.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        </>
                      ) : (
                        <FaUser className="text-white/20 text-6xl" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-white font-bold text-xl mb-1">
                        {tutor.name}
                      </h3>
                      <p className="text-primary text-sm font-medium mb-4">
                        {tutor.title}
                      </p>
                      <p className="text-white/85 text-sm leading-relaxed mb-6 line-clamp-4">
                        {tutor.bio || "No Bio Provided"}
                      </p>

                      {/* Rating & Students */}
                      <div className="mt-auto flex items-center gap-4 text-white/40 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          {renderStars(tutor.rating)}
                          <span className="text-white ml-1">
                            {tutor.rating || "5"}
                          </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                        <span>
                          {tutor.total_students.toLocaleString()} students
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
    </section>
  );
};

export default ExpertsSection;

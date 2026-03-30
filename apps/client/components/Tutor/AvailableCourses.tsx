import { useEffect, useState } from "react";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import courseService from "../../services/courseService";
import paymentService from "../../services/paymentService";
import { resetPaymentStatus } from "../../redux/slices/paymentSlice";
import { FaCheck, FaClock, FaVideo, FaAward, FaChartLine, FaUsers, FaDollarSign } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import useUserStore from "../../lib/hooks/useUserStore";
import { useRouter } from "next/router";
import Loader from "../Loader";
import { toast } from "react-hot-toast";
import tutorService from "../../services/tutorService";
import { imageUri } from "../../utils/constants";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";


declare let window: any;

const AvailableCourses = () => {
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { courses, isLoading } = useSelector((state: RootState) => state.courses);
  const { purchasedCourseIds, lastPaymentStatus, error: paymentError, isInitiating, isVerifying } = useSelector((state: RootState) => state.payment);
  const [showAll, setShowAll] = useState(false);
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { googleAuth } = useGoogleAuth();
  const router = useRouter();

  // Live NGN → USD exchange rate (open.er-api.com — no API key required)
  const [usdRate, setUsdRate] = useState<number | null>(null);

  // State for Name Prompt Modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);



  useEffect(() => {
    dispatch(courseService.getCourses());
    setIsVisible(true);
  }, [dispatch]);

  // Fetch live NGN → USD rate once on mount
  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Free open tier — no API key needed, updates hourly
        const res = await fetch("https://open.er-api.com/v6/latest/NGN");
        const data = await res.json();
        if (data?.rates?.USD) {
          setUsdRate(data.rates.USD);
        }
      } catch {
        // Silently fail — Naira price will still be shown
      }
    };
    fetchRate();
  }, []);

  // Convert Naira amount to USD string, e.g. "25.40"
  const toUSD = (naira: number): string | null => {
    if (!usdRate) return null;
    return (naira * usdRate).toFixed(2);
  };

  useEffect(() => {
    if (lastPaymentStatus === "failed" && paymentError) {
      toast.error(paymentError);
      dispatch(resetPaymentStatus());
    }
  }, [lastPaymentStatus, paymentError, dispatch]);

  const initiatePaymentWithNames = async (course: any, firstName: string, lastName: string) => {
    try {
      const resultAction = await dispatch(paymentService.initiatePayment({
        course_id: course.id,
        email: user.email || "",
        first_name: firstName,
        last_name: lastName,
        callback_url: `${window.location.origin}/tutor/verify`,
      }));

      if (paymentService.initiatePayment.fulfilled.match(resultAction)) {
        const paymentData = resultAction.payload?.data;
        
        if (paymentData?.authorization_url) {
          window.location.href = paymentData.authorization_url;
        } else {
          toast.error("Unable to get payment authorization link. Please try again.");
        }
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handlePayment = async (course: any) => {
    if (!isLoggedIn) {
      googleAuth("/tutor#courses");
      return;
    }

    if (purchasedCourseIds.includes(course.id)) {
      router.push("/dashboard");
      return;
    }

    const firstName = user.first_name || "";
    const lastName = user.last_name || "";

    // If we already have names in the local storage, we can use them
    // but the requirement says to check the endpoint.
    setIsCheckingProfile(true);
    try {
      const profileResult = await dispatch(tutorService.checkStudentProfile());
      if (tutorService.checkStudentProfile.fulfilled.match(profileResult)) {
        const profileData = profileResult.payload?.data;
        if (profileData?.has_profile && !profileData?.needs_names) {
          initiatePaymentWithNames(course, profileData.first_name, profileData.last_name);
        } else {
          // If profile is missing or names are needed, show modal
          setSelectedCourse(course);
          setTempFirstName(profileData?.first_name || firstName);
          setTempLastName(profileData?.last_name || lastName);
          setShowNameModal(true);
        }
      } else {
        // Fallback to local names if API fails? 
        // Or if API says success but data is weird.
        // The user says "check if the student has a profile already... and if not, modal shows up"
        if (!firstName || !lastName) {
          setSelectedCourse(course);
          setShowNameModal(true);
        } else {
          initiatePaymentWithNames(course, firstName, lastName);
        }
      }
    } catch (err) {
      console.error("Profile check failed:", err);
      // Fallback
      if (!firstName || !lastName) {
        setSelectedCourse(course);
        setShowNameModal(true);
      } else {
        initiatePaymentWithNames(course, firstName, lastName);
      }
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const displayedCourses = showAll ? courses : courses.slice(0, 3);

  return (
    <section id="courses" className="available-courses__section relative w-full py-16 md:py-24 bg-black/70 overflow-hidden">
      {(isLoading || isInitiating || isVerifying || isCheckingProfile) && <Loader />}
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 md:mb-20 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-white font-bold text-2xl md:text-3xl lg:text-4xl mb-3">
            Available Courses
          </h2>
          {/* Desktop Subtitle */}
          <p className="hidden md:block text-white/60 text-lg lg:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            Comprehensive programs designed to transform you from beginner to expert.
          </p>
          {/* Mobile Subtitle */}
          <p className="md:hidden text-white/60 text-sm max-w-3xl mx-auto font-light leading-relaxed">
            Comprehensive programs designed to transform you from beginner to expert.
          </p>
        </div>

        {/* Course Cards Container */}
        <div className="flex flex-col gap-8 md:gap-10">
          {!isLoading && courses.length === 0 ? (
            <div className={`transition-all duration-1000 flex justify-center w-full ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="bg-[#111111]/40 border border-white/5 rounded-[32px] p-12 flex flex-col items-center text-center backdrop-blur-3xl max-w-2xl w-full">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FaAward className="text-primary text-3xl opacity-50" />
                </div>
                <h3 className="text-white font-bold text-2xl mb-2">No Courses Available</h3>
                <p className="text-white/60 max-w-md mx-auto">
                  We&apos;re currently curating new high-quality courses. Please check back soon for our latest educational offerings.
                </p>
              </div>
            </div>
          ) : (
          displayedCourses?.map((course: any, index: any) => (
            <div
              key={course.id}
              className={`group relative bg-gray-900/10 border border-white/5 rounded-[24px] overflow-hidden backdrop-blur-3xl transition-all duration-700 hover:border-primary/20 hover:bg-gray-800/20 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Image Section - Top on mobile, Left on desktop */}
                <div className="relative w-full md:w-[330px] lg:w-[380px] aspect-[16/10] md:aspect-auto overflow-hidden bg-white/5 flex items-center justify-center">
                  {course.image ? (
                    <Image
                      src={course.image.startsWith('http') ? course.image : imageUri + course.image}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/20">
                      <FaAward className="text-6xl mb-2" />
                      <span className="text-sm">No Preview</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:hidden"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]/20 hidden md:block"></div>
                </div>

                {/* Content Section - Middle */}
                <div className="flex-1 p-5 lg:p-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold text-xl lg:text-2xl mb-4 group-hover:text-primary transition-colors duration-300">
                      {course.title}
                    </h3>
                    <p className="text-white/50 text-sm lg:text-base mb-6 leading-relaxed max-w-2xl">
                      {course.description}
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-8">
                      {course.features && course.features.length > 0 ? (
                         course.features.slice(0, 8).map((feature: any, i: any) => (
                        <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <FaCheck className="text-primary text-[10px]" />
                          </div>
                          <span className="truncate">{feature}</span>
                        </div>
                      ))
                      ) : (
                        <span className="text-white/30 text-sm italic">No specific features listed</span>
                      )}
                    </div>
                  </div>

                  {/* Meta Info Row */}
                  <div className="flex items-center gap-6 text-white/40 text-xs font-medium uppercase tracking-wider flex-wrap">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-primary/60" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaVideo className="text-primary/60" />
                      <span>{course.lessons} Hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-primary/60" />
                      {/* <span>{course.current_enrollment_count || 0} Enrolled</span> */}
                      <span>98 Enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaAward className="text-primary/60" />
                      <span>{course.certification}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA Section - Right on desktop, bottom on mobile */}
                <div className="w-full md:w-[300px] lg:w-[340px] p-6 lg:p-10 border-t border-white/5 md:border-t-0 md:border-l flex flex-col items-center justify-center text-center bg-white/[0.03] md:bg-black/20">
                  <div className="w-full flex flex-col items-center gap-3 justify-center mb-4">
                    <div className="text-center">
                      <span className="block text-primary md:text-white font-bold text-3xl md:text-3xl lg:text-4xl mb-0.5 md:mb-1">₦{course.price.toFixed(2)}</span>
                      {/* Live USD equivalent */}
                      {toUSD(course.price) && (
                        <span className="inline-flex items-center text-center gap-1 mb-0.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                          <FaDollarSign className="text-[10px]" />
                          {toUSD(course.price)}
                        </span>
                      )}
                      <span className="hidden md:block text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">One-time payment</span>
                      <span className="md:hidden text-center mt-1 text-white/40 text-[10px] uppercase tracking-widest font-bold block">One-time payment</span>
                    </div>

                    <button 
                      onClick={() => handlePayment(course)}
                      className="md:hidden px-8 py-3 rounded-full bg-primary text-black font-bold text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-primary/20">
                      {purchasedCourseIds.includes(course.id) ? "Dashboard" : "Pay Now"}
                    </button>
                  </div>

                  <button 
                    onClick={() => handlePayment(course)}
                    className="hidden md:flex w-full py-4 mb-6 rounded-full border border-red-300 text-black font-bold text-sm tracking-wide transition-all duration-300 bg-primary hover:text-black hover:scale-105 active:scale-95 items-center justify-center gap-2 group/btn">
                    {purchasedCourseIds.includes(course.id) ? "Dashboard" : "Pay Now"}
                    <HiArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </button>

                  {/* <div className="w-full flex flex-col items-center gap-2 pt-6 border-t border-white/5 md:border-none md:pt-0 md:mt-auto">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Passive Revenue Potential</span>
                    <span className="text-primary font-bold text-xl flex items-center gap-2">
                      <FaChartLine className="text-sm opacity-50" />
                      {course.passiveRevenue}
                    </span>
                  </div> */}
                </div>
              </div>
            </div>
          ))
          )}

          {/* Show More / Show Less Button */}
          {!isLoading && courses.length > 3 && (
            <div className={`flex justify-center mt-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 group"
              >
                {showAll ? "Show Less" : "Show More Courses"}
                <HiArrowRight className={`transition-transform duration-500 ${showAll ? "-rotate-90" : "group-hover:translate-x-1"}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

      {/* Name Prompt Modal */}
      {showNameModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-[24px] p-6 lg:p-8 w-full max-w-md relative shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-2">Complete Your Profile</h3>
            <p className="text-white/60 text-sm mb-6">Please provide your first and last name to proceed with the payment.</p>
            
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">First Name</label>
                <input 
                  type="text" 
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">Last Name</label>
                <input 
                  type="text" 
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setShowNameModal(false);
                  setTempFirstName("");
                  setTempLastName("");
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
                  setShowNameModal(false);
                  initiatePaymentWithNames(selectedCourse, tempFirstName.trim(), tempLastName.trim());
                  // Reset fields after initiation
                  setTempFirstName("");
                  setTempLastName("");
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
    </section>
  );
};

export default AvailableCourses;

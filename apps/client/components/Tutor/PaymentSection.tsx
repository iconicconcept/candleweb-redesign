import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import useUserStore from "../../lib/hooks/useUserStore";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";
import {
  FaLock,
  FaShieldAlt,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaBitcoin,
  FaChevronDown,
} from "react-icons/fa";
import courseService from "../../services/courseService";
import paymentService from "../../services/paymentService";
import tutorService from "../../services/tutorService";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Loader from "../Loader";

declare let window: any;

const PaymentSection = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { googleAuth } = useGoogleAuth();
  const { purchasedCourseIds, isInitiating, isVerifying } = useSelector(
    (state: RootState) => state.payment,
  );
  const { courses, isLoading } = useSelector(
    (state: RootState) => state.courses,
  );
  const router = useRouter();
  const axiosToken = useAxiosAuth();

  // Local state
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempPhoneNumber, setTempPhoneNumber] = useState("");
  const [tempReferralUsername, setTempReferralUsername] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    dispatch(courseService.getCourses());
  }, [dispatch]);

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
        phone: phone,
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
          // Free course — enrollment is already completed by the backend.
          toast.success("You're enrolled! Taking you to your dashboard.");
          router.push("/dashboard");
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

  const handlePaymentFlow = async (course: any) => {
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
          setTempFirstName(profileData?.first_name || firstName);
          setTempLastName(profileData?.last_name || lastName);
          setTempPhoneNumber(profileData?.phone || phone);
          setShowNameModal(true);
        }
      } else {
        if (!firstName || !lastName) {
          setShowNameModal(true);
        } else {
          initiatePaymentWithNames(course, firstName, lastName, phone);
        }
      }
    } catch (err) {
      console.error("Profile check failed:", err);
      if (!firstName || !lastName) {
        setShowNameModal(true);
      } else {
        initiatePaymentWithNames(course, firstName, lastName, phone);
      }
    } finally {
      setIsCheckingProfile(false);
    }
  };

  return (
    <section className="payment-section relative w-full py-16 md:py-24 bg-[#0a0a0a]">
      {(isLoading || isInitiating || isVerifying || isCheckingProfile) && (
        <Loader />
      )}
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        {/* Desktop Layout - Horizontal Box */}
        <div className="hidden md:flex flex-row items-stretch bg-[#111111] border border-white/5 rounded-[32px] overflow-visible backdrop-blur-3xl shadow-2xl">
          {/* Left Side - Info */}
          <div className="flex-1 p-6 md:p-10 lg:p-14">
            <h2 className="text-white font-bold text-2xl md:text-3xl lg:text-4xl mb-3">
              Ready to Start?
            </h2>
            <div className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center text-center p-6 md:p-8">
              <p className="text-white/40 text-xs md:text-sm lg:text-base max-w-xs">
                Select a course above to proceed with your journey to financial
                freedom.
              </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-white/5 my-10"></div>

          {/* Right Side - Action */}
          <div className="w-full md:w-[320px] lg:w-[440px] p-6 md:p-10 lg:p-14 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-white/40 font-medium text-xs md:text-sm">
                Total Amount
              </span>
              <span className="text-primary font-bold text-3xl md:text-4xl lg:text-5xl">
                $0.00
              </span>
            </div>

            <button
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className="w-full py-4 md:py-5 bg-[#ff9900] hover:bg-[#ffaa22] text-black font-black text-center text-sm md:text-lg uppercase tracking-widest rounded-full transition-all duration-300 transform active:scale-95 shadow-[0_0_30px_rgba(255,153,0,0.3)] mb-4 flex items-center justify-between px-3"
            >
              {selectedCourse ? selectedCourse.title : "SELECT & PAY"}
              <FaChevronDown
                className={`transition-transform ${showCourseDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Course Dropdown */}
            {showCourseDropdown && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#111111] border border-white/10 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto z-50">
                {isLoading ? (
                  <div className="p-4 text-white/60 text-center text-sm">
                    Loading courses...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-4 text-white/60 text-center text-sm">
                    No courses available
                  </div>
                ) : (
                  courses.map((course: any) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowCourseDropdown(false);
                        handlePaymentFlow(course);
                      }}
                      className="w-full p-4 text-left border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      <p className="text-white font-semibold text-sm">
                        {course.title}
                      </p>
                      <p className="text-white/60 text-xs mt-1">
                        ₦{course.price.toFixed(2)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <div className="px-2 py-1 rounded bg-white/5 flex items-center gap-1 md:gap-2">
                <FaShieldAlt className="text-primary" />
                <span>
                  Secured by <span className="text-white">Paystack</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Vertical Card with Green Glow */}
        <div className="md:hidden relative p-[1px] rounded-[32px] bg-gradient-to-b from-primary/40 to-transparent shadow-[0_0_40px_rgba(74,222,128,0.15)] overflow-visible">
          <div className="bg-[#0f0f0f] rounded-[31px] p-6 flex flex-col items-center">
            <h2 className="text-white font-bold text-2xl mb-3">
              Ready to Start?
            </h2>
            <p className="text-white/40 text-sm text-center mb-10 leading-relaxed">
              Select a course above to proceed with your journey to financial
              freedom.
            </p>

            {/* Price Breakdown Box */}
            <div className="w-full bg-[#080808] border border-white/5 rounded-2xl p-8 mb-10">
              <div className="flex justify-between mb-4">
                <span className="text-white/40 text-sm">Subtotal</span>
                <span className="text-white font-bold text-sm">$0.00</span>
              </div>
              <div className="flex justify-between mb-6">
                <span className="text-white/40 text-sm">Discount</span>
                <span className="text-primary font-bold text-sm">-$0.00</span>
              </div>
              <div className="h-px bg-white/10 mb-8"></div>
              <div className="flex justify-between items-center">
                <span className="text-white font-black text-xl">Total</span>
                <span className="text-primary font-black text-3xl">$0.00</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full relative mb-6">
              <button
                onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                className="w-full py-3 bg-[#ff9900] text-center hover:bg-[#ffaa22] text-black font-black text-lg uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {selectedCourse ? selectedCourse.title : "SELECT & PAY"}
                <FaChevronDown
                  className={`transition-transform ${showCourseDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {/* Course Dropdown Mobile */}
              {showCourseDropdown && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-[#111111] border border-white/10 rounded-xl shadow-2xl max-h-[250px] overflow-y-auto z-50">
                  {isLoading ? (
                    <div className="p-4 text-white/60 text-center text-sm">
                      Loading courses...
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="p-4 text-white/60 text-center text-sm">
                      No courses available
                    </div>
                  ) : (
                    courses.map((course: any) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowCourseDropdown(false);
                          handlePaymentFlow(course);
                        }}
                        className="w-full p-4 text-left border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-white font-semibold text-sm">
                          {course.title}
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                          ₦{course.price.toFixed(2)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Payment Icons */}
            <div className="flex gap-6 text-white/30 text-2xl mb-6">
              <FaCcVisa className="hover:text-white transition-colors" />
              <FaCcMastercard className="hover:text-white transition-colors" />
              <FaCcPaypal className="hover:text-white transition-colors" />
              <FaCcMastercard className="hover:text-white transition-colors" />
            </div>

            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
              Secure payment powered by Paystack
            </span>
          </div>
        </div>

        {/* Footer Meta Details */}
        <div className="mt-16 md:mt-24 text-center">
          <p className="text-white/40 text-[10px] md:text-sm mb-6 font-light max-w-lg mx-auto leading-relaxed">
            By proceeding, you agree to our{" "}
            <Link
              href={"/terms"}
              className="text-white underline cursor-pointer"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href={"/privacy"}
              className="text-white underline cursor-pointer"
            >
              Privacy Policy
            </Link>
          </p>
          <div className="flex items-center justify-center gap-8 text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <FaLock className="text-primary" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-primary" />
              <span>Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]"></div>
        {/* Subtle pattern lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#0a0a0a_70%),_linear-gradient(rgba(74,222,128,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(74,222,128,0.1)_1px,_transparent_1px)] bg-[length:100%_100%,40px_40px,40px_40px]"></div>
        </div>
      </div>

      {/* Name Prompt Modal */}
      {showNameModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-[24px] p-6 lg:p-8 w-full max-w-md relative shadow-2xl">
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
    </section>
  );
};

export default PaymentSection;

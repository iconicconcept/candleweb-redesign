import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import useUserStore from "../../lib/hooks/useUserStore";
import { FaLock, FaShieldAlt, FaCcVisa, FaCcMastercard, FaCcPaypal, FaBitcoin } from "react-icons/fa";

const PaymentSection = () => {
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { purchasedCourseIds } = useSelector((state: RootState) => state.payment);
  const router = useRouter();

  return (
    <section className="payment-section relative w-full py-16 md:py-24 bg-[#0a0a0a]">
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        
        {/* Desktop Layout - Horizontal Box */}
        <div className="hidden md:flex flex-row items-stretch bg-[#111111] border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-3xl shadow-2xl">
          {/* Left Side - Info */}
          <div className="flex-1 p-6 md:p-10 lg:p-14">
            <h2 className="text-white font-bold text-2xl md:text-3xl lg:text-4xl mb-6">
              Ready to Start?
            </h2>
            <div className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center text-center p-6 md:p-8">
               <p className="text-white/40 text-xs md:text-sm lg:text-base max-w-xs">
                 Select a course above to proceed with your journey to financial freedom.
               </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-white/5 my-10"></div>

          {/* Right Side - Action */}
          <div className="w-full md:w-[320px] lg:w-[440px] p-6 md:p-10 lg:p-14 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-white/40 font-medium text-xs md:text-sm">Total Amount</span>
              <span className="text-primary font-bold text-3xl md:text-4xl lg:text-5xl">$0.00</span>
            </div>

            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/register?redirect=/tutor#courses");
                } else if (purchasedCourseIds.length > 0) {
                  router.push("/dashboard");
                } else {
                  const element = document.getElementById('courses');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className="w-full py-4 md:py-5 bg-[#ff9900] hover:bg-[#ffaa22] text-black font-black text-center text-sm md:text-lg uppercase tracking-widest rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_30px_rgba(255,153,0,0.3)] mb-4">
              {purchasedCourseIds.length > 0 ? "GO TO DASHBOARD" : "PAY NOW"}
            </button>

            <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">
               <div className="px-2 py-1 rounded bg-white/5 flex items-center gap-1 md:gap-2">
                 <FaShieldAlt className="text-primary" />
                 <span>Secured by <span className="text-white">Paystack</span></span>
               </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Vertical Card with Green Glow */}
        <div className="md:hidden relative p-[1px] rounded-[32px] bg-gradient-to-b from-primary/40 to-transparent shadow-[0_0_40px_rgba(74,222,128,0.15)] overflow-hidden">
          <div className="bg-[#0f0f0f] rounded-[31px] p-6 flex flex-col items-center">
             <h2 className="text-white font-bold text-3xl mb-4">
               Ready to Start?
             </h2>
             <p className="text-white/40 text-sm text-center mb-10 leading-relaxed">
               Select a course above and begin your journey to financial freedom
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
             <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    router.push("/register?redirect=/tutor#courses");
                  } else if (purchasedCourseIds.length > 0) {
                    router.push("/dashboard");
                  } else {
                    const element = document.getElementById('courses');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="w-full py-3 bg-[#ff9900] text-center hover:bg-[#ffaa22] text-black font-black text-lg uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 mb-6">
                {purchasedCourseIds.length > 0 ? "GO TO DASHBOARD" : "PAY NOW"}
             </button>

             {/* Payment Icons */}
             <div className="flex gap-6 text-white/30 text-2xl mb-6">
                <FaCcVisa className="hover:text-white transition-colors" />
                <FaCcMastercard className="hover:text-white transition-colors" />
                <FaCcPaypal className="hover:text-white transition-colors" />
                <FaBitcoin className="hover:text-white transition-colors" />
             </div>

             <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
               Secure payment powered by Stripe
             </span>
          </div>
        </div>

        {/* Footer Meta Details */}
        <div className="mt-16 md:mt-24 text-center">
           <p className="text-white/40 text-[10px] md:text-sm mb-6 font-light max-w-lg mx-auto leading-relaxed">
             By proceeding, you agree to our <Link href={"/terms"} className="text-white underline cursor-pointer">Terms of Service</Link> and <Link href={"/privacy"} className="text-white underline cursor-pointer">Privacy Policy</Link>
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
    </section>
  );
};

export default PaymentSection;

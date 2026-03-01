import React from "react";
import { FaAndroid } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-[fadeIn_0.3s_ease-out]"></div>
      
      {/* Modal Content */}
      <div 
        className="relative bg-gradient-to-br from-[#121212] to-[#1a1a1a] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-[scaleUp_0.4s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <IoClose size={24} />
        </button>

        <div className="mt-4 mb-6 relative">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-[0_0_20px_rgba(39,236,176,0.2)]">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-[pulse_2s_infinite]">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-white font-bold text-2xl md:text-3xl mb-4 leading-tight">
            Payment Successful!
          </h2>
          
          <p className="text-white/70 text-base md:text-lg mb-8">
            Download our app to begin your classes and unlock your full potential.
          </p>

          <div className="flex flex-col items-center gap-6">
            <a 
              href="https://play.google.com/store/apps/details?id=com.candlewebservices.candleweb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all duration-300 transform hover:scale-105"
            >
              <FaAndroid className="text-primary text-6xl transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-2 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Click to Download
              </div>
            </a>

            <button
              onClick={onClose}
              className="mt-4 px-10 py-3 bg-[#FFA726] hover:bg-[#FF9800] text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_4px_15px_rgba(255,167,38,0.3)] min-w-[160px]"
            >
              OKAY
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39,236,176, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(39,236,176, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39,236,176, 0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;

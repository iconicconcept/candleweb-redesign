import { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import tutorService from "../../services/tutorService";

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { faqs, isLoading } = useSelector((state: RootState) => state.tutors);

  useEffect(() => {
    dispatch(tutorService.getFaqs());
  }, [dispatch]);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Sort FAQs by order if available, otherwise keep API order
  const sortedFaqs = [...faqs].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="faq-section relative w-full py-20 md:py-32 bg-black/70 overflow-hidden">
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1200px] lg:mx-auto">
        {/* Desktop Header */}
        <div className="hidden md:block text-center mb-20">
          <h2 className="text-white font-bold text-[16px] md:text-3xl lg:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden text-center mb-12">
          <span className="text-white font-bold text-[16px] md:text-3xl lg:text-4xl mb-4 block">
            Frequently asked questions
          </span>
          {/* Subtle decoration as seen in mobile mockup */}
          <div className="absolute top-0 left-0 w-full h-[300px] pointer-events-none opacity-20 transform -translate-y-1/2">
             <svg viewBox="0 0 400 400" className="w-full h-full text-primary">
                <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
                <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
             </svg>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="w-full max-w-4xl mx-auto space-y-0">
          {!isLoading && sortedFaqs.length === 0 ? (
             <div className="text-center text-xl text-white py-10">
               <p>No FAQs available at the moment.</p>
             </div>
          ) : (
            sortedFaqs.map((faq, index) => (
              <div 
                key={faq.id || index} 
                className="group border-b border-primary/30 last:border-none"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full py-6 md:py-8 flex items-center justify-between text-left focus:outline-none transition-all"
                >
                  <span className="text-white font-medium text-[14px] md:text-xl lg:text-2xl pr-8 group-hover:text-primary transition-colors duration-300">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {activeIndex === index ? (
                      <FaMinus className="text-primary text-text-[15px] transition-transform duration-300 rotate-180" />
                    ) : (
                      <FaPlus className="text-primary text-text-[15px] transition-transform duration-300" />
                    )}
                  </div>
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeIndex === index ? "max-h-[300px] pb-8 md:pb-10 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-white/60 text-[14px] md:text-base lg:text-lg leading-relaxed max-w-3xl">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
    </section>
  );
};

export default FaqSection;

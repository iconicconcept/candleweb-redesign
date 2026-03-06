import React from "react";
import Image from "next/image";

const partners = [
  { name: "Savvy", logo: "/savvy-logo.svg" },
  { name: "Bitmart", logo: "/bitmart-logo.png" },
  { name: "MonieRate", logo: "/monierate-logo.png" },
  { name: "n8n", logo: "/n8n_pink+black_logo.png" },
  { name: "Chain Co-op", logo: "/chain-co-op-logo.png" },
];

const PartnersSection = () => {
  return (
    <section className="partners-section relative w-full py-20 bg-black/70 overflow-hidden">
      <div className="relative z-10 w-full px-6 md:px-20 lg:max-w-[1400px] lg:mx-auto text-center mb-16">
        <h2 className="text-white font-bold text-2xl md:text-3xl lg:text-4xl mb-3">
          Our Partners
        </h2>
        <p className="md:hidden text-white/60 text-sm mx-auto font-light leading-relaxed">
          Through our trusted industry partners, outstanding graduates gain immediate internship opportunities.
        </p>
        <p className="hidden md:block text-white/60 text-sm lg:text-xl max-w-3xl mx-auto font-light leading-relaxed">
          Through our trusted industry partners, outstanding graduates gain immediate internship opportunities.
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden flex before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-[#0a0a0a] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-[#0a0a0a] after:to-transparent">
        <div className="flex animate-marquee whitespace-nowrap group">
          {/* We render 4 identical sets to give enough content for a smooth infinite scroll */}
          {[...Array(4)].map((_, setIndex) => (
            <React.Fragment key={`set-${setIndex}`}>
              {partners.map((partner, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className="flex-shrink-0 mx-4 md:mx-6 bg-white rounded-2xl w-40 h-24 md:w-56 md:h-32 flex items-center justify-center p-4 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default PartnersSection;

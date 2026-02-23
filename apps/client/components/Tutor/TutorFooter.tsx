import Link from "next/link";
import Image from "next/image";
import { FaTelegramPlane, FaTwitter } from "react-icons/fa";
import { AiFillLinkedin } from "react-icons/ai";
import { RiInstagramFill } from "react-icons/ri";
import { SiGmail } from "react-icons/si";

const TutorFooter = () => {
  const socialLinks = [
    { icon: <AiFillLinkedin />, href: "https://www.linkedin.com/company/candleweb-services/" },
    { icon: <FaTwitter />, href: "https://twitter.com/Candleweb_AI?t=3swlPh95OFEqwxeL8SX3Yg&s=09" },
    { icon: <FaTelegramPlane />, href: "https://t.me/candleweb" },
    { icon: <RiInstagramFill />, href: "https://instagram.com/candleweb_ai?igshid=OGQ5ZDc2ODk2ZA==" },
    { icon: <SiGmail />, href: "https://medium.com/@candleweb" },
  ];

  const desktopFooterLinks = [
    {
      category: "Products",
      links: [
        { label: "CandleBot", href: "/#candle" },
        { label: "Candle Token", href: "/candle" },
      ],
    },
    {
      category: "Resources",
      links: [
        { label: "Blog post", href: "https://medium.com/@candleweb" },
        { label: "White paper", href: "/whitepaper.pdf" },
        { label: "Pitch deck", href: "/tutor" },
        { label: "Media designs", href: "/tutor" },
        { label: "Help centre", href: "https://medium.com/@candleweb/list/1e42f8710067" },
      ],
    },
    {
      category: "Company",
      links: [
        { label: "Pricing", href: "/pricing" },
        { label: "About Us", href: "/about" },
        { label: "Sign in", href: "/register?redirect=/tutor#courses" },
        { label: "Create an account", href: "/register?redirect=/tutor#courses" },
      ],
    },
    {
        category: "Legal", // Added for desktop structure based on footer comparison
        links: [
          { label: "Terms & Condition", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
        ],
    }
  ];

  const mobileFooterLinks = [
    {
      category: "Company",
      links: [
        { label: "Pricing", href: "/pricing" },
        { label: "About Us", href: "/about" },
        { label: "Sign in", href: "/register?redirect=/tutor#courses" },
        { label: "Create an account", href: "/register?redirect=/tutor#courses" },
      ],
    },
    {
      category: "Resources",
      links: [
        { label: "White paper", href: "/whitepaper.pdf" },
        { label: "Pitch deck", href: "/tutor" },
        { label: "Media designs", href: "/tutor" },
      ],
    },
    {
      category: "Products",
      links: [
        { label: "CandleBot", href: "/#candle" },
        { label: "Candle Token", href: "/candle" },
      ],
    },
     { 
      category: "Legal",
      links: [
          { label: "Terms & Condition", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
      ]
    }
  ];

  return (
    <footer className="footer w-full bg-[#0d0d0d] pt-20 md:pt-32 pb-10 overflow-x-scroll">
      <div className="w-full px-6 md:px-20 lg:max-w-[1400px] lg:mx-auto">
        
        {/* Desktop Footer Content */}
        <div className="hidden md:flex flex-row justify-between items-start mb-24">
          {/* Logo & Socials Area */}
          <div className="flex flex-col">
            <Link href="/" className="mb-10 block">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Candleweb" width={120} height={30} className="max-w-[150px] md:max-w-[170px] w-auto" />
              </div>
            </Link>
            
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white/80 hover:bg-primary/20 hover:text-primary transition-all duration-300"
                >
                  <span className="text-xl">{social.icon}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Links Area */}
          <div className="flex gap-20 lg:gap-32">
            {desktopFooterLinks.map((cat, index) => (
              <div key={index} className="flex flex-col">
                <h4 className="text-white font-bold text-lg mb-4">
                  {cat.category}
                </h4>
                <ul className="space-y-2">
                  {cat.links.map((link, lIndex) => (
                    <li key={lIndex}>
                      <Link
                        href={link.href}
                        className="text-white/40 hover:text-primary text-base transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Footer Content */}
        <div className="md:hidden flex flex-col items-start">
          {/* Logo & Socials Area */}
          <div className="flex flex-col">
            <Link href="/" className="mb-5 block">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="Candleweb" width={120} height={30} className="max-w-[150px] w-auto" />     
              </div>
            </Link>
            
            <div className="flex gap-2">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white/80 transition-all border border-white/5 shadow-lg"
                >
                  <span className="text-xl">{social.icon}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Category Columns Vertically Stacked */}
          <div className="flex flex-col gap-12 w-full mb-16 mt-11">
             {mobileFooterLinks.map((cat, index) => (
               <div key={index} className="flex flex-col">
                  <h4 className="text-white font-bold text-xl mb-3">
                    {cat.category}
                  </h4>
                  <ul className="space-y-1.5">
                    {cat.links.map((link, lIndex) => (
                      <li key={lIndex}>
                        <Link href={link.href} className="text-white/40 text-[14px]">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
               </div>
             ))}
          </div>
        </div>

        {/* Legal Links Bar */}
        <div className="w-full pt-8 border-t border-[#ff9900]/40">
           <div className="flex flex-row justify-between items-center text-white/40 text-sm md:text-base">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms and conditions
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy policy
              </Link>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default TutorFooter;

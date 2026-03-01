import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { HiMenuAlt3 } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";
import { Button } from "ui";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import useUserStore from "../../lib/hooks/useUserStore";

const TutorHeader = () => {
  const [navbar, setNavbar] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [isBuyCryptoOpen, setIsBuyCryptoOpen] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);

  // Timeout refs for dropdown delay
  const buyCryptoTimeout = useRef<NodeJS.Timeout | null>(null);
  const documentTimeout = useRef<NodeJS.Timeout | null>(null);

  // Mobile Dropdown States
  const [mobileBuyCryptoOpen, setMobileBuyCryptoOpen] = useState(false);
  const [mobileDocumentOpen, setMobileDocumentOpen] = useState(false);

  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { purchasedCourseIds } = useSelector(
    (state: RootState) => state.payment,
  );

  const router = useRouter();

  const changeBackground = () => {
    if (window.scrollY >= 60) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);
    return () => {
      window.removeEventListener("scroll", changeBackground);
    };
  }, []);

  const { events } = useRouter();

  useEffect(() => {
    const close = () => {
      setOpenMobileMenu(false);
      setMobileBuyCryptoOpen(false);
      setMobileDocumentOpen(false);
    };
    events.on("routeChangeStart", close);
    return () => {
      events.off("routeChangeStart", close);
    };
  }, [events]);

  // Handlers for Buy Crypto Dropdown
  const handleBuyCryptoEnter = () => {
    if (buyCryptoTimeout.current) clearTimeout(buyCryptoTimeout.current);
    setIsBuyCryptoOpen(true);
  };

  const handleBuyCryptoLeave = () => {
    buyCryptoTimeout.current = setTimeout(() => {
      setIsBuyCryptoOpen(false);
    }, 200);
  };

  // Handlers for Document Dropdown
  const handleDocumentEnter = () => {
    if (documentTimeout.current) clearTimeout(documentTimeout.current);
    setIsDocumentOpen(true);
  };

  const handleDocumentLeave = () => {
    documentTimeout.current = setTimeout(() => {
      setIsDocumentOpen(false);
    }, 200);
  };

  return (
    <>
      <div className="nav__container fixed top-0 left-0 right-0 z-50 animate-[fadeInDown_0.6s_ease-out]">
        <div
          className={`nav__content px-6 md:px-20 h-16 md:h-20 flex items-center justify-between w-full transition-all duration-500 ${
            navbar
              ? "backdrop-blur-lg bg-white/10 border-b border-white/20 shadow-lg"
              : ""
          }`}
        >
          {/* Logo */}
          <Link href="/">
            <div className="nav__logo cursor-pointer group">
              <Image
                src="/logo.png"
                alt="Candleweb Logo"
                width={120}
                height={30}
                className="max-w-[120px] md:max-w-[140px] lg:max-w-[170px] w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <ul className="nav__menu--list hidden md:flex items-center md:gap-0 lg:gap-1">
            <li className="menu__list--item">
              <Link href="/">
                <span className="block px-4 py-3 font-medium text-white hover:text-primary transition-all duration-300">
                  Candle AI
                </span>
              </Link>
            </li>
            <li className="menu__list--item">
              <Link href="/tutor">
                <span className="block px-4 py-3 font-medium text-white hover:text-primary transition-all duration-300">
                  Academy
                </span>
              </Link>
            </li>

            {/* Buy Crypto Dropdown - Desktop */}
            <li
              className="menu__list--item relative group"
              onMouseEnter={handleBuyCryptoEnter}
              onMouseLeave={handleBuyCryptoLeave}
            >
              <div className="flex items-center gap-1 px-4 py-3 cursor-pointer group">
                <span className="font-medium text-white group-hover:text-primary transition-all duration-300">
                  Buy Crypto
                </span>
                <FiChevronDown
                  className={`text-white group-hover:text-primary transition-transform duration-300 ${isBuyCryptoOpen ? "rotate-180" : ""}`}
                />
              </div>

              {/* Dropdown Content */}
              <div
                className={`absolute top-full left-0 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 mt-1 shadow-2xl transition-all duration-300 origin-top ${
                  isBuyCryptoOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <Link href="https://candleweb.io/buy-crypto/?type=yellowcard">
                  <span className="block px-6 py-3 text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-all duration-200">
                    Yellow Card
                  </span>
                </Link>
                <Link href="https://candleweb.io/buy-crypto/?type=quidax">
                  <span className="block px-6 py-3 text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-all duration-200">
                    Quidax
                  </span>
                </Link>
              </div>
            </li>

            {/* Document Dropdown - Desktop */}
            <li
              className="menu__list--item relative group"
              onMouseEnter={handleDocumentEnter}
              onMouseLeave={handleDocumentLeave}
            >
              <div className="flex items-center gap-1 px-4 py-3 cursor-pointer group">
                <span className="font-medium text-white group-hover:text-primary transition-all duration-300">
                  Document
                </span>
                <FiChevronDown
                  className={`text-white group-hover:text-primary transition-transform duration-300 ${isDocumentOpen ? "rotate-180" : ""}`}
                />
              </div>

              {/* Dropdown Content */}
              <div
                className={`absolute top-full left-0 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 mt-1 shadow-2xl transition-all duration-300 origin-top ${
                  isDocumentOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <Link href="https://candleweb.io/document/whitepaper">
                  <span className="block px-6 py-3 text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-all duration-200">
                    White Paper
                  </span>
                </Link>
              </div>
            </li>

            <li className="menu__list--item">
              <Link href="/blog">
                <span className="block px-4 py-3 font-medium text-white hover:text-primary transition-all duration-300">
                  Blog
                </span>
              </Link>
            </li>
          </ul>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {!isLoggedIn ? (
              <>
                <Button
                  size="sm"
                  variant="transparent"
                  classstyle="!px-3 lg:!px-5 !text-white hover:!text-primary transition-all duration-300"
                  onClick={() =>
                    router.push("/register?redirect=/tutor#courses")
                  }
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  classstyle="!px-3 lg:!px-5 !py-2 !bg-[#FFA726] !border-[#FFA726] hover:!bg-[#FF9800] text-black !font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                  onClick={() =>
                    router.push("/register?redirect=/tutor#courses")
                  }
                >
                  Get started
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                classstyle="!px-3 lg:!px-5 !py-2 !bg-[#FFA726] !border-[#FFA726] hover:!bg-[#FF9800] text-black !font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                onClick={() => {
                  if (purchasedCourseIds.length > 0) {
                    router.push("https://dummy-app-link.com");
                  } else {
                    const element = document.getElementById("courses");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
              >
                {purchasedCourseIds.length > 0 ? "Download app" : "Pay Now"}
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <HiMenuAlt3
              className="text-3xl text-white cursor-pointer hover:text-primary transition-colors duration-300"
              onClick={() => setOpenMobileMenu(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed top-0 left-0 h-screen w-full bg-black md:hidden duration-300 ease-in-out px-6 shadow-2xl z-[60] ${
          openMobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="close__btn m-5 flex justify-end"
          onClick={() => setOpenMobileMenu(false)}
        >
          <IoClose className="text-white text-3xl cursor-pointer hover:text-primary transition-all duration-300 hover:rotate-90" />
        </div>
        <ul className="px-3 mt-8">
          <li className="mb-6 transform hover:translate-x-2 transition-all duration-300">
            <Link href="/">
              <span className="font-medium text-white text-lg hover:text-primary">
                Candle AI
              </span>
            </Link>
          </li>
          <li className="mb-6 transform hover:translate-x-2 transition-all duration-300">
            <Link href="/tutor">
              <span className="font-medium text-white text-lg hover:text-primary">
                Academy
              </span>
            </Link>
          </li>

          {/* Mobile Buy Crypto Dropdown */}
          <li className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setMobileBuyCryptoOpen(!mobileBuyCryptoOpen)}
            >
              <span
                className={`font-medium text-lg transition-all duration-300 ${mobileBuyCryptoOpen ? "text-primary" : "text-white"}`}
              >
                Buy Crypto
              </span>
              <FiChevronDown
                className={`text-white text-xl transition-transform duration-300 ${mobileBuyCryptoOpen ? "rotate-180 text-primary" : ""}`}
              />
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${mobileBuyCryptoOpen ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
            >
              <ul className="pl-4 space-y-4">
                <li>
                  <Link href="https://candleweb.io/buy-crypto/?type=yellowcard">
                    <span className="text-white/70 text-base hover:text-primary transition-all duration-300">
                      Yellow Card
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="https://candleweb.io/buy-crypto/?type=quidax">
                    <span className="text-white/70 text-base hover:text-primary transition-all duration-300">
                      Quidax
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* Mobile Document Dropdown */}
          <li className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setMobileDocumentOpen(!mobileDocumentOpen)}
            >
              <span
                className={`font-medium text-lg transition-all duration-300 ${mobileDocumentOpen ? "text-primary" : "text-white"}`}
              >
                Document
              </span>
              <FiChevronDown
                className={`text-white text-xl transition-transform duration-300 ${mobileDocumentOpen ? "rotate-180 text-primary" : ""}`}
              />
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${mobileDocumentOpen ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
            >
              <ul className="pl-4">
                <li>
                  <Link href="https://candleweb.io/document/whitepaper">
                    <span className="text-white/70 text-base hover:text-primary transition-all duration-300">
                      White Paper
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          <li className="mb-6 transform hover:translate-x-2 transition-all duration-300">
            <Link href="/blog">
              <span className="font-medium text-white text-lg hover:text-primary">
                Blog
              </span>
            </Link>
          </li>
        </ul>

        <hr className="mx-3 border-[1px] border-white/20 my-6" />
        <div className="mt-6 mx-2">
          {!isLoggedIn ? (
            <>
              <Button
                size="sm"
                fullwidth
                variant="transparent"
                classstyle="mb-4 !text-white hover:!text-primary transition-all duration-300"
                onClick={() => router.push("/register?redirect=/tutor#courses")}
              >
                Login
              </Button>
              <Button
                size="sm"
                fullwidth
                classstyle="!bg-[#FFA726] !border-[#FFA726] hover:!bg-[#FF9800] !text-white !font-semibold transition-all duration-300"
                onClick={() => router.push("/register?redirect=/tutor#courses")}
              >
                Get started
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              fullwidth
              classstyle="!bg-[#FFA726] !border-[#FFA726] hover:!bg-[#FF9800] !text-white !font-semibold transition-all duration-300"
              onClick={() => {
                if (purchasedCourseIds.length > 0) {
                  router.push("https://dummy-app-link.com");
                  setOpenMobileMenu(false);
                } else {
                  const element = document.getElementById("courses");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    setOpenMobileMenu(false);
                  }
                }
              }}
            >
              {purchasedCourseIds.length > 0 ? "Download app" : "Pay Now"}
            </Button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default TutorHeader;

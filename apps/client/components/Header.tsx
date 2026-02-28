import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Dropdown, SubMenuDropdown } from "ui/components/dropdown/Dropdown";
import { IoClose } from "react-icons/io5";
import { IoIosArrowDown, IoLogoBitcoin } from "react-icons/io";
import {
  Typography,
  Button,
  ProductIcon,
  DocsIcon,
  CandleIcon,
  TagIcon,
  UserAvatarImage,
  BTC
} from "ui";
import Image from "next/image";
import { error } from "./alert/Toast";
import { AiFillLinkedin, AiFillTwitterCircle } from "react-icons/ai";
import { FaTelegram } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { SiGmail } from "react-icons/si";
import useEthereum from "../lib/hooks/useEthereum";
import { axiosApi } from "../lib/axiosApi";
import { AxiosError } from "axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import useUserStore from "../lib/hooks/useUserStore";
import { BiLogOut } from "react-icons/bi";
import { setIsSuccessful } from "../redux/slices/authSlice";
import { setExchangeRecord } from "../redux/slices/exchangeSlice";
import { setNotification } from "../redux/slices/notificationSlice";
import { setUserRecord, setUnsubscribedReferral, setSubscribedReferral } from "../redux/slices/referralSlice";
import { setSubscription, setSubscriptionHistory, setCurrentPlan } from "../redux/slices/subscriptionSlice";
import { setActiveTrade, setPortfolioTrade, setYearList, setYearAnalysis } from "../redux/slices/tradeSlice";
import { setBalance } from "../redux/slices/userSlice";

export interface IHeaderProps {
  Icon: any;
  Logo: any;
  route: string;
}
export const Header = ({ Icon, Logo, route }: IHeaderProps) => {
  const [navbar, setNavbar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const router = useRouter()
  const { connectWallet } = useEthereum()
  const dispatch = useDispatch<AppDispatch>()
  const { user, setUser, removeUser } = useUserStore((state) => state);

  const changeBackground = () => {
    if (window.scrollY >= 60) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  const openMenu = (open: boolean) => {
    // console.log(open)
    setOpenMobileMenu(open);
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
    };

    events.on("routeChangeStart", close);
    return () => {
      events.off("routeChangeStart", close);
    };
  }, [events]);


  const loginUser = async (wallet: string, signer: string) => {
    setIsLoading(true);
    try {
      // Make a POST request to the server for user login
      const { data } = await axiosApi.post("/user/login/", {
        wallet_address: wallet,
        password: signer
      }, { withCredentials: true });
      if (data.status === "success") {

        const { data: userData } = await axiosApi.get("/user/profile/", {
          headers: {
            Authorization: `Bearer ${data.access_token}`
          },
          withCredentials: true
        })



        setUser({
          ...userData,
          access_token: data.access_token
        });

        router.push("/dashboard")
      }
    } catch (err: any) {
      // If there was an error during the login process, it will be caught here
      const e = err as AxiosError;
      const message =
        (e.response &&
          e.response.data &&
          (e.response?.data as any).message) ||
        e.message ||
        e.toString();
      error(message);
      // router.push("/register");
    }
    finally {
      setIsLoading(false);
    }
  }



  return (
    <div className="nav__container fixed top-0 left-0 right-0 z-50">
      <div
        className={`nav__content px-7 md:px-20 ms:px-9 h-16 md:h-20 flex items-center justify-between w-full ${navbar ? "bg-background" : ""
          }`}
      >
        <div className="left_logo flex items-center gap-5">
          <div className="mobile__nav hidden tb:flex sm:!hidden" onClick={() => openMenu(true)}>
            <Icon className="text-3xl text-primary" onClick={() => { }} />
          </div>
          <Link href="/">
            <div className="nav__logo">{Logo}</div>
          </Link>
        </div>
        <ul className="nav__menu--list  flex tb:hidden tl:items-center relative">
          {/* <li className="menu__list--item">
              <Dropdown
                title="Product"
                items={[{ name: "CandleAI", route: "/#candle" }]}
              />
            </li> */}

          <li className="menu__list--item duration-[1500ms] ease-in-out hover:text-primary cursor-pointer">
            <Link href={"/"}>
              <span
                className={`block px-5 ms:px-3 py-3 font-medium outfit ${route == "/" && "text-primary"
                  }`}
              >
                CandleAI
              </span>
            </Link>
          </li>

          <li className="menu__list--item  duration-[1500ms] ease-in-out hover:text-primary cursor-pointer">
            <Link href={"/tutor"}>
              <span
                className={`block px-5 ms:px-3 py-3 font-medium outfit ${route == "Academy" && "text-primary"
                  }`}
              >
                Academy
              </span>
            </Link>
          </li>
          {/* <li className="menu__list--item  duration-[1500ms] ease-in-out hover:text-primary cursor-pointer">
            <Link href="/candle">
              <span
                className={`block px-5 ms:px-3 py-3 font-medium outfit ${route == "candle" && "text-primary"
                  }`}
              >
                $Candle
              </span>
            </Link>
          </li> */}
          <li className="menu__list--item">
            <Dropdown
              title="Buy Crypto"
              items={[{ name: "Yellow Card", route: "/buy-crypto/?type=yellowcard" }, { name: "Quidax", route: "/buy-crypto/?type=quidax" },]}
            />
          </li>
          <li className="menu__list--item">
            <Dropdown
              title="Document"
              isStatic
              static={<Link href="/whitepaper.pdf" className="submenu__items block hover:text-primary duration-500">White Paper</Link>}
              items={[{ name: "White Paper", route: "" }]}
            />
          </li>
          <li className="menu__list--item  duration-[1500ms] ease-in-out hover:text-primary cursor-pointer">
            <Link href="/blog">
              <span
                className={`block px-5 ms:px-3 py-3 font-medium outfit ${route == "blog" && "text-primary"
                  }`}
              >
                Blog
              </span>
            </Link>
          </li>
        </ul>
        {Object.keys(user).length === 0 && <div className=" flex items-center gap-4 sm:hidden">
          <Button
            size="sm"

            iconright
            variant="transparent"
            classstyle="!px-3"
            // disabled
            onClick={async () => {

              if (user.access_token !== undefined) {
                const { data: userData } = await axiosApi.get("/user/profile/", {
                  headers: {
                    Authorization: `Bearer ${user.access_token}`
                  },
                  withCredentials: true
                })

                if (Object.keys(userData).length === 0) {
                  return
                }


                setUser({
                  ...userData,
                  access_token: user.access_token
                });


                router.push("/dashboard")
                return;
              }

              try {
                const res = await connectWallet();

                if (res === null) {
                  return
                }

                await loginUser(res.walletAddress, res.signMessage);
              } catch (err: any) {
                console.error(err)
              }

            }}
          >
            Login with Metamask
          </Button>
          <Button
            size="sm"
            variant="gradient"
            iconright
            classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow"}
            onClick={async () => {


              router.push("/register")

            }}
          >
            Get Started
          </Button>
        </div>}
        {/* TODO: do this */}
        {Object.keys(user).length > 0 && <div className="user_info relative flex items-center gap-3 cursor-pointer w-full max-w-[150px] pb-2 tb:justify-end" onMouseEnter={() => setDropdown(true)} onMouseLeave={() => setDropdown(false)}>
          <Image src={UserAvatarImage} alt="User Avatar" width={52} height={52} className="rounded-full w-10 h-10 tb:!w-8 tb:!h-8" />
          <div className="flex items-center gap-1"> <Typography classstyle=" font-medium outfit sm:!hidden">{user.username}
          </Typography>
            <IoIosArrowDown className={`transition duration-200 text-sm ${dropdown ? "rotate-180" : ""} sm:!hidden`} />
          </div>
          <div className={`hover__nav--items absolute top-12 right-0 left-0 bg-[#1E2024] border-[0.5px] border-[#848484] rounded-xl p-3 items-center flex-col  ${dropdown ? "flex" : "hidden"}`}>
            <Link href={"/dashboard"} className="transition duration-200 block px-5 py-2 font-medium rounded-full bg-[#282A30] text-[#BCBDBF] w-full text-center hover:scale-[0.95]">Dashboard</Link>
            <div className="h-2"></div>
            <Link href={"/dashboard/settings"} className="transition duration-200 block px-5 py-2 font-medium rounded-full bg-[#282A30] text-[#BCBDBF] w-full text-center hover:scale-[0.95]">Settings</Link>
            <div className="h-2"></div>
            <Button icon={<BiLogOut className="text-[#6A3B3B]" />} variant="transparent" classstyle="!text-[#BCBDBF]" onClick={() => {
              removeUser()
              dispatch(setIsSuccessful(false))
              dispatch(setSubscription([]))
              dispatch(setExchangeRecord([]))
              dispatch(setNotification({}))
              dispatch(setUserRecord({}))
              dispatch(setUnsubscribedReferral({}))
              dispatch(setSubscribedReferral({}))
              dispatch(setSubscriptionHistory([]))
              dispatch(setActiveTrade([]))
              dispatch(setPortfolioTrade({}))
              dispatch(setYearList({}))
              dispatch(setYearAnalysis([]))
              dispatch(setCurrentPlan({}))
              dispatch(setBalance(""))
              router.push("/")
            }}>Sign Out</Button>
          </div>
        </div>}
        <div className={`nav__menu hidden tb:flex`}>
          {/* Mobile Navbar */}
          <div className="mobile__nav md:hidden flex" onClick={() => openMenu(true)}>
            <Icon className="text-3xl text-primary" onClick={() => { }} />
          </div>
          <div
            className={`mobile__menu absolute top-0 left-0 h-screen bg-card w-full hidden tb:block duration-300 ease-in-out px-6 ${openMobileMenu ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div
              className="close__btn m-5 flex justify-end"
              onClick={() => openMenu(false)}
            >
              <IoClose className="text-gray-300 text-2xl" />
            </div>
            <ul className="px-3">
              <li className="mb-5">
                <SubMenuDropdown
                  title="Product"
                  icon={
                    <Image
                      src={ProductIcon}
                      alt="Product Icon"
                      className="mr-3 w-5 h-5"
                    />
                  }
                  items={[{ name: "CandleAI", route: "/#candle" }]}
                />
              </li>
              <li className="mb-8">
                <Link href="/tutor">
                  <Typography
                    classstyle={`font-medium outfit hover:text-primary flex items-center ${route == "tutor" && "!text-primary"
                      }`}
                  >
                    <Image
                      src={TagIcon}
                      alt="Academy Icon"
                      className="mr-3 w-5 h-5"
                    />{" "}
                    Academy
                  </Typography>
                </Link>
              </li>{" "}
              <li className="mb-6">
                <Link href="/candle">
                  <Typography
                    classstyle={`font-medium outfit hover:text-primary flex items-center ${route == "candle" && "!text-primary"
                      }`}
                  >
                    <Image
                      src={CandleIcon}
                      alt="Candleweb Icon"
                      className="mr-2 w-6 h-6"
                    />{" "}
                    $Candle
                  </Typography>
                </Link>
              </li>{" "}
              <li className="mb-5">

                <SubMenuDropdown
                  title="Buy Crypto"
                  icon={
                    <Image
                      src={BTC}
                      alt="Crypto Icon"
                      className="mr-3 w-5 h-5"
                    />
                  }
                  items={[{ name: "Yellow Card", route: "/buy-crypto/?type=yellowcard" }, { name: "Quidax", route: "/buy-crypto/?type=quidax" }]}
                />
              </li>
              <li className="mb-5">
                <SubMenuDropdown
                  title="Documents"
                  icon={
                    <Image
                      src={DocsIcon}
                      alt="Docs Icon"
                      className="mr-3 w-5 h-5"
                    />
                  }
                  items={[{ name: "White Paper", route: "/whitepaper.pdf" }]}
                />
              </li>
              <li className="mb-6">
                <Link href="/blog">
                  <Typography
                    classstyle={`font-medium outfit hover:text-primary flex items-center ${route == "candle" && "!text-primary"
                      }`}
                  >
                    <Image
                      src={CandleIcon}
                      alt="Candleweb Icon"
                      className="mr-2 w-6 h-6"
                    />{" "}
                    Blog
                  </Typography>
                </Link>
              </li>{" "}
            </ul>
            <hr className="mx-3 border-[1px] border-[#3C3C3C]" />
            <div className="mt-4 mx-2">
              {Object.keys(user).length === 0 && <div className="h-5 sm:!hidden"></div>}
              {Object.keys(user).length === 0 && <Button
                size="sm"
                fullwidth
                iconright
                variant="transparent"
                onClick={async () => {

                  if (user.access_token !== undefined) {
                    router.push("/dashboard")
                    return;
                  }

                  try {
                    const res = await connectWallet();

                    if (res === null) {
                      return
                    }

                    await loginUser(res.walletAddress, res.signMessage);
                  } catch (err: any) {
                    error(err)
                  }

                }}
              >
                Login
              </Button>}
              <div className="h-5"></div>
              <Button
                size="sm"
                variant="gradient"
                iconright
                fullwidth
                classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow"}
                onClick={async () => {


                  router.push("/register")

                }}
              >
                Get Started
              </Button>

            </div>
            <div className="footer__socials flex items-center justify-between mt-5 md:hidden w-full px-4">
              <Link href="https://www.linkedin.com/in/candleweb-services-b517a8276" target="_blank">
                <AiFillLinkedin className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
              </Link>
              <Link href="https://twitter.com/Candleweb_AI?t=3swlPh95OFEqwxeL8SX3Yg&s=09" target="_blank">
                <AiFillTwitterCircle className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
              </Link>
              <Link href="https://t.me/+udxNPk_Jzho2ZDM8" target="_blank">
                <FaTelegram className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
              </Link>
              <Link href="/#">
                <RiInstagramFill className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
              </Link>
              <Link href="/#">
                <SiGmail className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

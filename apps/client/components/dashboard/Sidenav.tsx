import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/router";
import Logo from "../../public/logo.png";
import { Button, Heading, SidenavImage, SvgIcons, sideNav } from "ui";
import { setCurrentPlan, setSubscription, setSubscriptionHistory } from "../../redux/slices/subscriptionSlice";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import { setSubscribedReferral, setUnsubscribedReferral, setUserRecord } from "../../redux/slices/referralSlice";
import { setActiveTrade, setPortfolioTrade, setYearAnalysis, setYearList } from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import useUserStore from "../../lib/hooks/useUserStore";

import { setIsSuccessful } from "../../redux/slices/authSlice";
import { BiLogOut } from "react-icons/bi";
import { AppDispatch } from "../../redux/store";
import { useDispatch } from "react-redux";

type Props = {};

const Sidenav = (props: Props) => {
  const router = useRouter();
  const path = router.pathname;

  const dispatch = useDispatch<AppDispatch>()

  const { removeUser } = useUserStore((state) => state);


  return (
    <div className="h-full">
      <div className="p-5 lg:px-3 bg-background transition duration-500 shadow h-full lg:max-h-screen lg:overflow-y-auto">
        <div className="logo sm:hidden">
          <Link href="/">
            <div className="nav__logo max-w-[150px]">
              <Image src={Logo} alt="Candleweb Logo" className="w-full h-full" />
            </div>
          </Link>
        </div>
        <ul className="mt-3 md:mt-8">
          {sideNav.map((nav, index) => {
            const isActive =
              nav.route === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(nav.route);
            return (
              <li className="" key={index}>
                <div

                  className={`sidebar__navlink ${isActive ? "active" : ""} flex items-center gap-2 px-3 py-2 rounded-full my-2 cursor-pointer`}
                  onClick={() => {
                    router.push(nav.route);
                  }}
                >
                <div className="link__icon w-10 h-10 flex items-center justify-center rounded-full p-2 text-[#B6B6B6]">
                  {nav.icon}
                </div>
                <p className="text-[#B6B6B6]">{nav.title}</p>
              </div>
            </li>
          )})}
        </ul>
        <div className="mt-0 p-5 w-full">
          <Button
            icon={
              <span className="w-5 h-5">
                <BiLogOut />
              </span>
            }
            iconright
            classstyle="!bg-[#261414] !border-[#261414] hover:!bg-[#261414] hover:!border-[#261414] !text-[#848484] sm:py-[2px] sm:text-sm !px-4 !py-2 !w-full lg:!px-0"
            onClick={async () => {
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
            }}
          >
            Sign Out
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Sidenav;

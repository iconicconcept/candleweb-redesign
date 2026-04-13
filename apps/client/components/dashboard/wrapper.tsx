import React, { useEffect, useState } from "react";
import DashHeader from "./header";
import Sidenav from "./Sidenav";
import { Typography, sideNav } from "ui";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradeService from "../../services/tradeService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import notificationService from "../../services/notificationService";
import userService from "../../services/userService";
import CheckLogin from "./CheckLogin";
import exchangeServices from "../../services/exchangeService";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import useUserStore from "../../lib/hooks/useUserStore";
import AIAgentChat from "./AIAgentChat";

interface Pages {
  children?: React.ReactNode;
}

const Wrapper = (props: Pages) => {
  const { tradePortfolio, activeTrade, tradePairList } = useSelector((state: RootState) => state.trade);
  const { notification } = useSelector((state: RootState) => state.notification)
  const { balance } = useSelector((state: RootState) => state.user)
  const { user } = useUserStore((state) => state);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const dispatch = useDispatch<AppDispatch>()
  const axiosToken = useAxiosAuth()
  const router = useRouter();
  const path = router.pathname;

  const openMenu = (open: boolean) => {
    // console.log(open)
    setOpenMobileMenu(open);
  };


  useEffect(() => {

    initializeCalls()

  }, [])

  const initializeCalls = async () => {
    if (isAuthorizationHeaderSet(axiosToken)) {


      dispatch(tradeService.getTradePortfolio(axiosToken));


      if (Object.keys(tradePairList).length === 0) {
        dispatch(tradeService.getTradePairList(axiosToken))
      }

      if (user && Object.keys(notification).length < 1) {
        dispatch(notificationService.getNotifications({ api: axiosToken }));
      }

      if (Object.keys(user).length < 1) {
        dispatch(userService.getUser(axiosToken))
      }

      // dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken))
      dispatch(exchangeServices.getExchangeRecords(axiosToken))
    }

    // dispatch(subscriptionService.getSubscriptionList())

  }



  return (
    <>
      {/* {isLoading && <Loader />} */}
      <CheckLogin>
        <div>
          <div className="header__body">
            <DashHeader onMenuClick={() => {
              console.log("clicked");
              setOpenMobileMenu((prev) => !prev);
            }} />
          </div>
          <div className="dash__body pt-[70px] md:pt-[81px] flex items-start">
            <aside
              className={`sidenav w-full md:max-w-[240px] h-[calc(100vh_-_81px)] sm:h-[calc(100vh_-_70px)] fixed bg-background top-[70px] md:top-[81px] left-0 z-20 tb:!w-[70%] transition duration-500 ${openMobileMenu ? "lg:translate-x-0" : "lg:translate-x-[-100%]"}`}
            >
              <Sidenav />
            </aside>
            <div className="main__content px-9 py-5 w-full ml-[240px] tb:ml-0 lg:ml-0 lg:!p-4 tb:mb-10 max-w-full md:max-w-none">
              <div className="max-w-7xl mx-auto">
                {props.children}
              </div>
            </div>
          </div>
          {/* <div className="mobile__nav fixed bottom-0 left-0 right-0 bg-card tb:!block ai:block hidden z-10">
            <ul className="mobile__sidenav__content flex justify-around items-center">
              {sideNav.map((nav, index) => (
                <li className="w-full" key={index}>
                  <div

                    className={`sidebar__navlink relative ${path === nav.route ? "mobile transition delay-500" : ""
                      } flex flex-col items-center gap-1 p-2`}
                    onClick={() => {
                      router.push(nav.route)
                    }}
                  >
                    <div className="link__icon w-10 h-10 flex items-center justify-center rounded-full p-2 text-[#B6B6B6]">
                      {nav.icon}
                    </div>
                    <Typography textsize="xs" classstyle="!text-txtGray">
                      {nav.title === "Invite & Earn" ? "Invite" : nav.title}
                    </Typography>
                  </div>
                </li>
              ))}
            </ul>
          </div> */}
        </div>
        <AIAgentChat />
      </CheckLogin>
    </>
  );
};

export default Wrapper;

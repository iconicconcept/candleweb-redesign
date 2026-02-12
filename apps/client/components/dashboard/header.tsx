import Image from "next/image";
import { Button, CDEIcon, MarketIcon, SelectImageDropdown, dollarFormat } from "ui";
import Icon from "../../public/logo.png";
import Link from "next/link";
import Notification from "./modal/Notification";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import useSWR from 'swr';
import { AppDispatch, RootState } from "../../redux/store";
import { fetcher } from "../../lib/axiosApi";
import { setCurrentPlan, setSubscription, setSubscriptionHistory } from "../../redux/slices/subscriptionSlice";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import { setSubscribedReferral, setUnsubscribedReferral, setUserRecord } from "../../redux/slices/referralSlice";
import { setActiveTrade, setPortfolioTrade, setYearAnalysis, setYearList } from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import useUserStore from "../../lib/hooks/useUserStore";
import { BiLogOut } from "react-icons/bi"
import { setIsSuccessful } from "../../redux/slices/authSlice";
import { useEffect, useState } from "react";
import userService from "../../services/userService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { BalanceProp } from "../../types/user";
import exchangeServices from "../../services/exchangeService";
import tradeService from "../../services/tradeService";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { CgMenuRight } from "react-icons/cg";

type Props = {
  onMenuClick?: () => void
};

const DashHeader = (props: Props) => {
  const { data } = useSWR('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana', fetcher);
  const { balance } = useSelector((state: RootState) => state.user);
  const [currentBalance, setCurrentBalance] = useState<string | undefined>(undefined)
  const { removeUser } = useUserStore((state) => state);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>()
  const axiosToken = useAxiosAuth();

  const { tradePortfolio: portfolio, isLoading, activeTradeLoading, tradeOrders, tradePairList, activeTrade } = useSelector((state: RootState) => state.trade);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const [showTable, setShowTable] = useState(true)






  const { user } = useUserStore((state) => state)



  useEffect(() => {

    if (!balance || Object.keys(balance).length === 0) {
      dispatch(userService.getBalance(axiosToken))
    }



  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (Object.keys(portfolio).length === 0) {
        dispatch(tradeService.getTradePortfolio(axiosToken));
      }
      if (Object.keys(tradePairList).length === 0) {
        dispatch(tradeService.getTradePairList(axiosToken));
      }
      // if (activeTrade.length === 0) {
      dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "" }));
      // }
      if (!balance || Object.keys(balance).length === 0) {
        dispatch(userService.getBalance(axiosToken));
      }
      if (exchangeRecord.length === 0) {
        dispatch(exchangeServices.getExchangeRecords(axiosToken));
      }
    };

    // Fetch data only if access token is present and authorization header is not set
    if (user.access_token && !isAuthorizationHeaderSet(axiosToken)) {
      axiosToken.defaults.headers["Authorization"] = "Bearer " + user.access_token;
    }
    if (user.access_token && isAuthorizationHeaderSet(axiosToken)) {
      fetchData();
    }
  }, []);

  return (
    <div className="fixed w-screen top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between gap-2 h-[70px] md:h-[81px] overflow-y-0 px-4 md:px-8 border-b-2 border-[#323233] bg-[#1f1f23] sm:bg-card">
        <div className="logo tb:block ai:block hidden">
          <Link href="/">
            <div className="nav__logo max-w-[140px]">
              <Image
                src={Icon}
                alt="Candleweb Logo"
                className="w-full h-full"
              />
            </div>
          </Link>
        </div>
        <div className="items-center gap-1 tb:!hidden ai:!hidden tl:flex">
          <Image src={MarketIcon} alt="Market Icon" className="w-4 h-5 mb-2" />
          <p className="font-semibold mr-1">Market today:</p>
          <ul className="flex items-center gap-2">
            {!data ? "Loading" : data.map((coin: any, index: number) => {
              const isNegative = coin.price_change_percentage_24h < 0;
              return (
                <li className="text-[#848484] text-xs font-medium flex items-center" key={index}>
                  <Image src={coin.image} alt={`Crypto Coin ${coin.is}`} width={14} height={14} className="mr-1 ai:hidden" />
                  {coin.id.toUpperCase()}{" "}
                  <span
                    className={`text-xs ${isNegative ? "text-[#FC5878]" : "text-primary"
                      } ai:ml-0 ml-1`}
                  >
                    {" "}
                    {isNegative ? "-" : "+"}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}
                  </span>
                  ,
                </li>
              )
            })}
          </ul>
        </div>
        <div className="btns flex items-center gap-6 md:gap-4">
          <div className="price__amount mr-4 sm:hidden">
            {/* <Heading textsize="sm" classstyle="sm:hidden !text-lg !font-medium"> */}
            {/* USDT Balance: {" "}  */}
            {balance.length > 0 && <SelectImageDropdown
              title={currentBalance ?? balance[0].name + " " + (balance[0].name.toLowerCase() === "cde" ? balance[0].balance : dollarFormat(balance[0].balance)).toString()} //title is string
              type="border"
              lists={balance.map((bl: BalanceProp) => bl.name + " " + (bl.name.toLowerCase() === "cde" ? bl.balance : dollarFormat(bl.balance)).toString())} //lists is a list of string
              image={balance.map((bl: BalanceProp, index) => <Image src={(bl.name.toLowerCase() === "cde" ? CDEIcon : bl.logo)} key={bl.name + index} alt="Balance Icon" width={20} height={20} className={`w-5 h-5 ${bl.name.toLowerCase() === "cde" ? "!w-6" : ""}`} />)} // should be a list of image
              onValueChange={(value: string) => {
                setCurrentBalance(value)
              }}
            />}
            {/* <span className="!font-normal"> {dollarFormat(parseFloat(balance ?? "0"))}</span> */}
            {/* </Heading> */}
          </div>
          <Notification />
          {/* <Button
            icon={
              <span className="w-5 h-5">
                <BiLogOut />
              </span>
            }
            classstyle="!bg-[#3c3c3d] !border-[#3c3c3d] !text-[#848484] sm:px-2 sm:py-[2px] sm:text-sm !px-4 !py-2 sm:!hidden"
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
          </Button> */}
          <div className="mobile__nav lg:flex xl:!hidden">
            <CgMenuRight className="text-3xl text-primary" onClick={() => {
              props.onMenuClick?.();
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashHeader;



import Head from "next/head";
import { useEffect, useState } from "react";
import { Button, CDEIcon, CandlewebIcon, Heading, SelectDropdown, SelectImageDropdown, dollarFormat } from "ui";
// import AmountCard from "../../components/dashboard/cards/amount";
import AnalyticsCard from "../../components/dashboard/charts/area";
// import Stats from "../../components/dashboard/charts/bar";
// import Radial from "../../components/dashboard/charts/radial";
import AddTrade from "../../components/dashboard/modal/AddTrade";
import GapTable from "../../components/dashboard/table/GapTable";
import Wrapper from "../../components/dashboard/wrapper";
// import { BsCurrencyDollar } from "react-icons/bs";
// import { TbDatabase } from "react-icons/tb";
import { DashboardSkeletonLoader, TableSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { tradeColumn } from "../../components/dashboard/table/HeaderColumns";
import useSWR from "swr";
import { fetcher } from "../../lib/axiosApi";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import tradeService from "../../services/tradeService";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import exchangeServices from "../../services/exchangeService";
import userService from "../../services/userService";
import useUserStore from "../../lib/hooks/useUserStore";
import { BalanceProp } from "../../types/user";
import AmountStats from "../../components/dashboard/AmountStats";
import Image from "next/image";

type Props = {};

const Dashboard = (props: Props) => {
  const { activeTradeLoading, tradeOrders } = useSelector((state: RootState) => state.trade);
  // const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const [showTable, setShowTable] = useState(true)
  const [currentBalance, setCurrentBalance] = useState<string | undefined>(undefined)
  // const { data } = useSWR('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana', fetcher);


  const { balance } = useSelector((state: RootState) => state.user)

  // const { user } = useUserStore((state) => state)
  // const dispatch = useDispatch<AppDispatch>()
  // const axiosToken = useAxiosAuth()

  // useEffect(() => {
  //   if (user.access_token && !isAuthorizationHeaderSet(axiosToken)) {
  //     axiosToken.defaults.headers["Authorization"] = "Bearer " + user.access_token
  //   }
  //   if (isAuthorizationHeaderSet(axiosToken)) {

  //     if (Object.keys(portfolio).length === 0) {
  //       dispatch(tradeService.getTradePortfolio(axiosToken));
  //     }

  //     if (Object.keys(tradePairList).length === 0) {
  //       dispatch(tradeService.getTradePairList(axiosToken))
  //     }

  //     if (activeTrade.length === 0) {
  //       dispatch(tradeService.getActiveTrade(axiosToken));
  //     }

  //     if (balance.length === 0) {
  //       dispatch(userService.getBalance(axiosToken))
  //     }

  //     if (exchangeRecord.length === 0) {
  //       dispatch(exchangeServices.getExchangeRecords(axiosToken))
  //     }
  //   }
  // }, [

  // ])



  return (
    <>
      <Head>
        <title>Candleweb Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Wrapper>
        {/* {isLoading && <DashboardSkeletonLoader />} */}
        <div className="dash__content">
          <div className="flex items-center gap-1 md:hidden mb-3 max-w-[200px]">

            {/* <Heading textsize="sm" classstyle="!text-lg !font-medium"> */}
            {balance.length > 0 && <SelectImageDropdown
              title={currentBalance ?? balance[0].name + " " + (balance[0].name.toLowerCase() === "cde" ? balance[0].balance : dollarFormat(balance[0].balance)).toString()} //title is string
              type="border"
              lists={balance.map((bl: BalanceProp) => bl.name + " " + (bl.name.toLowerCase() === "cde" ? bl.balance : dollarFormat(bl.balance)).toString())} //lists is a list of string
              image={balance.map((bl: BalanceProp, index: number) => <Image src={(bl.name.toLowerCase() === "cde" ? CDEIcon : bl.logo)} key={bl.name + index} alt="Balance Icon" width={20} height={20} className={`w-5 h-5 ${bl.name.toLowerCase() === "cde" ? "!w-6" : ""}`} />)} // should be a list of image
              onValueChange={(value: string) => {
                setCurrentBalance(value)
              }}
            />}
            {/* </Heading> */}
          </div>
          <AmountStats />

          {<div className="analytics w-full rounded-lg bg-card mt-5">
            <AnalyticsCard />
          </div>}
          <div className=" mt-6 w-full mb-20">
            <div className="add__trade flex items-center justify-between mb-2">
              <Heading textsize="md">Orders</Heading>

              <div className="trade__btns flex items-center gap-3">
                {showTable && <Button classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C] sm:!px-2 sm:!py-1 sm:!rounded-2xl" onClick={async () => {
                  setShowTable(false)
                }}>
                  Hide info
                </Button>}
                {!showTable && <Button classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C] sm:!px-2 sm:!py-1 sm:!rounded-2xl" onClick={() => setShowTable(true)}>
                  Show trade
                </Button>}
                <AddTrade btnText="Add Trade" />
              </div>
            </div>
            {activeTradeLoading && <TableSkeletonLoader />}
            {!activeTradeLoading && showTable && <GapTable
              columnCheck
              rowCheck
              rows={tradeOrders}
              cols={tradeColumn}
              isOpenModal
            />}
          </div>
        </div>
      </Wrapper>
    </>
  );
};

export default Dashboard;

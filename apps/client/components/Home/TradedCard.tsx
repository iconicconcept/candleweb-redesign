import Image from "next/image";
import { useEffect } from "react";
import { Heading, TradedIcon1, TradedIcon2, TradedIcon3, TradingCard } from "ui";
import { TradedAmountSkeletonLoader } from "../dashboard/skeleton/SkeletonLoader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradeService from "../../services/tradeService";
import userService from "../../services/userService";

type Props = {};

const TradedCard = (props: Props) => {
  const {
    totalTradeAmount,
    totalTradeProfit,
    isLoading: loading
  } = useSelector((state: RootState) => state.trade);
  const { totalUsers, isLoading } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(userService.getTotalUsers());
    dispatch(tradeService.getTotalTradeAmount());
    dispatch(tradeService.getTotalTradeProfit());
  }, []);

  return (
    <div className="max-w-[1065px] my-16 flex flex-col items-center justify-center w-screen m-auto">
      <Heading
        textsize="sm"
        classstyle="inter !font-medium !text-[#BCBCBC] uppercase sm:text-center sm:px-4"
      >
        The future of trading is already here
      </Heading>
      <div className="flex items-center justify-between gap-9 mt-10 w-full flex-nowrap lg:px-3 whitespace-nowrap lg:scroll-smooth lg:overflow-x-scroll lg:hide-scroll-bar -my-7 py-7 no__scroll sm:!mx-3">
        <TradingCard
          title={`Total Amount Traded`}
          tooltipText="Total amount traded in the platform"
          heading={totalTradeAmount}
          icon={<Image src={TradedIcon1} className="" alt="Total Amount Traded Icon" />}
          loader={<TradedAmountSkeletonLoader />}
          isLoading={false}
        />

        <TradingCard
          title="Total Profits Realized (%)"
          tooltipText="Total profits realized by users in the platform"
          heading={totalTradeProfit}
          icon={<Image src={TradedIcon2} alt="Total Profits Overtime Icon" />}
          loader={<TradedAmountSkeletonLoader />}
          isPercent
          isLoading={false}
        />

        <TradingCard
          title="Registered users"
          tooltipText="Total registered users on the platform"
          heading={totalUsers + 1483}
          icon={<Image src={TradedIcon3} alt="Total Transactions Icon" />}
          loader={<TradedAmountSkeletonLoader />}
          isUsers
          isLoading={false}
        />
      </div>
    </div>
  );
};

export default TradedCard;

// <div className="flex items-center lg:justify-around mt-[151px] sm:mt-[68px] max-w-[1065px] m-auto">
// <div className="flex gap-5 ms:gap-3 no__scroll justify-between w-full flex-nowrap lg:px-3 whitespace-nowrap lg:scroll-smooth lg:overflow-x-scroll lg:hide-scroll-bar -my-7 py-7">
//   <Fade cascade damping={0.6} delay={500} triggerOnce className="w-full stats_shadow hover:z-10">
//     <TradingCard
//       title={`Total Amount Traded`}
//       heading={totalTradeAmount}
//       icon={<Image src={TradedIcon1} alt="Total Amount Traded Icon" />}
//       loader={<TradedAmountSkeletonLoader />}
//       isLoading={loading}
//     />
//     <TradingCard
//       title="Total Profits Realized (%)"
//       heading={totalTradeProfit}
//       icon={<Image src={TradedIcon2} alt="Total Profits Overtime Icon" />}
//       loader={<TradedAmountSkeletonLoader />}
//       isPercent
//       isLoading={loading}
//     />
//     <TradingCard
//       title="Registered users"
//       heading={totalUsers + 1483}
//       icon={<Image src={TradedIcon3} alt="Total Transactions Icon" />}
//       loader={<TradedAmountSkeletonLoader />}
//       isUsers
//       isLoading={isLoading!}
//     />
//   </Fade></div>
// </div>

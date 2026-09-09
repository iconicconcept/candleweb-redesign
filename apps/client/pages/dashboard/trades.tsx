import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Button,
  DotCarousel,
  Heading,
  IconButton,
  Modal,
  SvgIcons,
  TradeOptionIcon,
  Typography
} from "ui";
import BarChartMixed from "../../components/dashboard/charts/barChartMixed";
import AddTrade from "../../components/dashboard/modal/AddTrade";
import GapTable from "../../components/dashboard/table/GapTable";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import useDashboardBootstrap from "../../lib/hooks/useDashboardBootstrap";
import useMediaQuery from "@mui/material/useMediaQuery";
import { TradeSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import { tradeColumn } from "../../components/dashboard/table/HeaderColumns";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  groupActiveTradesIntoDivs,
  groupProfitMarginIntoDivs
} from "../../components/GroupIntoDivs";
import tradeService from "../../services/tradeService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { TestimonialBody } from "../../components/Home/Testimonial";
import { SwiperSlide } from "swiper/react";
import Image from "next/image";
import { HiPlus } from "react-icons/hi";
import CustomTooltip from "ui/components/tooltip/Tooltip";
import { BsQuestionCircle } from "react-icons/bs";

type Props = {};

const TradesPage = (props: Props) => {
  const { activeTrade, tradeOrders, activeTradeLoading } = useSelector(
    (state: RootState) => state.trade
  );
  const { currency } = useSelector((state: RootState) => state.currency);
  const isMobile = useMediaQuery("only screen and (max-width: 600px)");
  const [showTable, setShowTable] = useState(true);
  const [tradeIndex, setTradeIndex] = useState(0);
  const [createTrade, setCreateTrade] = useState(false);
  const [openTradeOption, setOpenTradeOption] = useState<{
    tradeOption: boolean;
    stopTrade: boolean;
  }>({
    tradeOption: false,
    stopTrade: false
  });

  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();

  useDashboardBootstrap();

  useEffect(() => {
    dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "" }));
  }, []);

  const resumeTrade = async () => {
    await dispatch(tradeService.resumeTrade({ api: axiosToken, id: activeTrade[tradeIndex].id! }));
    dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "" }));
  };

  return (
    <>
      <Head>
        <title>Trades Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardShell active="trades">
        <TopBar
          crumb="Dashboard / My trades"
          title="My trades"
          subtitle="Every trade Candleweb is running for you, and the controls to pause or stop them."
        />
        {activeTradeLoading && <TradeSkeletonLoader />}
        {/* {<div className="trade__container px-4 sm:px-1 overflow-hidden"> */}
        {!activeTradeLoading && (
          <div className="trade__container px-4 sm:px-1 overflow-hidden">
            <div className="start__trade--button my-8 max-w-[400px] flex items-center">
              <div className="py-3 px-4 glass__bg !rounded-full ">
                <div className="trade__btnContainer flex items-center gap-3">
                  <Typography classstyle="!text-sm font-medium">Start Trading: </Typography>
                  <button
                    className="trade__button px-4 py-3 rounded-full font-bold text-black outline-none flex gap-2 items-center"
                    onClick={() => {
                      setCreateTrade(true);
                    }}
                  >
                    {" "}
                    <span className="rounded-full bg-black p-1">
                      <HiPlus className="text-white" />
                    </span>{" "}
                    Create Trade
                  </button>
                </div>
              </div>
            </div>
            <div className="top__trade grid grid-cols-3 tb:grid-cols-2 sm:!grid-cols-1 items-stretch gap-5">
              <div className="active__trade w-full bg-card rounded-lg h-full py-4 tb:col-span-2 sm:!col-span-1 max-h-[300px]">
                <div className="flex items-center justify-between pr-3 relative">
                  <div className="flex items-center gap-3 mb-2 ">
                    <Heading textsize="md" classstyle="pl-4">
                      Active Trade
                    </Heading>
                    {activeTrade.length > 0 && (
                      <div
                        className={`py-[1px] px-2 border rounded uppercase ${activeTrade[tradeIndex]?.is_active === true ? "border-primary text-primary" : "border-[#E96666] text-[#E96666]"} !text-sm`}
                      >
                        {activeTrade[tradeIndex]?.is_active === true ? "Active" : "pause"}
                      </div>
                    )}
                    <CustomTooltip
                      text="The trades you have active"
                      trigger={<BsQuestionCircle />}
                    />
                  </div>
                  {activeTrade.length > 0 && (
                    <div
                      className="w-5 cursor-pointer text-primary"
                      onClick={() => {
                        setOpenTradeOption((prev) => ({
                          ...prev,
                          tradeOption: !prev.tradeOption
                        }));
                      }}
                    >
                      {SvgIcons.settings}
                    </div>
                  )}
                  {activeTrade[tradeIndex]?.is_active === true && (
                    <div
                      className={`hover__nav--items absolute top-12 right-0 border-[0.5px] border-[#848484] rounded-xl p-3 items-center flex-col  ${openTradeOption.tradeOption ? "flex" : "hidden"} bg-[#1E2024] z-20 max-w-[210px]`}
                    >
                      <Button
                        variant="transparent"
                        classstyle="!text-[#E96666] !bg-[#282A30] max-w-[200px]"
                        onClick={() => {
                          setOpenTradeOption((prev) => ({
                            stopTrade: true,
                            tradeOption: false
                          }));
                        }}
                      >
                        Pause Trade
                      </Button>
                    </div>
                  )}
                  {activeTrade[tradeIndex]?.is_active === false && (
                    <div
                      className={`hover__nav--items absolute top-12 right-0 border-[0.5px] border-[#848484] rounded-xl p-3 items-center flex-col  ${openTradeOption.tradeOption ? "flex" : "hidden"} bg-[#1E2024] z-20 max-w-[210px]`}
                    >
                      <Button
                        variant="transparent"
                        classstyle="!text-primary !bg-[#282A30] max-w-[200px]"
                        onClick={() => {
                          resumeTrade();
                        }}
                      >
                        Resume Trade
                      </Button>
                    </div>
                  )}
                </div>

                {activeTrade.length < 1 && (
                  <div className="h-40 text-txtSec text-sm text-center flex items-center justify-center">
                    You haven&apos;t created a trade
                  </div>
                )}

                {activeTrade.length > 0 && (
                  <div className="active__trade--carousel w-full h-full relative cursor-grab">
                    {/* <DotCarousel onChange={(index) => {
                  console.log(index)
                }}>{groupActiveTradesIntoDivs(activeTrade, currency)}</DotCarousel> */}
                    <TestimonialBody
                      perview={1}
                      stopAutoplay
                      onSwipe={(index) => setTradeIndex(index)}
                    >
                      {groupActiveTradesIntoDivs(activeTrade, currency)?.map(
                        (tag: JSX.Element, index: number) => (
                          <SwiperSlide key={index}>{tag}</SwiperSlide>
                        )
                      )}
                    </TestimonialBody>
                  </div>
                )}
              </div>
              <div className="profit__margin w-full bg-card rounded-lg h-full p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Heading textsize="md">Profit Margin</Heading>

                  <CustomTooltip
                    text="The profit margin you've made from your trades"
                    trigger={<BsQuestionCircle />}
                  />
                </div>

                {activeTrade.length < 1 && (
                  <div className="h-40 text-txtSec text-sm text-center flex items-center justify-center">
                    You have no current profit
                  </div>
                )}
                {activeTrade.length > 0 && (
                  <div className="progress__chart flex flex-col items-stretch gap-5">
                    <DotCarousel>{groupProfitMarginIntoDivs(activeTrade)}</DotCarousel>
                  </div>
                )}
              </div>
              <div className="capital__chart bg-card rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Heading textsize="md">Capital Share</Heading>
                  <CustomTooltip
                    text="Your capital share in the active trades"
                    trigger={<BsQuestionCircle />}
                  />
                </div>

                {activeTrade.length < 1 && (
                  <div className="h-40 text-txtSec text-sm text-center flex items-center justify-center">
                    You have no active trade to view capital share
                  </div>
                )}
                {activeTrade.length > 0 && (
                  <div className="chart w-full h-[150px]">
                    <BarChartMixed />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-7">
              <div className="add__trade flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 md:gap-3">
                  <Heading textsize="md">Orders</Heading>
                  <CustomTooltip
                    text="All the orders you have made in the trade"
                    trigger={<BsQuestionCircle />}
                  />
                </div>
                <div className="trade__btns flex items-center gap-3">
                  {showTable && (
                    <Button
                      classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C]"
                      onClick={async () => {
                        // const rf = await refreshT();
                        // console.log(rf)
                        setShowTable(false);
                      }}
                    >
                      Hide info
                    </Button>
                  )}
                  {!showTable && (
                    <Button
                      classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C]"
                      onClick={() => setShowTable(true)}
                    >
                      Show trade
                    </Button>
                  )}
                  <AddTrade
                    btnText="New Trade"
                    isOpenModal={createTrade}
                    modalFunction={setCreateTrade}
                    isShowButton={false}
                  />
                </div>
              </div>
              {/* <GapTable /> */}
              {showTable && (
                <GapTable
                  rowCheck
                  columnCheck
                  rows={activeTrade[tradeIndex]?.trade_order ?? []}
                  cols={tradeColumn}
                  isOpenModal
                />
              )}
            </div>
          </div>
        )}
      </DashboardShell>
      <Modal
        title={""}
        width="500px"
        isOpen={openTradeOption.stopTrade}
        onChnage={(e) =>
          setOpenTradeOption((prev) => ({
            tradeOption: false,
            stopTrade: false
          }))
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">
            Stop Trade
          </Heading>
          <Typography classstyle="text-center !text-txtSec !my-5">
            Are you sure you want to stop this trade?
          </Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button
              variant="border"
              onClick={() => {
                setOpenTradeOption((prev) => ({
                  tradeOption: false,
                  stopTrade: false
                }));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                dispatch(
                  tradeService.cancelTrade({
                    api: axiosToken,
                    id: activeTrade[tradeIndex]?.id!
                  })
                ).then((res) =>
                  setOpenTradeOption((prev) => ({
                    tradeOption: false,
                    stopTrade: false
                  }))
                );
              }}
            >
              Proceed
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TradesPage;

import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Heading, Typography, SwitchToggle, Button, BNB, addExpirationDate, dollarFormat, RingIcon, UNITINFOICON, SignupIcon1, SignupIcon2, SignupIcon3 } from "ui";
import Footer from "../components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import subscriptionService from "../services/subscriptionService";
import Loader from "../components/Loader";
import useEthereum from "../lib/hooks/useEthereum";
import { useRouter } from "next/router";
import { loginUser } from "../utils/loginUser";
import { error } from "../components/alert/Toast";
import useUserStore from "../lib/hooks/useUserStore";
import useAxiosAuth from "../lib/hooks/useAxiosAuth";
import { SubscriptionHistoryProp } from "../types/subscription";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import SubscriptionModal from "../components/dashboard/modal/Subscription";
import InfoCard from "../components/Auth/InfoCard";

type Props = {};

export interface IPricingProps {
  icon?: any;
  title: string;
  description?: string;
  price: number;
  options?: string[];
  color?: string;
  id: number;
  unit?: number;
}

const Pricing = (props: Props) => {
  const minimumToken: number = 20;

  const [modalOpen, setModalOpen] = useState<{
    open: boolean;
    plan?: IPricingProps;
  }>({
    open: false,
  });
  const dispatch = useDispatch<AppDispatch>()
  const { subscriptions, currentPlan, subscriptionHistory, isLoading: loading, paymentIds } = useSelector((state: RootState) => state.subscription);
  const [subData, setSubData] = useState<IPricingProps[]>([]);
  const [unit, setUnit] = useState<{
    sub_id: number;
    unit: number
  }>({
    sub_id: 0,
    unit: minimumToken
  });
  const [isLoading, setIsLoading] = useState(false);

  const { user, setUser } = useUserStore((state) => state);
  const { connectWallet, paySubscription } = useEthereum()
  const router = useRouter()
  const axiosToken = useAxiosAuth();

  const subscriptionData: IPricingProps[] = [];


  useEffect(() => {
    if (subscriptions.length === 0) {
      dispatch(subscriptionService.getSubscriptionList())
    }

    if (paymentIds.length === 0) {
      dispatch(subscriptionService.getPaymentId());
    }

    if (Object.values(user).length > 0 && subscriptionHistory.length === 0) {
      dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken));
    }

    if (subscriptions.length > 0 && subData.length <= 3) {
      subscriptions.forEach((sub, index) => {
        let priceData = subscriptionData[index];

        const newFeatData: any[] = [];

        Object.keys(subscriptions[index].features![0]).forEach((thekey: any) => {

          // if (thekey === "stop_profit_adjuster") return;

          const newKey = thekey
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const value = (subscriptions[index].features![0] as { [key: string]: any })[thekey];
          if (thekey === "max_invest_amount") {
            newFeatData.push(`Max. Trade Amount: ${dollarFormat(parseFloat(value))}`);
            return;
          }
          if (thekey === "min_invest_amount") {
            newFeatData.push(`Min. Trade Amount: ${dollarFormat(parseFloat(value))}`);
            return;
          }

          if (thekey === "order_per_day") {
            return;
          }
          if (thekey != "description") {
            newFeatData.push(`${value} ` + newKey);
          }

        });

        if (!priceData) {
          priceData = {
            id: 0,
            title: "",
            description: "",
            price: 0
          };
        }

        priceData.id = sub.id || 0;
        priceData.title = sub.name!;
        priceData.description = sub.features![0].description!;
        priceData.price = parseFloat(sub.price!)
        priceData.options = newFeatData;
        setSubData((prev) => (
          [...prev,
            priceData]
        ))
      })
    }
  }, [subscriptions, subscriptionHistory])


  const subscriptionProceed = async (id: number, network: number) => {

    if (user.access_token === undefined) {
      connectWallet().then(async (res) => {
        if (res !== null) {
          await loginUser({
            wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, async onSuccess(data, type) {
              if (type === "success") {
                setUser(data)

                axiosToken.defaults.headers['Authorization'] = `Bearer ${data.access_token}`
                axiosToken.defaults.withCredentials = true;
                await dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken)).then((res) => {
                  if (res.payload.length > 0) {
                    const checkActive = res.payload.filter(
                      (sub: SubscriptionHistoryProp) => sub.is_active === true
                    );

                    if (checkActive.length > 0) {
                      error("You already have an active plan.")
                      return
                    }
                  }
                  paymentProceed(id, network)
                });
              }
            },
          });
        }
      }).catch((err) => { error(err.message) }).finally(() => setIsLoading(false))
    } else {
      paymentProceed(id, network)
    }
  }

  const paymentProceed = async (id: number, network: number) => {
    setIsLoading(true);
    if (Object.keys(currentPlan).length > 0) {
      error("You already have an active plan.");
      return
    }

    const expirationDate = addExpirationDate(false);

    await paySubscription(modalOpen.plan!.price!.toString(), id, expirationDate, network, unit.unit, true, router, axiosToken,);
    setModalOpen({
      open: false, plan: undefined,
    })

    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Candleweb - Pricing</title>
        <meta name="description" content="Explore CandleWeb's pricing plans and choose the perfect package for your trading needs. Discover our affordable options to access advanced trading tools, AI-powered trading algorithms, and real-time market analysis. Start maximizing your profits in the volatile cryptocurrency market with CandleWeb's competitive pricing offerings." />
        <meta name="keywords" content="CandleWeb pricing, trading package, affordable options, advanced trading tools, AI-powered trading algorithms, real-time market analysis, maximize profits, cryptocurrency market, competitive pricing" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {(isLoading || loading) && <Loader />}
      {<div className="main mt-16 md:mt-20 max-w-[1065px] m-auto relative sm:mx-5">
        <div className="top__content text-center mt-[181px]">
          <Heading textsize="3xl" classstyle="sm:text-3xl" align="center">
            Free up some time
          </Heading>
          <Typography align="center" classstyle="inter mt-3">
            Choose the package that fits your need.
          </Typography>
          <div className="my-8 flex items-center p-4 gap-5 max-w-[700px] m-auto rounded-3xl border border-txt-yellow">
            <Image src={UNITINFOICON} alt="Unit Info Icon" className="" />
            <div className="">
              <Heading textsize="md" classstyle="!text-primary">Flexible Subscriptions for Smarter Trading  </Heading>
              {/* <Heading textsize="md" classstyle="!text-primary" onClick={() => setReward()}>How CandleWeb subscriptions works</Heading> */}
              <Typography textsize="sm" classstyle="!text-sm !font-normal">We use trading units to keep costs fair and transparent. <span className="text_gradient font-bold">1 Unit = 1 Full Trade (Buy + Sell).</span> <br />
                The more units you have, the more trades our AI can execute for you. <span className="text-txt-yellow">No trades? No charges.</span>
              </Typography>
            </div>
          </div>
          <div className="pricing__demo--info w-full flex justify-center my-4 relative">
            <Image src={RingIcon} alt='Logo Ring' className='sm:hidden absolute -top-[113px] h-72 left-[120px] tb:left-0 -z-10' />
            <div className="demo__content px-4 py-2 flex items-center gap-10 glass__bg w-fit !rounded-full sm:gap-4">
              <Typography classstyle="!font-normal sm:!text-xs">Want to see Candle AI in action?, try our free demo</Typography>
              <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:!px-4 sm:!py-2"} onClick={() => {
                connectWallet().then((res) => {
                  if (res?.walletAddress) {
                    loginUser({
                      wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                        if (type === "success") {
                          setUser(value)
                          router.push("/dashboard")
                        } else {
                          router.push("/register")
                        }
                      }
                    });
                  }
                })
              }}>Try the Demo</Button>
            </div>
          </div>
        </div>
        <div className="h-10"></div>
        <div className="pricing__card grid grid-cols-3 sm:grid-cols-1 ms:grid-cols-2 md:gap-5 gap-10 items-center justify-center mt-12 place-items-center">
          {(subData ?? subscriptionData).slice(0, (subData ?? subscriptionData).length > 3 ? 3 : (subData ?? subscriptionData).length).map((card: IPricingProps, index) => (
            <div className={` relative ${index === 0 ? "pricing_1_after" : index === 1 ? "pricing_2_after" : "pricing_3_after"} `} key={card.id.toString() + index}>
              <div
                className={`relative sm:min-w-none sm:w-full ms:min-w-[345px] md:min-w-[270px] max-w-[400px] p-8 tb:!max-w-[270px] ${index === 0 ? "pricing_1_bg" : index === 1 ? "pricing_2_bg" : "pricing_3_bg"}  `}
                key={card.id.toString() + index}
              >
                <Heading
                  textsize="xl"
                  align="center"
                  classstyle={`text-white inter mb-3`}
                  boldness="normal"
                >
                  {card.title}
                </Heading>


                <Heading textsize="md" classstyle="my-3" align="center">
                  <span className="text-white text-5xl">
                    ${Number.isInteger(unit.sub_id === card.id ? card.price * unit.unit : card.price * minimumToken) ? (unit.sub_id === card.id ? card.price * unit.unit : card.price * minimumToken) : (unit.sub_id === card.id ? card.price * unit.unit : card.price * minimumToken).toFixed(2)}
                  </span>
                </Heading>
                <div className="flex flex-col items-center">
                  <div className="flex gap-5 items-center justify-between m-auto w-[120px] rounded-full bg-[#595959]/45 mt-4 mb-1">
                    <button className="minus w-8 h-8 rounded-full bg-black/45 flex items-center justify-center text-3xl cursor-pointer" onClick={() => {
                      if (unit.unit === minimumToken) return;
                      setUnit((prev) => ({
                        unit: card.id === prev.sub_id ? prev.unit - 1 : (minimumToken + 1),
                        sub_id: card.id
                      }))
                    }}>
                      -
                    </button>
                    {<Typography>{unit.sub_id === card.id ? unit.unit : minimumToken}</Typography>}
                    <button className="plus w-8 h-8 rounded-full bg-black/45 flex items-center justify-center text-xl cursor-pointer" onClick={() => {
                      setUnit((prev) => ({
                        unit: card.id === prev.sub_id ? prev.unit + 1 : (minimumToken + 1),
                        sub_id: card.id
                      }))
                    }}>+</button>
                  </div>
                  <Typography classstyle="inter !text-xs">Minimum of {minimumToken} units.</Typography>
                </div>

                <ul className="price__options my-4 list-disc list-inside">
                  {card.options?.map((option, index) => (
                    <li className="option py-3 font-semibold flex gap-2 items-center" key={index}>
                      {option.includes("true") && <AiOutlineCheck className="text-primary" />}
                      {option.includes("false") && <AiOutlineClose className="text-red-500" />}
                      {option.includes("true") || option.includes("false") ? option.replace(/true|false/gi, '') : option.includes('Per Month') ? (card.id === unit.sub_id ? unit.unit : minimumToken) + " Trades" : option}

                    </li>
                  ))}
                </ul>
                {card.id == 1 && <Button size="lg" fullwidth={true} onClick={() => setModalOpen((e) => ({ open: true, plan: card }))}
                  classstyle={`!bg-white !text-black !border-white hover:!text-white`}
                >
                  Choose
                </Button>}

                {(card.id === 2 || card.id === 3) && <Button size="lg" variant="gradient" fullwidth={true} onClick={() => setModalOpen((e) => ({ open: true, plan: card }))}
                  classstyle="yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow"
                >
                  Choose
                </Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      }
      <div className="h-64"></div>
      {/* <div className="flex items-center justify-center w-full">
        <Heading textsize="3xl">Subscribe using yellow card</Heading>

      </div> */}

      <SubscriptionModal isOpen={modalOpen.open} subscription={modalOpen.plan} setIsOpen={(e) => setModalOpen((prev) => ({
        ...prev, open: e
      }))} continueFunction={(id, network) => subscriptionProceed(id, network)} units={unit.unit} />
      <Footer />
    </>
  );
};

export default Pricing;

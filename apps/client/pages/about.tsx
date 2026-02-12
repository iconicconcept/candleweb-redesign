import Head from "next/head";
import Image from "next/image";
import { FaAngleRight } from "react-icons/fa";
import {
  Affiliate2Image,
  AffiliateImage,
  BinanceImage,
  Button,
  ByBit,
  EthereumIcon,
  GoalImage,
  Heading,
  IconButton,
  MISES,
  MetaMaskIcon,
  StoryImage,
  TrustWalletImage,
  Typography,
  WHY1Image,
  WHY2Image,
  WHY3Image,
  YELLOWCARDICON,
} from "ui";
import Newsletter from "../components/About/Newsletter";
import Footer from "../components/Footer";
import useEthereum from "../lib/hooks/useEthereum";
import { useRouter } from "next/router";
import useUserStore from "../lib/hooks/useUserStore";
import { useState } from "react";
import Loader from "ui/components/feedback/loader";
import { loginUser } from "../utils/loginUser";
import WhyCard from "../components/Home/Why";
import Teams from "../components/About/Teams";
import { useMediaQuery } from "@react-hook/media-query";
// import Teams from "../components/About/Teams";

type Props = {};

const About = (props: Props) => {
  const { connectWallet } = useEthereum();
  const router = useRouter()
  const { setUser } = useUserStore((state) => state);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const whySection: {
    icon: any;
    title: string;
    description: string;
  }[] = [
      {
        icon: WHY1Image,
        title: "Effortless AI Trading",
        description:
          "With its continuous learning abilities, CandleAI adjusts its trading strategy, identifies the most profitable trade entries and exits 24/7.",
      },
      {
        icon: WHY2Image,
        title: "Beginner-Friendly Platform",
        description:
          "Onboarding is simple. Create an account, connect your preferred exchange and launch Candle AI",
      },
      {
        icon: WHY3Image,
        title: "Automated Execution",
        description:
          "Once you're set-up, CandleAI takes care of the rest, executing trades accurately and ensuring transparent portfolio management.",
      },
    ];
  return (
    <>
      <Head>
        <title>About Candleweb - AI-Powered Trading Platform for Profitable Trades</title>
        <meta name="description" content="Maximize trading success with CandleWeb! AI-powered CandleAI analyzes real-time data, giving a competitive edge in crypto. Utilize advanced algorithms, minimize risks, and maximize profits. Start achieving financial goals with CandleWeb and $CDE token. Access advanced tools for profitable trades in cryptocurrency." />
        <meta name="keywords" content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token" />
        <link rel="canonical" href="https://candleweb.io" />
        <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {isLoading && <Loader />}
      <div className="mt-16 md:mt-20 relative">
        <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
          <div className="our__story flex sm:flex-col md:py-8 sm:pt-8 md:mt-[151px] md:items-center justify-between">
            <div className="ourstory__image max-w-[350px] max-h-[350px] md:mb-0 sm:order-last">
              <Image
                src={StoryImage}
                alt="Our Story Image"
                className="w-full h-full"
              />

            </div>
            <div className="ourstory__details sm:mt-10">
              <Heading
                textsize="3xl"
                boldness="bold"
                classstyle="sm:text-left sm:text-3xl !text-primary"
              >
                Our Story
              </Heading>
              <Typography textsize="sm" classstyle="my-8 max-w-lg sm:text-left tb:text-sm">
                At Candleweb, everyone deserves the opportunity to participate in the exciting world of cryptocurrency, regardless of technical expertise or time constraints. That&apos;s why we created CandleAI, an innovative AI-powered trading bot designed to simplify and automate your crypto trading experience.

                {/* <span className="my-2"></span>
                We are committed to using the latest artificial intelligence and
                machine learning techniques to create trading bots that can help
                you achieve your financial goals. Our trading bots use advanced
                algorithms and market analysis to make informed trades, minimize
                risks and maximize profits. Whether you are a seasoned trader or
                a beginner, our trading bots are designed to help you succeed. */}
              </Typography>
            </div>

          </div>
        </div>
        {/* WHY CHOOSE SECTION */}
        <div className="m-auto w-full">
          <div className="why__section mt-[151px] sm:mt-[68px] relative body__gradient--right after:bg-[rgba(39,236,176,0.07)]">
            <Heading
              textsize="3xl"
              boldness="bold"
              classstyle="mb-10 sm:text-3xl ms:text-center sm:text-center text_gradient"
              align="center"
            >
              What makes us better?
            </Heading>
            <div className="bottom__to__top__gradient">
              <div className="max-w-[1065px] flex items-center justify-center gap-10 w-full py-20 tb:flex-col sm:px-9 m-auto">
                {whySection.map((card, index) => (
                  <WhyCard key={index} title={card.title} description={card.description} icon={card.icon} />

                ))}
              </div>
            </div>
          </div>
        </div>
        {/* GOALS SECTION */}
        <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
          <div className="goals flex sm:flex-col py-8 md:items-start justify-between mt-[151px] sm:mt-[68px] ms:gap-5 gap-10">
            <div className="goals__image ms:max-w-[340px] max-w-[450px] max-h-[450px] md:mb-0 sm:mt-10">

              <Image
                src={GoalImage}
                alt="Our Goals Image"
                className="w-full h-full"
              />

            </div>
            <div className="goals__details w-full">
              <Heading
                textsize="2xl"
                boldness="bold"
                classstyle="sm:text-center sm:text-2xl text_gradient"
              >
                Why Choose us
              </Heading>
              <div className="h-2"></div>
              <ul className="list-disc inter ml-5 text-white">
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-2xl sm:text-left tb:text-sm" color="white">
                    Effortless, Profitable AI Trading: CandleAI continuously learns, identifies and executes profitable trades around the clock, helping you grow your wealth in the crypto market.
                  </Typography>
                </li>
                <div className="h-2"></div>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-2xl sm:text-left tb:text-sm" color="white">
                    Built for Africa by Africans: We understand the unique challenges faced by African users. CandleAI&apos;s user-friendly platform is designed for ease of use, regardless of your technical expertise. Simple onboarding allows you to get started quickly and begin trading with confidence.
                  </Typography>
                </li>
                <div className="h-2"></div>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-2xl sm:text-left tb:text-sm" color="white">
                    Automated Execution: CandleAI executes trades precisely and manages your portfolio transparently, so you can focus on what matters most.
                  </Typography>
                </li>
              </ul>
            </div>

          </div>
        </div>
        {/* Affiliate Section */}
        <div className="mt-[151px] w-full sm:mt-0">
          <div className="flex items-center sm:flex-col md:justify-between md:gap-10 py-12 max-w-[1065px] m-auto sm:mx-9 lg:mx-7">

            <div className="affiliate__details sm:mt-10 ms:mt-10 flex flex-col items-start">
              <Heading
                textsize="2xl"
                boldness="bold"
                classstyle="sm:text-left sm:text-2xl text_gradient"
              >
                Candleweb Affiliate Program
              </Heading>
              <Image
                src={Affiliate2Image}
                alt="Affiliate Image"
                className="w-full h-full tl:hidden"
              />
              <Typography
                textsize="sm"
                classstyle="mt-5 my-2  ms:max-w-3xl max-w-md sm:text-left tb:text-sm"
              >
                Join our Affiliate Program to earn while sharing the benefits of cryptocurrency trading with others in Africa.
              </Typography>
              <ul className="list-disc inter ml-5 text-primary">
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    <span className="text-primary font-medium">How it works: </span> Spread the Word, Reap the Rewards: Share your unique referral link and earn a commission each time someone joins CandleAI through your link. You earn from their subscription fees and beyond.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    <span className="text-primary font-medium">Grow Your Earnings: </span>  Earn a percentage from the subscription fees of your direct referrals, their referrals (2nd generation), and their referrals&apos; referrals (3rd generation).
                  </Typography>
                </li>
              </ul>
              <div className="h-6"></div>
              <Typography
                textsize="xs"
                classstyle="!text-primary !font-medium"
              >
                Commission Structure:
              </Typography>
              <ul className="list-disc inter ml-5 text-white">
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    7% commission on direct referrals.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    4% commission on 2nd generation referrals.
                  </Typography>
                </li> <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    2% commission on 3rd generation referrals.
                  </Typography>
                </li>
              </ul>
              <div className="h-6"></div>
              <Image
                src={AffiliateImage}
                alt="Affiliate Image"
                className="w-full h-full sl:hidden max-w-[300px]"
              />
              <Typography
                textsize="xs"
                classstyle="!text-primary !font-medium"
              >
                Example:
              </Typography>
              <Typography
                textsize="xs"
                classstyle="mt-2"
              >
                Refer John to CandleAI and earn a 7% commission on his subscription fee. When John refers Mohammed, you earn 4% on Mohammed&apos;s subscription. If Mohammed then refers Ola, you earn 2% on Ola&apos;s subscription.
              </Typography>
              <div className="h-6"></div>
              <Typography
                textsize="xs"
                classstyle="!text-primary !font-medium"
              >
                Why Join the CandleAI Affiliate Program?
              </Typography>
              <ul className="list-disc inter ml-5 text-white">
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Passive Income: Earn commissions effortlessly.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Unlimited Potential: No earnings cap.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Flexibility: Promote CandleAI in ways that suit you best.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Empower Others: Help your network achieve financial freedom.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Real-Time Tracking & Easy Payouts: Monitor earnings and withdraw commissions anytime.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Marketing Support: Access materials to simplify promotion.
                  </Typography>
                </li>
                <li className="">
                  <Typography textsize="xs" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                    Dedicated Support: Our team ensures your success.
                  </Typography>
                </li>
              </ul>
              <div className="h-4"></div>
              <Typography textsize="sm" classstyle="max-w-sm sm:text-left tb:text-sm" color="white">
                Join the CandleAI Affiliate Program today, start building your financial future, and empower others to do the same!
              </Typography>
              <div className="h-6"></div>
              <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow max-w-[130px] sm:!px-10"} onClick={() => {
                connectWallet().then((res) => {
                  if (res?.walletAddress) {
                    loginUser({
                      wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                        if (type === "success") {
                          setUser(value)
                          router.push("/dashboard/invite")
                        } else {
                          router.push("/register")
                        }
                      }
                    });
                  }
                })
              }}>Become an affiliate</Button>
            </div>
            <div className="affiliate__image w-full h-full max-w-[400px] md:mb-0 sm:mt-10 sm:order-last flex flex-col gap-10 sm:!hidden">

              <Image
                src={AffiliateImage}
                alt="Affiliate Image"
                className="w-full h-full sm:hidden"
              />
              <Image
                src={Affiliate2Image}
                alt="Affiliate Image"
                className="w-full h-full tb:hidden"
              />

            </div>
          </div>
        </div>
        {/* <div className=" m-auto">
          <Teams />
        </div> */}

        {/* Next One */}
      </div>
      <div>
        <div className="partners__section sm:mt-[68px] mt-[151px] flex flex-col items-center justify-center relative">
          <Heading textsize="3xl" classstyle="sm:text-3xl text_gradient">
            Meet Our Partners
          </Heading>
          {/* <Typography
            textsize="sm"
            classstyle="inter my-2 sm:text-left sm:px-2"
          >
            We only support brands that provide true value to their customer.
          </Typography> */}
          <div className="partners flex items-center justify-center gap-10 h-[135px] sm:py-3 my-10 bg-card w-full ">
            <Image
              src={BinanceImage}
              alt="Binance Logo"
              className="max-h-[80px] max-w-[80px] sm:max-w-[45px]"
            />
            <Image
              src={MetaMaskIcon}
              alt="M Logo"
              className="max-h-[75px] max-w-[75px] sm:max-w-[45px]"
            />
            <Image
              src={MISES}
              alt="Mises Wallet Logo"
              className="max-h-[55px] max-w-[75px] sm:max-w-[45px]"
            />
            <Image
              src={ByBit}
              alt="ByBit Wallet Logo"
              className="max-h-[75px] max-w-[75px] sm:max-w-[45px]"
            />
            <Image
              src={YELLOWCARDICON}
              alt="Yellowcard Wallet Logo"
              className="max-h-[30px] sm:max-w-[45px]"
            />
          </div>
        </div>
      </div>
      <div>
        <Newsletter />
      </div>
      <Footer />
    </>
  );
};

export default About;

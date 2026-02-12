import { useRouter } from "next/router";
import React, { useEffect } from "react";
import {
  Button,
  Heading,
  RoundedSelectDropdown,
  RoundedTextInput,
  SignupIcon1,
  SignupIcon2,
  SignupIcon3,
  SvgIcons,
  Typography
} from "ui";
import InfoCard from "../components/Auth/InfoCard";
import { error } from "../components/alert/Toast";
import Head from "next/head";

// Define types for Ramp
declare global {
  interface Window {
    ramp: {
      initialize: (config: {
        public_key: string;
        reference: string;
        from_currency: string;
        to_currency: string;
        from_amount: string;
        mode: string;
        network: string;
        onClose: (ref: any) => void;
        onReceiveWalletDetails: (walletDetails: any) => void;
        onSuccess: (transaction: any) => void;
      }) => void;
    };
  }
}

type Props = {};

/**
 * Generates a random reference ID for payment transactions
 * @param prefix Optional prefix for the reference (default: 'REF')
 * @param length Length of the numeric part (default: 10)
 * @returns A string reference in format PREFIX_RANDOMNUMBERS
 */
function generateRandomReference(prefix: string = "REF", length: number = 10): string {
  // Generate a timestamp component (milliseconds since epoch)
  const timestamp = Date.now().toString().slice(-8);

  // Generate remaining random digits
  const remainingLength = length - timestamp.length;
  let randomPart = "";

  if (remainingLength > 0) {
    for (let i = 0; i < remainingLength; i++) {
      randomPart += Math.floor(Math.random() * 10).toString();
    }
  }

  // Combine all parts
  return `${prefix}_${timestamp}${randomPart}`;
}

const BuyCrypto = (props: Props) => {
  const router = useRouter();
  const [rampModalOverlay, setRampModalOverlay] = React.useState<Element | null>(null);
  const [selectedNetwork, setSelectedNetwork] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [showRampOverlay, setShowRampOverlay] = React.useState(false);

  useEffect(() => {
    // Load the Ramp script dynamically
    const script = document.createElement("script");
    script.src = "https://d309lcjd52k0i0.cloudfront.net/ramp.js";
    script.async = true;
    document.body.appendChild(script);

    // Clean up on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const payWithRamp = () => {
    if (selectedNetwork === "" || amount === "") {
      error("Select a network and enter an amount");
      return;
    }

    if (amount === "0") {
      error("Enter an amount greater than 0");
      return;
    }

    const numericAmount = typeof amount === "string" ? Number(amount) : amount;

    if (isNaN(numericAmount)) {
      error("Enter a valid amount");
      return;
    }

    const reference: string = generateRandomReference(selectedNetwork, 12);

    // Check if ramp is loaded
    if (window.ramp) {
      setShowRampOverlay(true);
      window.ramp.initialize({
        public_key: "pub_LwBKDJVNDgZvZm28GhohUZGEqp8Gxgvs",
        reference: reference,
        from_currency: "usdt",
        to_currency: "ngn",
        from_amount: amount,
        mode: "sell",
        network: selectedNetwork,
        onClose: function (ref) {
          // Handle when the modal is closed
          console.log("onClose", ref);
        },
        onReceiveWalletDetails: function (walletDetails) {
          console.log("onReceiveWalletDetails", walletDetails);
        },
        onSuccess: function (transaction) {
          console.log("onSuccess", transaction);
        }
      });

      const rampModalOverlay = document.querySelector(".ramp-mount-container-overlay");
      setRampModalOverlay(rampModalOverlay);
      rampModalOverlay?.classList.add("test");

      const iframeOverlay = document.querySelector(".ramp-iframe-style");
      iframeOverlay?.classList.add("relative");
      const iframeOverlayButton = document.querySelector(".iframeOverlay");
      iframeOverlayButton?.classList.remove("hidden");

      const closeButton = document.createElement("button");
      closeButton.textContent = "close me";
      closeButton.classList.add("iframeOverlay__close");

      iframeOverlay?.appendChild(closeButton);
    } else {
      console.error("Ramp is not loaded yet");
    }
  };

  function handleCloseOverlay() {
    if (rampModalOverlay) {
      rampModalOverlay.remove();
      const iframeOverlayButton = document.querySelector(".iframeOverlay");
      iframeOverlayButton?.classList.add("hidden");
    }
  }

  useEffect(() => {
    if (!showRampOverlay) return;

    function handleRampOverlayClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.classList.contains("ramp-mount-container-overlay")) {
        setShowRampOverlay(false);
      }
    }

    // Attach event listener to the document
    document.addEventListener("click", handleRampOverlayClick, true);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleRampOverlayClick, true);
    };
  }, [showRampOverlay]);

  return (
    <>
      <Head>
        <title>Buy Crypto Quickly and Hassle Free on Candleweb</title>
        <meta name="description" content="buy crypto quickly and hassle free on candleweb" />
        <meta
          name="keywords"
          content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, buy crypto, CandleWeb, CandleAI, CDE token"
        />
        <meta
          property="og:title"
          content="CandleWeb - AI-Powered Trading Platform for Profitable Trades"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="main mt-16 md:mt-20">
        <div className="heading__title sm:mx-5 pt-10 sm:pt-5">
          <Heading textsize="2xl" boldness="med" align="center">
            Purchase crypto quickly and hassle free on <span className="text_gradient">Candle</span>
            web
          </Heading>
        </div>
        <div className="crypto_section">
          {router.query.type === "yellowcard" && (
            <section className="yellow_card_section flex gap-10 items-center justify-center w-full bg-[#1F1F1F] p-10 tb:flex-col sm:p-5 mt-10">
              <div className="yellow_card--iframe w-full max-w-[400px] min-h-[620px] rounded-lg">
                <iframe
                  id="ycWidgetIframe"
                  src={`https://widget.yellowcard.io/landing/${process.env.NEXT_PUBLIC_YELLOW_CARD_PUBLIC_KEY as string}`}
                  title="Buy crypto with Yellow Card"
                  className="min-h-[620px] rounded-lg overflow-hidden w-full"
                  allow="camera https://widget.yellowcard.io;"
                ></iframe>
              </div>
              <div className="w-10"></div>
              <div className="yellow_card--info">
                {SvgIcons.yellowcard}
                <div className="mt-5">
                  <Heading
                    textsize="md"
                    classstyle="max-w-lg mb-3 inter font-medium tb:max-w-none sm:text-lg sm:text-center"
                  >
                    Seamless Crypto Payments with Yellow Card
                  </Heading>
                  <Typography
                    textsize="xs"
                    classstyle="inter font-normal sm:text-xs sm:text-[#D9D9D9] sm:text-center"
                  >
                    Use Yellow Card to subscribe securely with crypto. Fast, simple, and
                    hassle-free.
                  </Typography>
                  <div className="mt-6 flex flex-col gap-5 mb-4">
                    <InfoCard
                      icon={SignupIcon1}
                      title="1. Choose Your Plan"
                      desc="Select the best AI trading plan that fits your needs."
                    />
                    <InfoCard
                      icon={SignupIcon2}
                      title="2. Pay with Yellow Card"
                      desc="Complete payment securely using Yellow Card."
                    />
                    <InfoCard
                      icon={SignupIcon3}
                      title="3. Start Trading"
                      desc="Enjoy AI-powered trading after payment."
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
          {router.query.type === "quidax" && (
            <section className="yellow_card_section flex gap-10 items-center justify-center w-full bg-[#1F1F1F] p-10 tb:flex-col sm:p-5 mt-10">
              <div className="quidax__container bg-white rounded-2xl p-5 flex flex-col items-center shadow-lg">
                <div className="quidax__icon my-4">{SvgIcons.quidax}</div>
                <Heading
                  textsize="lg"
                  boldness="med"
                  color="black"
                  classstyle="!text-black"
                  align="center"
                >
                  Purchase Crypto Instantly with <br />
                  Quidax
                </Heading>
                <div className="iframeOverlay hidden">
                  <button
                    className="iframeOverlay__close overflow-hidden"
                    onClick={handleCloseOverlay}
                    aria-label="Close"
                  >
                    <p className="bg-white">&times;</p>
                  </button>
                </div>
                <div className="quidax__tabs my-5 w-full">
                  <div className="quidax_tabs--cover m-auto border-[1px] border-[#9C9C9C] rounded-full p-1 flex items-center w-full max-w-[50%] shadow-sm">
                    <div className="quidax_tabs--item active px-5 py-2 rounded-full w-full flex items-center justify-center font-medium cursor-pointer">
                      <Typography classstyle="!text-black inter">Buy</Typography>
                    </div>
                    <div className="quidax_tabs--item border-[1px] border-[#9C9C9C] px-5 py-2 rounded-full w-full flex items-center justify-center font-semibold cursor-pointer">
                      <Typography classstyle="!text-black inter">Sell</Typography>
                    </div>
                  </div>
                </div>
                <div className="h-4"></div>
                <RoundedSelectDropdown
                  title="Select your preferred network"
                  icon={SvgIcons.network}
                  lists={["bep20", "erc20", "solana", "trc20", "celo"]}
                  onValueChange={(value: string) => setSelectedNetwork(value)}
                />
                <RoundedTextInput
                  type="number"
                  name="amount"
                  label="Enter Amount"
                  value={amount}
                  Icon={SvgIcons.dollar}
                  className="border-[1px] border-gray-200 !h-[50px]"
                  iconClassName="top-[13px]"
                  onChange={(value) => {
                    setAmount(value.target.value);
                  }}
                  placeholder="min USD 10"
                />
                <Button
                  variant="gradient"
                  onClick={() => payWithRamp()}
                  fullwidth
                  classstyle={
                    "tb:w-full purple_gradient_btn !font-bold !bg-[#6100a5] !border-[#6100a5] hover:!bg-[#6100a5] hover:!border-[#6100a5] tb:!px-0 text-white"
                  }
                >
                  Continue
                </Button>
              </div>
              <div className="w-10"></div>
              <div className="yellow_card--info">
                <div className="">{SvgIcons.quidaxWhite}</div>
                <div className="mt-5">
                  <Heading
                    textsize="md"
                    classstyle="max-w-lg mb-3 inter font-medium tb:max-w-none sm:text-lg sm:text-center"
                  >
                    Purchase Crypto Instantly with Quidax
                  </Heading>
                  <Typography
                    textsize="xs"
                    classstyle="inter font-normal sm:text-xs sm:text-[#D9D9D9] sm:text-center"
                  >
                    Securely buy cryptocurrencies on our platform with Quidax – quick, simple, and
                    hassle-free.
                  </Typography>
                  <div className="mt-6 flex flex-col gap-5 mb-4">
                    <InfoCard
                      icon={SignupIcon1}
                      title="1. Choose Your Plan"
                      desc="Select the best AI trading plan that fits your needs."
                    />
                    <InfoCard
                      icon={SignupIcon2}
                      title="2. Pay with Quidax Card"
                      desc="Complete payment securely using Quidax."
                    />
                    <InfoCard
                      icon={SignupIcon3}
                      title="3. Start Trading"
                      desc="Enjoy AI-powered trading after payment."
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default BuyCrypto;

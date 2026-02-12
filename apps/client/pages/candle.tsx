"use client";

import Head from "next/head";
import Image from "next/image";
import React, { useState } from "react";
import {
  Button,
  CANDLETOKENIMAGE,
  CandlePriceChart,
  CandleTransChart,
  Heading,
  PieChartImage,
  TokenImage,
  Typography,
  UseImage,
  WhereImage,
} from "ui";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import useEthereum from "../lib/hooks/useEthereum";
import useUserStore from "../lib/hooks/useUserStore";
import { loginUser } from "../utils/loginUser";

type Props = {};

const Candle = (props: Props) => {
  const { connectWallet } = useEthereum()
  const router = useRouter()
  const { setUser } = useUserStore((state) => state);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  return (
    <>
      <Head>
        <title>Candle Token - AI-Powered Trading Platform for Profitable Trades</title>
        <meta name="description" content="Candle is the in-app token of CandleAI, $CDE is built on the Ethereum blockchain as an ERC-20 token and is designed to be the primary means of paying for CandleAI&apos;s products and services." />
        <meta name="keywords" content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token" />
        <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="mt-16 md:mt-20 relative">
        {/* What is Candle $CDE */}
        <div>
          <div className="candle flex sm:flex-col pt-8 md:mt-[151px] md:items-center justify-between tb:pl-10 sm:!pl-3  m-auto">
            <div className="candle__details sm:mx-7 ml-36">
              <Typography classstyle="!text-primary mb-2 uppercase font-semibold">
                About $CDE
              </Typography>
              <Heading
                textsize="2xl"
                classstyle="sm:text-2xl ms:text-4xl sm:text-left"
              >
                What is Candle ($CDE)?
              </Heading>
              <Typography classstyle="my-8 sm:mt-4 max-w-md sm:text-left">
                Candle ($CDE) is the in-app token of CandleAI. Built on the Solana blockchain, $CDE is designed to be the primary means of paying for CandleAI&apos;s products and services.

              </Typography>
            </div>
            <div className="candle__image h-full md:mb-0">
              <Image
                src={CANDLETOKENIMAGE}
                alt="Candle Image"
                className="max-h-[500px] max-w-[600px] w-full h-full"
              />
            </div>

          </div>
        </div>
        {/* How to use your $CDE */}
        <div className="w-full radial_bg mt-[151px] sm:mt-[68px] py-12">
          <div className="useEarn max-w-[1065px] m-auto relative flex sm:flex-col items-center justify-between sm:mx-9 lg:mx-7 ms:gap-5">

            <div className="useEarn__image max-w-[539px] max-h-[418px]">
              {/* TODO: REDUCE IMAGE SIZE */}
              <Image
                src={UseImage}
                alt="Use Earn Image"
                className="w-full h-full"
              />
            </div>
            <div className="useEarn sm:order-last sm:mt-10 flex flex-col sm:items-center">
              <Heading
                textsize="3xl"
                classstyle="sm:text-center ms:text-4xl sm:text-3xl"
              >
                Use your $CDE
              </Heading>
              <Typography
                classstyle="my-8 max-w-lg sm:text-left tb:text-sm"
                textsize="sm"
                color="white"
              >
                Unlock phenomenal perks with $CDE; As a $CDE token holder, you
                will be eligible for discounts on CandleAI subscriptions, have
                access to exclusive bot features, and earn rewards through
                staking. <div className="my-2"></div>
                Use it your way - With a variety of uses, $CDE is not limited to
                just incentivizing users that transact with CandleAI. It will
                be the primary payment medium for subscription plans.
              </Typography>
              {/* TODO: FIX BUTTON ALIGN */}
              <Button variant="gradient" size="lg" classstyle="yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow max-w-[150px] px-0 sm:w-full" onClick={() => {
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
              }}>
                Start earning
              </Button>
            </div>
          </div>
        </div>
        {/* Statistics of $CDE */}
        <div>
          <div className="statistics mt-[151px] sm:mt-[68px] max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
            <Typography align="center" classstyle="uppercase !text-primary font-semibold mb-2">
              Today&apos;s Stats
            </Typography>
            <Heading textsize="2xl" align="center" classstyle="mb-2 sm:text-2xl">
              See How Candle is Doing Today
            </Heading>
            <Typography align="center" classstyle="max-w-lg m-auto mb-5">
              Dive into the current price, trading volume, and market capitalization of the Candle token.
            </Typography>
            <div className="statistics__chart--card flex items-center gap-10 justify-between mt-8 sm:mt-[50px] sm:flex-col">
              <div className="glass_bg relative after:w-full after:max-w-[500px] after:max-h-none">
                <div className="glass__bg statistics__chart--price stats_shadow duration-500 cursor-pointer shadow-md rounded-lg max-w-[500px]">
                  <Heading textsize="md" classstyle="mb-1 ml-4 mt-4 title__name">
                    CANDLE PRICE (USD)
                  </Heading>
                  <Typography textsize="xs" classstyle="ml-4">
                    This is the latest price of 1 Candle ($CDE)
                  </Typography>
                  <div className="price__chart relative mt-5">
                    <Heading
                      textsize="3xl"
                      classstyle="absolute right-[20px] bottom-[20px] sm:text-4xl"
                    >
                      $0.0188
                    </Heading>
                    <Image src={CandlePriceChart} alt="Candle Price Char" />
                  </div>
                </div>
              </div>
              <div className="glass_bg relative after:w-full after:max-w-[500px] after:max-h-none">
                <div className="glass__bg statistics__chart--transaction stats_shadow duration-500 cursor-pointer shadow-md rounded-lg max-w-[500px]">
                  <Heading textsize="md" classstyle="mb-1 ml-4 mt-4 title__name">
                    TRANSACTIONS
                  </Heading>
                  <Typography textsize="xs" classstyle="ml-4">
                    Transactions conducted using $CDE
                  </Typography>
                  <div className="transaction__chart relative mt-5">
                    <Heading
                      textsize="3xl"
                      classstyle="absolute right-[20px] bottom-[20px] sm:text-4xl"
                    >
                      400,000
                    </Heading>
                    <Image src={CandleTransChart} alt="Candle Transaction Char" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Where to buy $CDE */}
        <div className="w-full relative radial_bg">
          <div className="where__buy mt-[151px] sm:mt-[68px] max-w-[1065px] m-auto flex items-center justify-between sm:flex-col sm:mx-9 lg:mx-7 ms:gap-5 py-10">
            <div className="where__buy--details flex flex-col sm:items-center sm:mt-10 p-4">
              <Heading textsize="3xl" classstyle="sm:text-3xl ms:text-4xl">
                Where to buy $CDE
              </Heading>

              <Typography textsize="sm" classstyle=" max-w-sm sm:text-left tb:text-sm !text-white mt-3">
                Pre-Launch:
              </Typography>
              <ul className="list-disc inter ml-8 mt-1 text-black">
                <li className="">
                  <Typography textsize="sm" classstyle=" max-w-sm sm:text-left tb:text-sm" color="black">
                    <strong>Partner Launchpads: </strong> Stay tuned for exclusive access to $CDE through our carefully selected partner launchpads.
                  </Typography>
                </li>
              </ul>
              <Typography textsize="sm" classstyle=" max-w-sm sm:text-left tb:text-sm !text-white mt-3">
                Launch & Beyond:
              </Typography>
              <ul className="list-disc inter text-black ml-8 mt-1">
                <li className="">
                  <Typography textsize="sm" classstyle=" max-w-sm sm:text-left tb:text-sm" color="black">
                    <strong>DEX: </strong>  Following our official launch, $CDE will be readily available for purchase on Solana based DEXes,. This allows for early access and direct ownership within the DeFi ecosystem.
                  </Typography>
                </li>
                <li className="mt-2">
                  <Typography textsize="sm" classstyle=" max-w-sm sm:text-left tb:text-sm" color="black">
                    <strong>Centralized Exchanges (Coming Soon): </strong> We&apos;re actively partnering with reputable exchanges to make $CDE even more accessible. Stay tuned!
                  </Typography>
                </li>
              </ul>
              {/* <Typography textsize="sm" classstyle="my-8 max-w-sm sm:text-left tb:text-sm">
                Don’t miss out on the opportunity; take advantage of the early
                chance to buy $CDE on our partnered launchpads before its
                official launch. Upon launch, it will promptly be accessible on
                Uniswap, and further down the line, on centralized exchanges
                that we will be partnering with.
              </Typography> */}
              <Button variant="gradient" size="lg" classstyle="yellow_gradient_btn mt-7 !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow max-w-[150px] px-0 sm:w-full" >
                Quick buy
              </Button>
            </div>
            <div className="where__buy--image max-w-[500px] sm:mt-10">
              <Image
                src={WhereImage}
                alt="Where to buy Image"
                className="w-full h-full -translate-y-20"
              />
            </div>
          </div>
        </div>
        {/* Tokenomics */}
        <div>
          <div className="tokenomics mt-[151px] sm:mt-[68px] max-w-[1065px] m-auto flex flex-col sm:mx-9 lg:mx-7">
            <Typography classstyle="!text-primary mb-2 uppercase font-semibold text-center">
              CANDLE
            </Typography>
            <Heading textsize="2xl" align="center" classstyle="sm:text-2xl">
              Tokenomics
            </Heading>
            <Typography classstyle="my-2 text-center">
              Breakdown of the Token Economy
            </Typography>
            <div className="token__chart mt-[70px]">
              <div className="token__chart--pie h-[400px] sm:h-auto">
                <Image
                  src={PieChartImage}
                  alt="Home PieChart"
                  className="h-full w-full"
                  style={{
                    objectFit: "contain"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center relative sm:px-9 lg:px-7 bottom__to__top__gradient pb-20 pt-10 -mt-24">
          <Typography
            textsize="sm"
            classstyle="max-w-5xl py-3 mt-[130px] sm:mt-[80px]"
          >
            <b className="text-primary"> Staking and airdrops:</b> This wallet
            will be used to incentivize our users for staking their $CDE, and
            also users who participate in airdrop based campaigns we would be
            organizing. <div className="my-2"></div>
            <b className="text-primary">Ecosystem: </b> This allocation powers
            the project, this wallet will be used for the activities of the
            company such as development funding, marketing, exchange listing
            fees, etc.
            <div className="my-2"></div>
            <b className="text-primary">Launchpad:</b> The tokens in this wallet
            are reserved for launch, they will be sent to partner launchpads
            which will serve as incubators for our project. These launchpads
            will help us with fundraising, token distribution, and liquidity.
          </Typography>
        </div>
        {/* Top end */}
      </div>
      <Footer />
    </>
  );
};

export default Candle;

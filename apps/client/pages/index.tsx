import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/router";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import BrandLogo from "../components/public/BrandLogo";
import { Written } from "../components/public/Written";

const bars = [214, 196, 184, 168, 150, 140, 122, 110, 86, 66, 60, 40];
const tabs = ["Your bots", "Trade records", "Risk controls"];

const VENUES = [
  { name: "KuCoin", logo: "/kucoin-logo.png" },
  { name: "Binance", logo: "/binance-logo.png" },
  { name: "Bybit", logo: "/bybit-logo.jpg" },
  { name: "BitMart", logo: "/bitmart-logo.png" },
];

function Mark() {
  return <BrandLogo className="landing-logo" height={18} priority />;
}
function ButtonLink({
  href,
  children,
  tone = "amber",
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  tone?: "amber" | "teal" | "glass";
  onClick?: () => void;
}) {
  const className = `landing-btn landing-btn-${tone}`;
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
function DataCard({
  className,
  title,
  children,
  live = false,
}: {
  className: string;
  title: string;
  children: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className={`landing-data-card ${className}`}>
      <div className="landing-card-head">
        <span>{title}</span>
        {live && <i className="landing-dot" />}
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries, observer) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-seen");
          observer.unobserve(entry.target);
        }),
      // Trigger a little after the element enters from the bottom so the
      // reveal actually plays on screen instead of finishing off-view.
      { threshold: 0.01, rootMargin: "0px 0px -12% 0px" },
    );
    document
      .querySelectorAll(".landing-rise")
      .forEach((element) => reveal.observe(element));
    const timer = window.setInterval(
      () => setActiveStep((step) => (step + 1) % 3),
      2800,
    );
    return () => {
      reveal.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Candleweb | Deploy, run and improve your trading bot</title>
        <meta
          name="description"
          content="Trading infrastructure for people who build their own bots. Connect your exchange, automate execution and review every decision."
        />
      </Head>
      <main className="landing-stage">
        <div className="landing-aura" />
        <div className="landing-grid" />
        <PublicHeader active="home" />
        <div className="landing-wrap">
          <header className="landing-hero" id="top">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow landing-rise">
                Trading infrastructure for bot builders
              </p>
              <h1 className="landing-rise rise-left">
                Deploy, run, and improve
                <br />
                <span>your trading bot.</span>
              </h1>
              <p className="landing-sub landing-rise">
                You already built the bot, in n8n, Make, or plain code.
                Candleweb feeds it live market data, executes the decisions it
                sends back, and manages every position from entry to exit. You
                keep the strategy. You never write exchange code.
              </p>
              <div className="landing-hero-cta landing-rise rise-left">
                <ButtonLink href="#access">
                  Get Started <span>↗</span>
                </ButtonLink>
                <ButtonLink href="#how" tone="teal">
                  See the handoff
                </ButtonLink>
              </div>
              <div className="landing-stats">
                <div className="landing-rise">
                  <b>4</b>
                  <span>exchanges, one endpoint</span>
                </div>
                <div className="landing-rise">
                  <b>15m</b>
                  <span>from candle close to open position</span>
                </div>
                <div className="landing-rise">
                  <b>n8n</b>
                  <span>Make, Zapier or your own code</span>
                </div>
              </div>
            </div>
            <div className="landing-art">
              <div className="landing-chart landing-rise rise-right">
                <svg
                  viewBox="0 0 600 340"
                  preserveAspectRatio="none"
                  aria-label="Trading chart"
                >
                  <defs>
                    <linearGradient id="landingUp" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#7EF0D2" />
                      <stop offset="1" stopColor="#0E9C78" />
                    </linearGradient>
                    <linearGradient
                      id="landingLine"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop stopColor="#0E9C78" />
                      <stop offset=".55" stopColor="#31E0B0" />
                      <stop offset="1" stopColor="#FFB93D" />
                    </linearGradient>
                  </defs>
                  {bars.map((height, index) => (
                    <rect
                      key={index}
                      x={24 + index * 48}
                      y={height}
                      width="13"
                      height={286 - height}
                      rx="3"
                      fill="url(#landingUp)"
                    />
                  ))}
                  <path
                    d="M30 250 L78 232 L126 210 L174 196 L222 172 L270 162 L318 146 L366 130 L414 108 L462 88 L510 78 L558 60"
                    fill="none"
                    stroke="url(#landingLine)"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <DataCard
                className="landing-card-a landing-rise rise-pop"
                title="Candleweb → your bot"
                live
              >
                <p className="landing-card-title">Market data delivered</p>
                <p className="landing-mono">
                  BTC/USDT · 15m · closed 14:45:00Z
                </p>
                <div className="landing-tags">
                  <span>RSI 61.4</span>
                  <span>MACD +18.7</span>
                  <span>EMA-50</span>
                  <span>ATR 214.6</span>
                </div>
              </DataCard>
              <DataCard
                className="landing-card-b landing-rise rise-pop"
                title="your bot → Candleweb"
              >
                <p className="landing-card-title">Decision received</p>
                <div className="landing-kv">
                  <i>action</i>
                  <b>buy</b>
                </div>
                <div className="landing-kv">
                  <i>size</i>
                  <b>15% of balance</b>
                </div>
                <div className="landing-kv">
                  <i>risk appetite</i>
                  <b>moderate</b>
                </div>
              </DataCard>
              <DataCard
                className="landing-card-c landing-rise rise-pop"
                title="Candleweb running it"
                live
              >
                <div className="landing-kv">
                  <i>14:45:02 · filled</i>
                  <b>0.0311 BTC @ 64,356.10</b>
                </div>
                <div className="landing-kv">
                  <i>14:45:02 · stop armed</i>
                  <b>63,712.00</b>
                </div>
                <div className="landing-kv">
                  <i>16:20:41 · closed</i>
                  <b className="landing-up">+1.42%</b>
                </div>
              </DataCard>
            </div>
          </header>
        </div>

        <section className="landing-band" id="how">
          <div className="landing-wrap landing-section">
            <p className="landing-eyebrow landing-rise">How it works</p>
            <h2 className="landing-write landing-rise">
              {(
                [
                  ["Unlock"],
                  ["hands-off", "em"],
                  ["execution"],
                  ["for"],
                  ["the"],
                  ["bot"],
                  ["you"],
                  ["already built", "strong"],
                ] as [string, ("em" | "strong")?][]
              ).map(([word, box], index) => {
                const Tag = box ?? "span";
                return (
                  <Tag key={index} style={{ "--i": index } as React.CSSProperties}>
                    {word}
                  </Tag>
                );
              })}
              <span
                className="landing-write-dot"
                style={{ "--i": 8 } as React.CSSProperties}
              >
                .
              </span>
            </h2>
            <div className="landing-flow landing-deal">
              {[
                "We send the data",
                "Your bot decides",
                "We hold the position",
              ].map((title, index) => (
                <article
                  key={title}
                  className="landing-step landing-rise"
                  data-active={activeStep === index}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <div className="landing-step-top">
                    <span>0{index + 1}</span>
                    <small>
                      {index === 0
                        ? "Candleweb → your bot"
                        : index === 1
                          ? "your bot → Candleweb"
                          : "Candleweb runs it"}
                    </small>
                  </div>
                  <h3>{title}</h3>
                  <p>
                    {index === 0
                      ? "Your pair, your timeframe, your indicators, computed and pushed the moment the candle closes."
                      : index === 1
                        ? "Any logic you like, an LLM prompt, a rule set, a model. Post the decision back to one endpoint."
                        : "Placement, fills, stops, trailing exits, the close. Your bot can go back to sleep."}
                  </p>
                  <pre>
                    {index === 0
                      ? '{\n  "pair": "BTC/USDT",\n  "timeframe": "15m",\n  "indicators": { "rsi_14": 61.4 }\n}'
                      : index === 1
                        ? '{\n  "action": "buy",\n  "size_pct": 15,\n  "risk_appetite": "moderate"\n}'
                        : "14:45:02  filled\n          0.0311 BTC @ 64,356.10\n16:20:41  closed\n          +1.42% · written to record"}
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-wrap landing-section landing-two">
          <div className="landing-rise">
            <p className="landing-eyebrow">Why this exists</p>
            <h2>
              <Written text="The signal was the easy part." />
            </h2>
            <div className="landing-ratio">
              <div>
                <i />
                <i />
              </div>
              <p>
                <b>10%</b>{" "}
                <Written text="The decision, reading a chart and forming a view." />
              </p>
              <p>
                <b>90%</b>{" "}
                <Written text="Everything else, the reason most bots never leave the canvas." />
              </p>
            </div>
          </div>
          <div>
            <p className="landing-lede landing-rise rise-left">
              If you can build something that reads a chart and forms an opinion
              in an afternoon, the intelligence is solved. Then you try to make
              it trade, and meet the other ninety per cent: the part that has
              everything to do with plumbing.
            </p>
            <ul className="landing-rows landing-rise">
              <li>
                <b>Rate limits</b>
                <span>
                  Every indicator needs history. Multiply the exchange calls by
                  twenty symbols.
                </span>
              </li>
              <li>
                <b>Partial fills</b>
                <span>Your order filled 60%. What happens to the rest?</span>
              </li>
              <li>
                <b>Monitoring</b>
                <span>
                  A stop-loss only works if something is awake at 3am.
                </span>
              </li>
              <li>
                <b>Four exchanges</b>
                <span>
                  Four auth systems, order schemas, and ways to break.
                </span>
              </li>
              <li>
                <b>No record</b>
                <span>
                  What did the bot actually see when it decided? Gone.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-band" id="capabilities">
          <div className="landing-wrap landing-section">
            <div className="landing-section-head">
              <div className="landing-rise">
                <p className="landing-eyebrow">Inside the dashboard</p>
                <h2>
                  <Written text="Everything your bots are doing, in one place." />
                </h2>
              </div>
              <ButtonLink href="#access">
                Get Started <span>↗</span>
              </ButtonLink>
            </div>
            <div className="landing-tabs" role="tablist">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === index}
                  onClick={() => setActiveTab(index)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="landing-screen landing-rise">
              <div className="landing-screen-bar">
                <span>
                  <Mark />
                </span>
                <span>
                  BTC/USDT 64,356.10 <b>+1.42%</b>
                </span>
                <span>KuCoin · connected</span>
              </div>
              {activeTab === 0 && (
                <div className="landing-bots">
                  {[
                    ["Momentum v3", "n8n · BTC/USDT · 15m", "41"],
                    ["Range fader", "Make · SOL/USDT · 1h", "63"],
                    ["EMA cross", "Python · ETH/USDT · 4h", "12"],
                  ].map(([name, source, trades], index) => (
                    <div className="landing-bot" key={name}>
                      <div>
                        <b>{name}</b>
                        <span
                          className={`landing-state ${index === 2 ? "idle" : ""}`}
                        >
                          {index === 2 ? "Paused" : "Running"}
                        </span>
                      </div>
                      <p className="landing-mono">{source}</p>
                      <div className="landing-spark">
                        <span style={{ height: `${35 - index * 7}%` }} />
                        <span style={{ height: `${62 - index * 8}%` }} />
                        <span style={{ height: `${48 - index * 5}%` }} />
                        <span style={{ height: `${82 - index * 9}%` }} />
                        <span style={{ height: `${72 - index * 4}%` }} />
                      </div>
                      <div className="landing-kv">
                        <i>trades · 30d</i>
                        <b>{trades}</b>
                      </div>
                      <div className="landing-kv">
                        <i>open now</i>
                        <b>{index === 0 ? "1" : "0"}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 1 && (
                <div className="landing-table">
                  <div>
                    16:20 &nbsp; Momentum v3 &nbsp; BTC/USDT{" "}
                    <b className="landing-up">+1.42%</b>
                  </div>
                  <div>
                    11:05 &nbsp; Range fader &nbsp; SOL/USDT{" "}
                    <b className="landing-down">-0.94%</b>
                  </div>
                  <div>
                    08:30 &nbsp; EMA cross &nbsp; ETH/USDT{" "}
                    <b className="landing-up">+0.61%</b>
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div className="landing-risk-row">
                  {[
                    ["Risk appetite", "Moderate", "52%"],
                    ["Max position size", "15% of balance", "15%"],
                    ["Trailing stop", "On", "100%"],
                  ].map(([label, value, width]) => (
                    <div className="landing-risk" key={label}>
                      <small>{label}</small>
                      <b>{value}</b>
                      <i>
                        <span style={{ width }} />
                      </i>
                      <p>Candleweb keeps every trade within your controls.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="landing-wrap landing-section" id="layers">
          <p className="landing-eyebrow landing-rise">The part we handle</p>
          <h2>
            <Written text="Everything between your bot's decision and a closed position." />
          </h2>
          <div className="landing-layers landing-deal">
            {[
              [
                "Market data",
                "Deploy",
                "OHLCV plus the indicators you choose, on your timeframe and pair, pushed to your webhook at every candle close.",
              ],
              [
                "Position monitoring",
                "Run",
                "A stop-loss set from your risk appetite, a trailing stop that follows price up, and workers watching continuously.",
              ],
              [
                "Order execution",
                "Run",
                "One endpoint across KuCoin, Binance, Bybit and BitMart. Fills tracked as they arrive.",
              ],
              [
                "Bot review",
                "Improve",
                "Every trade is stored with the exact candles and indicator values your bot saw, so you get specific edits to improve it.",
              ],
            ].map(([title, action, description]) => (
              <article className="landing-layer landing-rise" key={title}>
                <div>
                  <h3>{title}</h3>
                  <span>{action}</span>
                </div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-band">
          <div className="landing-wrap landing-section">
            <p className="landing-eyebrow landing-rise">
              Your exchange, your funds
            </p>
            <h2>
              <Written text="Candleweb never holds your money." />
            </h2>
            <p className="landing-lede landing-rise rise-left">
              Connect your own exchange account with API keys you control and can
              revoke at any time. Every order is placed in your account, under
              your name.
            </p>
            <div className="landing-custody landing-deal">
              {[
                [
                  "Where your funds sit",
                  "Your exchange account",
                  "No wallet, pooled balance or deposit address.",
                ],
                [
                  "What we get",
                  "Trade-only API keys",
                  "Scoped to placing and closing orders. Withdrawal permission is never needed.",
                ],
                [
                  "How you stop it",
                  "Revoke, any time",
                  "Delete the key on your exchange and access ends immediately.",
                ],
              ].map(([label, title, description]) => (
                <article className="landing-cus landing-rise" key={label}>
                  <small>{label}</small>
                  <b>{title}</b>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="landing-venues landing-rise">
              <div className="landing-venues-row">
                {[0, 1].map((set) => (
                  <Fragment key={set}>
                    {VENUES.map((venue) => (
                      <div
                        className="landing-venue-card"
                        key={`${set}-${venue.name}`}
                        aria-hidden={set === 1}
                      >
                        <span>
                          <Image
                            src={venue.logo}
                            alt={venue.name}
                            fill
                            sizes="200px"
                            style={{ objectFit: "contain" }}
                          />
                        </span>
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="landing-venues-note landing-rise">
              More exchanges on request.
            </p>
          </div>
        </section>

        <div className="landing-wrap landing-section" id="access">
          <section className="landing-cta">
            <div className="landing-rise">
              <p className="landing-eyebrow">Get started</p>
              <h2>
                <Written text="Point your bot at Candleweb." />
              </h2>
              <p className="landing-lede landing-rise rise-left">
                Create an account, connect your exchange with API keys you
                control, and paste the webhook URL into your workflow.
              </p>
              <ol className="landing-rise">
                <li>
                  <span>1</span>Create your Candleweb account
                </li>
                <li>
                  <span>2</span>Add trade-only API keys from your exchange
                </li>
                <li>
                  <span>3</span>Paste the webhook URL into your workflow
                </li>
              </ol>
            </div>
            <form
              className="landing-form landing-rise"
              onSubmit={(event) => {
                event.preventDefault();
                router.push("/register");
              }}
            >
              <label htmlFor="landing-email">Email</label>
              <input
                id="landing-email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <label htmlFor="landing-tool">
                What did you build your bot with?
              </label>
              <select id="landing-tool" defaultValue="n8n">
                <option>n8n</option>
                <option>Make</option>
                <option>Zapier</option>
                <option>My own code</option>
                <option>Haven&apos;t built one yet</option>
              </select>
              <button className="landing-btn landing-btn-amber" type="submit">
                Get Started <span>↗</span>
              </button>
              <p>
                Free to connect. You fund your own exchange account. Candleweb
                never holds it.
              </p>
            </form>
          </section>
        </div>

        <PublicFooter description="Trading infrastructure for people who build their own bots. Built in Abuja, Nigeria." />
      </main>
    </>
  );
}

// import Image from 'next/image'
// import React, { useState } from 'react'
// import { BotImage, Button, Heading, HeroBgIcon, MacPcImage, MacScreen1Image, MacScreen2Image, MacScreen3Image, MobileHeroImage, Modal, PlayIcon, Step1Icon, Step2Icon, Step3Icon, SvgIcons, Typography, UNITINFOICON, WHY1Image, WHY2Image, WHY3Image } from 'ui'

// import NewStepCard from '../components/Home/NewStep'
// import WhyCard from '../components/Home/Why'
// import FAQ from '../components/Home/FAQ'
// import Token from '../components/Home/Token'
// import Testimonial from '../components/Home/Testimonial'
// import CryptoTable from '../components/dashboard/table/CryptoTable'
// import Footer from '../components/Footer'
// import Head from 'next/head'

// import { useRouter } from 'next/router'
// import useEthereum from '../lib/hooks/useEthereum'
// import useUserStore from '../lib/hooks/useUserStore'
// import { loginUser } from '../utils/loginUser'

// import { TradedCard } from '../components/Home'

// type Props = {}

// const NewIndex = (props: Props) => {
//     const { connectWallet } = useEthereum()
//     const router = useRouter()
//     const { setUser } = useUserStore((state: any) => state);
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//     const [showModal, setShowModal] = useState(false)
//     return (
//         <>
//             <Head>
//                 <title>Candleweb - AI-Powered Trading Platform for Profitable Trades</title>
//                 <meta name="description" content="Maximize trading success with CandleWeb! AI-powered CandleAI analyzes real-time data, giving a competitive edge in crypto. Utilize advanced algorithms, minimize risks, and maximize profits. Start achieving financial goals with CandleWeb and $CDE token. Access advanced tools for profitable trades in cryptocurrency." />
//                 <meta name="keywords" content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token" />
//                 <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
//                 <link rel="canonical" href="https://candleweb.io" />
//                 <link rel="icon" href="/favicon.ico" />
//                 <meta name="viewport" content="width=device-width, initial-scale=1" />

//                 {/* TrustBox Script */}
//                 {/* <script
//                     type="text/javascript"
//                     src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
//                     async
//                 ></script> */}
//                 {/* End TrustBox Script */}

//             </Head>
//             <div className='bg-[#1b1b1b]'>
//                 <div className="mt-20 w-full bg-[#0d0d0d] px-4 h-12 flex gap-2 sm:gap-1 items-center justify-center cursor-pointer">
//                     {/* <Image src={UNITINFOICON} alt="Unit Info Icon" className="invert h-7 w-7" /> */}
//                     <div className="h-7 w-7 sm:h-5 sm:w-5">

//                         {SvgIcons.info}
//                     </div>
//                     <Typography classstyle='inter !text-txt-yellow !text-xl sm:!text-sm' tooltip='<span style="font-weight: bold; font-size: 16px;" class="text_gradient">We Don’t Hold Your Funds, You Do.</span><br />

//                         Your security is our priority. We don’t ask for deposits or hold your funds.<br />

//                         Your assets stay safe in your crypto exchange account, and you remain in complete control of your investments while we work to maximise your returns'>Your  Assets Stay In Your Wallet. Always.</Typography>
//                 </div>

//                 {/* HERO */}
//                 <div className="mt-20 flex flex-col items-center justify-center">

//                     <Typography classstyle='inter !font-medium sm:!text-xs text-center sm:font-normal sm:max-w-[300px]' textsize='sm'>
//                         Unleashing AI for smarter trading and passive income
//                     </Typography>
//                     <div className="max-w-[700px] mt-4 sm:px-2">
//                         <Heading textsize='3xl' classstyle='inter sm:!text-4xl' align='center'>
//                             <span className='text_gradient'> CandleAI: </span> Making Crypto Trading Simple and Profitable for All Africans
//                         </Heading>
//                     </div>

//                     <div className="mt-8 flex items-center gap-5 sm:flex-col">
//                         <div className="flex flex-col items-center">
//                             <Button variant='border' classstyle='!border-primary hover:!border-primary sm:w-full !py-3' icon={<Image
//                                 src={PlayIcon}
//                                 alt="Play Icon"
//                                 className=""
//                             />} onClick={async () => {
//                                 setShowModal(true);
//                             }}>Click to watch the Video</Button>
//                             <Typography classstyle='inter !text-[#BCBCBC] mt-1 !text-[10px]'>Watch and learn from our detailed video!</Typography>
//                         </div>
//                         <div className="flex flex-col items-center">
//                             <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:w-full"} onClick={() => {
//                                 // connectWallet().then((res) => {
//                                 //     if (res?.walletAddress) {
//                                 //         loginUser({
//                                 //             wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
//                                 //                 if (type === "success") {
//                                 //                     setUser(value)
//                                 //                     router.push("/dashboard")
//                                 //                 } else {
//                                 //                     router.push("/register")
//                                 //                 }
//                                 //             }
//                                 //         });
//                                 //     }
//                                 // })
//                                 router.push("/register");
//                             }}>Try Free Demo Now</Button>
//                             <Typography classstyle='inter !text-[#BCBCBC] mt-1 !text-[10px]'>Start with a risk-free AI demo trade!</Typography>
//                         </div>
//                     </div>

//                     {/* <div className="h-4"></div> */}
//                     {/* <div className="trustpilot__body w-full bg-[#1F1F1F] p-4 h-24">
//                         <TrustBox
//                             templateId="your-template-id" // Replace with your template ID
//                             businessUnitId="your-business-unit-id" // Replace with your business unit ID
//                             styleHeight="50px" // Adjust height as needed
//                             styleWidth="100%"
//                             theme="light"
//                         />
//                     </div> */}
//                     <div className="mt-[-40px] sm:hidden">
//                         <Image src={HeroBgIcon} alt='Hero Image' />
//                     </div>
//                     <div className="mt-5 sm:flex hidden">
//                         <Image src={MobileHeroImage} alt='Hero Image' />
//                     </div>
//                 </div>
//                 {/* TRADING */}
//                 <TradedCard />
//                 {/* MOST TRADED */}
//                 <div className="max-w-[1065px] mb-16 mt-40 flex flex-col items-center justify-center w-full m-auto">
//                     <Heading textsize='sm' classstyle='inter !font-medium !text-[#BCBCBC] uppercase '>MOST TRADED CRYPTOCURRENCIES</Heading>
//                     <div className="w-full overflow-x-scroll flex-nowrap lg:px-3 whitespace-nowrap lg:scroll-smooth lg:overflow-x-scroll lg:hide-scroll-bar -mb-7 py-7 no__scroll pb-24">
//                         <CryptoTable />
//                     </div>
//                 </div>
//                 {/* CANDLE AI */}
//                 <div className="mt-16 tb:mt-20 flex flex-col md:flex-row md:items-center justify-between max-w-[1075px] m-auto sm:mx-9 lg:mx-7">
//                     <div className="left__description sm:order-last sm:flex sm:flex-col sm:items-center flex-1 sm:mt-[55px] ">
//                         <Heading textsize='xl' classstyle='inter'>CandleAI</Heading>
//                         <Typography classstyle='inter !text-[#BCBCBC] mb-5 mt-2 max-w-lg' textsize='sm'>Effortlessly Earn Passive Income with CandleAI. Our AI trading bot analyses cryptocurrency markets 24/7, helping you make profitable trades even while you sleep.
//                             <br /><br />
//                             Getting started is simple: sign up, choose your cryptocurrencies, and let CandleAI take care of the rest.
//                         </Typography>
//                         <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:!w-full sm:max-w-[300px] sm:!px-0"} onClick={() => {
//                             connectWallet().then((res) => {
//                                 if (res?.walletAddress) {
//                                     loginUser({
//                                         wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
//                                             if (type === "success") {
//                                                 setUser(value)
//                                                 router.push("/dashboard")
//                                             } else {
//                                                 router.push("/register")
//                                             }
//                                         }
//                                     });
//                                 }
//                             })
//                         }}>Try Free Demo Now</Button>
//                     </div>
//                     <div className="right__image  w-full h-full max-w-[480px] max-h-[480px] min-w-[300px] ms:min-w-[150px] ms:max-w-[340px] mb-4 md:mb-0 flex-none">
//                         <Image src={BotImage} alt="Steps Image" className="w-full h-full" />
//                     </div>
//                 </div>
//                 {/* STEPS */}
//                 <div className="wave__bg bg-[url('/wave.svg')] sm:bg-[url('/wave_mobile.svg')]">
//                     <div className=" py-20 px-20 my-16 sm:px-12">
//                         <div className="h-72 sm:h-10"></div>
//                         <Heading textsize='xl' classstyle='inter mb-2 sm:text-2xl'>Effortless trading in 3 steps</Heading>
//                         <Typography classstyle='font-normal max-w-sm'>Begin your journey to 24/7 trading and profitability with CandleAI, your AI trading
//                             companion.</Typography>
//                         <div className="flex items-center justify-around gap-5 mt-10 max-w-[1065px] w-full m-auto tb:flex-col">
//                             <NewStepCard title='Create Account' description='Get Started in Seconds. Sign up with your crypto wallet and connect your preferred exchange account.' icon={Step1Icon} index={1} />
//                             <NewStepCard title='initiate a trade' description='Choose a trading pair, initiate the trade and let CandleAI take over.  ' icon={Step2Icon} index={2} />
//                             <NewStepCard title='Start earning' description="Trade smarter, not harder. CandleAI's Auto-Profit Taking locks in gains while you relax. Focus on what matters and let the AI handle the trades." icon={Step3Icon} index={3} />
//                         </div>
//                     </div>
//                     {/* WHY */}
//                     <div className="bottom__to__top__gradient mt-16 flex flex-col items-center">
//                         <Heading textsize='xl' classstyle='inter mb-10 sm:mb-0 text-primary sm:text-3xl'>Why we are better</Heading>
//                         <div className=" flex items-center justify-center gap-10 w-full py-20 tb:flex-col sm:px-9">
//                             <WhyCard title='Effortless AI Trading' description='"Trading Made Effortless: CandleAI continuously learns and adjusts its strategy,
// identifying profitable opportunities and executing precise trades for around-the-clock
// profitability.' icon={WHY1Image} />
//                             <WhyCard title='Beginner-Friendly Platform' description='Onboarding is simple. Create an account, connect your preferred exchange and launch CandleAI' icon={WHY2Image} />
//                             <WhyCard title='Automated Execution' description="Once you're set-up, CandleAI takes care of the rest, executing trades accurately and ensuring transparent portfolio management." icon={WHY3Image} />
//                         </div>
//                     </div>
//                 </div>
//                 {/* WELCOME */}
//                 <div className="mac_pc_cover radial_bg py-20 flex items-center gap-10 justify-around tb:flex-col">
//                     <div className="left_image tb:order-last tb:mt-10 tb:-ml-20 sm:px-5">
//                         <div className=" max-w-[500px] relative w-full">
//                             <Image src={MacPcImage} alt='Mac Pc image' className='w-full h-full' />
//                             {/* <Image src={MacScreenImage} alt='Mac Screen image' className='mac_screen_img absolute top-[20px] left-[15px]' /> */}
//                             <Image src={MacScreen1Image} alt='Mac Screen 1 image' className='mac_screen_1 absolute top-0 left-12' />
//                             <Image src={MacScreen2Image} alt='Mac Screen 2 image' className='mac_screen_2 absolute -top-1 left-24' />
//                             <Image src={MacScreen3Image} alt='Mac Screen 3 image' className='mac_screen_3 absolute -top-3 left-36' />
//                         </div>
//                     </div>
//                     <div className="right_details flex flex-col tb:items-center">
//                         <Heading textsize='3xl' classstyle='inter max-w-lg !text-black font-bold tb:text-center sm:text-3xl'>Welcome to the <br /><span className='text-white'>Future </span> of trading</Heading>
//                         <Typography classstyle='inter my-5 max-w-lg !text-black tb:text-center sm:px-6'>Step into a world where artificial intelligence transforms trading into a stress-free,
//                             highly efficient, and precision-driven journey to profitability.</Typography>
//                         <Button variant='gradient' classstyle={"tb:max-w-[300px] tb:w-full yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow max-w-[130px] sm:max-w-[300px] sm:!px-0"} onClick={() => router.push("/register")}>Get Started</Button>
//                     </div>
//                 </div>
//                 {/* TOKEN */}
//                 <div className="wavy_bg_line bg-[url('/wave_lines.svg')]">
//                     <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
//                         <Token />
//                     </div>
//                     {/* TESTIMONIAL */}
//                     <div className="m-auto sm:!mx-0">
//                         <div className="testimonial__section flex flex-col items-center sm:mt-[4.25rem] mt-[9.4375rem] w-full">
//                             <Typography textsize="sm" classstyle="tracking-widest uppercase font-medium sm:text-sm">
//                                 See what people are saying about us
//                             </Typography>
//                             <Testimonial />
//                         </div>
//                     </div>
//                     {/* FAQ */}
//                     <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
//                         <FAQ />
//                     </div>
//                 </div>
//                 {/* <div className="h-screen"></div> */}
//             </div>
//             <Footer />
//             <Modal
//                 title={""}
//                 width="720px"

//                 isOpen={showModal}
//                 onChnage={(e: any) =>
//                     setShowModal((prev) => {
//                         return !prev
//                     })
//                 }
//             >
//                 <div className="modal-content">
//                     <div className="video-container">
//                         <iframe width="670" height="405" className='sm:!w-full' src="https://www.youtube.com/embed/j2iyFk38IiE?si=bdQyw6J34tMWgDck" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
//                     </div>
//                 </div>
//             </Modal>
//         </>
//     )
// }

// export default NewIndex

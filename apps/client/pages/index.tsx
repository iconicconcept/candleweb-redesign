import Image from 'next/image'
import React, { useState } from 'react'
import { BotImage, Button, Heading, HeroBgIcon, MacPcImage, MacScreen1Image, MacScreen2Image, MacScreen3Image, MobileHeroImage, Modal, PlayIcon, Step1Icon, Step2Icon, Step3Icon, SvgIcons, Typography, UNITINFOICON, WHY1Image, WHY2Image, WHY3Image } from 'ui'

import NewStepCard from '../components/Home/NewStep'
import WhyCard from '../components/Home/Why'
import FAQ from '../components/Home/FAQ'
import Token from '../components/Home/Token'
import Testimonial from '../components/Home/Testimonial'
import CryptoTable from '../components/dashboard/table/CryptoTable'
import Footer from '../components/Footer'
import Head from 'next/head'

import { useRouter } from 'next/router'
import useEthereum from '../lib/hooks/useEthereum'
import useUserStore from '../lib/hooks/useUserStore'
import { loginUser } from '../utils/loginUser'

import { TradedCard } from '../components/Home'

type Props = {}

const NewIndex = (props: Props) => {
    const { connectWallet } = useEthereum()
    const router = useRouter()
    const { setUser } = useUserStore((state: any) => state);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState(false)
    return (
        <>
            <Head>
                <title>Candleweb - AI-Powered Trading Platform for Profitable Trades</title>
                <meta name="description" content="Maximize trading success with CandleWeb! AI-powered CandleAI analyzes real-time data, giving a competitive edge in crypto. Utilize advanced algorithms, minimize risks, and maximize profits. Start achieving financial goals with CandleWeb and $CDE token. Access advanced tools for profitable trades in cryptocurrency." />
                <meta name="keywords" content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token" />
                <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
                <link rel="canonical" href="https://candleweb.io" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* TrustBox Script */}
                {/* <script
                    type="text/javascript"
                    src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
                    async
                ></script> */}
                {/* End TrustBox Script */}

            </Head>
            <div className='bg-[#1b1b1b]'>
                <div className="mt-20 w-full bg-[#0d0d0d] px-4 h-12 flex gap-2 sm:gap-1 items-center justify-center cursor-pointer">
                    {/* <Image src={UNITINFOICON} alt="Unit Info Icon" className="invert h-7 w-7" /> */}
                    <div className="h-7 w-7 sm:h-5 sm:w-5">

                        {SvgIcons.info}
                    </div>
                    <Typography classstyle='inter !text-txt-yellow !text-xl sm:!text-sm' tooltip='<span style="font-weight: bold; font-size: 16px;" class="text_gradient">We Don’t Hold Your Funds, You Do.</span><br />
                        
                        Your security is our priority. We don’t ask for deposits or hold your funds.<br />
                        
                        Your assets stay safe in your crypto exchange account, and you remain in complete control of your investments while we work to maximise your returns'>Your  Assets Stay In Your Wallet. Always.</Typography>
                </div>


                {/* HERO */}
                <div className="mt-20 flex flex-col items-center justify-center">

                    <Typography classstyle='inter !font-medium sm:!text-xs text-center sm:font-normal sm:max-w-[300px]' textsize='sm'>
                        Unleashing AI for smarter trading and passive income
                    </Typography>
                    <div className="max-w-[700px] mt-4 sm:px-2">
                        <Heading textsize='3xl' classstyle='inter sm:!text-4xl' align='center'>
                            <span className='text_gradient'> CandleAI: </span> Making Crypto Trading Simple and Profitable for All Africans
                        </Heading>
                    </div>

                    <div className="mt-8 flex items-center gap-5 sm:flex-col">
                        <div className="flex flex-col items-center">
                            <Button variant='border' classstyle='!border-primary hover:!border-primary sm:w-full !py-3' icon={<Image
                                src={PlayIcon}
                                alt="Play Icon"
                                className=""
                            />} onClick={async () => {
                                setShowModal(true);
                            }}>Click to watch the Video</Button>
                            <Typography classstyle='inter !text-[#BCBCBC] mt-1 !text-[10px]'>Watch and learn from our detailed video!</Typography>
                        </div>
                        <div className="flex flex-col items-center">
                            <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:w-full"} onClick={() => {
                                // connectWallet().then((res) => {
                                //     if (res?.walletAddress) {
                                //         loginUser({
                                //             wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                                //                 if (type === "success") {
                                //                     setUser(value)
                                //                     router.push("/dashboard")
                                //                 } else {
                                //                     router.push("/register")
                                //                 }
                                //             }
                                //         });
                                //     }
                                // })
                                router.push("/register");
                            }}>Try Free Demo Now</Button>
                            <Typography classstyle='inter !text-[#BCBCBC] mt-1 !text-[10px]'>Start with a risk-free AI demo trade!</Typography>
                        </div>
                    </div>




                    {/* <div className="h-4"></div> */}
                    {/* <div className="trustpilot__body w-full bg-[#1F1F1F] p-4 h-24">
                        <TrustBox
                            templateId="your-template-id" // Replace with your template ID
                            businessUnitId="your-business-unit-id" // Replace with your business unit ID
                            styleHeight="50px" // Adjust height as needed
                            styleWidth="100%"
                            theme="light"
                        />
                    </div> */}
                    <div className="mt-[-40px] sm:hidden">
                        <Image src={HeroBgIcon} alt='Hero Image' />
                    </div>
                    <div className="mt-5 sm:flex hidden">
                        <Image src={MobileHeroImage} alt='Hero Image' />
                    </div>
                </div>
                {/* TRADING */}
                <TradedCard />
                {/* MOST TRADED */}
                <div className="max-w-[1065px] mb-16 mt-40 flex flex-col items-center justify-center w-full m-auto">
                    <Heading textsize='sm' classstyle='inter !font-medium !text-[#BCBCBC] uppercase '>MOST TRADED CRYPTOCURRENCIES</Heading>
                    <div className="w-full overflow-x-scroll flex-nowrap lg:px-3 whitespace-nowrap lg:scroll-smooth lg:overflow-x-scroll lg:hide-scroll-bar -mb-7 py-7 no__scroll pb-24">
                        <CryptoTable />
                    </div>
                </div>
                {/* CANDLE AI */}
                <div className="mt-16 tb:mt-20 flex flex-col md:flex-row md:items-center justify-between max-w-[1075px] m-auto sm:mx-9 lg:mx-7">
                    <div className="left__description sm:order-last sm:flex sm:flex-col sm:items-center flex-1 sm:mt-[55px] ">
                        <Heading textsize='xl' classstyle='inter'>CandleAI</Heading>
                        <Typography classstyle='inter !text-[#BCBCBC] mb-5 mt-2 max-w-lg' textsize='sm'>Effortlessly Earn Passive Income with CandleAI. Our AI trading bot analyses cryptocurrency markets 24/7, helping you make profitable trades even while you sleep.
                            <br /><br />
                            Getting started is simple: sign up, choose your cryptocurrencies, and let CandleAI take care of the rest.
                        </Typography>
                        <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:!w-full sm:max-w-[300px] sm:!px-0"} onClick={() => {
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
                        }}>Try Free Demo Now</Button>
                    </div>
                    <div className="right__image  w-full h-full max-w-[480px] max-h-[480px] min-w-[300px] ms:min-w-[150px] ms:max-w-[340px] mb-4 md:mb-0 flex-none">
                        <Image src={BotImage} alt="Steps Image" className="w-full h-full" />
                    </div>
                </div>
                {/* STEPS */}
                <div className="wave__bg bg-[url('/wave.svg')] sm:bg-[url('/wave_mobile.svg')]">
                    <div className=" py-20 px-20 my-16 sm:px-12">
                        <div className="h-72 sm:h-10"></div>
                        <Heading textsize='xl' classstyle='inter mb-2 sm:text-2xl'>Effortless trading in 3 steps</Heading>
                        <Typography classstyle='font-normal max-w-sm'>Begin your journey to 24/7 trading and profitability with CandleAI, your AI trading
                            companion.</Typography>
                        <div className="flex items-center justify-around gap-5 mt-10 max-w-[1065px] w-full m-auto tb:flex-col">
                            <NewStepCard title='Create Account' description='Get Started in Seconds. Sign up with your crypto wallet and connect your preferred exchange account.' icon={Step1Icon} index={1} />
                            <NewStepCard title='initiate a trade' description='Choose a trading pair, initiate the trade and let CandleAI take over.  ' icon={Step2Icon} index={2} />
                            <NewStepCard title='Start earning' description="Trade smarter, not harder. CandleAI's Auto-Profit Taking locks in gains while you relax. Focus on what matters and let the AI handle the trades." icon={Step3Icon} index={3} />
                        </div>
                    </div>
                    {/* WHY */}
                    <div className="bottom__to__top__gradient mt-16 flex flex-col items-center">
                        <Heading textsize='xl' classstyle='inter mb-10 sm:mb-0 text-primary sm:text-3xl'>Why we are better</Heading>
                        <div className=" flex items-center justify-center gap-10 w-full py-20 tb:flex-col sm:px-9">
                            <WhyCard title='Effortless AI Trading' description='"Trading Made Effortless: CandleAI continuously learns and adjusts its strategy, 
identifying profitable opportunities and executing precise trades for around-the-clock 
profitability.' icon={WHY1Image} />
                            <WhyCard title='Beginner-Friendly Platform' description='Onboarding is simple. Create an account, connect your preferred exchange and launch CandleAI' icon={WHY2Image} />
                            <WhyCard title='Automated Execution' description="Once you're set-up, CandleAI takes care of the rest, executing trades accurately and ensuring transparent portfolio management." icon={WHY3Image} />
                        </div>
                    </div>
                </div>
                {/* WELCOME */}
                <div className="mac_pc_cover radial_bg py-20 flex items-center gap-10 justify-around tb:flex-col">
                    <div className="left_image tb:order-last tb:mt-10 tb:-ml-20 sm:px-5">
                        <div className=" max-w-[500px] relative w-full">
                            <Image src={MacPcImage} alt='Mac Pc image' className='w-full h-full' />
                            {/* <Image src={MacScreenImage} alt='Mac Screen image' className='mac_screen_img absolute top-[20px] left-[15px]' /> */}
                            <Image src={MacScreen1Image} alt='Mac Screen 1 image' className='mac_screen_1 absolute top-0 left-12' />
                            <Image src={MacScreen2Image} alt='Mac Screen 2 image' className='mac_screen_2 absolute -top-1 left-24' />
                            <Image src={MacScreen3Image} alt='Mac Screen 3 image' className='mac_screen_3 absolute -top-3 left-36' />
                        </div>
                    </div>
                    <div className="right_details flex flex-col tb:items-center">
                        <Heading textsize='3xl' classstyle='inter max-w-lg !text-black font-bold tb:text-center sm:text-3xl'>Welcome to the <br /><span className='text-white'>Future </span> of trading</Heading>
                        <Typography classstyle='inter my-5 max-w-lg !text-black tb:text-center sm:px-6'>Step into a world where artificial intelligence transforms trading into a stress-free,
                            highly efficient, and precision-driven journey to profitability.</Typography>
                        <Button variant='gradient' classstyle={"tb:max-w-[300px] tb:w-full yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow max-w-[130px] sm:max-w-[300px] sm:!px-0"} onClick={() => router.push("/register")}>Get Started</Button>
                    </div>
                </div>
                {/* TOKEN */}
                <div className="wavy_bg_line bg-[url('/wave_lines.svg')]">
                    <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
                        <Token />
                    </div>
                    {/* TESTIMONIAL */}
                    <div className="m-auto sm:!mx-0">
                        <div className="testimonial__section flex flex-col items-center sm:mt-[4.25rem] mt-[9.4375rem] w-full">
                            <Typography textsize="sm" classstyle="tracking-widest uppercase font-medium sm:text-sm">
                                See what people are saying about us
                            </Typography>
                            <Testimonial />
                        </div>
                    </div>
                    {/* FAQ */}
                    <div className="max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
                        <FAQ />
                    </div>
                </div>
                {/* <div className="h-screen"></div> */}
            </div>
            <Footer />
            <Modal
                title={""}
                width="720px"

                isOpen={showModal}
                onChnage={(e: any) =>
                    setShowModal((prev) => {
                        return !prev
                    })
                }
            >
                <div className="modal-content">
                    <div className="video-container">
                        <iframe width="670" height="405" className='sm:!w-full' src="https://www.youtube.com/embed/j2iyFk38IiE?si=bdQyw6J34tMWgDck" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default NewIndex
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import Logo from "../public/logo.png";
import Image from 'next/image';
import { Button, Heading, LogoRingIcon, RegisterCornerIcon, SignUpIcon, Typography, maskWalletAddress } from 'ui';
import useUserStore from '../lib/hooks/useUserStore';
import useEthereum from '../lib/hooks/useEthereum';
import { useRouter } from 'next/router';
import { error } from '../components/alert/Toast';
import { axiosApi } from '../lib/axiosApi';
import { AxiosError } from 'axios';
import { Stepper, Step, StepLabel, Box, styled, StepConnector, stepConnectorClasses } from '@mui/material';

import { FiUser } from 'react-icons/fi';
import { MdAlternateEmail } from 'react-icons/md';
import ProcessInfo from '../components/Auth/ProcessInfo';
import { FirstForm, LastForm } from '../components/Auth/FirstForm';
import { AuthTestimonialCard, TestimonialBody } from '../components/Home/Testimonial';
import Head from 'next/head';
import { SwiperSlide } from 'swiper/react';
import { RegisterProps } from './auth/register';
import exchangeServices from '../services/exchangeService';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { validateEmailAddress } from '../utils/emailValidate';
import authService from '../services/authService';

import { loginUser as userLogin } from '../utils/loginUser';

import { useMediaQuery } from '@react-hook/media-query';
import testimonialService from '../services/testimonialService';
import { Result } from '../types/testimonial';
import Loader from '../components/Loader';

type Props = {}

const Register = (props: Props) => {
    const { testimonials } = useSelector((state: RootState) => state.testimonial)
    const [currentStep, setCurrentStep] = useState(0);
    const { user, setUser } = useUserStore((state) => state);
    const router = useRouter()
    const { connectWallet, loading, mobileConnectWallet, connectedAccount } = useEthereum()
    const { isSuccessfulLogin, isLoading: authLoading } = useSelector((state: RootState) => state.auth)
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch<AppDispatch>()
    const isMobile = useMediaQuery("(max-width: 600px)");

    const [regDetails, setRegDetails] = useState<RegisterProps>({
        wallet_address: "",
        username: "",
        email: "",
        exchange: { id: 0, name: "" },
        apiKey: "",
        apiSecret: "",
        referral: "",
        password: "",
        date: 0,
    });

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRegDetails((prev) => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };


    useEffect(() => {
        if (connectedAccount) return
        connectWallet(true).then((res) => {
            setRegDetails((prev) => ({
                ...prev,
                wallet_address: res?.walletAddress ?? connectedAccount ?? ""
            }))
            // }
        })
    }, [])

    useEffect(() => {
        dispatch(exchangeServices.getExchanges())
        if (testimonials.results?.length === 0) {
            dispatch(testimonialService.getTestimonial())
        }

    }, [])

    //     useEffect(() => {
//         if (!router.isReady) return;
//         if (isSuccessfulLogin) {
//             const redirect = router.query.redirect as string;
//             if (redirect) {
//                 router.push(redirect);
//             } else {
//                 router.push("/dashboard");
//             }
//         }
//     }, [isSuccessfulLogin, router.isReady])

    const registerUser = async () => {
        const { username, email, wallet_address } = regDetails;

        if (!wallet_address && connectedAccount !== null) {
            return error("Connect your wallet")
        }

        if (!email || !username) {
            return error("Fill in required details")
        }

        const walletDetails = await connectWallet()

        regDetails.date = Date.now()
        regDetails.password = walletDetails?.signMessage!
        regDetails.referral = router.query.referral as string ?? ""

        if (!regDetails.wallet_address) {
            regDetails.wallet_address = connectedAccount as string
        }




        await dispatch(authService.registerUser({
            data: regDetails, onSucess: (value) => {
                userLogin({
                    wallet: wallet_address, signerPassword: walletDetails?.signMessage!, setIsLoading, onSuccess: (value, type) => {
                        if (type === "success") {
                            setUser(value)
                            const redirect = router.query.redirect as string || localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');
                            if (redirect) {
                                localStorage.removeItem('authRedirect');
                                sessionStorage.removeItem('authRedirect');
                                router.push(redirect);
                            } else {
                                router.push("/dashboard")
                            }
                        } else {
                            setRegDetails((prev) => ({
                                ...prev,
                                wallet_address, password: walletDetails?.signMessage!
                            }))
                        }
                    }
                });
            },
        }))


    };



    const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
        // [`&.${stepConnectorClasses.alternativeLabel}`]: {
        //     top: 22,
        // },
        [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundColor:
                    '#27ecb0',
            },
        },
        [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundColor:
                    '#27ecb0',
            },
        },
        [`& .${stepConnectorClasses.line}`]: {
            height: 3,
            border: 0,
            backgroundColor:
                theme.palette.mode === 'dark' ? "#27ecb0" : '#eaeaf0',
            borderRadius: 1,
        },
    }));



    const loginUser = async (wallet: string, signer: string) => {
        setIsLoading(true);
        try {
            // Make a POST request to the server for user login
            const { data } = await axiosApi.post("/user/login/", {
                wallet_address: wallet,
                password: signer
            }, { withCredentials: true });
            if (data.status === "success") {

                const { data: userData } = await axiosApi.get("/user/profile/", {
                    headers: {
                        Authorization: `Bearer ${data.access_token}`
                    },
                    withCredentials: true
                })



                setUser({
                    ...userData,
                    access_token: data.access_token
                });

                const redirect = router.query.redirect as string || localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');
                if (redirect) {
                    localStorage.removeItem('authRedirect');
                    sessionStorage.removeItem('authRedirect');
                    router.push(redirect);
                } else {
                    router.push("/dashboard")
                }
            }
        } catch (err: any) {
            // If there was an error during the login process, it will be caught here
            const e = err as AxiosError;
            const message =
                (e.response &&
                    e.response.data &&
                    (e.response?.data as any).message) ||
                e.message ||
                e.toString();
            error(message);
            // Removed router.push("/register") to avoid stripping query parameters
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Head>
                <title>Create account - Candleweb</title>
                <meta name="description" content="Register and join the candleweb community to start trading" />
                <meta name="keywords" content="" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            {(isLoading || authLoading) && <Loader />}
            <div className='relative'>
                <div className="corner__image absolute -bottom-7 right-0 z-[-1]">
                    <Image src={RegisterCornerIcon} alt='Corner Image' className='tb:w-[200px] tb:h-[200px] sm:w-[170px] sm:h-[170px]' />
                </div>

                <div>
                    {/* Header */}
                    <div className="flex items-center justify-between px-10 py-5 sm:flex sm:justify-center sm:pt-7">
                        {/* LOGO */}
                        <div className="">
                            <Link href="/">
                                <div className="nav__logo">
                                    {(currentStep === 0 || isMobile) && <Image
                                        src={Logo}
                                        alt="Home Logo"
                                        className="max-w-[150px] md:max-w-[170px]"
                                    />}
                                </div>
                            </Link>
                        </div>
                        {/* LOGIN */}
                        <div className="flex items-center gap-5 sm:hidden">
                            <Typography classstyle='text-sm'>Already have an account? </Typography>
                            <Button
                                size="sm"
                                // icon={<MdRocketLaunch />}
                                iconright
                                variant="border"
                                classstyle="!px-7 !border-primary"
                                onClick={async () => {

                                    if (Object.values(user).length > 0) {
                                        const redirect = router.query.redirect as string || localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');
                                        if (redirect) {
                                            localStorage.removeItem('authRedirect');
                                            sessionStorage.removeItem('authRedirect');
                                            router.push(redirect);
                                        } else {
                                            router.push("/dashboard");
                                        }
                                        return;
                                    }

                                    try {
                                        const res = await connectWallet();

                                        if (res === null) {

                                            return
                                        }

                                        await loginUser(res.walletAddress, res.signMessage);
                                    } catch (err: any) {
                                        error(err)
                                    }

                                }}
                            >
                                Login
                            </Button>
                        </div>
                    </div>
                    {/* BODY */}
                    <div className="flex items-center gap-10 px-10 py-14 justify-around tb:flex-col sm:gap-5 sm:pb-9 sm:pt-0 sm:px-5 z-10">
                        {/* LEFT INFORMATION */}
                        <div className="w-1/2 tb:w-full relative">
                            {/* WELCOME INFO */}
                            {currentStep === 0 && <div className="flex flex-col items-center sm:mt-14">
                                <Heading textsize='2xl' classstyle='inter max-w-lg !text-white font-bold tb:text-center'>Welcome to the <br /><span className='text-primary'>Future </span> of trading</Heading>
                                <Image src={SignUpIcon} alt='Signup Image' className='mt-6 max-h-[514px] sm:hidden' />
                            </div>}
                            {/* TESTIMONIAL */}
                            {currentStep !== 0 && <Image src={LogoRingIcon} alt='Logo Ring' className='-ml-20 sm:hidden absolute -top-20 left-28' />}
                            {(currentStep === 1 || currentStep === 2) && <div className='w-full'><TestimonialBody perview={1}>
                                {testimonials.results?.map((testimonial: Result, index: number) => (
                                    <SwiperSlide><AuthTestimonialCard key={index} testimonial={testimonial} /></SwiperSlide>
                                ))}
                                {/* <SwiperSlide><AuthTestimonialCard /></SwiperSlide>
                                <SwiperSlide><AuthTestimonialCard /></SwiperSlide>
                                <SwiperSlide><AuthTestimonialCard /></SwiperSlide>
                                <SwiperSlide><AuthTestimonialCard /></SwiperSlide>
                                <SwiperSlide><AuthTestimonialCard /></SwiperSlide> */}
                            </TestimonialBody></div>}
                        </div>
                        {/* RIGHT FORM */}
                        <div className="w-1/2 tb:w-full">
                            {/* SIGN UP INFO */}
                            {currentStep === 0 && <ProcessInfo onSignUpClick={() => setCurrentStep(1)} />}
                            {/* STEP 1 REGISTRATION */}
                            {currentStep === 1 && <FirstForm connectedAccount={connectedAccount ?? ""} regDetails={regDetails} onInputChange={onInputChange} onNextClick={(to) => {
                                if (to === "forward") {
                                    if (!regDetails.username || !regDetails.email) {
                                        error("Please enter your username and email address")
                                        return
                                    }
                                    if (!validateEmailAddress(regDetails.email)) {
                                        error("Invalid email address")
                                        return
                                    }
                                    setCurrentStep(2);
                                    return;
                                }
                                setCurrentStep(0)
                            }} />}
                            {/* STEP 2 REGISTRATION */}
                            {currentStep === 2 && <LastForm regDetails={regDetails} onInputChange={onInputChange} onNextClick={(to) => {
                                if (to === "forward") {
                                    registerUser();
                                    return;
                                }
                                setCurrentStep(1);
                            }} />}
                        </div>
                    </div>

                </div>
            </div>
        </>)
}

export default Register
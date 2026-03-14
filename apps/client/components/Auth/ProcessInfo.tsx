import React from 'react'
import { Button, GoogleIcon, Heading, SignupIcon1, SignupIcon2, SignupIcon3, SvgIcons, Typography } from 'ui'
import InfoCard from './InfoCard'
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import authService from '../../services/authService';
import { uri } from '../../lib/axiosApi';

type Props = {
    onSignUpClick: any;
}

const ProcessInfo = (props: Props) => {
    const router = useRouter();
    const { isSuccessfulLogin, isLoading: authLoading } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<AppDispatch>()
    return (
        <div className="">
            <Heading textsize='lg' classstyle='max-w-lg mb-3 inter font-medium tb:max-w-none sm:text-lg sm:text-center'>
                Sign up process is easy, here is a quick run down
            </Heading>
            <Typography textsize='sm' classstyle='inter font-normal sm:text-xs sm:text-[#D9D9D9] sm:text-center'>
                Simple steps to start trading with CandleAI and unlock your crypto potential.
            </Typography>

            {/* Google sign-in — shown first so mobile users see it immediately */}
            <div className="max-w-[544px] tb:max-w-none mt-6">
                <Button icon={SvgIcons.google} classstyle={"!bg-white hover:!bg-white !border-white !font-bold !px-0"} fullwidth onClick={() => {
                    // Save redirect to local storage for google auth callback
                    const redirect = router.query.redirect as string;
                    if (redirect) {
                        localStorage.setItem('authRedirect', redirect);
                    }
                    router.push(`${uri}user/google/login/`)
                }}>Continue with google</Button>
            </div>

            <div className="relative my-8 max-w-[544px] tb:max-w-none">
                <hr className='border-gray-600' />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full bg-background">
                    <Typography>or</Typography>
                </div>
            </div>

            <div className="flex flex-col gap-5 mb-4">
                <InfoCard icon={SignupIcon1} title='Choose your username and add an email' desc='Craft a memorable username and add your email address to establish your identity within the trading platform.' />
                <InfoCard icon={SignupIcon2} title='Select the  exchange to run candle AI' desc='Choose the exchange or market where you&apos;ll be running the candle AI. This step is crucial for effective trading.' />
                <InfoCard icon={SignupIcon3} title='Connect to meta mask and start trading' desc='Link your MetaMask wallet to start your trading journey. MetaMask ensures secure transactions and access to decentralised applications.' />
            </div>
            <div className="flex items-center justify-between max-w-[544px] tb:max-w-none">
                <Button variant='border' classstyle='border-primary !py-3' onClick={() => router.back()}>Go Back</Button>
                <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow"} onClick={props.onSignUpClick}>Signup</Button>
            </div>
        </div>
    )
}

export default ProcessInfo
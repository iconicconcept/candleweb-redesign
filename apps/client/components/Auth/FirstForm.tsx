import { Box, Step, StepLabel, Stepper } from '@mui/material'
import React, { useState } from 'react'
import { FiUser } from 'react-icons/fi'
import { Button, Heading, RoundedSelectDropdown, RoundedTextInput, SvgIcons, Typography, maskWalletAddress } from 'ui'
import useEthereum from '../../lib/hooks/useEthereum'


import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { ExchangeProp } from '../../types/exchange'
import useUserStore from '../../lib/hooks/useUserStore'
import { useRouter } from 'next/router'
import { error } from '../alert/Toast'
import { AxiosError } from 'axios'
import { axiosApi, uri } from '../../lib/axiosApi'
import { RegisterProps } from '../../pages/auth/register'
import { HiOutlineMail } from 'react-icons/hi'
import Link from 'next/link'




type Props = {
    regDetails: RegisterProps,
    onNextClick: (to: "forward" | "back") => void,
    onInputChange: any;
    connectedAccount?: string | undefined;
}

export const FirstForm = ({ regDetails, onInputChange, onNextClick, connectedAccount }: Props) => {
    const { connectWallet } = useEthereum()
    const [currentStep, setCurrentStep] = useState(0);
    const { user, setUser } = useUserStore((state) => state);
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);

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

                router.push("/dashboard")
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
            router.push("/register");
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div className="w-full tb:flex tb:items-center tb:justify-center">
                <div className="flex flex-col items-center w-full border border-[#414141] rounded-[36px] p-10 max-w-[544px] sm:px-5 sm:py-8">
                    <Heading textsize='xl' classstyle='inter font-medium mb-2 sm:text-xl' align='center'>
                        Create an account
                    </Heading>
                    <Typography classstyle='text-xs inter'>
                        Enter your preferred login credentials
                    </Typography>
                    <div className="step_indicator my-6 w-full">
                        <Box sx={{ width: '100%' }}>
                            <Stepper activeStep={1} alternativeLabel

                                sx={{
                                    "& .MuiStepConnector-line": {
                                        borderTopWidth: "2px",
                                    },
                                    "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
                                        borderColor: "#ffb322", // Ensure the active line is red

                                    },
                                    "& .MuiStepIcon-root.Mui-completed": {
                                        color: "#ffb322", // Ensure the completed line is red
                                    },
                                    "& .MuiStepIcon-root.Mui-active": {
                                        color: "#ffffff"
                                    },
                                    "& .MuiStepIcon-root": {
                                        color: "#ffffff"
                                    },
                                    "& .MuiStepIcon-text": {
                                        fill: "#000000",
                                        color: "#ffffff"
                                    },
                                    "& .MuiStepLabel-label": {
                                        color: "#ffffff !important",
                                        fill: "#ffffff !important",
                                        fontWeight: 200,
                                        marginTop: "10px",
                                    },
                                }}
                            >

                                <Step>
                                    <StepLabel>Info</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Platform</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Connect</StepLabel>
                                </Step>

                            </Stepper>
                        </Box>
                    </div>
                    <div className="wallet_address border border-primary rounded-full px-5 py-2 w-fit bg-[#D9D9D9]/[0.14]">
                        {connectedAccount !== null ? maskWalletAddress(connectedAccount!) : regDetails.wallet_address.length > 6 ? maskWalletAddress(regDetails.wallet_address) : "No connected wallet..."}
                    </div>
                    <div className="input_form w-full">
                        <RoundedTextInput
                            type="username"
                            name="username"
                            label="Username"
                            tooltip={false}
                            value={regDetails.username}
                            placeholder='Choose a username'
                            Icon={<FiUser />}
                            onChange={onInputChange}
                        />
                        <RoundedTextInput
                            type="email"
                            name="email"
                            label="Email"
                            placeholder='Enter your email address'
                            value={regDetails.email}
                            Icon={<HiOutlineMail />}
                            onChange={onInputChange}
                        />
                        <Button variant='gradient' onClick={() => onNextClick("forward")} fullwidth classstyle={"tb:w-full yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow tb:!px-0"}>Next</Button>
                        <div className="h-3"></div>
                        <Button variant='transparent' onClick={() => onNextClick("back")} fullwidth classstyle={""}>Back</Button>
                        <div className="relative my-8 max-w-[544px] tb:max-w-none">
                            <hr className='border-gray-600' />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full bg-background">
                                <Typography>or</Typography>
                            </div>
                        </div>
                        <div className="max-w-[544px] tb:max-w-none">

                            <Button icon={SvgIcons.google} classstyle={"!bg-white hover:!bg-white !border-white !font-bold !px-0"} fullwidth onClick={() => {
                                //TODO: Always check
                                router.push(`${uri}user/google/login/`)
                            }}>Continue with google</Button>
                        </div>
                    </div>
                </div>


            </div>
            <div className="sm:flex hidden items-center justify-center w-full mt-5">
                <Typography classstyle='text-sm'>Already have an account? </Typography>
                <Button
                    size="sm"
                    iconright
                    variant="transparent"
                    classstyle="!px-4 !text-primary"
                    onClick={async () => {

                        if (Object.values(user).length > 0) {
                            router.push("/dashboard")
                            return;
                        }

                        try {
                            const res = await connectWallet();

                            if (res === null) {
                                // error("Please connect your metamask");
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
        </>

    )
}



export const LastForm = ({ regDetails, onInputChange, onNextClick }: Props) => {
    // const { connection } = useConnection();
    // const { publicKey, sendTransaction } = useWallet();
    const { connectedAccount, connectWallet } = useEthereum()
    const [currentStep, setCurrentStep] = useState(0);
    const { user, setUser } = useUserStore((state) => state);
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);
    const { exchanges } = useSelector((state: RootState) => state.exchange)
    const [selectedExchangeName, setSelectedExchangeName] = useState<string>("")

    const isKucoin = selectedExchangeName.toLowerCase() === "kucoin"

    const handleNextClick = (direction: "forward" | "back") => {
        if (direction === "forward" && isKucoin && !regDetails.apiPassphrase) {
            return error("API Passphrase is required for Kucoin")
        }
        onNextClick(direction)
    }

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

                router.push("/dashboard")
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
            router.push("/register");
        }
        finally {
            setIsLoading(false);
        }
    }



    return (
        <>
            <div className="w-full tb:flex tb:items-center tb:justify-center">
                <div className="flex flex-col items-center w-full border border-[#414141] rounded-[36px] p-10 max-w-[544px] sm:px-5 sm:py-8">
                    <Heading textsize='xl' classstyle='inter font-medium mb-2 sm:text-xl' align='center'>
                        Choose your trade platform
                    </Heading>
                    <Typography classstyle='text-xs inter'>
                        Body secondary text
                    </Typography>
                    <div className="step_indicator my-6 w-full">
                        <Box sx={{ width: '100%' }}>
                            <Stepper activeStep={2} alternativeLabel

                                sx={{
                                    "& .MuiStepConnector-line": {
                                        borderTopWidth: "2px",
                                    },
                                    "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
                                        borderColor: "#ffb322", // Ensure the active line is red
                                    },
                                    "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                                        borderColor: "#ffb322", // Ensure the active line is red
                                    },
                                    "& .MuiStepIcon-root.Mui-completed": {
                                        color: "#ffb322", // Ensure the completed line is red
                                    },
                                    "& .MuiStepIcon-root.Mui-active": {
                                        color: "#ffb322"
                                    },
                                    "& .MuiStepIcon-root": {
                                        color: "#ffffff"
                                    },
                                    "& .MuiStepIcon-text": {
                                        fill: "#000000",
                                        color: "#ffffff"
                                    },
                                    "& .MuiStepLabel-label": {
                                        color: "white",
                                        fontWeight: 200,
                                        marginTop: "10px",
                                    },
                                }}
                            >

                                <Step>
                                    <StepLabel>Info</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Platform</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Connect</StepLabel>
                                </Step>

                            </Stepper>
                        </Box>
                    </div>
                    <div className="input_form w-full mt-5 flex flex-col items-center">

                        <RoundedSelectDropdown
                            title="Select your preferred trading platform"
                            icon={SvgIcons.exchange}
                            lists={exchanges.map((el: any, i: any) => (
                                el.name
                            ))}
                            onValueChange={(value: string) => {
                                const selectedCur: ExchangeProp = exchanges.filter((cur) => cur.name === value)[0];
                                setSelectedExchangeName(value)
                                // setRegDetails((prev) => ({
                                //   ...prev,
                                //   exchange: selectedCur
                                // }))
                            }}
                        />
                        <div className="h-5"></div>
                        <RoundedTextInput
                            type="text"
                            name="apiKey"
                            label="API Key"
                            isOptional
                            value={regDetails.apiKey}
                            Icon={SvgIcons.apiKey}
                            onChange={onInputChange}
                            placeholder='Enter API key'
                            tooltipText="This is the API key that you have generated from the Exchange you selected. We recommend your turn-off withdrawal via keys."
                        />

                        <RoundedTextInput
                            type="text"
                            name="apiSecret"
                            label="API Secret"
                            isOptional
                            value={regDetails.apiSecret}
                            Icon={SvgIcons.apiSecret}
                            onChange={onInputChange}
                            placeholder='Enter API secret'
                            tooltipText="Here you are to provide the API secret generated alongside the API Key."
                        />
                        {isKucoin && (
                            <RoundedTextInput
                                type="text"
                                name="apiPassphrase"
                                label="API Passphrase"
                                isOptional
                                value={regDetails.apiPassphrase ?? ""}
                                Icon={SvgIcons.apiKey}
                                onChange={onInputChange}
                                placeholder='Enter API passphrase'
                                tooltipText="This is the API passphrase required for Kucoin exchange."
                            />
                        )}
                        <div className="terms_and_conditions py-3 flex flex-col items-start w-full pl-5">
                            <Typography textsize='xs'>By clicking begin connection you accept Candle web <Link href={"/privacy"} target='_blank' className='underline'>privacy policy</Link></Typography>
                            <div className="flex items-center gap-3 my-3">
                                <input id="default-checkbox" type="checkbox" value="" className="appearance-none w-4 h-4  bg-card border-2 border-gray-300 rounded checked:bg-primary checked:border-0 cursor-pointer" />
                                <Typography textsize='xs'>Subscribe to our newsletter and get all the latest updates</Typography>
                            </div>
                        </div>
                        <Button variant='gradient' onClick={() => handleNextClick("forward")} fullwidth classstyle={"tb:w-full yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow tb:!px-0"}>Begin Connection</Button>
                        <div className="h-3"></div>
                        <Button variant='transparent' onClick={() => handleNextClick("back")} fullwidth classstyle={""}>Back</Button>
                    </div>

                </div>

            </div>
            <div className="sm:flex hidden items-center justify-center w-full mt-5">
                <Typography classstyle='text-sm'>Already have an account? </Typography>
                <Button
                    size="sm"
                    iconright
                    variant="transparent"
                    classstyle="!px-4 !text-primary"
                    onClick={async () => {

                        if (Object.values(user).length > 0) {
                            router.push("/dashboard")
                            return;
                        }

                        try {
                            const res = await connectWallet();

                            if (res === null) {
                                error("Please connect your metamask");
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
        </>
    )
}
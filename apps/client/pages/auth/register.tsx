import React, { useEffect, useState } from "react";
import { FiUser } from "react-icons/fi";
import { BsShieldLock } from "react-icons/bs";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { MdAlternateEmail, MdContentCopy, MdLockClock } from "react-icons/md";
import { TextInput, Button, SelectDropdown, Heading, Typography, Modal, REFERIMAGE, maskWalletAddress } from "ui";
import Image from "next/image";
import Head from "next/head";
import { error } from "../../components/alert/Toast";
import Loader from "../../components/Loader";
import { validateEmailAddress } from "../../utils/emailValidate";
import { useRouter } from "next/router";
import { copyToClipboard } from "../../utils/copyToClipboard";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import authService from "../../services/authService";
import { useMediaQuery } from "@react-hook/media-query";
// import exchangeServices from "../../services/exchangeService";
import { ExchangeProp } from "../../types/exchange";
import useEthereum from "../../lib/hooks/useEthereum";
import { loginUser } from "../../utils/loginUser";
import useUserStore from "../../lib/hooks/useUserStore";



export interface RegisterProps {
  wallet_address: string;
  username: string;
  email: string;
  exchange: ExchangeProp;
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string;
  date: number;
  referral?: string;
  password: string;
}

const Register = () => {
  const router = useRouter();
  const [regStep, setRegStep] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [openHelpModal, setOpenHelpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>()
  const { isSuccessfulLogin, isLoading: authLoading } = useSelector((state: RootState) => state.auth)
  const { setUser } = useUserStore((state) => state);
  const [regDetails, setRegDetails] = useState<RegisterProps>({
    wallet_address: "",
    username: "",
    email: "",
    exchange: { id: 0, name: "" },
    apiKey: "",
    apiSecret: "",
    apiPassphrase: "",
    referral: "",
    password: "",
    date: 0,
  });

  useEffect(() => {
    // Redirect to /register and optionally add referral parameter
    // const referralParam = router.query.referral;
    if (router.isReady) {
      router.push("/register", { query: { referral: router.query.referral as string ?? "" } });
    }
  }, [router.isReady]);


  const isMobile = useMediaQuery("only screen and (max-width: 768px)");
  const { exchanges } = useSelector((state: RootState) => state.exchange)
  const { connectWallet, loading, mobileConnectWallet, connectedAccount } = useEthereum()


  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRegDetails((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  // useEffect(() => {
  //   connectWallet(true).then((res) => {
  //     setRegDetails((prev) => ({
  //       ...prev,
  //       wallet_address: res?.walletAddress ?? connectedAccount ?? ""
  //     }))
  //     // }
  //   })
  // }, [])

  // useEffect(() => {
  //   dispatch(exchangeServices.getExchanges())
  // }, [])

  // useEffect(() => {
  //   if (isSuccessfulLogin) {
  //     router.push("/dashboard")
  //   }
  // }, [isSuccessfulLogin])


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
        loginUser({
          wallet: wallet_address, signerPassword: walletDetails?.signMessage!, setIsLoading, onSuccess: (value, type) => {
            if (type === "success") {
              setUser(value)
              const redirect = router.query.redirect as string;
              if (redirect) {
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

  const nextStep = () => {
    const { wallet_address: address } = regDetails;
    if (regStep == 1) {

      if (!address && !connectedAccount) {
        error("Connect your wallet");
        if (isMobile) {
          setOpenHelpModal(true);
        }
        return
      }

      if (!regDetails.username || !regDetails.email) {
        error("Fill in required details");
        return
      }

      if (!validateEmailAddress(regDetails.email)) {
        error("Invalid email address")
        return
      }
      setRegStep((prev) => prev + 1);
    }
  };


  return (
    <>
      <Head>
        <title>Create account - Candleweb</title>
        <meta name="description" content="Register and join the candleweb community to start trading" />
        <meta name="keywords" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {<Loader />}
      <div className="login__container mt-16 md:mt-20">
        <div className="login__content flex justify-center h-[calc(100vh_-_100px)]">
          <div className="form__container w-full max-w-[400px] mx-5 md:mx-0 flex flex-col justify-center">
            <form className="bg-card rounded-lg p-5 w-full min-h-[453px]">
              {/* <img src={Signin} alt="" className="w-[61px] h-[61px]" /> */}
              <p className="text-xl font-medium mt-3 mb-5 text-center">
                Create Account
              </p>
              <div className="register__steps flex items-center justify-center py-3 gap-4">
                <div
                  className={`register__step--1 cursor-pointer border-[3px] w-10 ${regStep == 1 ? "border-primary" : "border-gray-400"
                    }`}
                  onClick={() => setRegStep(1)}
                ></div>
                <div
                  className={`register__step--2 cursor-pointer border-[3px] w-10 ${regStep == 2 ? "border-primary" : "border-gray-400"
                    }`}
                  onClick={() => nextStep()}
                ></div>
              </div>
              <div className="form__inputs">
                <div
                  className={`form__step--1 min-h-[191px] my-5 ${regStep != 1 ? "hidden" : "block"
                    }`}
                >
                  <TextInput
                    type="address"
                    name="address"
                    label={connectedAccount !== null ? maskWalletAddress(connectedAccount) : regDetails.wallet_address.length > 6 ? maskWalletAddress(regDetails.wallet_address) : "No connected wallet..."}
                    value={""}
                    disabled={true}
                    Icon={<HiOutlineCurrencyDollar />}
                    onChange={onInputChange}
                  />
                  <TextInput
                    type="username"
                    name="username"
                    label="Username"
                    value={regDetails.username}
                    Icon={<FiUser />}
                    onChange={onInputChange}
                  />
                  <TextInput
                    type="email"
                    name="email"
                    label="Email"
                    value={regDetails.email}
                    Icon={<MdAlternateEmail />}
                    onChange={onInputChange}
                  />
                </div>
                <div
                  className={`form__step--2 min-h-[191px] my-5 ${regStep != 2 ? "hidden" : "block"
                    }`}
                >
                  <div className="pt-4">
                    <SelectDropdown
                      title="Exchange"
                      lists={exchanges.map((el: any, i: any) => (
                        el.name
                      ))}
                      onValueChange={(value: string) => {
                        const selectedCur: ExchangeProp = exchanges.filter((cur) => cur.name === value)[0];
                        setRegDetails((prev) => ({
                          ...prev,
                          exchange: selectedCur
                        }))
                      }}
                    />
                  </div>
                  <TextInput
                    type="text"
                    name="apiKey"
                    label="API Key"
                    isOptional
                    value={regDetails.apiKey}
                    Icon={<BsShieldLock />}
                    onChange={onInputChange}
                    tooltip
                    tooltipText="This is the API key that you have generated from the Exchange you selected. We recommend your turn-off withdrawal via keys."
                  />
                  <TextInput
                    type="text"
                    name="apiSecret"
                    label="API Secret"
                    isOptional
                    value={regDetails.apiSecret}
                    Icon={<MdLockClock />}
                    onChange={onInputChange}
                    tooltip
                    tooltipText="Here you are to provide the API secret generated alongside the API Key."
                  />
                </div>



                <Modal isOpen={openModal} onChnage={(e) => setOpenModal(e)} title={"Referral"} >
                  <div className="copy mb-3 w-full flex flex-col items-center">
                    <div className="copy__image mb-3">
                      <Image src={REFERIMAGE} alt="referral image" className="max-w-[200px] w-full h-full object-contain" />
                    </div>
                    <Heading textsize="xs" boldness="light" classstyle="text-center !text-sm text-gray-300 mb-2 max-w-[300px]">Get rewarded for spreading the word! Copy your referral URL and refer friends now!</Heading>
                    <div className="cursor-pointer mb-4 flex items-center gap-1" onClick={() => copyToClipboard(`CandleAI is the ultimate AI cryptocurrency trading bot! Experience 100% automation, proper risk management and maximized profits. \nSign up and refer your friends and earn up to NGN13,500 once they subscribe. \nJoin the waitlist now: https://candleweb.io/register?referral=${regDetails.username}`)}>
                      <Typography classstyle="text-[var(--secondary)] !text-sm">
                        https://candleweb.io/register?referral={regDetails.username}
                      </Typography>
                      <MdContentCopy /></div>
                    <Button onClick={() => router.push("/dashboard")}>Continue to Dashboard</Button>
                  </div>
                </Modal>



                {regStep != 2 && (
                  <Button onClick={nextStep} fullwidth={true} className="mt-4">
                    Next
                  </Button>
                )}
                {regStep == 2 && (
                  <Button
                    onClick={registerUser}
                    fullwidth={true}
                    className="mt-4"
                  >
                    Finish
                  </Button>
                )}

                <p
                  className="text-center text-sm mt-4 cursor-pointer hover:text-primary duration-700"
                  onClick={() => connectWallet().then((res) => {
                    if (res !== null) {
                      loginUser({
                        wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                          if (type === "success") {
                            setUser(value)
                            const redirect = router.query.redirect as string;
                            if (redirect) {
                              router.push(redirect);
                            } else {
                              router.push("/dashboard")
                            }
                          } else {
                            setRegDetails((prev) => ({
                              ...prev,
                              wallet_address: res.walletAddress, password: res.signMessage
                            }))
                          }
                        }
                      });
                    }
                  })}
                >
                  Log in
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal isOpen={openHelpModal} onChnage={(e) => setOpenHelpModal(e)} title={"How to signup for waitlist - Mobile"} >
        <div className="">

          <div className="divider my-4"></div>
          <Heading textsize={"sm"} boldness="light" color="gray">1. INSTALL AND CREATE A METAMASK WALLET.</Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Install MetaMask from Google Playstore and open it. Select GET STARTED and CREATE A NEW WALLET. </Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">2. CREATE A PASSWORD AND BACKUP YOUR SEED PHRASE:</Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Choose a strong and secure password, them copy and securely backup the 12 words seed phrase generated by MetaMask. Save this seed phrase in secure places.</Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">3. CONFIRM YOUR SEED PHRASE AND SECURE YOUR WALLET.</Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Input your seed phrase in the correct order, then create a device password. </Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">4. OPEN THE BROWSER IN METAMASK AND PASTE THE REFERRAL/WAITLIST LINK.</Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Paste the referral link/waitlist link in the browser, and connect your wallet.</Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">5. CREATE A NEW CandleAI ACCOUNT. </Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Select a username and input your email address, then click on NEXT.</Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">6. SELECT AN EXCHANGE AND INPUT API KEYS.</Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">On the exchange option, select BINANCE, then skip API KEYS, this is optional for now.</Typography>
          <div className="divider my-5"></div>
          <Heading textsize={"sm"} boldness="light">7. COPY AND SHARE YOUR REFERRAL LINK. </Heading>
          <div className="divider my-1"></div>
          <Typography classstyle="ml-5 !font-light">Copy and share your referral link with your friends and family to earn some rewards.</Typography>
          <div className="divider my-5"></div>
          <Link href={"https://medium.com/@candleweb/how-to-create-a-metamask-wallet-50341174ba"} target="_blank"> <Button>Read more...</Button></Link>

        </div>
      </Modal>
    </>
  );
};

export default Register;

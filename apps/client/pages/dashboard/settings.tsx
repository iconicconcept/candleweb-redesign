import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Button, Heading, Modal, RoundedTextInput, SvgIcons, SwitchToggle, Typography, UNITINFOICON, maskString, maskWalletAddress } from "ui";
import InputEdit from "../../components/dashboard/inputEdit";
import GapTable from "../../components/dashboard/table/GapTable";
import Wrapper from "../../components/dashboard/wrapper";
import { SettingSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import AddExchange from "../../components/dashboard/modal/AddExchange";
import { exchangeColumn } from "../../components/dashboard/table/HeaderColumns";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import exchangeServices from "../../services/exchangeService";
import { getFirstAndLastLetter, getRandomColor } from "../../utils/constants";
import { success, warning } from "../../components/alert/Toast";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { ExchangeRecord } from "../../types/exchange";
import { maskEmailUsername } from "../../utils/emailValidate";
import userService from "../../services/userService";
import useEthereum from "../../lib/hooks/useEthereum";
import { useRouter } from "next/router";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import { setUserRecord, setUnsubscribedReferral, setSubscribedReferral } from "../../redux/slices/referralSlice";
import { setSubscription, setSubscriptionHistory, setCurrentPlan } from "../../redux/slices/subscriptionSlice";
import { setActiveTrade, setPortfolioTrade, setYearList, setYearAnalysis } from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import useUserStore from "../../lib/hooks/useUserStore";
import Image from "next/image";
import tradeService from "../../services/tradeService";
import subscriptionService from "../../services/subscriptionService";
import { BiWallet } from "react-icons/bi";
import { isValidEthereumAddress } from "../../utils/ethers";

type Props = {};

const Setting = (props: Props) => {
  const { isLoading, exchangeRecord } = useSelector((state: RootState) => state.exchange)
  const { isLoading: userLoading } = useSelector((state: RootState) => state.user)
  const { user, removeUser, setUser, } = useUserStore((state) => state)
  const dispatch = useDispatch<AppDispatch>()
  const axiosToken = useAxiosAuth()
  const { connectedAccount, connectWallet } = useEthereum()
  const [record, setRecord] = useState<ExchangeRecord[]>([])
  const [isLive, setIsLive] = useState<boolean>(false)
  const [deleteExchange, setDeleteExchange] = useState({
    delete: false,
    data: "",
  });
  const router = useRouter()
  const [updateInfo, setUpdateInfo] = useState<{

    wallet_address: string
    username: string
  }>({

    wallet_address: "",
    username: "",
  })

  const [showTable, setShowTable] = useState(true)
  const [deleteUser, setDeleteUser] = useState(false)


  useEffect(() => {
    if (!user.email) {
      dispatch(userService.getUser(axiosToken))
    }
  }, [user])


  useEffect(() => {
    dispatch(exchangeServices.getExchangeRecords(axiosToken))
    setUpdateInfo((e) => ({
      ...e,
      username: user.username!
    }))
  }, [])

  useEffect(() => {
    if (exchangeRecord.length > 0) {
      setRecord(exchangeRecord);
    }
  }, [exchangeRecord])

  useEffect(() => {
    setIsLive(user.is_live_mode!)
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateInfo({
      ...updateInfo,
      [e.target.name]: e.target.value
    })
  }


  return (
    <>
      <Head>
        <title>Settings Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Wrapper>
        {(isLoading || userLoading) && <SettingSkeletonLoader />}
        {(!isLoading && !userLoading) && <>
          <div className="sett__content bg-card pb-8 rounded-lg mb-4">
            <div className="sett__header">
              <div className="sett__cover h-20 md:h-32 bg-txt-primary w-full"></div>
              <div className="user relative flex items-center md:justify-between px-7 sm:px-3 sm:flex-col -translate-y-5 md:-translate-y-2">
                <div className="user__details w-full justify-start flex items-end gap-5 sm:gap-3 -translate-y-4">
                  <div className="user__image w-28 h-28 rounded-full border-[3px] border-card relative overflow-hidden flex items-center justify-center uppercase" style={{
                    backgroundColor: getRandomColor()
                  }}>
                    <Heading textsize="2xl">{getFirstAndLastLetter(user.username ?? "No user")}</Heading>

                  </div>
                  <div className="user__info mb-2">
                    <Heading
                      textsize="md"
                      classstyle="name text-xl inter sm:text-base"
                    >
                      {user.username ?? "No user"}
                    </Heading>

                    {/* For smaller devices */}
                    <Typography
                      classstyle="token inter text-txtSec text-[0.75rem] md:text-[0.9rem]"
                      color="gray"
                    >
                      {maskWalletAddress(user.wallet_address ?? connectedAccount!)}
                    </Typography>
                  </div>
                </div>
                <div className="tb:absolute tb:-top-10 tb:right-7 sm:!right-2 sm:!-top-7">
                  <Button
                    classstyle="!rounded-full !border-[#B0484B] sm:!px-3 sm:!py-2"
                    variant="border"
                    onClick={() => setDeleteUser(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
            <div className="editInput bg-[#282A30] p-3 sm:px-1 rounded-lg mx-2 md:mx-5 shadow-lg">
              <InputEdit
                label="Username"
                value={updateInfo.username}
                name="username"
                inputClassName="!mb-2"
                change={(e) => onInputChange(e)}
              />
              <InputEdit
                label="Email"
                value={maskEmailUsername(user.email!)}
                name="email"
                inputClassName="!mb-2"
                hideButton
                change={(e) => { }}
              />
            </div>
          </div>
          <div className="auto__stop my-6">
            <div className="stop mb-10">
              <div className="header flex items-center gap-4">
                {SvgIcons.auto_stop}{" "}
                <Heading textsize="xs" classstyle="sm:text-sm sm:text-txtGray">
                  AUTO STOP LOSS ADJUSTER
                </Heading>
              </div>
              <Typography textsize="sm" classstyle="py-3 sm:text-xs max-w-2xl" color="gray">
                When enabled, the Auto Stop-Loss Adjuster feature helps you automatically adjust your stop-loss based on your risk appetite, ensuring your losses are minimized at all time.
              </Typography>
              <div className="stop__btns flex items-center gap-8 sm:gap-5 mt-3">
                <Button classstyle="!rounded-full p-3 sm:py-2 sm:px-4 sm:text-sm" onClick={() => success("Already Enabled...")}>
                  ENABLE
                </Button>
                <Button
                  variant="border"
                  classstyle="!border-[rgba(252,88,120,1)] !rounded-full p-3 sm:py-2 sm:px-4"
                  onClick={() => warning("Due to proper risk management, you are not allowed to disable this")}
                >
                  DISABLE
                </Button>
              </div>
            </div>
            {/* AUTO PROFIT TAKING */}
            <div className="stop mb-10">
              <div className="header flex items-center gap-4">
                {SvgIcons.stop}{" "}
                <Heading textsize="xs" classstyle="sm:text-sm sm:text-txtGray">
                  AUTO PROFIT TAKING
                </Heading>
              </div>
              <Typography textsize="sm" classstyle="py-3 sm:text-xs max-w-2xl" color="gray">
                Although enabled by default for every user, when enabled, the Auto Take Profit feature always ensures that the profits you make trading with CandleAI is secured at all time, and not included to your trading Capital.
              </Typography>
              <div className="stop__btns flex items-center gap-8 sm:gap-5 mt-3">
                <Button classstyle="!rounded-full p-3 sm:py-2 sm:px-4 sm:text-sm" onClick={() => success("Auto Profit taking is enabled by default, you can disable it by creating a new trade and disabling reinvest.")}>
                  ENABLE
                </Button>
                <Button
                  variant="border"
                  classstyle="!border-[rgba(252,88,120,1)] !rounded-full p-3 sm:py-2 sm:px-4 sm:text-sm"
                  onClick={() => success("Already Enabled...")}
                >
                  DISABLE
                </Button>
              </div>
            </div>
            {/* UPDATE METAMASK */}

            {<div className="stop mt-5 mb-14">
              <div className="header flex items-center gap-4">
                <div className="w-4 h-4">

                  {SvgIcons.metamask}{" "}
                </div>
                <Heading textsize="xs" classstyle="sm:text-sm sm:text-txtGray">
                  UPDATE METAMASK WALLET
                </Heading>
              </div>
              <Typography textsize="xs" classstyle="pt-3 sm:text-xs !font-medium" color="white">
                Metamask Wallet Address
              </Typography>
              <div className="stop__btns flex items-center gap-8 sm:gap-5 mt-2">
                {/*  */}
                <div className="w-full max-w-[300px]">

                  <RoundedTextInput
                    type="wallet"
                    name="wallet_address"
                    label="wallet"
                    tooltip={false}
                    className="!my-0"
                    value={updateInfo.wallet_address}
                    placeholder='Connect a metamask wallet'
                    edit={false}
                    Icon={<BiWallet />}
                    onChange={(e) => onInputChange(e)}
                  />
                </div>
                {<Button classstyle="!rounded-full p-3 sm:py-2 sm:px-4 sm:text-sm !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow" onClick={async () => {
                  const res = await connectWallet();

                  if (res === null) {

                    return
                  }

                  dispatch(userService.updateWalletAddress({
                    wallet_address: res.walletAddress,
                    password: res.signMessage,
                    api: axiosToken,
                  })).then((value) => {
                    success("Wallet Info updated successfully");
                    setUser({ ...value.payload, access_token: user.access_token })
                  })
                }}>
                  CONNECT WALLET
                </Button>}
                {/* {updateInfo.wallet_address && <Button classstyle="!rounded-full p-3 sm:py-2 sm:px-4 sm:text-sm !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow" onClick={async () => {
                  dispatch(userService.updateUserDemo({
                    is_live: user.is_live_mode,
                    wallet_address: updateInfo.wallet_address,
                    api: axiosToken,
                  })).then((value) => {
                    setUser({ ...value.payload, access_token: user.access_token })
                  });
                  setUpdateInfo({ ...updateInfo, wallet_address: "" })
                }}>
                  Update Wallet
                </Button>} */}
              </div>
            </div>}
            {/* Live Switcher */}
            <div className="stop mb-10">
              <div className="header flex items-center gap-4">
                {SvgIcons.env_switcher}{" "}
                <Heading textsize="xs" classstyle="sm:text-sm sm:text-txtGray">
                  TRADING MODE
                </Heading>
              </div>
              <Typography textsize="sm" classstyle="py-3 sm:text-xs max-w-2xl" color="gray">
                The Trading mode allows you to switch between the DEMO and LIVE environment. The option you choose determines the type of trades you can create and the trade information you will see on your Portfolio and Trade pages.
              </Typography>
              <div className="stop__btns flex items-center gap-8 sm:gap-5 mt-3">

                <div className="switch__type flex items-center justify-center">
                  <Typography
                    classstyle={`inter font-medium mr-2 ${!isLive ? "!text-primary" : "!text-[#CCC6C6]"
                      }`}
                    textsize="xs"
                  >
                    DEMO
                  </Typography>
                  <SwitchToggle
                    name="live"
                    value="true"
                    width={35}
                    height={16}
                    diameter={23}
                    checked={isLive}
                    oncheckedchange={(vl) => {

                      dispatch(userService.updateUserDemo({
                        is_live: vl,
                        api: axiosToken,
                      })).then(async (dt) => {
                        setUser({ ...dt.payload, access_token: user.access_token })
                        await dispatch(exchangeServices.getExchangeRecords(axiosToken))
                        success("Switched successfully");
                        dispatch(setActiveTrade([]))
                        dispatch(setBalance(""))
                        dispatch(setPortfolioTrade({}))
                        dispatch(userService.getBalance(axiosToken))
                        dispatch(tradeService.getActiveTrade({
                          api: axiosToken,
                          interval: "6months"
                        }))
                        dispatch(tradeService.getTradePortfolio(axiosToken))
                        dispatch(tradeService.getTradePairList(axiosToken))
                        dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken))
                      });
                      setIsLive((prev) => !prev)

                    }}
                  />
                  <Typography
                    classstyle={`inter font-medium ml-2 ${isLive ? "!text-primary" : "!text-[#CCC6C6]"
                      }`}
                    textsize="xs"
                  >
                    LIVE
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 mt-24 w-full">
            <div className="add__trade flex flex-col mb-3">
              <Heading textsize="md">Exchanges</Heading>
              {/* <div className="h-3"></div> */}
              <div className="my-6 flex items-center p-4 gap-5 m-auto rounded-3xl border border-txt-yellow">
                <Image src={UNITINFOICON} alt="Unit Info Icon" className="" />
                <div className="">
                  <Heading textsize="sm" classstyle="!text-primary">Exchange Configuration IPs</Heading>
                  {/* <Heading textsize="md" classstyle="!text-primary" onClick={() => setReward()}>How CandleWeb subscriptions works</Heading> */}
                  <Typography textsize="sm" classstyle="!text-sm !font-normal">To ensure seamless integration with our AI Platform for automated trading, please configure your exchange to use this 3 distinct IP addresses. <span className="text_gradient font-bold">65.21.47.124, 107.155.122.236, 209.182.234.182</span>
                  </Typography>
                </div>
              </div>
              <div className="h-3"></div>
              <div className="trade__btns flex items-end justify-end gap-3 float-right">
                {/* {showTable && <Button classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C] sm:!px-2 sm:!py-1 sm:!rounded-2xl" onClick={() => setShowTable(false)}>
                  Hide trade
                </Button>} */}
                {!showTable && <Button classstyle="!rounded-full !py-2 !px-4 !bg-[#4F545C] !text-white !border-[#4F545C] sm:!px-2 sm:!py-1 sm:!rounded-2xl" onClick={() => setShowTable(true)}>
                  Show trade
                </Button>}
                <AddExchange btnText="Add Exchange" exchangeAdded={() => {
                  dispatch(exchangeServices.getExchangeRecords(axiosToken)).then((res) => {
                    setRecord(res.payload);
                  })
                }} />
              </div>
            </div>
            {record.length > 0 && showTable && <GapTable rowCheck columnCheck rows={record?.map((exch) => ({
              ...exch,
              API_KEY: maskString(exch.API_KEY!),
              API_SECRET: maskString(exch.API_SECRET!),
            }))!} cols={exchangeColumn(async (value, id) => {
              if (value === "deactivate") {
                setDeleteExchange({
                  delete: true,
                  data: id
                })
              }
            })} />}
            {record.length < 1 && <div className="flex items-center justify-center h-20 mt-5 rounded-lg bg-card w-full">
              <p className="text-txtSec text-sm">You haven&apos;t added any exchange record</p></div>}
          </div></>}
      </Wrapper>


      <Modal
        title={""}
        width="500px"
        isOpen={deleteExchange.delete}
        onChnage={(e) =>
          setDeleteExchange({
            delete: false,
            data: ""
          })
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">Delete Exchange</Heading>
          <Typography classstyle="text-center !text-txtSec !mt-5 mb-2">Are you sure you want to Delete this exchange?</Typography>
          <Typography classstyle="text-center !text-red-500 !mb-5">This action will delete all trade associated with this exchange.</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setDeleteExchange({
                delete: false,
                data: ""
              })
            }}>Cancel</Button>
            <Button onClick={() => {
              dispatch(exchangeServices.deleteExchange({
                api: axiosToken,
                id: deleteExchange.data
              })).then((res) => {
                setDeleteExchange({
                  delete: false,
                  data: ""
                })
                dispatch(exchangeServices.getExchangeRecords(axiosToken)).then((res) => {
                  setRecord(res.payload);
                })
                dispatch(userService.getBalance(axiosToken))
              })

            }}>Proceed</Button>
          </div>
        </div>
      </Modal>


      <Modal
        title={""}
        width="500px"
        isOpen={deleteUser}
        onChnage={(e) =>
          setDeleteUser(e)
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">Delete Account</Heading>
          <Typography classstyle="text-center !text-txtSec !mt-5 mb-2">Are you sure you want to Delete this account?</Typography>
          <Typography classstyle="text-center !text-red-500 !mb-5">You can&apos;t reverse this action.</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setDeleteUser(false)
            }}>Cancel</Button>
            <Button onClick={() => {
              dispatch(userService.deleteUser(axiosToken)).then((res) => {
                removeUser()
                dispatch(setSubscription([]))
                dispatch(setExchangeRecord([]))
                dispatch(setNotification({}))
                dispatch(setUserRecord({}))
                dispatch(setUnsubscribedReferral({}))
                dispatch(setSubscribedReferral({}))
                dispatch(setSubscriptionHistory([]))
                dispatch(setActiveTrade([]))
                dispatch(setPortfolioTrade({}))
                dispatch(setYearList({}))
                dispatch(setYearAnalysis([]))
                dispatch(setCurrentPlan({}))
                dispatch(setBalance(""))
                router.push("/")
              })
            }}>Proceed</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Setting;

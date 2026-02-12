import React, { useEffect, useState } from "react";
import { TbCurrencyDollar } from "react-icons/tb";
import {
  Button,
  DashTextInput,
  Heading,
  Modal,
  SelectDropdown,
  SvgIcons,
  SwitchToggle,
  Typography,
} from "ui";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import currencyService from "../../../services/currencyService"
import { Currency, CurrencyPair } from "../../../types/currency";
import exchangeServices from "../../../services/exchangeService";
import { error } from "../../alert/Toast";
import { ExchangeProp, ExchangeRecord } from "../../../types/exchange";
import tradeService from "../../../services/tradeService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { AddTradeProp } from "../../../types/trade";
import Link from "next/link";
import useUserStore from "../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import { AiOutlineWarning } from "react-icons/ai";
import useEthereum from "../../../lib/hooks/useEthereum";
import Loader from "../../Loader";
import ConfettiComponent from "../confetti/confetti";

type Props = {
  btnText: string;
  isShowButton?: boolean;
  isOpenModal?: boolean;
  modalFunction?: (value: boolean) => void;
};

const AddTrade = ({ isOpenModal, modalFunction, ...props }: Props) => {
  const { currency } = useSelector((state: RootState) => state.currency)
  const [isLoading, setIsLoading] = useState(false)
  const { exchanges, exchangeRecord } = useSelector((state: RootState) => state.exchange)
  const dispatch = useDispatch<AppDispatch>()
  const { createTrade: createMetaTrade } = useEthereum()
  const axiosToken = useAxiosAuth()
  const { user } = useUserStore((state) => state)

  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>()
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>()
  const [selectedExchange, setSelectedExchange] = useState<ExchangeRecord | ExchangeProp>()
  const [tradeDetails, setTradeDetails] = useState<{
    amount: string;
    stop_loss: string;
    re_invest_all: boolean,
    trade_type: null | 1 | 2,
  }>({
    amount: "",
    stop_loss: "0.50",
    re_invest_all: true,
    trade_type: null,
  });

  const [addTradeConfirm, setAddTradeConfirm] = useState(false);

  const [record, setRecord] = useState<ExchangeRecord[]>([])

  useEffect(() => {
    dispatch(currencyService.getCurrency())
    dispatch(exchangeServices.getExchanges())
    if (isAuthorizationHeaderSet(axiosToken) && exchangeRecord.length < 1 && user.email) {
      dispatch(exchangeServices.getExchangeRecords(axiosToken))
    }
    // console.log({ exchangeRecord, exchanges, user: user.is_live_mode })
  }, [])

  useEffect(() => {
    if (exchangeRecord.length > 0) {
      setRecord(exchangeRecord);
    }
  }, [exchangeRecord])

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };


  const addTrade = async () => {
    const { amount, stop_loss, re_invest_all, trade_type } = tradeDetails
    if (!selectedExchange) {
      return error("Select an exchange")
    }

    if (trade_type === null) {
      return error("Select trade type")
    }

    if (!selectedCurrency) {
      return error("Select a currency")
    }

    if (!selectedPair) {
      return error("Select a currency pair")
    }

    if (!selectedPair) {
      return error("Select a currency pair")
    }

    if (!amount || !stop_loss) {
      return error("Add all required details")
    }

    setIsLoading(true)

    try {

      const dataToCreate: AddTradeProp = {
        currency_id: selectedCurrency.pk!,
        exchange_id: selectedExchange.id!,
        pair_id: selectedPair.id!,
        amount: parseFloat(amount),
        stop_loss: parseFloat(stop_loss),
        re_invest_all,
        trade_type: trade_type
      }

      const creating = await dispatch(tradeService.createTrade({
        api: axiosToken,
        data: dataToCreate
      })).unwrap();
      if (creating) {

        createMetaTrade({
          pair: selectedPair.pair!,
          exchange_name: (selectedExchange as ExchangeProp)?.name ?? (selectedExchange as ExchangeRecord)?.supported_exchange_id,
          amount: amount,
          take_profit: re_invest_all,
          active: true,
        })
        setShowConfetti(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAddTradeConfirm(false)
        await new Promise(resolve => setTimeout(resolve, 1000));
        modalFunction && modalFunction(false);
        await new Promise(resolve => setTimeout(resolve, 1000));

      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <Loader />}
      <Modal
        title="Add Trade"
        isOpen={isOpenModal}
        onChnage={modalFunction}
        btn={!props.isShowButton ? <Button classstyle="!rounded-full !py-2 !px-4 !bg-txt-yellow !border !border-txt-yellow sm:!px-2 sm:!py-1 sm:!rounded-2xl">{props.btnText}</Button> : undefined}
      >
        <div className="py-5">
          <form action="" className="flex flex-col items-start gap-5">

            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Exchange
              </Typography>
              <div className="form__exchange--info flex flex-col w-full mr-7">
                {!user.is_live_mode && <SelectDropdown
                  title="Exchange"
                  dash
                  flex={true}
                  icon={SvgIcons.arrow_down}
                  lists={exchanges.map((el: ExchangeProp, i: number) => (
                    el.name!
                  ))}
                  onValueChange={(value: string) => {
                    if (!record || !user.is_live_mode) {
                      const selectedCur: ExchangeProp = exchanges.filter((cur: ExchangeProp) => cur.name === value)[0];

                      setSelectedExchange(selectedCur)
                    } else {
                      const selectedCur: ExchangeRecord = exchangeRecord.filter((cur: ExchangeRecord) => cur.supported_exchange_id === value)[0];
                      setSelectedExchange(selectedCur)

                    }
                  }}
                />}
                {user.is_live_mode === true && <SelectDropdown
                  title="Exchange"
                  dash
                  flex={true}
                  icon={SvgIcons.arrow_down}
                  lists={record.map((el: ExchangeRecord, i: number) => (
                    el.supported_exchange_id!
                  ))}
                  onValueChange={(value: string) => {
                    if (!record || !user.is_live_mode) {
                      const selectedCur: ExchangeProp = exchanges.filter((cur: ExchangeProp) => cur.name === value)[0];

                      setSelectedExchange(selectedCur)
                    } else {
                      const selectedCur: ExchangeRecord = exchangeRecord.filter((cur: ExchangeRecord) => cur.supported_exchange_id === value)[0];
                      setSelectedExchange(selectedCur)

                    }
                  }}
                />}
                {user.is_live_mode === true && record.length < 1 && <Typography classstyle="!text-[var(--redish)] text-xs mt-1">You currently haven&apos;t created an exchange record. <Link href={Object.keys(user).length !== 0 ? "/dashboard/settings" : "/register"} className="underline ml-1">Create one</Link></Typography>}
              </div>

            </div>
            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Type
              </Typography>
              <div className="form__exchange--info flex flex-col w-full mr-7">
                <SelectDropdown
                  title="Trade Type"
                  dash
                  flex
                  icon={SvgIcons.arrow_down}
                  lists={["Live", "Demo"].map((el: string, i: number) => (
                    el
                  ))}
                  onValueChange={(value: string) => {
                    if (value === "Demo") {
                      setTradeDetails((prev) => ({
                        ...prev,
                        trade_type: 1
                      }))
                    } else {
                      setTradeDetails((prev) => ({
                        ...prev,
                        trade_type: 2
                      }))
                    }
                  }}
                />
                {user.is_live_mode === true && record.length < 1 && <Typography classstyle="!text-[var(--redish)] text-xs mt-1">You currently haven&apos;t created an exchange record. <Link href={Object.keys(user).length !== 0 ? "/dashboard/settings" : "/register"} className="underline ml-1">Create one</Link></Typography>}
              </div>

            </div>
            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Currency
              </Typography>
              <SelectDropdown
                title="Currency"
                dash
                flex
                icon={SvgIcons.arrow_down}
                lists={currency?.map((el: Currency, i: number) => (
                  el.name!
                ))}
                onValueChange={(value: string) => {
                  const selectedCur: Currency = currency.filter((cur) => cur.name === value)[0];
                  setSelectedCurrency(selectedCur)
                }}
              />
            </div>
            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Pair
              </Typography>
              <SelectDropdown
                title="Pair"
                dash
                flex
                icon={SvgIcons.arrow_down}
                lists={currency?.map((el: Currency, i: number) => (
                  el.currency_pair![0].pair!
                ))}
                onValueChange={(value: string) => {
                  const selectedCur: CurrencyPair = currency.filter((cur) => cur.currency_pair![0].pair === value)[0].currency_pair![0];
                  setSelectedPair(selectedCur)
                }}
              />
            </div>
            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Amount
              </Typography>
              <DashTextInput
                type="number"
                name="amount"
                value={tradeDetails.amount}
                className="!my-2"
                dash
                Icon={<TbCurrencyDollar className="!text-gray-400" />}
                onChange={(e) => setTradeDetails((prev) => ({
                  ...prev,
                  amount: e.target.value
                }))}
              />
            </div>
            <div className="form__group flex items-center w-full gap-5">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Stop Loss
              </Typography>
              <DashTextInput
                type="text"
                name="stop_loss"
                className="!my-2"
                value={"0.5"}
                dash
                disabled
                Icon={
                  <span className="!text-gray-400 w-4 h-4 flex items-center justify-center">
                    {SvgIcons.stop_loss}
                  </span>
                }
                onChange={(e) => { }}
              />
            </div>
            <div className="form__group flex items-center justify-start">
              <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                Take Profit?
              </Typography>
              <div className="flex items-center ml-4">

                <Typography
                  classstyle={`inter  mr-2`}
                  textsize="xs"
                >
                  NO
                </Typography>
                <SwitchToggle
                  name="reinvest"
                  value="true"
                  checked={tradeDetails.re_invest_all}
                  width={30}
                  height={18}
                  diameter={22}
                  oncheckedchange={(vl) => {
                    setTradeDetails((prev) => ({
                      ...prev,
                      re_invest_all: vl
                    }))
                  }}
                />
                <Typography
                  classstyle={`inter ml-2`}
                  textsize="xs"
                >
                  YES
                </Typography> </div>
            </div>
            <div className="btn w-full flex justify-end">
              <Button classstyle="!bg-txt-yellow !border-txt-yellow" onClick={() => {
                setAddTradeConfirm(true);
              }}>Add trade</Button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal
        title={""}
        width="500px"
        isOpen={addTradeConfirm}
        onChnage={(e) =>
          setAddTradeConfirm(e)
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <AiOutlineWarning className="text-yellow-600 mb-2 text-3xl" />
          <Heading textsize="lg" classstyle="text-center">Disclaimer</Heading>
          <Typography classstyle="text-center !text-txtSec !my-5">By creating this trade, you acknowledge that Candleweb is not liable for any losses resulting from your use of its services including the CandleAI software.</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setAddTradeConfirm(false)
            }}>Cancel</Button>
            <Button onClick={() => {
              addTrade();
            }}>Proceed</Button>
          </div>
        </div>
      </Modal>
      <ConfettiComponent trigger={showConfetti} onComplete={handleConfettiComplete} />
    </>
  );
};

export default AddTrade;

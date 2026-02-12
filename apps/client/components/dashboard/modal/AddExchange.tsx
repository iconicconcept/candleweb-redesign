import React, { useEffect, useState } from "react";
import { HiPlus } from "react-icons/hi";
import { IoAddSharp } from "react-icons/io5";
import Image from "next/image"
import { TbCurrencyDollar } from "react-icons/tb";
import { useDispatch, useSelector } from "react-redux";
import {
    APIKEYICON,
    APISECRETICON,
    Button,
    DashTextInput,
    Modal,
    SelectDropdown,
    SvgIcons,
    SwitchToggle,
    Typography,
} from "ui";
import { AppDispatch, RootState } from "../../../redux/store";
import exchangeServices from "../../../services/exchangeService";
import { ExchangeProp } from "../../../types/exchange";
import { error } from "../../alert/Toast";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { AiFillPlusCircle } from "react-icons/ai";

type Props = {
    btnText: string;
    exchangeAdded: () => void;
};

export interface ExchangeData {
    supported_exchange_id: number;
    API_KEY: string;
    API_SECRET: string;
    API_PASSPHRASE?: string;
}

const AddExchange = ({ exchangeAdded, ...props }: Props) => {
    const [exchangeData, setExchangeData] = useState<ExchangeData>({
        supported_exchange_id: 0,
        API_KEY: "",
        API_SECRET: "",
        API_PASSPHRASE: ""
    })
    const [selectedExchangeName, setSelectedExchangeName] = useState<string>("")
    const { exchanges, isLoading } = useSelector((state: RootState) => state.exchange)
    const dispatch = useDispatch<AppDispatch>()
    const axiosToken = useAxiosAuth()

    useEffect(() => {
        if (exchanges.length < 1) {
            dispatch(exchangeServices.getExchanges())
        }
    }, [exchanges, dispatch])

    const isKucoin = selectedExchangeName.toLowerCase() === "kucoin"

    const addExchange = async () => {
        const { supported_exchange_id, API_KEY, API_SECRET, API_PASSPHRASE } = exchangeData

        if (supported_exchange_id < 1) {
            return error("Select your exchange")
        }
        if (!API_KEY || !API_SECRET) {
            return error("Add your api details")
        }
        if (isKucoin && !API_PASSPHRASE) {
            return error("API Passphrase is required for Kucoin")
        }

        const dataToSend = isKucoin ? exchangeData : {
            supported_exchange_id: exchangeData.supported_exchange_id,
            API_KEY: exchangeData.API_KEY,
            API_SECRET: exchangeData.API_SECRET
        }

        dispatch(exchangeServices.addExchange({
            axiosToken,
            data: dataToSend
        })).then((res) => exchangeAdded())
    }

    return (
        <Modal
            title="Add Exchange"
            btn={<Button icon={<AiFillPlusCircle />} classstyle="!rounded-full !py-2 !px-4 !bg-txt-yellow !border-txt-yellow sm:!px-2 sm:!py-1 sm:!rounded-2xl">{props.btnText}</Button>}
        >
            <div className="py-5">
                <form action="" className="flex flex-col items-start gap-5">
                    <div className="form__group flex items-center w-full gap-5">
                        <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                            Exchange
                        </Typography>
                        <SelectDropdown
                            title="Exchange"
                            dash
                            flex={true}
                            icon={SvgIcons.arrow_down}
                            lists={exchanges.map((el: ExchangeProp, i: number) => (
                                el.name
                            ))}
                            onValueChange={(value: string) => {
                                const selectedCur: ExchangeProp = exchanges.filter((cur) => cur.name === value)[0];
                                setSelectedExchangeName(value)
                                setExchangeData((prev) => ({
                                    ...prev,
                                    supported_exchange_id: selectedCur.id
                                }))
                            }}
                        />
                    </div>
                    <div className="form__group flex items-center w-full gap-5">
                        <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                            Api Key
                        </Typography>
                        <DashTextInput
                            type="text"
                            name="apikey"
                            value={exchangeData.API_KEY}
                            className="!my-2"
                            dash
                            Icon={SvgIcons.exchange_apiKey}
                            onChange={(e) => {
                                setExchangeData((prev) => ({
                                    ...prev,
                                    API_KEY: e.target.value
                                }))
                            }}
                        />
                    </div>
                    <div className="form__group flex items-center w-full gap-5">
                        <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                            Api Secret
                        </Typography>
                        <DashTextInput
                            type="text"
                            name="apiSecret"
                            value={exchangeData.API_SECRET}
                            className="!my-2"
                            dash
                            Icon={SvgIcons.exchange_apiSecret}
                            onChange={(e) => {
                                setExchangeData((prev) => ({
                                    ...prev,
                                    API_SECRET: e.target.value
                                }))
                            }}
                        />
                    </div>
                    {isKucoin && (
                        <div className="form__group flex items-center w-full gap-5">
                            <Typography classstyle="w-24 inter" textsize="xs" color="gray">
                                Api Passphrase
                            </Typography>
                            <DashTextInput
                                type="text"
                                name="apiPassphrase"
                                value={exchangeData.API_PASSPHRASE ?? ""}
                                className="!my-2"
                                dash
                                Icon={SvgIcons.exchange_apiKey}
                                onChange={(e) => {
                                    setExchangeData((prev) => ({
                                        ...prev,
                                        API_PASSPHRASE: e.target.value
                                    }))
                                }}
                            />
                        </div>
                    )}

                    <div className="btn w-full flex justify-end">
                        <Button classstyle="!bg-txt-yellow !border-txt-yellow" onClick={() => addExchange()} loading={isLoading}>Add Exchange</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddExchange;

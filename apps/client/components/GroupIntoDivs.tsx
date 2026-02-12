import { Heading, Progress, SvgIcons, Typography, dollarFormat, convertDate } from "ui";
import { TradeProp } from "../types/trade";
import { Currency, CurrencyPair } from "../types/currency";

import Image from "next/image"

export const groupProfitMarginIntoDivs = (arr: TradeProp[]): JSX.Element[] => {
    const newData: JSX.Element[] = []
    for (let i = 0; i < arr.length; i += 4) {
        const item1 = arr[i];
        const item2 = arr[i + 1];
        const item3 = arr[i + 2];
        const item4 = arr[i + 3];
        const divContent = (
            <>
                <div className="progress flex items-center gap-3 mb-3" key={i + item1.id!}>
                    <Typography classstyle="left__line w-14 h-3" textsize="xs">{item1.pair}</Typography>{" "}
                    <Progress progress={item1.profit_margin ?? 0} color="#8FB6D5" />{" "}
                    <Typography>{Number(item1.profit_margin!.toFixed(2)) ?? 0}%</Typography>
                </div>
                {item2 !== undefined && <div className="progress flex items-center gap-3 mb-3" key={i + "item2" + item1.id!}>
                    <Typography classstyle="left__line w-14 h-3" textsize="xs">{item2.pair}</Typography>{" "}
                    <Progress progress={Number(item2.profit_margin!.toFixed(2)) ?? 0} color="#8FB6D5" />{" "}
                    <Typography>{Number(item2.profit_margin!.toFixed(2)) ?? 0}%</Typography>
                </div>}
                {item3 !== undefined && <div className="progress flex items-center gap-3 mb-3" key={i + "item3" + item1.id!}>
                    <Typography classstyle="left__line w-14 h-3" textsize="xs">{item3.pair}</Typography>{" "}
                    <Progress progress={Number(item3.profit_margin!.toFixed(2)) ?? 0} color="#8FB6D5" />{" "}
                    <Typography>{Number(item3.profit_margin!.toFixed(2)) ?? 0}%</Typography>
                </div>}
                {item4 !== undefined && <div className="progress flex items-center gap-3 mb-3" key={i + "item4" + item1.id!}>
                    <Typography classstyle="left__line w-14 h-3" textsize="xs">{item4.pair}</Typography>{" "}
                    <Progress progress={Number(item4.profit_margin!.toFixed(2)) ?? 0} color="#8FB6D5" />{" "}
                    <Typography>{Number(item4.profit_margin!.toFixed(2)) ?? 0}%</Typography>
                </div>}
            </>
        );
        newData.push(divContent);
    }
    return newData;

}

function isPositive(num: number): boolean {
    return num < 0 ? false : true;
}

export const groupActiveTradesIntoDivs = (arr: TradeProp[], currency: Currency[]): JSX.Element[] => {

    const newData: JSX.Element[] = [];
    let curPair: CurrencyPair[] = [];

    if (currency.length > 0) {
        for (var i = 0; i < currency.length; i++) {
            if (
                currency[i].currency_pair &&
                currency[i].currency_pair?.length! > 0
            ) {
                const curP = currency[i].currency_pair!;
                let newCur: CurrencyPair[] = [];
                for (var j = 0; j < curP.length; j++) {

                    newCur.push(curP[j]);
                }

                curPair = [...curPair, ...newCur];
            }
        }
    }

    // console.log(isPositive((parseFloat(arr[0].amount!) - parseFloat(arr[0].trade_balance!))));



    for (let i = 0; i < arr.length; i++) {
        const item1 = arr[i];
        // const item2 = arr[i + 1];
        const divContent = (
            <div className="pb-1" key={i + (item1.id ?? 0)}>
                <div className="coin flex items-start gap-2 justify-between p-3 ai:py-2 tb:!py-3">
                    <div className="icon w-10"><Image src={"https://res.cloudinary.com/dguemmmfk/" + curPair.find((cur) => cur.pair === item1.pair)?.photo} alt="CurrencyPair Icon" width={30} height={30} /></div>
                    <div className=" flex flex-col items-start flex-1 w-full ">
                        <Typography classstyle="text-sm font-normal">
                            {item1.currency} <span className="text-txtGray ml-3">{item1.pair}</span>
                        </Typography>
                        <Heading textsize="sm" boldness="normal">
                            {dollarFormat(Number(parseFloat(item1.amount!).toFixed(4)))}
                        </Heading>
                        <Typography classstyle="text-sm">
                            Bal:  {dollarFormat(Number(parseFloat(item1.trade_balance!).toFixed(4)))}
                        </Typography>
                        <Typography classstyle="text-sm !text-txtGray">
                            Trade Exchange:  <span className="text-txt-yellow">{item1.exchange!}</span>
                        </Typography>
                    </div>
                    <div className="flex items-end gap-1 flex-col">

                        <Typography
                            classstyle="flex items-center gap-1 text-xs"
                            style={{
                                color: !isPositive((parseFloat(item1.trade_balance!) - parseFloat(item1.amount!))) ? "#FC5878" : "#17A087",
                            }}
                        >
                            <span className="[&>*]:!text-lg">{SvgIcons.percent}</span>
                            {(item1.profit_loss_differrence?.toFixed(2) ?? 0)}%
                        </Typography>
                        <Typography
                            classstyle="flex items-center gap-1 !text-2xl font-bold"
                            style={{
                                color: !isPositive((parseFloat(item1.trade_balance!) - parseFloat(item1.amount!))) ? "#FC5878" : "#17A087",
                            }}
                        >
                            <span className="[&>*]:!text-lg">{!isPositive((parseFloat(item1.trade_balance!) - parseFloat(item1.amount!))) ? "" : "+"}</span>
                            {(((parseFloat(item1.trade_balance!) - parseFloat(item1.amount!))).toFixed(2) ?? 0)}
                        </Typography>
                    </div>
                </div>
                <hr className="border-gray-500 mr-4 ml-14" />
                <div className="flex justify-between items-center p-4 ml-10 ">
                    <Typography classstyle="text-sm font-normal" color="gray">
                        Orders: {Math.ceil((item1.trade_order?.length ?? 0) / 2)}
                    </Typography>
                    {item1.created_at && <Typography classstyle="text-sm font-normal" color="gray">
                        {convertDate(item1.created_at!)}
                    </Typography>}
                </div>
                {/* {item2 !== undefined && <div className="coin flex items-center gap-2 justify-between p-3 ai:py-2 tb:!py-3">
                    <div className="icon w-10"><Image src={"https://api.candleweb.io" + curPair.find((cur) => cur.pair === item2.pair)?.photo} alt="CurrencyPair Icon" width={30} height={30} /></div>
                    <div className=" flex flex-col items-start flex-1 w-full ">
                        <Typography classstyle="text-sm font-normal">
                            {item2.currency} <span className="text-txtGray ml-3">{item2.pair}</span>
                        </Typography>
                        <Heading textsize="sm" boldness="normal">
                            {dollarFormat(Number(parseFloat(item2.amount!).toFixed(4)))}
                        </Heading>
                        <Typography classstyle="text-sm">
                            Bal:  {dollarFormat(Number(parseFloat(item2.trade_balance!).toFixed(4)))}
                        </Typography>
                    </div>
                    <Typography
                        classstyle="flex items-center gap-1"
                        style={{
                            color: item2.profit_loss_differrence ? item2.profit_loss_differrence.toString().slice(0, 1).toString() === "-" ? "#FC5878" : "#17A087" : "#17A087",
                        }}
                    >
                        <span className="[&>*]:!text-lg">{SvgIcons.percent}</span>
                        {item2.profit_loss_differrence?.toFixed(4) ?? 0}%
                    </Typography>
                </div>} */}
            </div>
        );
        newData.push(divContent);
    }
    return newData;
};




import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Heading, SelectDropdown, convertTo12HrFormat, dollarFormat, numberFormat } from "ui";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import { TradeOrder } from "../../../types/trade";
import tradeService from "../../../services/tradeService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { setActiveTrade } from "../../../redux/slices/tradeSlice";
import { DashboardSkeletonLoader } from "../skeleton/SkeletonLoader";

interface ProcessedTradeData {
  name: string;
  amount: number;
  uv: number;
  type: string
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any;
}

const time_interval: {
  interval: string,
  interval_id: string
}[] = [
    {
      interval: "1H",
      interval_id: "1hr"
    },
    {
      interval: "24H",
      interval_id: "24hrs"
    },
    {
      interval: "1W",
      interval_id: "1week"
    },
    {
      interval: "1M",
      interval_id: "1month"
    }, {
      interval: "3M",
      interval_id: "3months"
    },
    {
      interval: "6M",
      interval_id: "6months"
    }
  ];

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: ProcessedTradeData = payload[0].payload;
    return (
      <div className={`px-3 py-2 bg-white border-4 rounded-lg text-sm  ${data.type === "SELL" ? "text-[var(--redish)] border-[var(--redish)]" : "text-primary border-primary"} inter font-semibold`}>
        <p>{`Amount: ${dollarFormat(parseFloat(data.amount.toString()))}`}</p>
        <p>{`Type: ${data.type}`}</p>
        <p>{`${data.name}`}</p>
      </div>
    );
  }

  return null;
};

const generateData = () => {
  const times = ['1 AM', '4 AM', '7 AM', '10 AM', '1 PM', '4 PM', '8 PM'];
  const newData = times.map((time) => {
    return {
      name: time,
      uv: Math.floor(Math.random() * 5000) + 1000,
      amount: 0,
      type: ""
    };
  });

  return newData;
};

const tradeData = (chartTradeOrders: TradeOrder[]): ProcessedTradeData[] => {
  const newData: ProcessedTradeData[] = chartTradeOrders.map((order) => {
    return {
      name: convertTo12HrFormat(order.created_at!),
      amount: parseFloat(order.price || '0'), // Parse price as a number
      uv: parseFloat(order.price || '0'),  // Parse price as a number
      type: order.type!
    };
  });

  return newData;
};

const AnalyticsCard = () => {
  // const [statSelect, setStatSelect] = useState("Summary");
  // const dateFormat = ["1H", "24H", "1W", "3M", "6M"];
  const { tradePairList, chartActiveTrade, chartTradeOrders, activeTradeLoading } = useSelector((state: RootState) => state.trade);

  const [data, setData] = useState(chartTradeOrders.length > 0 ? tradeData(chartTradeOrders) : generateData())
  const [selectedInterval, setSelectedInterval] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();

  const filterAnalytics = (asset: string) => {
    const filtered = chartTradeOrders.filter((trd) => trd.pair === asset);
    if (filtered.length > 0) {
      setData(tradeData(filtered));
    }
  }

  useEffect(() => {
    if (chartActiveTrade.length === 0) {
      dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "", isChart: true }));
    }
  }, []);

  useEffect(() => {

    setData(tradeData(chartTradeOrders));

  }, [chartTradeOrders])

  return (
    <>
      {activeTradeLoading && <DashboardSkeletonLoader />}

      {!activeTradeLoading && <div className="w-full max-w-full min-h-[444px] rounded-2xl bg-card p-3">
        <div className="analytics__top flex items-center justify-between sm:flex-col sm:gap-2 sm:items-start py-3 px-7 mb-4">
          <div className="stats__list flex items-center gap-5 w-full">
            <Heading textsize="md">Trade Summary</Heading>
            <div className="analytics__date--filter flex items-center w-full max-w-[120px]">
              <SelectDropdown
                title="Asset"
                lists={Array.from(new Set(tradePairList.invested_pairs)).map((pair, _) => pair) ?? ["No Asset"]}
                type="border"
                onValueChange={(value: string) => {
                  if (value.toLocaleLowerCase() !== "no asset") {
                    filterAnalytics(value);
                  }
                }}
              />
            </div>
          </div>

          <div className="date__filter flex items-center gap-2 sm:mt-2 sm:gap-1">
            {time_interval.map(({ interval, interval_id }) => (
              <button
                key={interval_id}
                className={`border-[0.5px] border-solid border-gray-400 px-2 py-1 text-xs rounded-md ${selectedInterval === interval_id ? 'bg-txt-yellow border-txt-yellow text-black font-semibold' : ''}`}
                onClick={async () => {
                  setSelectedInterval(interval_id)
                  await dispatch(tradeService.getActiveTrade({
                    api: axiosToken,
                    interval: interval_id,
                    isChart: true,
                  }));
                  // setActiveTrade(fetchedTrade);
                }}
              >
                {interval}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            >
              <defs>
                <linearGradient id="analy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="15%" stopColor="#27ECB0" stopOpacity={0.8} />
                  <stop offset="10%" stopColor="#27ECB0" stopOpacity={0.78} />
                  <stop offset="75%" stopColor="#27ECB0" stopOpacity={0.4} />
                  <stop offset="90%" stopColor="#27ECB0" stopOpacity={0.1} />
                  <stop offset="20%" stopColor="#27ECB0" stopOpacity={0.07} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "500",
                  fill: "white",
                  marginBottom: "3rem",
                }}
              />
              <YAxis
                dataKey="uv"
                axisLine={false}
                tickLine={false}
                tickCount={5}
                width={85}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "500",
                  fill: "white",
                }}
                tickFormatter={(num) => `${dollarFormat(num)}`}
              />
              <Tooltip
                // labelStyle={{ color: "#27ECB0" }}
                // formatter={(value, name, data) => {
                //   // console.log({ data })
                //   return [data.payload.type, dollarFormat(parseFloat(value.toString())), name]
                // }}
                content={<CustomTooltip />}
              />
              <CartesianGrid opacity={0.1} vertical={false} horizontal={false} />

              <Area
                type="monotone"
                dataKey="type"
                stroke="#FAECB0"
                fill="url(#analy)"
                hide
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#27ECB0"
                fill="url(#analy)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>}
    </>
  );
};

export default AnalyticsCard;

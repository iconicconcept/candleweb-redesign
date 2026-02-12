import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dollarFormat, Heading, numberFormat, SelectDropdown } from "ui";
import { AppDispatch, RootState } from "../../../redux/store";
import { YearlyProfitAnalysisProp } from "../../../types/trade";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import tradeService from "../../../services/tradeService";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-sm text-[#0577AB] border-2 border-[#0577AB] rounded-lg p-2">
        <p className="label">{`Amount : ${payload[1].payload.amt.toString()}%`}</p>
        <p className="label">{`${payload[0].payload.name}`}</p>
      </div>
    );
  }
  return null
};

interface ProcessedYearlyProfitData {
  name: string;
  amt: number;
  pv: number;
  uv: number;
}

const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getMonthNames = (): string[] => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const monthNames: string[] = [];

  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth - i + 12) % 12;
    monthNames.unshift(months[monthIndex]);
  }

  return monthNames;
};

const generateData = () => {
  const months = getMonthNames();
  const newData = [];
  for (let i = 0; i < months.length; i++) {
    const uv = 0;
    const pv = 0;
    const amt = Math.max(uv + pv, 1, Math.min(100, uv + pv)); // Calculate amt as the maximum of the sum of uv and pv, 1 (minimum value), and the sum limited to 100
    newData.push({ name: months[i], uv, pv, amt });
  }
  return newData;
};

const generateYearlyProfitData = (data: YearlyProfitAnalysisProp[]): ProcessedYearlyProfitData[] => {
  const processedData: ProcessedYearlyProfitData[] = data.map((item) => {
    const { month, percent } = item;

    const yearlyData = {
      name: month || '',
      amt: percent || 0,
      pv: percent ? (percent / 2) : 0,
      uv: percent ? (percent / 2) : 0,
    };
    return yearlyData;
  });

  return processedData;
};

const Stats = () => {

  const { tradePairList, tradeYears, yearAnalysis, selectedTradePair, selectedTradeYear } = useSelector((state: RootState) => state.trade);
  const [data, setData] = useState(yearAnalysis.length > 0 ? generateYearlyProfitData(yearAnalysis) : generateData());

  const dispatch = useDispatch<AppDispatch>()
  const axiosToken = useAxiosAuth()

  const filterPair = (data: string, type: "year" | "asset") => {
    if (yearAnalysis.length < 1) {
      return
    }

    if (type === "year") {
      dispatch(tradeService.getYearlProfitAnalysis({
        api: axiosToken,
        pair: selectedTradePair,
        year: data
      })).then((res) => {
        if (Object.keys(res).length > 0) {

          setData(generateYearlyProfitData(res.payload));
        }
      }).catch((err) => {

      });
    } else if (type === "asset") {
      dispatch(tradeService.getYearlProfitAnalysis({
        api: axiosToken,
        pair: data,
        year: selectedTradeYear
      })).then((res) => {
        if (Object.keys(res).length > 0) {
          setData(generateYearlyProfitData(res.payload));
        }
      }).catch((err) => { });
    }
  }

  return (
    <div className="w-full h-[346px] rounded-2xl bg-card p-4">
      <div className="stats__top--info px-6 py-2 flex justify-between items-center sm:flex-col sm:items-start sm:px-2 sm:gap-2 sm:py-1">
        <Heading textsize="md">Profit Breakdown</Heading>{" "}
        <div className="select__dp max-w-[200px] w-full flex gap-2 items-center">
          <SelectDropdown
            title="Asset"
            lists={Array.from(new Set(tradePairList.invested_pairs)).map((pair, index) => pair) ?? ["No Asset"]}
            type="border"
            onValueChange={(value: string) => {
              if (value.toLocaleLowerCase() !== "no asset") {
                filterPair(value, "asset")
              }
            }}
          />
          <SelectDropdown
            title="Year"
            lists={tradeYears.trades_years?.map((year, index) => year.toString()) ?? ["No Year"]}
            type="border"
            onValueChange={(value: string) => {
              if (value.toLocaleLowerCase() !== "no year") {
                filterPair(value, "year")
              }
            }}
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{
            top: 30,
            right: 30,
            left: 0,
            bottom: 30,
          }}
        >
          {/* TODO: https://api.candleweb.io/media/images/currency/image_2022-08-24_02-20-55.png */}
          <defs>
            <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#72FFBB" stopOpacity={1} />
              <stop offset="100%" stopColor="#3CFE38" stopOpacity={1} />
            </linearGradient>{" "}
            <linearGradient id="gra" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#379FFF" stopOpacity={1} />
              <stop offset="100%" stopColor="#0577AB" stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            type="category"
            allowDuplicatedCategory={true}
            tickLine={false}
            orientation="bottom"
            axisLine={false}
          />
          <YAxis
            dataKey={"amt"}
            tickLine={false}
            orientation="left"
            axisLine={false}
            tickFormatter={(num) => `${num}%`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'transparent' }}
          />
          <CartesianGrid opacity={0.1} vertical={false} />
          <Bar
            dataKey="pv"
            stackId="a"
            legendType="none"
            fill="url(#color)"
            maxBarSize={20}
            radius={[0, 0, 900, 900]}
          />
          <Bar
            dataKey="uv"
            stackId="a"
            legendType="none"
            fill="url(#gra)"
            width={40}
            maxBarSize={20}
            radius={[900, 900, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Stats;

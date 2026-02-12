import React, { PureComponent } from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { RootState } from "../../../redux/store";
import { aggregateProfitLossByPair } from "../../../utils/trade-utils";
import { generateRandomLightColor } from "ui";

type Props = {};

const BarChartMixed = (props: Props) => {
  const { activeTrade } = useSelector((state: RootState) => state.trade)

  const pairData = aggregateProfitLossByPair(activeTrade, 50)
  const allPairs = activeTrade.map(trade => trade.pair);
  const uniquePairs = new Set(allPairs);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={pairData}
        margin={{
          top: 0,
          right: 20,
          left: 0,
          bottom: 0,
        }}
        barGap={15}
        barCategoryGap={15}
      >
        {/* <XAxis dataKey="name" />
        <YAxis /> */}
        <Legend
          align="right"
          layout="vertical"
          verticalAlign="middle"
          fontSize={15}
          className="inter !text-sm"
          iconSize={10}
          margin={{
            left: 20,
          }}
        />
        <Tooltip cursor={{ fill: 'transparent' }} />

        {Array.from(uniquePairs).map((pair, index) => (
          <Bar
            dataKey={pair!}
            barSize={10}
            key={index}
            fill={generateRandomLightColor()}
            radius={[900, 900, 900, 900]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartMixed;

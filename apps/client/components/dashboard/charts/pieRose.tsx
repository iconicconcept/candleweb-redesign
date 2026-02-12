import React from "react";
import ReactEcharts from "echarts-for-react";
import { TradeOrder } from "../../../types/trade";

type Props = {
  tradeData: TradeOrder[]
};

const PieRose = ({ tradeData }: Props) => {
  return (
    <div className="w-[280px] h-[360px]">
      <ReactEcharts
        style={{
          height: "100%"
        }}
        option={{
          legend: {
            top: "bottom",
            borderWidth: 1,
            borderColor: "#1e2023",
            textStyle: {
              color: "#fff",
            },
          },
          title: {
            text: "Profit - Loss Margin",
            left: "center",
            top: "-1%",
            textStyle: {
              color: "#fff",
            },
          },
          toolbox: {
            show: false,
          },
          tooltip: {
            trigger: "item",
          },
          series: [
            {
              name: "Profit - Loss Margin",
              type: "pie",
              radius: [30, 125],
              center: ["50%", "50%"],
              roseType: "area",
              itemStyle: {
                borderRadius: 0,
                borderWidth: 2,
                borderColor: "#fff",
              },
              label: {
                show: false,
              },
              color: ["#37BC93", "#FF0000"],
              data: tradeData.map((trade, index) => ({ value: trade.price, name: trade.type })),
            },
          ],
        }}
      />
    </div>
  );
};

export default PieRose;

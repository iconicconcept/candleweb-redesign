import React from "react";
import ReactEcharts from "echarts-for-react";

type Props = {
  color: string;
  tooltip: string;
  amount: number;
};

const HalfPie = ({ color, tooltip, amount }: Props) => {
  const cost = amount <= 0 ? 1 : amount
  return (
    <div className="w-[200px] h-[150px]">
      <ReactEcharts
        style={{
          height: "200px",
        }}
        option={{
          tooltip: {
            trigger: "item",
          },
          legend: {
            show: false,
          },
          axisPointer: {
            show: true,
          },
          height: 200,
          series: [
            {
              name: "From",
              type: "pie",
              radius: ["40%", "70%"],
              center: ["50%", "50%"],
              // adjust the start angle
              startAngle: 180,
              label: {
                show: false,
              },
              data: [
                {
                  value: cost,
                  name: tooltip,
                  itemStyle: {
                    color: color,
                  },
                },
                {
                  // make an record to fill the bottom 50%
                  value: cost + (cost * 70.42) / 100,
                  itemStyle: {
                    // stop the chart from rendering this piece
                    color: "none",
                    decal: {
                      symbol: "none",
                    },
                  },
                  label: {
                    show: false,
                  },
                },
              ],
            },
          ],
        }}
      />
    </div>
  );
};

export default HalfPie;

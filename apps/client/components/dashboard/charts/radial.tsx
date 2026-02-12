import React from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { useMediaQuery } from "@react-hook/media-query";

type Props = {
  profit: number;
  loss: number
};

const Radial = ({ profit, loss }: Props) => {
  const isMobile = useMediaQuery("only screen and (max-width: 600px)");

  const data = [

    {
      id: "first",
      data: [
        {
          x: "Profit",
          y: 0,
          color: "#60FF90",
        },
        {
          x: "Loss",
          y: parseFloat(loss.toFixed(4)),
          color: "#E00038",
        },
      ],
    },
    {
      id: "second",
      data: [
        {
          x: "Profit",
          y: parseFloat(profit.toFixed(4)),
          color: "#60FF90",
        },
        {
          x: "Loss",
          y: 0,
          color: "#E00038",
        },
      ],
    },
  ];

  return (
    <ResponsiveRadialBar
      data={data}
      valueFormat=" >-.2f"
      startAngle={0}
      endAngle={270}
      padding={0.35}
      cornerRadius={27}
      margin={{
        top: isMobile ? -50 : 10,
        right: isMobile ? 0 : 10,
        bottom: isMobile ? 0 : 40,
        left: isMobile ? 0 : 10,
      }}
      colors={(bar) => bar.data.color}
      borderColor={{
        from: "color",
        modifiers: [["darker", 1]],
      }}
      tracksColor="rgba(132,132,132,0.05)"
      enableRadialGrid={false}
      enableCircularGrid={false}
      radialAxisStart={null}
      circularAxisOuter={null}
      labelsTextColor={{ from: "color", modifiers: [] }}
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 38,
          translateY: isMobile ? -20 : 20,
          itemWidth: 106,
          itemHeight: 20,
          itemsSpacing: 6,
          symbolSize: 20,
          itemDirection: "left-to-right",
          itemTextColor: "#ffffff",
          symbolShape: "diamond",
        },
      ]}
      tooltip={({ bar }) => (
        <div className="py-2 px-3 bg-white rounded-sm">

          <strong style={{ color: bar.color }}>
            {bar.category}: {bar.value}
          </strong>
        </div>
      )}
    />
  );
};

export default Radial;

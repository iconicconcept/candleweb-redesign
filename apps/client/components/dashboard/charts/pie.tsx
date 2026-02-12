import React from "react";
import { ResponsivePie } from "@nivo/pie";

type Props = {};

const Pie = (props: Props) => {
  const data = [
    {
      id: "java",
      label: "java",
      value: 255,
      color: "hsl(234, 70%, 50%)",
    },
    {
      id: "scala",
      label: "scala",
      value: 488,
      color: "hsl(336, 70%, 50%)",
    },
    {
      id: "sass",
      label: "sass",
      value: 4,
      color: "hsl(344, 70%, 50%)",
    },
    {
      id: "make",
      label: "make",
      value: 322,
      color: "hsl(288, 70%, 50%)",
    },
    {
      id: "elixir",
      label: "elixir",
      value: 277,
      color: "hsl(285, 70%, 50%)",
    },
  ];
  return (
    <ResponsivePie
      data={data}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      startAngle={-180}
      innerRadius={0.35}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor="#ffffff"
      enableArcLinkLabels={false}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#333333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      enableArcLabels={false}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 0,
          itemWidth: 100,
          itemHeight: 18,
          itemTextColor: "#999",
          itemDirection: "left-to-right",
          itemOpacity: 1,
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: "#000",
              },
            },
          ],
        },
      ]}
    />
  );
};

export default Pie;

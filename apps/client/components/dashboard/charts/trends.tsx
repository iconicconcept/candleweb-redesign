import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { useMediaQuery } from "@react-hook/media-query";

type Props = {};

const TrendsChart = (props: Props) => {
  const isMobile = useMediaQuery("only screen and (max-width: 600px)");
  const data = [
    {
      id: "Unsubscripped referrals",
      data: [
        { x: "1", y: 1 },
        { x: "2", y: 2 },
        { x: "3", y: 4 },
        { x: "4", y: 5 },
        { x: "5", y: 6 },
        { x: "6", y: 1 },
        { x: "7", y: 3 },
        { x: "8", y: 2 },
        { x: "9", y: 1 },
        { x: "10", y: 4 },
      ],
      color: "#568FFF",
    },
    {
      id: "Unclaimed reward",
      data: [
        { x: "1", y: 1 },
        { x: "2", y: 4 },
        { x: "3", y: 3 },
        { x: "4", y: 1 },
        { x: "5", y: 2 },
        { x: "6", y: 6 },
        { x: "7", y: 5 },
        { x: "8", y: 3 },
        { x: "9", y: 4 },
        { x: "10", y: 2 },
      ],
      color: "#FC5878",
    },
    {
      id: "Claimed reward",
      data: [
        { x: "1", y: 1 },
        { x: "2", y: 5 },
        { x: "3", y: 3 },
        { x: "4", y: 4 },
        { x: "5", y: 1 },
        { x: "6", y: 6 },
        { x: "7", y: 2 },
        { x: "8", y: 4 },
        { x: "9", y: 3 },
        { x: "10", y: 5 },
      ],
      color: "#56FFC2",
    },
  ];

  return (
    <ResponsiveLine
      data={data}
      margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      axisTop={null}
      colors={{ datum: "color" }}
      theme={{
        textColor: "inherit",
        axis: {
          legend: {
            text: {
              fill: "inherit:darker(2.4)",
              fontWeight: "bold",
            },
          },
        },
      }}
      axisRight={null}
      axisBottom={null}
      axisLeft={null}
      enableGridX={false}
      enableGridY={false}
      enablePoints={false}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      areaBlendMode="multiply"
      areaOpacity={0}
      useMesh={true}
      legends={[
        {
          anchor: "bottom",
          direction: isMobile ? "column" : "row",
          justify: false,
          translateX: isMobile ? 5 : 86,
          translateY: isMobile ? 56 : 34,
          itemsSpacing: isMobile ? -6 : 50,
          itemDirection: "left-to-right",
          itemWidth: 106,
          itemHeight: 20,
          itemOpacity: 0.75,
          itemTextColor: "inherit",
          symbolSize: 7,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default TrendsChart;

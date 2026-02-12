import Image from "next/image";
import React from "react";
import {
  Heading,
  RoadMap1Image,
  RoadMap2Image,
  RoadMap3Image,
  RoadMap4Image,
  Typography,
} from "ui";

type Props = {};

const Roadmap = (props: Props) => {
  const roadmapContent: {
    icon: any;
    title: string;
    lists: string[];
  }[] = [
      {
        icon: RoadMap1Image,
        title: "Milestone 1",
        lists: [
          "Brand identity development",
          "Platform and smart contract architecture",
          "Platform development & testing",
          "In-app token sales",
        ],
      },
      {
        icon: RoadMap2Image,
        title: "Milestone 2",
        lists: [
          "Strategic raise",
          "CandleAI AI agent training",
          "Smart contract deployment on testnet",
          "Smart contract audit and mainnet deployment",
        ],
      },
      {
        icon: RoadMap3Image,
        title: "Milestone 3",
        lists: [
          "Team Expansion",
          "Official Marketing",
          "Launch raise",
          "Partnership",
        ],
      },
      {
        icon: RoadMap4Image,
        title: "Milestone 4",
        lists: [
          "Integration of more tradeable assets.",
          "CandleAI IOS/Android design and architecture",
          "CandleAI IOS/Android development and testing.",
          "IOS/Android launch",
        ],
      },
    ];
  return (
    <div>
      <div className="roadmap__section sm:mt-[68px] mt-[151px] flex flex-col items-center justify-center">
        <Heading textsize="3xl" classstyle="sm:text-3xl mb-5">
          Roadmap
        </Heading>
        <Typography classstyle="max-w-4xl" align="center">
          A comprehensive guide to our company’s vision, strategy and
          priorities.
        </Typography>

        <div className="roadmap__timeline mt-[99px] flex justify-center ms:flex ms:justify-around items-center sm:mt-[52px] relative ms:w-full w-full">
          <div className="md:border-l-2 relative">
            <div className="md:hidden absolute h-full xs:h-[calc(100%_-_1rem)] xs:mt-2 w-1 border-l-2 left-8"></div>
            {roadmapContent.map((rm, index) => (
              <div
                className="transform sm:ml-2 ml-20 relative flex items-center bg-transparent border-4 border-gray-400 text-white rounded-full mb-5 md:mb-10 xs:!h-[100px] sm:h-[90px] h-[180px] w-full max-w-[600px]"
                key={index}
              >
                <div className="sm:hidden w-8 h-8 bg-dark-primary absolute -left-[84px] transform -translate-x-2/4 rounded-full z-10 mt-0"></div>

                <div className="sm:hidden w-20 h-1 bg-gray-400 absolute -left-20 z-0"></div>

                <div className="rounded-full sm:!w-[89px] sm:!h-[89px] w-[202px] h-[202px] bg-dark-primary flex items-center justify-center md:-translate-x-10 -translate-x-5">
                  <div className="rounded-full sm:w-[81px] sm:h-[81px] w-[185px] h-[185px] border-4 border-background flex items-center justify-center">
                    <Image
                      src={rm.icon}
                      alt={"Milestone Image " + index + 1}
                      className="w-[79px] h-[79px] sm:w-[37px] sm:h-[37px]"
                    />
                  </div>
                </div>
                <div className="md:flex-auto sm:-space-y-2 sm:-translate-x-2 xs:!-translate-x-4">
                  <Heading
                    textsize="sm"
                    classstyle="text-primary inter sm:text-[10px]"
                  >
                    {rm.title}
                  </Heading>
                  <ul className="">
                    {rm.lists.map((list, index) => (
                      <li
                        className="text-xs sm:text-[8px] md:my-1 inter list-disc list-inside leading-[1.2]"
                        key={index}
                      >
                        {list}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

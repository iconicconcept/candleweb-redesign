import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Fade, Slide } from "react-awesome-reveal";
import { Heading, StepImage, Typography } from "ui";

type IStepsProps = {};

const Steps = (props: IStepsProps) => {
  const [count, setCount] = useState(1);

  const mouseEnter = (index: number) => {
    setCount(index);
  };

  const mouseLeave = () => {
    setCount(1);
  };

  return (
    <div className="steps__section sm:mt-[68px] mt-[151px]">


      <Heading
        textsize="3xl"
        classstyle="sm:text-3xl sm:hidden mb-2 sm:text-center ms:mb-5"
        align="left"
      >
        CandleAI in 3 easy steps
      </Heading>

      <div className="steps__content flex items-center justify-between md:gap-10 sm:flex-col ms:gap-5">
        <div className="steps_details order-last">
          <div className="steps my-3">
            <Fade cascade direction="up" triggerOnce damping={0.4} delay={500} className={`steps__list max-w-[400px] stats_shadow hover:z-10 relative ${count === 1 ? "index_1" : count === 2 ? "index_2" : "index_3"}`}>
              {/* STEP 1 ACCOUNT */}
              <div
                className={`relative step sm:min-h-[156px] step__account transition duration-[1500ms] ease-in-out flex items-start justify-start p-2 md:px-4 py-6 rounded-lg my-2 md:my-4 min-w-[150px] bg-card md:cursor-pointer border-2 border-card ${count === 1
                  ? "!border-primary md:scale-110 !shadow-stat z-20 step_shadow"
                  : "bg-card"
                  } `}
                onMouseEnter={() => mouseEnter(1)}
                onMouseLeave={() => mouseLeave()}
              >
                <Typography
                  textsize="xs"
                  classstyle={`step__count md:h-5 md:w-5 w-4 h-4 flex items-center justify-center sm:mt-1 md:mx-2 mx-1 bg-dark font-bold rounded-full duration-1000 ${count === 1 ? "!bg-primary !text-dark" : "!bg-background"
                    }`}
                >
                  1
                </Typography>
                <div className="step__details flex-1 text-dark ml-2">
                  <Heading
                    textsize="md"
                    boldness="bold"
                    classstyle={`mb-1 uppercase transition duration-[1500ms] ease-in-out text-primary `}
                  >
                    Create an account
                  </Heading>
                  <Typography
                    classstyle={`font-normal transition duration-[1500ms] ease-in-out text-white`}
                  >
                    Sign up with your web3 wallet and connect your preferred
                    exchange account.
                  </Typography>
                </div>
              </div>
              {/* STEP 2 TRADE */}
              <div
                className={`relative step sm:min-h-[156px] step__trade flex items-start duration-[1500ms] ease-in-out p-2 md:px-4 py-6 rounded-lg my-2 md:my-4 min-w-[150px] md:cursor-pointer bg-card border-2 border-card ${count === 2
                  ? "!border-primary md:scale-110 !shadow-stat z-20 step_shadow"
                  : "bg-card"
                  } `}
                onMouseEnter={() => mouseEnter(2)}
                onMouseLeave={() => mouseLeave()}
              >
                <Typography
                  textsize="xs"
                  classstyle={`step__count md:h-5 md:w-5 w-4 h-4 flex items-center justify-center sm:mt-1 mx-1 md:mx-2 bg-dark font-bold rounded-full duration-1000 ${count === 2 ? "!bg-primary !text-dark" : "!bg-background"
                    }`}
                >
                  2
                </Typography>
                <div className="step__details flex-1 ml-2">
                  <Heading
                    textsize="md"
                    boldness="bold"
                    classstyle={`mb-1 uppercase transition duration-[1500ms] ease-in-out text-primary `}
                  >
                    Initiate a trade
                  </Heading>
                  <Typography
                    classstyle={`font-normal transition duration-[1500ms] ease-in-out text-white`}
                  >
                    Choose a trading pair and initiate trade. Start trading with
                    confidence.
                  </Typography>
                </div>
              </div>
              {/* STEP 3 Earn */}
              <div
                className={`relative step sm:min-h-[156px] step__trade transition duration-[1500ms] ease-in-out flex items-start p-2 md:px-4 py-6 rounded-lg my-2 md:my-4 min-w-[150px] bg-card md:cursor-pointer border-2 border-card ${count === 3
                  ? "!border-primary md:scale-110 !shadow-stat z-20 step_shadow"
                  : "bg-card"
                  } `}
                onMouseEnter={() => mouseEnter(3)}
                onMouseLeave={() => mouseLeave()}
              >
                <Typography
                  textsize="xs"
                  classstyle={`step__count md:h-5 md:w-5 w-4 h-4 flex items-center justify-center sm:mt-1 mx-1 md:mx-2 bg-dark font-bold rounded-full duration-1000 ${count === 3 ? "!bg-primary !text-dark" : "!bg-background"
                    }`}
                >
                  3
                </Typography>
                <div className="step__details flex-1 ml-2">
                  <Heading
                    textsize="md"
                    boldness="bold"
                    classstyle={`mb-1 uppercase transition duration-[1500ms] ease-in-out text-primary `}
                  >
                    Start Earning
                  </Heading>
                  <Typography
                    classstyle={`font-normal transition duration-[1500ms] ease-in-out text-white `}
                  >
                    Sit back and get return on your investment with CandleAI.
                  </Typography>
                </div>
              </div>
            </Fade>
          </div>
        </div>
        <div>

          <Slide direction="left" triggerOnce duration={2500} className="steps__image sm:m-2 ms:max-w-[340px] sm:!max-h-full max-w-[400px] max-h-[400px] mb-4 md:mb-0 ms:w-full">
            <Image src={StepImage} alt="Steps Image" className="w-full h-full" />
          </Slide>
          <Heading
            textsize="3xl"
            classstyle="sm:text-3xl sm:mt-7 mb-5 md:hidden mb-2 sm:text-center"
            align="left"
          >
            CandleAI in 3 easy steps
          </Heading>
        </div>
      </div>
    </div>
  );
};

export default Steps;

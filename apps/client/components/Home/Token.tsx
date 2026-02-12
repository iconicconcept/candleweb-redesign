import Image from "next/image";
import Link from "next/link";
import React from "react";
import { MdArrowForwardIos } from "react-icons/md";
import {
  Button,
  Heading,
  IconButton,
  PieChartImage,
  PieInfoImage,
  TokenImage,
  Typography,
  joinClasses,
} from "ui";
import classes from "../classes/Token.classes";

export interface ITokenClasses {
  base: string;
  header: string;
  theader: string;
  details: string;
  image: string;
  desc: string;
  lists: string;
  list: string;
  button: string;
}

type Props = {};

const Token = (props: Props) => {
  return (
    <div>
      <div className={classes.base}>
        <Heading textsize="md" align="center" classstyle="uppercase sm:!font-normal">
          One token for a million rewards
        </Heading>
        <div className={classes.image}>
          <Image src={TokenImage} alt="Token Image" className="w-full" />
        </div>
        <div className={`${classes.details} max-w-[800px]`}>
          {/* <Heading
            textsize="lg"
            boldness="semibold"
            align="left"
            classstyle={classes.theader}
          >
       
          </Heading> */}
          <Heading textsize="xl" boldness="med"
            align="center" classstyle={joinClasses(classes.theader, "sm:text-3xl uppercase")}>
            Candle Token ($CDE)
          </Heading>
          <Typography textsize="sm" classstyle={classes.desc}>
            Maximise your trading abilities, unlock discounts, rewards, and elite trading with the $CDE advantage <br /><br />
            $CDE is our Solana based utility token fueling the ecosystem and unlocks the full CandleAI experience. As the gateway to AI-powered crypto trading automation, $CDE offers:
          </Typography>
          <ul className={classes.lists}>
            <li className={classes.list}>
              Cost-effective Subscriptions when you pay with $CDE
            </li>
            <li className={classes.list}>
              Exclusive Savings and discounts using $CDE
            </li>
            <li className={classes.list}>
              Earn Passive Rewards Through Staking
            </li>
            <li className={classes.list}>
              Share in community reward for holding $CDE
            </li>
          </ul>
        </div>
        {/* <Link href={"/candle"}>
          <Button
            variant="border"
            size="xs"
            classstyle={`${classes.button} !text-white !border-primary`}
          // icon={<MdArrowForwardIos className="text-lg !text-primary" />}
          >
            Learn more...
          </Button>
        </Link> */}
        {/* <div className="token__chart w-full flex sm:flex-col items-center justify-around gap-7 sm:mt-[68px] mt-[151px]">
          <div className="token__chart--pie max-w-[430px] max-h-[430px]">
            <Image
              src={PieChartImage}
              alt="Home PieChart"
              className="h-full w-full"
            />
          </div>
          <div className="token__chart--info max-w-[430px] max-h-[430px]">
            <Image
              src={PieInfoImage}
              alt="Home PieChart"
              className="h-full w-full"
            />
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Token;

import Image from "next/image";
import { useRouter } from "next/router";
import {
  BotImage,
  Button,
  Heading, Typography
} from "ui";

import { Fade } from "react-awesome-reveal";
import { AiFillEdit } from "react-icons/ai";


type Props = {};

const HomeHeader = (props: Props) => {
  const router = useRouter();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1075px] m-auto sm:mx-9 lg:mx-7">
      <div className="home__left--details sm:order-last sm:flex sm:flex-col sm:items-center flex-1 sm:mt-[55px] " >
        <Fade triggerOnce duration={1500} className="w-full">

          <Heading
            textsize="4xl"
            boldness="bold"
            classstyle="sm:text-left sm:!text-[2.35rem] !leading-tight !text-[55px] md:leading-snug md:tracking-normal inter w-full ms:!text-[2.6rem]"
          >
            Less stress, <br /><span className="text-primary">More</span><br className="md:hidden" /> profitable trades
            {/* <Typed
            strings={[`Less stress, <br /><span class="text-primary">More</span><br className="md:hidden" /> profitable trades`]}
            typeSpeed={40}
          /> */}

          </Heading>
        </Fade>
        <Fade delay={1500} duration={1000} triggerOnce className="my-5">

          <Typography classstyle="mb-8 mt-5 max-w-lg sm:text-left" textsize="sm">
            With artificial intelligence, CandleAI executes trades efficiently with high precision and accuracy by analyzing vast amounts of market data in real time, providing you with a competitive advantage in the fast-paced and volatile crypto market.
          </Typography>
        </Fade>
        <div className="mt-6">

          <Fade direction="up" triggerOnce delay={2500} duration={1000}>

            <Button
              size="lg"
              classstyle={"w-[120px] !font-bold"}
              icon={<AiFillEdit />}

              iconright
              onClick={() => router.push("/register")}
            >
              Create an account
            </Button>
          </Fade>
        </div>
      </div>
      <Fade direction="right" triggerOnce delay={3500} duration={2000} className="home__right sm:hidden w-full h-full max-w-[480px] max-h-[480px] min-w-[300px] ms:min-w-[150px] ms:max-w-[340px] mb-4 md:mb-0 flex-none">

        <Image src={BotImage} alt="Home Bot" className="w-full h-full" />
      </Fade>
    </div>
  );
};

export default HomeHeader;

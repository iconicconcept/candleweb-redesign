import Image from "next/image";
import { MdArrowForwardIos } from "react-icons/md";
import { CarouselVideo, Heading, IconButton, Typography } from "ui";
import { useRouter } from "next/router";
import useEthereum from "../../lib/hooks/useEthereum";
import useUserStore from "../../lib/hooks/useUserStore";

import { loginUser } from "../../utils/loginUser";
import { error } from "../alert/Toast";

type IHomeCarouselProps = {};

const HomeCarousel = (props: IHomeCarouselProps) => {
  const { connectWallet } = useEthereum()
  const router = useRouter()
  const { user, setUser } = useUserStore((state) => state);



  // async function getUsersInfo(db: any) {
  //   const usersInfoCol = collection(db, 'usersInfo');
  //   const usersInfoSnapshot = await getDocs(usersInfoCol);
  //   const usersInfoList = usersInfoSnapshot.docs.map(doc => doc.data());
  //   return usersInfoList;
  // }

  // function saveDataToFile(data: any, filename: any) {
  //   outputJson(filename, data);
  // }

  // getUsersInfo(db).then(usersInfoList => {
  //   saveDataToFile(usersInfoList, 'usersInfo.json');
  // });

  const testDemo = async () => {
    // getUsersInfo(db);

    if (Object.values(user).length > 0) {
      router.push("/dashboard")
      return
    }

    try {
      const res = await connectWallet();

      if (!res?.walletAddress) {
        error("Please connect your metamask");
        return
      }


      connectWallet().then((res) => {
        if (res) {
          loginUser({
            wallet: res.walletAddress, signerPassword: res.signMessage, onSuccess: (value, type) => {
              if (type === "success") {
                setUser(value)
                router.push("/dashboard")
              } else {
                router.push("/register")
              }
            }
          });
        }
      })



    } catch (err: any) {
      error(err)
    }

  }

  return (
    <div className="flex items-center sm:flex-col ms:flex-col md:justify-between md:gap-10 m-auto">
      {/* <VideoCarousel
        videos={[
          "https://www.youtube.com/embed/D9N7QaIOkG8",
          "https://www.youtube.com/embed/D9N7QaIOkG8",
        ]}
      /> */}
      <div className="carousel__image w-full max-w-[400px] px-5">
        <Image src={CarouselVideo} alt="" />
      </div>
      <div className="carousel__details sm:flex ms:flex ms:flex-col ms:items-center sm:flex-col sm:items-center sm:mt-20 ms:mt-20 sm:mx-9 lg:mx-7">
        <Heading
          textsize="3xl"
          boldness="bold"
          classstyle="sm:text-3xl ms:!text-left ms:w-full"
        >
          CandleAI
        </Heading>
        <Typography
          textsize="sm"
          classstyle="max-w-lg ms:max-w-3xl sm:text-left font-normal mt-3 mb-4"
        >
          CandleAI uses artificial intelligence to analyze market trends, news,
          and data to make informed trading decisions. It continually learns and
          adapts to changing market conditions to make the most profitable
          trades. CandleAI operates 24/7, giving you the opportunity to trade
          even when you&apos;re sleeping. Onboarding with CandleAI is simple
          and straight forward. Once you register, you can easily select your
          preferred trading pairs and customize your trading strategies
          according to your goals and risk tolerance. From there, the bot takes
          care of everything. You can trust that the trades made by CandleAI
          are informed, accurate and reliable.
        </Typography>

        <IconButton
          variant="transparent"
          size="xs"
          classstyle="font-normal !text-primary px-0 py-0 hover:bg-transparent hover:text-white"
          righticon={<MdArrowForwardIos className="text-lg text-primary" />}
          onClick={testDemo}
        >
          Test Demo
        </IconButton>

      </div>
    </div>
  );
};

export default HomeCarousel;
